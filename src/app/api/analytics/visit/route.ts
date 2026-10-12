import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  classifyVisitSource,
  createVisitorId,
  hashNetworkAddress,
  hashVisitorId,
  isLikelyBot,
  VISITOR_COOKIE_MAX_AGE,
  VISITOR_COOKIE_NAME,
} from "@/lib/analytics/visit";
import { getAdminSession, isInternalAnalyticsVisitor } from "@/lib/auth/session";
import { createAnalyticsClient, getAnalyticsSharedSecret } from "@/lib/supabase/analytics";

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
  if ((await getAdminSession()) || (await isInternalAnalyticsVisitor())) {
    return emptyResponse();
  }
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
    const { error } = await createAnalyticsClient().rpc("record_site_visit", {
      p_secret: getAnalyticsSharedSecret(),
      p_visitor_hash: hashVisitorId(visitorId),
      p_network_hash: hashNetworkAddress(request.headers),
      p_pathname: parsed.data.pathname,
      p_property_number: parsed.data.property_number ?? null,
      p_is_entry: parsed.data.is_entry,
      p_source_type: attribution.sourceType,
      p_source_name: attribution.sourceName,
      p_referrer_host: attribution.referrerHost,
      p_search_query: attribution.searchQuery,
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
