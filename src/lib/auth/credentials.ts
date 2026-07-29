import "server-only";

import { timingSafeEqual } from "node:crypto";

function safeEqual(input: string, expected: string) {
  const left = Buffer.from(input);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyAdminCredentials(id: string, password: string) {
  const expectedId = process.env.ADMIN_ID;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedId || !expectedPassword) {
    throw new Error("관리자 계정 환경변수가 설정되지 않았습니다.");
  }

  return safeEqual(id, expectedId) && safeEqual(password, expectedPassword);
}
