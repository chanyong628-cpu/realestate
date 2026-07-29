"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CustomerBlockActionState {
  error?: string;
}

const blockSchema = z.object({
  customer_name: z.string().trim().min(1, "고객 이름을 입력해 주세요."),
  customer_phone: z.string().trim().max(30),
  customer_memo: z.string().trim().max(3000),
  shared_title: z.string().trim().max(120),
  shared_description: z.string().trim().max(2000),
});

async function requireAdmin() {
  if (!(await getAdminSession())) redirect("/admin/login");
}

function parseBlockForm(formData: FormData) {
  return blockSchema.safeParse({
    customer_name: formData.get("customer_name"),
    customer_phone: formData.get("customer_phone"),
    customer_memo: formData.get("customer_memo"),
    shared_title: formData.get("shared_title"),
    shared_description: formData.get("shared_description"),
  });
}

export async function createCustomerBlockAction(
  _state: CustomerBlockActionState,
  formData: FormData,
): Promise<CustomerBlockActionState> {
  await requireAdmin();
  const parsed = parseBlockForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const client = createAdminClient();
  const { data, error } = await client
    .from("customer_blocks")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !data) {
    console.error("Customer block creation failed:", error?.message);
    return { error: "고객 블록을 저장하지 못했습니다." };
  }

  revalidatePath("/admin/customer-blocks");
  redirect("/admin/customer-blocks?created=1");
}

export async function updateCustomerBlockAction(
  id: string,
  _state: CustomerBlockActionState,
  formData: FormData,
): Promise<CustomerBlockActionState> {
  await requireAdmin();
  const parsed = parseBlockForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const client = createAdminClient();
  const { error } = await client
    .from("customer_blocks")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: "고객 블록을 수정하지 못했습니다." };

  revalidatePath("/admin/customer-blocks");
  revalidatePath(`/share/customer-block/${id}`);
  redirect("/admin/customer-blocks?updated=1");
}

export async function deleteCustomerBlockAction(id: string) {
  await requireAdmin();
  const { error } = await createAdminClient()
    .from("customer_blocks")
    .delete()
    .eq("id", id);
  if (error) throw new Error("고객 블록을 삭제하지 못했습니다.");
  revalidatePath("/admin/customer-blocks");
}
