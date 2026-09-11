import { createHash, timingSafeEqual } from "node:crypto";

export type PropertyApiAuthResult =
  | "authorized"
  | "unauthorized"
  | "misconfigured";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function authorizePropertyApiRequest(
  request: Request,
  configuredSecret: string | undefined,
): PropertyApiAuthResult {
  if (!configuredSecret || configuredSecret.length < 32) return "misconfigured";

  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer ([^\s]+)$/);
  if (!match) return "unauthorized";

  return timingSafeEqual(digest(match[1]), digest(configuredSecret))
    ? "authorized"
    : "unauthorized";
}
