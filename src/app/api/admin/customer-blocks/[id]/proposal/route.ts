import { getAdminSession } from "@/lib/auth/session";
import {
  createRentalProposal,
  fetchProposalImages,
  type ProposalProperty,
} from "@/lib/proposals/create-rental-proposal";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CustomerBlock,
  CustomerBlockProperty,
  Property,
} from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function safeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").trim() || "고객";
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/customer-blocks/[id]/proposal">,
) {
  if (!(await getAdminSession())) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const selectedIds = formData
    .getAll("propertyIds")
    .map(String)
    .filter(Boolean);

  if (!selectedIds.length) {
    return Response.json(
      { error: "PowerPoint에 넣을 매물을 선택해 주세요." },
      { status: 400 },
    );
  }

  const client = createAdminClient();
  const [{ data: blockData }, { data: relationData }] = await Promise.all([
    client.from("customer_blocks").select("*").eq("id", id).maybeSingle(),
    client
      .from("customer_block_properties")
      .select("*")
      .eq("customer_block_id", id)
      .in("property_id", selectedIds),
  ]);

  const block = blockData as CustomerBlock | null;
  const relations = (relationData ?? []) as CustomerBlockProperty[];
  if (!block) {
    return Response.json({ error: "고객 블록을 찾을 수 없습니다." }, { status: 404 });
  }

  const allowedIds = new Set(relations.map((relation) => relation.property_id));
  const orderedIds = selectedIds.filter((propertyId) =>
    allowedIds.has(propertyId),
  );
  if (!orderedIds.length) {
    return Response.json(
      { error: "선택한 매물이 고객 블록에 없습니다." },
      { status: 400 },
    );
  }

  const { data: propertyData, error } = await client
    .from("properties")
    .select("*")
    .in("id", orderedIds);
  if (error) {
    return Response.json(
      { error: "매물 정보를 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  const byId = new Map(
    ((propertyData ?? []) as Property[]).map((property) => [
      property.id,
      property,
    ]),
  );
  const properties = (
    await Promise.all(
      orderedIds.map(async (propertyId) => {
        const property = byId.get(propertyId);
        if (!property) return null;
        const imageCandidates = property.image_urls.slice(0, 4);
        const proposalImages = await fetchProposalImages(imageCandidates);
        return { ...property, proposalImages } satisfies ProposalProperty;
      }),
    )
  ).filter((property): property is ProposalProperty => property !== null);

  if (!properties.length) {
    return Response.json(
      { error: "PowerPoint에 넣을 매물 정보가 없습니다." },
      { status: 400 },
    );
  }

  try {
    const file = await createRentalProposal(properties);
    const filename = `${safeFilename(block.customer_name)}_임대제안서.pptx`;
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (generationError) {
    console.error("Proposal generation failed:", generationError);
    return Response.json(
      { error: "PowerPoint를 만들지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
