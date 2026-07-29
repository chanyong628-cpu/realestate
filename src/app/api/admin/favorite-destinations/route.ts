import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const propertyIdSchema = z.string().uuid();
const updateSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("admin"),
    propertyId: z.string().uuid(),
    selected: z.boolean(),
  }),
  z.object({
    type: z.literal("customer"),
    propertyId: z.string().uuid(),
    blockId: z.string().uuid(),
    selected: z.boolean(),
  }),
]);

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ admin: false }, { status: 401 });
  }

  const propertyId = propertyIdSchema.safeParse(
    new URL(request.url).searchParams.get("propertyId"),
  );
  if (!propertyId.success) {
    return NextResponse.json({ error: "매물 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const client = createAdminClient();
  const [{ data: blocks }, { data: relations }, { data: adminFavorite }] =
    await Promise.all([
      client
        .from("customer_blocks")
        .select("id,customer_name")
        .order("created_at", { ascending: false }),
      client
        .from("customer_block_properties")
        .select("customer_block_id")
        .eq("property_id", propertyId.data),
      client
        .from("admin_favorite_properties")
        .select("property_id")
        .eq("property_id", propertyId.data)
        .maybeSingle(),
    ]);

  const selectedBlocks = new Set(
    (relations ?? []).map((relation) => relation.customer_block_id as string),
  );

  return NextResponse.json({
    admin: true,
    destinations: [
      {
        type: "admin",
        id: "admin",
        label: "나의 즐겨찾기",
        selected: Boolean(adminFavorite),
      },
      ...(blocks ?? []).map((block) => ({
        type: "customer",
        id: block.id as string,
        label: block.customer_name as string,
        selected: selectedBlocks.has(block.id as string),
      })),
    ],
  });
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "저장 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const client = createAdminClient();
  const value = parsed.data;
  const query =
    value.type === "admin"
      ? value.selected
        ? client
            .from("admin_favorite_properties")
            .upsert({ property_id: value.propertyId })
        : client
            .from("admin_favorite_properties")
            .delete()
            .eq("property_id", value.propertyId)
      : value.selected
        ? client.from("customer_block_properties").upsert(
            {
              customer_block_id: value.blockId,
              property_id: value.propertyId,
            },
            { onConflict: "customer_block_id,property_id" },
          )
        : client
            .from("customer_block_properties")
            .delete()
            .eq("customer_block_id", value.blockId)
            .eq("property_id", value.propertyId);
  const { error } = await query;

  if (error) {
    console.error("Favorite destination update failed:", error.message);
    return NextResponse.json({ error: "즐겨찾기를 저장하지 못했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
