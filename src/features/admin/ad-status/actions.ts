"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { AD_PLATFORMS, AD_STATUS_ORDER } from "./types";

async function requireAdmin() {
  if (!(await getAdminSession())) redirect("/admin/login");
}

const addSchema = z.object({
  title: z.string().trim().min(1).max(200),
  property_number: z.string().trim().max(50),
});

export async function addAdStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = addSchema.safeParse({
    title: formData.get("title"),
    property_number: formData.get("property_number") ?? "",
  });
  if (!parsed.success) return;
  await createAdminClient()
    .from("ad_status")
    .insert({
      title: parsed.data.title,
      property_number: parsed.data.property_number || null,
    });
  revalidatePath("/admin/ad-status");
}

const setSchema = z.object({
  id: z.string().uuid(),
  platform: z.enum(AD_PLATFORMS.map((p) => p.key) as [string, ...string[]]),
  status: z.enum(AD_STATUS_ORDER),
});

export async function setAdPlatformStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = setSchema.safeParse({
    id: formData.get("id"),
    platform: formData.get("platform"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;
  await createAdminClient()
    .from("ad_status")
    .update({
      [parsed.data.platform]: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);
  revalidatePath("/admin/ad-status");
}

// 마감: ad_status 행만 삭제한다. properties / property_archive / 사진 저장소는 건드리지 않는다.
export async function closeAdStatusAction(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  await createAdminClient().from("ad_status").delete().eq("id", id.data);
  revalidatePath("/admin/ad-status");
}
