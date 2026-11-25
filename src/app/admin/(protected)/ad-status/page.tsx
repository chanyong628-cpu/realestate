import {
  addAdStatusAction,
  closeAdStatusAction,
  setAdPlatformStatusAction,
} from "@/features/admin/ad-status/actions";
import {
  AD_PLATFORMS,
  AD_STATUS_LABEL,
  AD_STATUS_STYLE,
  nextAdStatus,
  type AdStatusRow,
} from "@/features/admin/ad-status/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "광고현황판" };

export default async function AdStatusPage() {
  const { data, error } = await createAdminClient()
    .from("ad_status")
    .select("*")
    .order("ad_date", { ascending: false })
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as AdStatusRow[];

  const byDate = new Map<string, AdStatusRow[]>();
  for (const row of rows) {
    byDate.set(row.ad_date, [...(byDate.get(row.ad_date) ?? []), row]);
  }

  return (
    <section>
      <p className="font-bold text-forest-600">AD STATUS</p>
      <h1 className="mt-1 text-3xl font-black">광고현황판</h1>
      <p className="mt-2 text-stone-600">
        칸을 누르면 상태가 바뀝니다(대기 → 작성됨 → 등록됨 → 보류 → 실패). 마감하면 이
        현황판의 기록만 삭제되며, 매물 DB와 홈페이지 매물·사진은 그대로입니다.
      </p>

      <form
        action={addAdStatusAction}
        className="mt-6 flex flex-wrap items-end gap-2 rounded-2xl bg-white p-4 shadow-sm"
      >
        <label className="min-w-0 flex-1 text-sm font-bold">
          매물명(폴더명)
          <input
            name="title"
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-normal"
          />
        </label>
        <label className="w-32 text-sm font-bold">
          매물번호
          <input
            name="property_number"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-normal"
          />
        </label>
        <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white">
          추가
        </button>
      </form>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
          광고현황을 불러오지 못했습니다. (SQL을 아직 실행하지 않았다면 먼저 실행해 주세요)
        </p>
      )}
      {!error && !rows.length && (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-14 text-center text-stone-500">
          진행 중인 광고가 없습니다.
        </div>
      )}

      {[...byDate.entries()].map(([date, items]) => (
        <div key={date} className="mt-8">
          <h2 className="text-lg font-black">
            {date} <span className="text-sm font-bold text-stone-500">{items.length}건</span>
          </h2>
          <div className="mt-3 space-y-3">
            {items.map((row) => (
              <article key={row.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-black">{row.title}</p>
                    {row.property_number && (
                      <p className="text-sm text-stone-500">{row.property_number}</p>
                    )}
                  </div>
                  <form action={closeAdStatusAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <button className="shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-bold hover:bg-stone-50">
                      마감
                    </button>
                  </form>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {AD_PLATFORMS.map((platform) => {
                    const status = row[platform.key];
                    return (
                      <form key={platform.key} action={setAdPlatformStatusAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="platform" value={platform.key} />
                        <input type="hidden" name="status" value={nextAdStatus(status)} />
                        <button
                          className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold ${AD_STATUS_STYLE[status]}`}
                        >
                          <span className="block text-xs font-medium opacity-70">
                            {platform.label}
                          </span>
                          {AD_STATUS_LABEL[status]}
                        </button>
                      </form>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
