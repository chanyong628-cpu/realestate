import { createHash } from "node:crypto";
import { authorizePropertyApiRequest } from "./auth";
import { errorResponse, successResponse } from "./http";

/**
 * 2026-09-28 추가: 데스크톱 프로그램(cy_ad_program.py)이 매물 폴더의 [OUTPUT]
 * 하위폴더에 있는 실제 사진 파일을 하나씩 올리는 새 경로. 기존 구글 드라이브
 * 경로(import-drive)는 그대로 남겨두고 건드리지 않는다.
 *
 * Vercel Node.js 서버리스 함수는 요청 본문 크기에 제한이 있어(플랜과 무관하게
 * 약 4.5MB), 사진을 한 번에 여러 장 묶어 보내면 큰 사진 몇 장만으로도 요청
 * 자체가 거부될 수 있다. 그래서 이 엔드포인트는 "요청 1회 = 사진 1장"만
 * 받는다 - 여러 장은 클라이언트(cy_ad_program.py)가 반복 호출한다.
 */

const FOLDER_NAME_MAX_LENGTH = 200;
const CONTROL_CHAR_PATTERN = /[\u0000-\u001f\u007f]/;

export class LocalImageUploadApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface LocalImageUploadResult {
  imageUrl: string;
}

interface LocalImageUploadLogger {
  info(message: string): void;
  error(message: string): void;
}

interface LocalImageUploadDependencies {
  getSecret: () => string | undefined;
  uploadImage: (
    folderName: string,
    fileName: string,
    buffer: Buffer,
  ) => Promise<LocalImageUploadResult>;
  logger?: LocalImageUploadLogger;
  now?: () => Date;
  maxFileBytes?: number;
}

const DEFAULT_MAX_FILE_BYTES = 15 * 1024 * 1024; // 원본(업로드 전) 사진 1장 상한

function defaultLogger(): LocalImageUploadLogger {
  return {
    info: (message) => console.info(message),
    error: (message) => console.error(message),
  };
}

function folderFingerprint(folderName: string) {
  return createHash("sha256").update(folderName).digest("hex").slice(0, 16);
}

function validateFolderName(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") {
    throw new LocalImageUploadApiError(400, "VALIDATION_ERROR", "folder_name이 필요합니다.");
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new LocalImageUploadApiError(400, "VALIDATION_ERROR", "폴더명을 입력해 주세요.");
  }
  if (trimmed.length > FOLDER_NAME_MAX_LENGTH) {
    throw new LocalImageUploadApiError(
      400,
      "VALIDATION_ERROR",
      `폴더명은 ${FOLDER_NAME_MAX_LENGTH}자 이하여야 합니다.`,
    );
  }
  if (CONTROL_CHAR_PATTERN.test(trimmed)) {
    throw new LocalImageUploadApiError(
      400,
      "VALIDATION_ERROR",
      "폴더명에 제어 문자를 사용할 수 없습니다.",
    );
  }
  return trimmed;
}

export function createLocalImageUploadHandler(
  dependencies: LocalImageUploadDependencies,
) {
  const logger = dependencies.logger ?? defaultLogger();
  const now = dependencies.now ?? (() => new Date());
  const maxFileBytes = dependencies.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;

  return async function uploadLocalImage(request: Request) {
    const auth = authorizePropertyApiRequest(request, dependencies.getSecret());
    if (auth === "misconfigured") {
      return errorResponse(
        500,
        "API_NOT_CONFIGURED",
        "Property API 인증 설정이 완료되지 않았습니다.",
      );
    }
    if (auth === "unauthorized") {
      return errorResponse(401, "UNAUTHORIZED", "인증에 실패했습니다.");
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
      return errorResponse(
        415,
        "UNSUPPORTED_MEDIA_TYPE",
        "Content-Type은 multipart/form-data여야 합니다.",
      );
    }

    try {
      const form = await request.formData();
      const folderName = validateFolderName(form.get("folder_name"));
      const file = form.get("file");
      if (!(file instanceof File)) {
        throw new LocalImageUploadApiError(400, "VALIDATION_ERROR", "file 항목이 필요합니다.");
      }
      if (file.size <= 0) {
        throw new LocalImageUploadApiError(400, "VALIDATION_ERROR", "빈 파일입니다.");
      }
      if (file.size > maxFileBytes) {
        throw new LocalImageUploadApiError(
          413,
          "PAYLOAD_TOO_LARGE",
          `사진 1장은 ${Math.floor(maxFileBytes / (1024 * 1024))}MB 이하여야 합니다.`,
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await dependencies.uploadImage(folderName, file.name || "photo", buffer);

      logger.info(
        `[CY_PROPERTY_API] ${JSON.stringify({
          action: "UPLOAD_LOCAL_IMAGE",
          folder_fingerprint: folderFingerprint(folderName),
          timestamp: now().toISOString(),
        })}`,
      );
      return successResponse({ image_urls: [result.imageUrl], count: 1 });
    } catch (error) {
      if (error instanceof LocalImageUploadApiError) {
        return errorResponse(error.status, error.code, error.message);
      }
      logger.error(
        `[CY_PROPERTY_API] ${JSON.stringify({
          action: "UPLOAD_LOCAL_IMAGE_ERROR",
          error_code: "INTERNAL_ERROR",
          timestamp: now().toISOString(),
        })}`,
      );
      return errorResponse(500, "INTERNAL_ERROR", "사진을 업로드하지 못했습니다.");
    }
  };
}
