import type { ZodError } from "zod";

export const MAX_PROPERTY_API_BODY_BYTES = 64 * 1024;

export class PropertyApiHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const responseHeaders = {
  "Cache-Control": "private, no-store",
  "Content-Type": "application/json; charset=utf-8",
};

export function successResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return Response.json(
    { success: true, ...body },
    { status, headers: responseHeaders },
  );
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return Response.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    { status, headers: responseHeaders },
  );
}

export function zodErrorResponse(error: ZodError) {
  return errorResponse(
    400,
    "VALIDATION_ERROR",
    "입력값을 확인해 주세요.",
    error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  );
}

export async function readLimitedJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new PropertyApiHttpError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Content-Type은 application/json이어야 합니다.",
    );
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_PROPERTY_API_BODY_BYTES
  ) {
    throw new PropertyApiHttpError(
      413,
      "PAYLOAD_TOO_LARGE",
      "요청 본문이 너무 큽니다.",
    );
  }

  if (!request.body) {
    throw new PropertyApiHttpError(400, "INVALID_JSON", "JSON 본문이 필요합니다.");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_PROPERTY_API_BODY_BYTES) {
      await reader.cancel();
      throw new PropertyApiHttpError(
        413,
        "PAYLOAD_TOO_LARGE",
        "요청 본문이 너무 큽니다.",
      );
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();

  try {
    const value = JSON.parse(text) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Expected an object");
    }
    return value;
  } catch {
    throw new PropertyApiHttpError(
      400,
      "INVALID_JSON",
      "올바른 JSON 객체를 전송해 주세요.",
    );
  }
}
