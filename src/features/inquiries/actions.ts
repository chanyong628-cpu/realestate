"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export interface InquiryActionState {
  success?: boolean;
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

async function sendTelegramNotification(
  inquiry: z.infer<typeof inquirySchema>,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const message = [
    "🏢 C.Y 부동산 새 맞춤문의",
    "",
    `업종: ${inquiry.business_type}`,
    `전화번호: ${inquiry.phone}`,
    `예산: ${inquiry.budget}`,
    `평수: ${inquiry.desired_area}`,
    `입주일: ${inquiry.move_in_date || "미정"}`,
    `기타사항: ${inquiry.notes || "없음"}`,
  ].join("\n");

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    console.error("Telegram inquiry notification failed:", response.status);
  }
}

export async function createInquiryAction(
  _state: InquiryActionState,
  formData: FormData,
): Promise<InquiryActionState> {
  if (String(formData.get("company") ?? "")) {
    return { success: true };
  }

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
    .insert(parsed.data);
  if (error) {
    console.error("Inquiry creation failed:", error.message);
    return { error: "문의 접수에 실패했습니다. 전화로 문의해 주세요." };
  }

  try {
    await sendTelegramNotification(parsed.data);
  } catch (error) {
    console.error("Telegram inquiry notification error:", error);
  }
  return { success: true };
}
