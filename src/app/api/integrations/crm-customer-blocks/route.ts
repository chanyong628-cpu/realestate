import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type CustomerInput = {
  id?: number;
  name?: string;
  phone?: string;
  memo?: string;
};

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRM_CUSTOMER_BLOCK_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as { customers?: CustomerInput[] };
    const inputs = Array.isArray(body.customers) ? body.customers : [];
    if (!inputs.length) return NextResponse.json({ ok: false, error: "선택한 손님이 없습니다." }, { status: 400 });
    if (inputs.length > 50) return NextResponse.json({ ok: false, error: "한 번에 50명까지 생성할 수 있습니다." }, { status: 400 });

    const client = createAdminClient();
    const created: Array<{ id: string; name: string }> = [];

    for (const input of inputs) {
      const customerName = text(input.name, 120);
      const customerPhone = text(input.phone, 30);
      const customerMemo = text(input.memo, 3000);
      if (!customerName) continue;

      let lookup = client.from("customer_blocks").select("id, customer_name").eq("customer_name", customerName);
      lookup = customerPhone ? lookup.eq("customer_phone", customerPhone) : lookup.is("customer_phone", null);
      const { data: existing, error: findError } = await lookup.maybeSingle();
      if (findError) throw findError;
      if (existing) {
        created.push({ id: existing.id as string, name: existing.customer_name as string });
        continue;
      }

      const { data, error } = await client
        .from("customer_blocks")
        .insert({ customer_name: customerName, customer_phone: customerPhone || null, customer_memo: customerMemo || null })
        .select("id, customer_name")
        .single();
      if (error || !data) throw error ?? new Error("고객 블록을 생성하지 못했습니다.");
      created.push({ id: data.id as string, name: data.customer_name as string });
    }

    return NextResponse.json({ ok: true, created });
  } catch (error) {
    console.error("CRM customer block import failed:", error);
    return NextResponse.json({ ok: false, error: "고객 블록을 생성하지 못했습니다." }, { status: 502 });
  }
}
