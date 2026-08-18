"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export interface InquiryAdminActionState {
  error?: string;
}

const inquirySchema = z.object({
  business_type: z.string().trim().min(1, "업종을 입력해 주세요.").max(100),
  phone: z
    .string()
    .trim()
    .min(8, "전화번호를 확인해 주세요.")
    .max(30, "전화번호를 확인해 주세요."),
  budget: z.string().trim().min(1, "예산을 입력해 주세요.").max(100),
  desired_area: z.string().trim().min(1, "평수를 입력해 주세요.").max(100),
  move_in_date: z.string().trim().max(100),
  notes: z.string().trim().max(1000, "기타사항은 1,000자 이내로 작성해 주세요."),
});

async function requireAdmin() {
  if (!(await getAdminSession())) redirect("/admin/login");
}

export async function updateInquiryAction(
  id: string,
  _previousState: InquiryAdminActionState,
  formData: FormData,
): Promise<InquiryAdminActionState> {
  await requireAdmin();
  const parsed = inquirySchema.safeParse({
    business_type: formData.get("business_type"),
    phone: formData.get("phone"),
    budget: formData.get("budget"),
    desired_area: formData.get("desired_area"),
    move_in_date: formData.get("move_in_date"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { error } = await createAdminClient()
    .from("inquiries")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    console.error("Inquiry update failed:", error.message);
    return { error: "문의 수정에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath("/admin/inquiries");
  redirect("/admin/inquiries?updated=1");
}

export async function deleteInquiryAction(id: string) {
  await requireAdmin();
  const { error } = await createAdminClient()
    .from("inquiries")
    .delete()
    .eq("id", id);

  if (error) throw new Error("문의를 삭제하지 못했습니다.");
  revalidatePath("/admin/inquiries");
}
