import path from "node:path";
import { Automizer, modify } from "pptx-automizer";
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

export async function fetchProposalImages(urls: string[]) {
  const images = await Promise.all(
    urls.slice(0, 4).map(async (url) => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return null;
        const source = Buffer.from(await response.arrayBuffer());
        if (!source.length) return null;
        const buffer = await sharp(source)
          .rotate()
          .resize(1200, 630, {
            fit: "contain",
            position: "centre",
            background: { r: 255, g: 255, b: 255 },
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
    .load(TEMPLATE_NAME, "proposal");

  presentation.addSlide("proposal", 1);

  properties.forEach((property) => {
    presentation.addSlide("proposal", 2, (slide) => {
      slide.removeElement("직사각형 122");
      slide.removeElement("직사각형 137");
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
      const frames = [
        { x: 0.542, y: 1.182, w: 4.883, h: 2.668 },
        { x: 5.425, y: 1.182, w: 4.883, h: 2.668 },
        { x: 5.417, y: 3.859, w: 4.883, h: 2.785 },
        { x: 0.542, y: 3.859, w: 4.883, h: 2.785 },
      ];

      ["직사각형 11", "직사각형 102", "직사각형 103", "직사각형 313"].forEach(
        (name) => slide.removeElement(name),
      );

      property.proposalImages.slice(0, 4).forEach((data, imageIndex) => {
        if (!data) return;
        const frame = frames[imageIndex];
        if (!frame) return;
        slide.generate(
          (generatedSlide) => {
            generatedSlide.addImage({
              data,
              x: frame.x,
              y: frame.y,
              w: frame.w,
              h: frame.h,
            });
          },
          `Interior photo ${imageIndex + 1}`,
        );
      });
    });
  });

  presentation.addSlide("proposal", 4);
  const stream = await presentation.stream({
    compressionOptions: { level: 6 },
  });
  return streamToBuffer(stream);
}
