import Link from "next/link";
import { DeleteInquiryButton } from "@/features/admin/inquiries/delete-button";
import type { AdminInquiry } from "@/features/admin/inquiries/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "맞춤 문의 관리" };

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const notice = await searchParams;
  const { data, error } = await createAdminClient()
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });
  const inquiries = (data ?? []) as AdminInquiry[];

  return (
    <section>
      <p className="font-bold text-forest-600">INQUIRIES</p>
      <h1 className="mt-1 text-3xl font-black">맞춤 문의</h1>
      <p className="mt-2 text-stone-600">
        홈페이지에서 접수된 문의를 최신순으로 확인합니다.
      </p>

      {notice.updated && (
        <p className="mt-4 rounded-xl bg-brand-soft px-4 py-3 font-bold text-brand-accent">
          문의 내용이 수정되었습니다.
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
          문의 목록을 불러오지 못했습니다.
        </p>
      )}
      {!error && !inquiries.length && (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-14 text-center text-stone-500">
          아직 접수된 문의가 없습니다.
        </div>
      )}
      {!!inquiries.length && (
        <div className="mt-8 space-y-4">
          {inquiries.map((inquiry) => (
            <article
              key={inquiry.id}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">{inquiry.business_type}</h2>
                  <a
                    href={`tel:${inquiry.phone.replace(/\D/g, "")}`}
                    className="mt-1 inline-block font-bold text-brand-accent"
                  >
                    {inquiry.phone}
                  </a>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <time className="text-xs text-stone-500">
                    {new Intl.DateTimeFormat("ko-KR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Seoul",
                    }).format(new Date(inquiry.created_at))}
                  </time>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/inquiries/${inquiry.id}/edit`}
                      className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold hover:bg-stone-50"
                    >
                      수정
                    </Link>
                    <DeleteInquiryButton
                      id={inquiry.id}
                      businessType={inquiry.business_type}
                    />
                  </div>
                </div>
              </div>
              <dl className="mt-4 grid gap-3 rounded-xl bg-stone-50 p-4 text-sm sm:grid-cols-3">
                <div><dt className="text-stone-500">예산</dt><dd className="mt-1 font-bold">{inquiry.budget}</dd></div>
                <div><dt className="text-stone-500">평수</dt><dd className="mt-1 font-bold">{inquiry.desired_area}</dd></div>
                <div><dt className="text-stone-500">입주일</dt><dd className="mt-1 font-bold">{inquiry.move_in_date || "미정"}</dd></div>
              </dl>
              {inquiry.notes && (
                <p className="mt-4 whitespace-pre-wrap leading-7 text-stone-700">
                  {inquiry.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
