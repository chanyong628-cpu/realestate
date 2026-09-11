import { authorizePropertyApiRequest } from "./auth";
import {
  errorResponse,
  PropertyApiHttpError,
  readLimitedJson,
  successResponse,
  zodErrorResponse,
} from "./http";
import {
  createPropertySchema,
  hasAllowedPropertyImageHosts,
  propertyIdentifierSchema,
  searchPropertiesSchema,
  updatePropertySchema,
} from "./schema";
import { PropertyStoreError, type PropertyRepository } from "./types";
import type { Property } from "../../types/database";

type PropertyAction =
  | "CREATE_PROPERTY"
  | "UPDATE_PROPERTY"
  | "PUBLISH_PROPERTY"
  | "UNPUBLISH_PROPERTY";

interface PropertyApiLogger {
  info(message: string): void;
  error(message: string): void;
}

interface PropertyApiDependencies {
  repository: PropertyRepository;
  getSecret: () => string | undefined;
  getSupabaseUrl: () => string | undefined;
  revalidate: (property: Property) => void;
  logger?: PropertyApiLogger;
  now?: () => Date;
}

function defaultLogger(): PropertyApiLogger {
  return {
    info: (message) => console.info(message),
    error: (message) => console.error(message),
  };
}

export function createPropertyApiHandlers(dependencies: PropertyApiDependencies) {
  const logger = dependencies.logger ?? defaultLogger();
  const now = dependencies.now ?? (() => new Date());

  function authenticate(request: Request) {
    const result = authorizePropertyApiRequest(
      request,
      dependencies.getSecret(),
    );
    if (result === "misconfigured") {
      return errorResponse(
        500,
        "API_NOT_CONFIGURED",
        "Property API 인증 설정이 완료되지 않았습니다.",
      );
    }
    if (result === "unauthorized") {
      return errorResponse(401, "UNAUTHORIZED", "인증에 실패했습니다.");
    }
    return null;
  }

  function validateImageHosts(imageUrls: string[] | undefined) {
    return hasAllowedPropertyImageHosts(
      imageUrls,
      dependencies.getSupabaseUrl(),
    );
  }

  function writeLog(action: PropertyAction, property: Property) {
    logger.info(
      `[CY_PROPERTY_API] ${JSON.stringify({
        action,
        property_id: property.id,
        property_number: property.property_number,
        timestamp: now().toISOString(),
      })}`,
    );
  }

  function revalidateProperty(property: Property) {
    try {
      dependencies.revalidate(property);
    } catch {
      logger.error(
        `[CY_PROPERTY_API] ${JSON.stringify({
          action: "REVALIDATE_ERROR",
          property_id: property.id,
          property_number: property.property_number,
          timestamp: now().toISOString(),
        })}`,
      );
    }
  }

  function handleUnexpected(error: unknown) {
    if (error instanceof PropertyApiHttpError) {
      return errorResponse(error.status, error.code, error.message);
    }
    if (error instanceof PropertyStoreError && error.code === "23505") {
      return errorResponse(
        409,
        "PROPERTY_NUMBER_CONFLICT",
        "이미 사용 중인 매물번호입니다.",
      );
    }

    logger.error(
      `[CY_PROPERTY_API] ${JSON.stringify({
        action: "ERROR",
        error_code:
          error instanceof PropertyStoreError
            ? (error.code ?? "DATABASE_ERROR")
            : "INTERNAL_ERROR",
        timestamp: now().toISOString(),
      })}`,
    );
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "요청을 처리하지 못했습니다.",
    );
  }

  async function parseIdentifier(identifier: string) {
    const parsed = propertyIdentifierSchema.safeParse(identifier);
    return parsed.success ? parsed.data : null;
  }

  return {
    async search(request: Request) {
      const unauthorized = authenticate(request);
      if (unauthorized) return unauthorized;

      const url = new URL(request.url);
      const parsed = searchPropertiesSchema.safeParse(
        Object.fromEntries(url.searchParams.entries()),
      );
      if (!parsed.success) return zodErrorResponse(parsed.error);

      try {
        const properties = await dependencies.repository.search(
          parsed.data.q,
          parsed.data.limit,
        );
        return successResponse({ properties, count: properties.length });
      } catch (error) {
        return handleUnexpected(error);
      }
    },

    async get(request: Request, identifier: string) {
      const unauthorized = authenticate(request);
      if (unauthorized) return unauthorized;

      const normalized = await parseIdentifier(identifier);
      if (!normalized) {
        return errorResponse(
          400,
          "INVALID_PROPERTY_IDENTIFIER",
          "매물 ID 또는 매물번호 형식을 확인해 주세요.",
        );
      }

      try {
        const property =
          await dependencies.repository.findByIdentifier(normalized);
        if (!property) {
          return errorResponse(
            404,
            "PROPERTY_NOT_FOUND",
            "해당 매물을 찾을 수 없습니다.",
          );
        }
        return successResponse({ property });
      } catch (error) {
        return handleUnexpected(error);
      }
    },

    async create(request: Request) {
      const unauthorized = authenticate(request);
      if (unauthorized) return unauthorized;

      try {
        const json = await readLimitedJson(request);
        const parsed = createPropertySchema.safeParse(json);
        if (!parsed.success) return zodErrorResponse(parsed.error);
        if (!validateImageHosts(parsed.data.image_urls)) {
          return errorResponse(
            400,
            "IMAGE_URL_NOT_ALLOWED",
            "현재 Supabase property-images 주소만 사용할 수 있습니다.",
          );
        }

        if (
          parsed.data.property_number &&
          (await dependencies.repository.existsByPropertyNumber(
            parsed.data.property_number,
          ))
        ) {
          return errorResponse(
            409,
            "PROPERTY_NUMBER_CONFLICT",
            "이미 사용 중인 매물번호입니다.",
          );
        }

        const property = await dependencies.repository.create(parsed.data);
        revalidateProperty(property);
        writeLog("CREATE_PROPERTY", property);
        return successResponse({ property }, 201);
      } catch (error) {
        return handleUnexpected(error);
      }
    },

    async update(request: Request, identifier: string) {
      const unauthorized = authenticate(request);
      if (unauthorized) return unauthorized;

      const normalized = await parseIdentifier(identifier);
      if (!normalized) {
        return errorResponse(
          400,
          "INVALID_PROPERTY_IDENTIFIER",
          "매물 ID 또는 매물번호 형식을 확인해 주세요.",
        );
      }

      try {
        const json = await readLimitedJson(request);
        const parsed = updatePropertySchema.safeParse(json);
        if (!parsed.success) return zodErrorResponse(parsed.error);
        if (!validateImageHosts(parsed.data.image_urls)) {
          return errorResponse(
            400,
            "IMAGE_URL_NOT_ALLOWED",
            "현재 Supabase property-images 주소만 사용할 수 있습니다.",
          );
        }

        const property = await dependencies.repository.update(
          normalized,
          parsed.data,
        );
        if (!property) {
          return errorResponse(
            404,
            "PROPERTY_NOT_FOUND",
            "해당 매물을 찾을 수 없습니다.",
          );
        }
        revalidateProperty(property);
        writeLog("UPDATE_PROPERTY", property);
        return successResponse({ property });
      } catch (error) {
        return handleUnexpected(error);
      }
    },

    async setPublished(
      request: Request,
      identifier: string,
      isPublished: boolean,
    ) {
      const unauthorized = authenticate(request);
      if (unauthorized) return unauthorized;

      const normalized = await parseIdentifier(identifier);
      if (!normalized) {
        return errorResponse(
          400,
          "INVALID_PROPERTY_IDENTIFIER",
          "매물 ID 또는 매물번호 형식을 확인해 주세요.",
        );
      }

      try {
        const property = await dependencies.repository.setPublished(
          normalized,
          isPublished,
        );
        if (!property) {
          return errorResponse(
            404,
            "PROPERTY_NOT_FOUND",
            "해당 매물을 찾을 수 없습니다.",
          );
        }
        revalidateProperty(property);
        writeLog(
          isPublished ? "PUBLISH_PROPERTY" : "UNPUBLISH_PROPERTY",
          property,
        );
        return successResponse({ property });
      } catch (error) {
        return handleUnexpected(error);
      }
    },
  };
}
