import Link from "next/link";
import { CopyLinkButton } from "@/features/admin/customer-blocks/copy-link-button";
import { DeleteCustomerBlockButton } from "@/features/admin/customer-blocks/delete-button";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomerBlock } from "@/types/database";

export const metadata = { title: "고객 블록" };

export default async function CustomerBlocksPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const notice = await searchParams;
  const { data, error } = await createAdminClient()
    .from("customer_blocks")
    .select("*")
    .order("created_at", { ascending: false });
  const blocks = data as CustomerBlock[] | null;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold text-forest-600">CUSTOMER BLOCKS</p>
          <h1 className="mt-1 text-3xl font-black">고객 블록</h1>
          <p className="mt-2 text-stone-600">
            고객별 추천 매물을 묶어 로그인 없는 공유 링크를 만듭니다.
          </p>
        </div>
        <Link
          href="/admin/customer-blocks/new"
          className="rounded-xl bg-forest-700 px-5 py-3 font-bold text-white"
        >
          + 고객 블록 생성
        </Link>
      </div>

      {(notice.created || notice.updated) && (
        <p className="mt-6 rounded-xl bg-forest-50 p-4 font-bold text-forest-700">
          고객 블록이 {notice.created ? "생성" : "수정"}되었습니다.
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
          고객 블록을 불러오지 못했습니다.
        </p>
      )}

      {!error && !blocks?.length && (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-14 text-center">
          아직 생성된 고객 블록이 없습니다.
        </div>
      )}

      {!!blocks?.length && (
        <div className="mt-8 grid gap-4">
          {blocks.map((block) => (
            <article
              key={block.id}
              className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center"
            >
              <div>
                <h2 className="font-black">{block.customer_name}</h2>
                <p className="mt-1 text-sm text-stone-500">
                  {block.customer_phone || "연락처 없음"} · {block.shared_slug}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyLinkButton slug={block.shared_slug} />
                <Link
                  href={`/share/customer-block/${block.shared_slug}`}
                  target="_blank"
                  className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold"
                >
                  미리보기
                </Link>
                <Link
                  href={`/admin/customer-blocks/${block.id}/edit`}
                  className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold"
                >
                  수정
                </Link>
                <Link
                  href={`/admin/customer-blocks/${block.id}/edit#ppt-proposal`}
                  className="rounded-lg bg-[#0F4CBB] px-3 py-2 text-xs font-bold text-white"
                >
                  PPT 제안서
                </Link>
                <DeleteCustomerBlockButton
                  id={block.id}
                  name={block.customer_name}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
