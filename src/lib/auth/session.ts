import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "cy_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

interface SessionPayload {
  sub: string;
  exp: number;
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET은 32자 이상이어야 합니다.");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

export async function createAdminSession(adminId: string) {
  const payload: SessionPayload = {
    sub: adminId,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const token = `${encodedPayload}.${sign(encodedPayload)}`;
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [encodedPayload, suppliedSignature] = token.split(".");
  if (!encodedPayload || !suppliedSignature) return null;

  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(sign(encodedPayload));

  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}
