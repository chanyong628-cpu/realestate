import "server-only";

import { createHmac, randomUUID } from "node:crypto";
export { classifyVisitSource, isLikelyBot } from "./source";

export const VISITOR_COOKIE_NAME = "cy_visitor";
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function createVisitorId() {
  return randomUUID();
}

export function hashVisitorId(visitorId: string) {
  const secret =
    process.env.ANALYTICS_HASH_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("방문 통계 해시 환경변수가 설정되지 않았습니다.");
  }
  return createHmac("sha256", secret).update(visitorId).digest("hex");
}
