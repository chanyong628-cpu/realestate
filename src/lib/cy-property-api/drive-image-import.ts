import "server-only";

import { createHash } from "node:crypto";
import sharp from "sharp";
import {
  downloadGoogleDriveImage,
  findGoogleDriveChildFoldersByName,
  GoogleDriveImportError,
  listGoogleDriveImages,
  readGoogleDriveImageBuffer,
} from "../google-drive";
import { createAdminClient } from "../supabase/admin";
import {
  DriveImageApiError,
  type DriveImageImportResult,
} from "./drive-image-handler";

const PROPERTY_IMAGE_BUCKET = "property-images";
const MAX_PROPERTY_IMAGES = 40;
const MAX_WEBP_SIZE = 700 * 1024;
const INITIAL_MAX_WIDTH = 1600;

function hash(value: string | Buffer, length = 16) {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

export function buildDriveImageStoragePath(
  folderId: string,
  fileId: string,
  webp: Buffer,
) {
  return `drive-imports/${hash(folderId)}/${hash(fileId)}-${hash(webp)}.webp`;
}

async function optimizePropertyImage(source: Buffer) {
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

  throw new DriveImageApiError(
    422,
    "IMAGE_PROCESSING_FAILED",
    "사진을 홈페이지 업로드 크기로 압축하지 못했습니다.",
  );
}

function isMissingBucket(message: string) {
  return message.toLowerCase().includes("not found");
}

async function ensurePropertyImageBucket() {
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

async function objectExists(
  supabase: ReturnType<typeof createAdminClient>,
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

async function uploadWebp(
  supabase: ReturnType<typeof createAdminClient>,
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

function mapDriveError(error: GoogleDriveImportError) {
  const code =
    error.status === 400
      ? "DRIVE_INPUT_INVALID"
      : error.status === 403
        ? "DRIVE_ACCESS_DENIED"
        : error.status === 404
          ? "DRIVE_FOLDER_NOT_FOUND"
          : error.status === 413
            ? "DRIVE_IMAGE_TOO_LARGE"
            : error.status === 503
              ? "DRIVE_NOT_CONFIGURED"
              : "DRIVE_REQUEST_FAILED";
  return new DriveImageApiError(error.status, code, error.message);
}

export async function importGoogleDrivePropertyImages(
  folderName: string,
  oidcToken?: string,
): Promise<DriveImageImportResult> {
  const rootFolder =
    process.env.GOOGLE_DRIVE_PROPERTY_ROOT_FOLDER?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_URL?.trim();
  if (!rootFolder) {
    throw new DriveImageApiError(
      503,
      "DRIVE_NOT_CONFIGURED",
      "Google Drive 상위 폴더 설정이 필요합니다.",
    );
  }

  let folderId = "";
  let files: Awaited<ReturnType<typeof listGoogleDriveImages>> = [];
  try {
    const folders = await findGoogleDriveChildFoldersByName(
      rootFolder,
      folderName,
      oidcToken,
    );
    if (!folders.length) {
      throw new DriveImageApiError(
        404,
        "DRIVE_FOLDER_NOT_FOUND",
        "해당 이름의 Google Drive 폴더를 찾을 수 없습니다.",
      );
    }
    if (folders.length > 1) {
      throw new DriveImageApiError(
        409,
        "DRIVE_FOLDER_AMBIGUOUS",
        "같은 이름의 Google Drive 폴더가 둘 이상 있습니다. 폴더명을 고유하게 변경해 주세요.",
      );
    }

    folderId = folders[0].id;
    files = await listGoogleDriveImages(folderId, oidcToken);
  } catch (error) {
    if (error instanceof DriveImageApiError) throw error;
    if (error instanceof GoogleDriveImportError) throw mapDriveError(error);
    throw error;
  }

  if (!files.length) {
    throw new DriveImageApiError(
      404,
      "DRIVE_IMAGES_NOT_FOUND",
      "폴더에서 가져올 수 있는 사진을 찾지 못했습니다.",
    );
  }
  if (files.length > MAX_PROPERTY_IMAGES) {
    throw new DriveImageApiError(
      400,
      "TOO_MANY_IMAGES",
      `홈페이지 매물 사진은 최대 ${MAX_PROPERTY_IMAGES}장까지 가져올 수 있습니다.`,
    );
  }

  const supabase = await ensurePropertyImageBucket();
  const createdPaths: string[] = [];
  const imageUrls: string[] = [];

  try {
    for (const file of files) {
      const { response } = await downloadGoogleDriveImage(file.id, oidcToken);
      const original = await readGoogleDriveImageBuffer(response);
      const webp = await optimizePropertyImage(original);
      const path = buildDriveImageStoragePath(folderId, file.id, webp);
      if (await uploadWebp(supabase, path, webp)) createdPaths.push(path);
      const { data } = supabase.storage
        .from(PROPERTY_IMAGE_BUCKET)
        .getPublicUrl(path);
      imageUrls.push(data.publicUrl);
    }
  } catch (error) {
    if (createdPaths.length) {
      const { error: cleanupError } = await supabase.storage
        .from(PROPERTY_IMAGE_BUCKET)
        .remove(createdPaths);
      if (cleanupError) {
        console.error("Drive image import cleanup failed:", {
          count: createdPaths.length,
          code: "STORAGE_CLEANUP_FAILED",
        });
      }
    }
    if (error instanceof DriveImageApiError) throw error;
    if (error instanceof GoogleDriveImportError) throw mapDriveError(error);
    console.error("Drive property image import failed:", {
      code: "IMAGE_IMPORT_FAILED",
    });
    throw new DriveImageApiError(
      502,
      "IMAGE_IMPORT_FAILED",
      "Google Drive 사진을 홈페이지 저장소로 가져오지 못했습니다.",
    );
  }

  return { imageUrls, count: imageUrls.length, folderId };
}
