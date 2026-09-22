import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  classifyVisitSource,
  createVisitorId,
  hashVisitorId,
  isLikelyBot,
  VISITOR_COOKIE_MAX_AGE,
  VISITOR_COOKIE_NAME,
} from "@/lib/analytics/visit";
import { getAdminSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4 * 1024;
const visitSchema = z
  .object({
    pathname: z.string().trim().min(1).max(300).startsWith("/"),
    search: z.string().max(500).optional().default(""),
    referrer: z.string().max(2048).optional().default(""),
    property_number: z
      .string()
      .trim()
      .regex(/^CY-\d{4,10}$/)
      .optional(),
    is_entry: z.boolean().optional().default(true),
  })
  .strict();

function emptyResponse(visitorId?: string) {
  const response = new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "private, no-store" },
  });
  if (visitorId) {
    response.cookies.set(VISITOR_COOKIE_NAME, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: VISITOR_COOKIE_MAX_AGE,
    });
  }
  return response;
}

export async function POST(request: NextRequest) {
  if (await getAdminSession()) return emptyResponse();
  if (isLikelyBot(request.headers.get("user-agent") ?? "")) {
    return emptyResponse();
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return emptyResponse();

  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return emptyResponse();
    const parsed = visitSchema.safeParse(JSON.parse(raw) as unknown);
    if (!parsed.success || /^\/(?:admin|api)(?:\/|$)/.test(parsed.data.pathname)) {
      return emptyResponse();
    }

    const existingVisitorId = request.cookies.get(VISITOR_COOKIE_NAME)?.value;
    const visitorId = existingVisitorId || createVisitorId();
    const attribution = classifyVisitSource(
      parsed.data.referrer,
      parsed.data.search,
      request.nextUrl.hostname.toLowerCase(),
    );
    const supabase = createAdminClient();
    let propertyId: string | null = null;

    if (parsed.data.property_number) {
      const { data } = await supabase
        .from("properties")
        .select("id")
        .eq("property_number", parsed.data.property_number)
        .maybeSingle();
      propertyId = typeof data?.id === "string" ? data.id : null;
    }

    const { error } = await supabase.from("site_visits").insert({
      visitor_hash: hashVisitorId(visitorId),
      pathname: parsed.data.pathname,
      property_id: propertyId,
      property_number: parsed.data.property_number ?? null,
      is_entry: parsed.data.is_entry,
      source_type: attribution.sourceType,
      source_name: attribution.sourceName,
      referrer_host: attribution.referrerHost,
      search_query: attribution.searchQuery,
    });
    if (error) {
      console.error("First-party analytics insert failed:", {
        code: error.code,
      });
    }
    return emptyResponse(existingVisitorId ? undefined : visitorId);
  } catch (error) {
    console.error("First-party analytics request failed:", {
      code: error instanceof SyntaxError ? "INVALID_JSON" : "INTERNAL_ERROR",
    });
    return emptyResponse();
  }
}
