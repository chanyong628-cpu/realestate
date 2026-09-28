import "server-only";

import { createHash } from "node:crypto";
import sharp from "sharp";
import { createAdminClient } from "../supabase/admin";

/**
 * 2026-09-28 추가: drive-image-import.ts에 있던 "사진 최적화 + Supabase 업로드"
 * 공통 로직을 여기로 분리했다. 로컬 OUTPUT 폴더 업로드(local-image-upload.ts)와
 * 구글 드라이브 가져오기(drive-image-import.ts)가 동일한 버킷/최적화 규칙을
 * 그대로 공유한다. 기존 동작은 값 하나 바뀌지 않고 그대로 옮겨왔다
 * (tests/cy-drive-image-import.test.ts가 그대로 통과하는지로 확인).
 */

export const PROPERTY_IMAGE_BUCKET = "property-images";
export const MAX_PROPERTY_IMAGES = 40;
export const MAX_WEBP_SIZE = 700 * 1024;
export const INITIAL_MAX_WIDTH = 1600;

export class ImageProcessingError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function hashValue(value: string | Buffer, length = 16) {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

export async function optimizePropertyImage(source: Buffer) {
  let width = INITIAL_MAX_WIDTH;
  let quality = 82;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const webp = await sharp(source, {
      failOn: "error",
      limitInputPixels: 80_000_000,
    })
      .rotate()
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer();

    if (webp.byteLength <= MAX_WEBP_SIZE) return webp;
    width = Math.max(800, Math.round(width * 0.85));
    quality = Math.max(48, quality - 6);
  }

  throw new ImageProcessingError(
    422,
    "IMAGE_PROCESSING_FAILED",
    "사진을 홈페이지 업로드 크기로 압축하지 못했습니다.",
  );
}

function isMissingBucket(message: string) {
  return message.toLowerCase().includes("not found");
}

export async function ensurePropertyImageBucket() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.getBucket(PROPERTY_IMAGE_BUCKET);
  if (data) return supabase;
  if (error && !isMissingBucket(error.message)) throw error;

  const { error: createError } = await supabase.storage.createBucket(
    PROPERTY_IMAGE_BUCKET,
    {
      public: true,
      fileSizeLimit: MAX_WEBP_SIZE,
      allowedMimeTypes: ["image/webp"],
    },
  );
  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw createError;
  }
  return supabase;
}

export async function objectExists(
  supabase: Awaited<ReturnType<typeof ensurePropertyImageBucket>>,
  path: string,
) {
  const slash = path.lastIndexOf("/");
  const prefix = path.slice(0, slash);
  const fileName = path.slice(slash + 1);
  const { data, error } = await supabase.storage
    .from(PROPERTY_IMAGE_BUCKET)
    .list(prefix, { limit: 2, search: fileName });
  if (error) throw error;
  return (data ?? []).some((item) => item.name === fileName);
}

export async function uploadWebp(
  supabase: Awaited<ReturnType<typeof ensurePropertyImageBucket>>,
  path: string,
  webp: Buffer,
) {
  if (await objectExists(supabase, path)) return false;

  const { error } = await supabase.storage
    .from(PROPERTY_IMAGE_BUCKET)
    .upload(path, webp, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
  if (!error) return true;

  // A simultaneous retry can win between the existence check and upload.
  if (await objectExists(supabase, path)) return false;
  throw error;
}
