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
export const maxDuration = 60;

function safeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").trim() || "매물";
}

export async function GET(
  _request: Request,
  context: RouteContext<"/api/admin/properties/[id]/proposal">,
) {
  if (!(await getAdminSession())) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await context.params;
  const { data, error } = await createAdminClient()
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return Response.json(
      { error: "매물 정보를 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  const property = data as Property | null;
  if (!property) {
    return Response.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
  }

  const proposalImages = await fetchProposalImages(
    property.image_urls.slice(0, 4),
  );
  const proposalProperty = {
    ...property,
    proposalImages,
  } satisfies ProposalProperty;

  try {
    const file = await createRentalProposal([proposalProperty]);
    const filename = `${safeFilename(property.property_number)}_임대제안서.pptx`;
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (generationError) {
    console.error("Property proposal generation failed:", generationError);
    return Response.json(
      { error: "PowerPoint를 만들지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
