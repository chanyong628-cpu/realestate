import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Automizer, modify } from "pptx-automizer";
import type { ShapeModificationCallback } from "pptx-automizer";
import sharp from "sharp";
import type { Property } from "@/types/database";
import { formatPyeong } from "@/lib/properties/format";

const TEMPLATE_NAME = "cy-rental-proposal.pptx";

export interface ProposalProperty extends Property {
  proposalImages: Array<string | null>;
}

function formatNumber(value: number | null) {
  return value === null ? "-" : value.toLocaleString("ko-KR");
}

function formatArea(property: Property) {
  if (property.exclusive_area === null) return "-";
  return `실 ${formatPyeong(property.exclusive_area)}평`;
}

function formatParking(property: Property) {
  const total = property.total_parking_count ?? "-";
  const available = property.available_parking_count ?? "-";
  return `총 ${total}대 / 가능 ${available}대`;
}

function formatRestroom(property: Property) {
  if (property.restroom_type === "internal_private") return "분리화장실";
  if (property.restroom_type === "external_shared") return "공용화장실";
  return "-";
}

function formatMonthlyTotal(property: Property) {
  if (property.monthly_rent === null || property.maintenance_fee === null) {
    return "-";
  }
  return formatNumber(property.monthly_rent + property.maintenance_fee);
}

function imageDataUri(buffer: Buffer, contentType: string) {
  const mime = contentType.startsWith("image/") ? contentType : "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function dataUriBuffer(data: string) {
  const match = data.match(/^data:[^;]+;base64,(.+)$/);
  return match ? Buffer.from(match[1], "base64") : null;
}

function replaceShapeImageFill(filename: string): ShapeModificationCallback {
  return (element, relations) => {
    if (!relations) return;
    const blip = element.getElementsByTagName("a:blip")[0];
    const relationId = blip?.getAttribute("r:embed");
    if (!relationId) return;

    const relationItems = relations.getElementsByTagName("Relationship");
    for (let index = 0; index < relationItems.length; index += 1) {
      const relation = relationItems[index];
      if (relation.getAttribute("Id") === relationId) {
        relation.setAttribute("Target", `../media/${filename}`);
        break;
      }
    }

    const sourceRect = element.getElementsByTagName("a:srcRect")[0];
    if (sourceRect) {
      ["l", "t", "r", "b"].forEach((attribute) =>
        sourceRect.setAttribute(attribute, "0"),
      );
    }
  };
}

export async function fetchProposalImages(urls: string[]) {
  const images = await Promise.all(
    urls.slice(0, 4).map(async (url, imageIndex) => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return null;
        const source = Buffer.from(await response.arrayBuffer());
        if (!source.length) return null;
        const buffer = await sharp(source)
          .rotate()
          .resize(1200, imageIndex < 2 ? 656 : 684, {
            fit: "cover",
            position: "centre",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 84, mozjpeg: true })
          .toBuffer();
        return imageDataUri(
          buffer,
          "image/jpeg",
        );
      } catch {
        return null;
      }
    }),
  );

  return images;
}

function streamToBuffer(stream: NodeJS.ReadableStream) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
    );
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export async function createRentalProposal(properties: ProposalProperty[]) {
  const mediaDir = await fs.mkdtemp(path.join(os.tmpdir(), "cy-proposal-"));
  const mediaNames: Array<Array<string | null>> = [];

  await Promise.all(
    properties.map(async (property, propertyIndex) => {
      mediaNames[propertyIndex] = await Promise.all(
        property.proposalImages.slice(0, 4).map(async (data, imageIndex) => {
          if (!data) return null;
          const buffer = dataUriBuffer(data);
          if (!buffer) return null;
          const filename = `property-${propertyIndex + 1}-photo-${imageIndex + 1}.jpg`;
          await fs.writeFile(path.join(mediaDir, filename), buffer);
          return filename;
        }),
      );
    }),
  );

  const templateDir = path.join(process.cwd(), "templates");
  const automizer = new Automizer({
    templateDir,
    removeExistingSlides: true,
    autoImportSlideMasters: false,
    cleanup: false,
    compression: 6,
    verbosity: 0,
  });
  const presentation = automizer
    .loadRoot(TEMPLATE_NAME)
    .loadMedia(
      mediaNames.flat().filter((name): name is string => Boolean(name)),
      mediaDir,
    )
    .load(TEMPLATE_NAME, "proposal");

  presentation.addSlide("proposal", 1);

  properties.forEach((property, propertyIndex) => {
    presentation.addSlide("proposal", 2, (slide) => {
      slide.modifyElement(
        "Group 58",
        modify.setTableData({
          body: [
            {
              values: [
                "물건주소",
                property.private_address || property.public_address || "-",
              ],
            },
            { values: ["층 수", property.floor || "-"] },
            { values: ["면 적", formatArea(property)] },
            { values: ["주 차 장", formatParking(property)] },
            {
              values: [
                "엘리베이터",
                property.elevator_available ? "有" : "無",
              ],
            },
            { values: ["화 장 실", formatRestroom(property)] },
          ],
        }),
      );
      slide.modifyElement(
        "표 1",
        modify.setTableData({
          body: [
            { values: ["보증금", formatNumber(property.deposit)] },
            { values: ["월세", formatNumber(property.monthly_rent)] },
            { values: ["관리비", formatNumber(property.maintenance_fee)] },
            { values: ["월세 + 관리비", formatMonthlyTotal(property)] },
          ],
        }),
      );
      slide.modifyElement(
        "표 2",
        modify.setTableData({ body: [{ values: ["", ""] }] }),
      );
    });

    presentation.addSlide("proposal", 3, (slide) => {
      const placeholders = [
        "직사각형 11",
        "직사각형 102",
        "직사각형 103",
        "직사각형 313",
      ];

      mediaNames[propertyIndex]?.forEach((filename, imageIndex) => {
        const placeholder = placeholders[imageIndex];
        if (!filename || !placeholder) return;
        slide.modifyElement(placeholder, replaceShapeImageFill(filename));
      });
    });
  });

  presentation.addSlide("proposal", 4);
  try {
    const stream = await presentation.stream({
      compressionOptions: { level: 6 },
    });
    return await streamToBuffer(stream);
  } finally {
    await fs.rm(mediaDir, { recursive: true, force: true });
  }
}
