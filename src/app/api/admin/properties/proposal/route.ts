import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import {
  createRentalProposal,
  fetchProposalImages,
  type ProposalProperty,
} from "@/lib/proposals/create-rental-proposal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Property } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_BODY_BYTES = 16 * 1024;
const requestSchema = z
  .object({ ids: z.array(z.string().uuid()).min(1).max(20) })
  .strict();

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return Response.json({ error: "요청이 너무 큽니다." }, { status: 413 });
  }

  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      return Response.json({ error: "요청이 너무 큽니다." }, { status: 413 });
    }
    const parsed = requestSchema.safeParse(JSON.parse(raw) as unknown);
    if (!parsed.success) {
      return Response.json(
        { error: "PPT에 넣을 매물을 1~20개 선택해 주세요." },
        { status: 400 },
      );
    }

    const ids = [...new Set(parsed.data.ids)];
    const { data, error } = await createAdminClient()
      .from("properties")
      .select("*")
      .in("id", ids);
    if (error) {
      return Response.json(
        { error: "매물 정보를 불러오지 못했습니다." },
        { status: 500 },
      );
    }

    const byId = new Map(
      ((data ?? []) as Property[]).map((property) => [property.id, property]),
    );
    const properties = ids
      .map((id) => byId.get(id))
      .filter((property): property is Property => Boolean(property));
    if (!properties.length) {
      return Response.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
    }

    const proposalProperties = await Promise.all(
      properties.map(async (property) => ({
        ...property,
        proposalImages: await fetchProposalImages(property.image_urls.slice(0, 4)),
      }) satisfies ProposalProperty),
    );
    const file = await createRentalProposal(proposalProperties);
    const filename = `CY_선택매물_${properties.length}개_임대제안서.pptx`;
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Bulk property proposal generation failed:", {
      code: error instanceof SyntaxError ? "INVALID_JSON" : "GENERATION_ERROR",
    });
    return Response.json(
      { error: "선택 매물 PowerPoint를 만들지 못했습니다." },
      { status: 500 },
    );
  }
}
