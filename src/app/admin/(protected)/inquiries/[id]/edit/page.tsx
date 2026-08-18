import Link from "next/link";
import { notFound } from "next/navigation";
import { InquiryAdminForm } from "@/features/admin/inquiries/inquiry-admin-form";
import type { AdminInquiry } from "@/features/admin/inquiries/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "맞춤 문의 수정" };

export default async function EditInquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await createAdminClient()
    .from("inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const inquiry = data as AdminInquiry | null;

  if (!inquiry) notFound();

  return (
    <section className="pb-20">
      <Link
        href="/admin/inquiries"
        className="text-sm font-bold text-forest-600 hover:underline"
      >
        ← 맞춤 문의 목록
      </Link>
      <p className="mt-3 font-bold text-forest-600">INQUIRIES</p>
      <h1 className="mt-1 text-3xl font-black">맞춤 문의 수정</h1>
      <InquiryAdminForm inquiry={inquiry} />
    </section>
  );
}
