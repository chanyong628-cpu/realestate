import "server-only";

import { LocalImageUploadApiError } from "./local-image-upload-handler";
import {
  PROPERTY_IMAGE_BUCKET,
  ImageProcessingError,
  ensurePropertyImageBucket,
  hashValue as hash,
  optimizePropertyImage,
  uploadWebp,
} from "./image-storage";

export function buildLocalImageStoragePath(
  folderName: string,
  fileName: string,
  webp: Buffer,
) {
  return `local-imports/${hash(folderName)}/${hash(fileName)}-${hash(webp)}.webp`;
}

export async function uploadLocalPropertyImage(
  folderName: string,
  fileName: string,
  original: Buffer,
): Promise<{ imageUrl: string }> {
  const supabase = await ensurePropertyImageBucket();

  let webp: Buffer;
  try {
    webp = await optimizePropertyImage(original);
  } catch (error) {
    if (error instanceof ImageProcessingError) {
      throw new LocalImageUploadApiError(error.status, error.code, error.message);
    }
    throw error;
  }

  const path = buildLocalImageStoragePath(folderName, fileName, webp);
  try {
    await uploadWebp(supabase, path, webp);
  } catch {
    throw new LocalImageUploadApiError(
      502,
      "IMAGE_UPLOAD_FAILED",
      "사진을 홈페이지 저장소로 업로드하지 못했습니다.",
    );
  }

  const { data } = supabase.storage.from(PROPERTY_IMAGE_BUCKET).getPublicUrl(path);
  return { imageUrl: data.publicUrl };
}
