import { createHash } from "node:crypto";
import { z } from "zod";
import { authorizePropertyApiRequest } from "./auth";
import {
  errorResponse,
  PropertyApiHttpError,
  readLimitedJson,
  successResponse,
  zodErrorResponse,
} from "./http";

export const driveImageImportSchema = z
  .object({
    folder_name: z
      .string()
      .trim()
      .min(1, "폴더명을 입력해 주세요.")
      .max(200, "폴더명은 200자 이하여야 합니다.")
      .refine(
        (value) => !/[\u0000-\u001f\u007f]/.test(value),
        "폴더명에 제어 문자를 사용할 수 없습니다.",
      ),
  })
  .strict();

export class DriveImageApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface DriveImageImportResult {
  imageUrls: string[];
  count: number;
  folderId: string;
}

interface DriveImageImportLogger {
  info(message: string): void;
  error(message: string): void;
}

interface DriveImageImportDependencies {
  getSecret: () => string | undefined;
  importFolder: (
    folderName: string,
    oidcToken?: string,
  ) => Promise<DriveImageImportResult>;
  logger?: DriveImageImportLogger;
  now?: () => Date;
}

function defaultLogger(): DriveImageImportLogger {
  return {
    info: (message) => console.info(message),
    error: (message) => console.error(message),
  };
}

function folderFingerprint(folderId: string) {
  return createHash("sha256").update(folderId).digest("hex").slice(0, 16);
}

export function createDriveImageImportHandler(
  dependencies: DriveImageImportDependencies,
) {
  const logger = dependencies.logger ?? defaultLogger();
  const now = dependencies.now ?? (() => new Date());

  return async function importDriveImages(
    request: Request,
    oidcToken?: string,
  ) {
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

    try {
      const json = await readLimitedJson(request);
      const parsed = driveImageImportSchema.safeParse(json);
      if (!parsed.success) return zodErrorResponse(parsed.error);

      const result = await dependencies.importFolder(
        parsed.data.folder_name,
        oidcToken,
      );
      logger.info(
        `[CY_PROPERTY_API] ${JSON.stringify({
          action: "IMPORT_DRIVE_IMAGES",
          folder_fingerprint: folderFingerprint(result.folderId),
          count: result.count,
          timestamp: now().toISOString(),
        })}`,
      );
      return successResponse({
        image_urls: result.imageUrls,
        count: result.count,
      });
    } catch (error) {
      if (error instanceof PropertyApiHttpError) {
        return errorResponse(error.status, error.code, error.message);
      }
      if (error instanceof DriveImageApiError) {
        return errorResponse(error.status, error.code, error.message);
      }

      logger.error(
        `[CY_PROPERTY_API] ${JSON.stringify({
          action: "IMPORT_DRIVE_IMAGES_ERROR",
          error_code: "INTERNAL_ERROR",
          timestamp: now().toISOString(),
        })}`,
      );
      return errorResponse(
        500,
        "INTERNAL_ERROR",
        "Google Drive 사진을 가져오지 못했습니다.",
      );
    }
  };
}
