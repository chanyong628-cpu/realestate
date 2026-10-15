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
  configuredSecret: string | undefined | Array<string | undefined>,
): PropertyApiAuthResult {
  const configuredSecrets = (Array.isArray(configuredSecret)
    ? configuredSecret
    : [configuredSecret]
  ).filter((secret): secret is string => Boolean(secret && secret.length >= 32));
  if (!configuredSecrets.length) return "misconfigured";

  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer ([^\s]+)$/);
  if (!match) return "unauthorized";

  return configuredSecrets.some((secret) =>
    timingSafeEqual(digest(match[1]), digest(secret)),
  )
    ? "authorized"
    : "unauthorized";
}
