import "server-only";

import {
  downloadGoogleDriveImage,
  findGoogleDriveChildFoldersByName,
  GoogleDriveImportError,
  listGoogleDriveImages,
  readGoogleDriveImageBuffer,
} from "../google-drive";
import {
  DriveImageApiError,
  type DriveImageImportResult,
} from "./drive-image-handler";
import {
  ImageProcessingError,
  MAX_PROPERTY_IMAGES,
  PROPERTY_IMAGE_BUCKET,
  ensurePropertyImageBucket,
  hashValue as hash,
  optimizePropertyImage,
  uploadWebp,
} from "./image-storage";

// 2026-09-28: 사진 최적화(optimizePropertyImage)/버킷 준비(ensurePropertyImageBucket)/
// 업로드(uploadWebp) 로직은 image-storage.ts로 옮겨 로컬 업로드 경로와 공유한다.
// 이 파일의 나머지 동작(구글 드라이브 조회 자체)은 전혀 바뀌지 않았다.

export function buildDriveImageStoragePath(
  folderId: string,
  fileId: string,
  webp: Buffer,
) {
  return `drive-imports/${hash(folderId)}/${hash(fileId)}-${hash(webp)}.webp`;
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
    if (error instanceof ImageProcessingError) {
      throw new DriveImageApiError(error.status, error.code, error.message);
    }
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
