import path from "node:path";
import { Automizer, CmToDxa, modify } from "pptx-automizer";
import sharp from "sharp";
import type { CustomerBlock, Property } from "@/types/database";
import { formatPyeong } from "@/lib/properties/format";

const TEMPLATE_NAME = "cy-rental-proposal.pptx";

export interface ProposalProperty extends Property {
  proposalImages: string[];
}

function formatNumber(value: number | null) {
  return value === null ? "-" : value.toLocaleString("ko-KR");
}

function formatAmount(property: Property) {
  return `${formatNumber(property.deposit)} / ${formatNumber(property.monthly_rent)} / ${formatNumber(property.maintenance_fee)}`;
}

function formatArea(property: Property) {
  if (property.exclusive_area === null) return "-";
  return `${property.exclusive_area.toLocaleString("ko-KR")}㎡ (실 ${formatPyeong(
    property.exclusive_area,
  )}평)`;
}

function formatParking(property: Property) {
  if (property.available_parking_count !== null) {
    return `가능 ${property.available_parking_count}대`;
  }
  return property.parking_available ? "주차 가능" : "주차 불가";
}

function proposalDescription(property: Property) {
  const ignored = [
    "C.Y",
    "REALESTATE",
    "네이버",
    "당근",
    "기본확인사항",
    "상호:",
    "등록번호:",
    "전화번호:",
    "주소:",
  ];
  const candidates = (property.description ?? "")
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^[✔✓•·\-─『』✨❤️\s]+/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(
      (line) =>
        line.length >= 3 &&
        !ignored.some((keyword) => line.includes(keyword)),
    )
    .slice(0, 3);

  const fallback = [
    property.title,
    property.move_in_date ? `입주 가능: ${property.move_in_date}` : "",
    property.building_direction
      ? `건물 방향: ${property.building_direction}`
      : "",
  ].filter(Boolean);

  return (candidates.length ? candidates : fallback)
    .map((line) => `• ${line}`)
    .join("\n");
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

  return images.filter((image): image is string => Boolean(image));
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

function inchesToDxa(value: number) {
  return CmToDxa(value * 2.54);
}

export async function createRentalProposal(
  block: CustomerBlock,
  properties: ProposalProperty[],
) {
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

  presentation.addSlide("proposal", 1, (slide) => {
    slide.modifyElement(
      "Text 7",
      modify.setText(`${block.customer_name} 고객님 임대제안서`),
    );
    slide.modifyElement(
      "Text 9",
      modify.setText(`C.Y부동산 추천 매물 | 총 ${properties.length}건`),
    );
  });

  properties.forEach((property, index) => {
    const informationPage = index * 2 + 1;
    const photoPage = informationPage + 1;

    presentation.addSlide("proposal", 2, (slide) => {
      slide.removeElement("Image 0");
      slide.removeElement("Image 1");
      slide.modifyElement(
        "Text 3",
        modify.setText(`물건 정보 ( ${property.property_number} )`),
      );
      slide.modifyElement(
        "Text 11",
        modify.setText(property.private_address || property.public_address || "-"),
      );
      slide.modifyElement("Text 15", modify.setText(property.floor || "-"));
      slide.modifyElement("Text 19", modify.setText(formatAmount(property)));
      slide.modifyElement("Text 23", modify.setText(formatArea(property)));
      slide.modifyElement("Text 27", modify.setText(formatParking(property)));
      slide.modifyElement(
        "Text 31",
        modify.setText(property.elevator_available ? "有" : "無"),
      );
      slide.modifyElement(
        "Text 36",
        modify.setText(proposalDescription(property)),
      );
      slide.modifyElement(
        "Text 44",
        modify.setText(String(informationPage).padStart(2, "0")),
      );
    });

    presentation.addSlide("proposal", 3, (slide) => {
      slide.modifyElement(
        "Text 18",
        modify.setText(String(photoPage).padStart(2, "0")),
      );

      const frames = [
        { x: 0.22, y: 1.35, w: 4.67, h: 2.45 },
        { x: 5.11, y: 1.35, w: 4.67, h: 2.45 },
        { x: 0.22, y: 4.02, w: 4.67, h: 2.45 },
        { x: 5.11, y: 4.02, w: 4.67, h: 2.45 },
      ];

      frames.forEach((frame, frameIndex) => {
        slide.modifyElement(
          `Shape ${frameIndex + 7}`,
          modify.setPosition({
            x: inchesToDxa(frame.x),
            y: inchesToDxa(frame.y),
            w: inchesToDxa(frame.w),
            h: inchesToDxa(frame.h),
          }),
        );
      });

      property.proposalImages.slice(0, 4).forEach((data, imageIndex) => {
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
