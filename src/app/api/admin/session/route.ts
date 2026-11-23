import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";

// 정적으로 만들어진 목록 페이지(테마·카테고리 등)에서 관리자 도구를 보여줄지 판단하는 용도.
export async function GET() {
  const admin = Boolean(await getAdminSession());
  return NextResponse.json(
    { admin },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
