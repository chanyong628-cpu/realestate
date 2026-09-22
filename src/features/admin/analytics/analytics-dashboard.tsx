import Link from "next/link";
import type {
  AdminAnalyticsData,
  AnalyticsCountItem,
  AnalyticsRangeDays,
} from "@/lib/analytics/dashboard";

const ranges: Array<{ days: AnalyticsRangeDays; label: string }> = [
  { days: 7, label: "7일" },
  { days: 30, label: "30일" },
  { days: 90, label: "90일" },
];

function RankingList({
  items,
  emptyText,
}: {
  items: AnalyticsCountItem[];
  emptyText: string;
}) {
  if (!items.length) {
    return <p className="mt-5 text-sm text-stone-400">{emptyText}</p>;
  }

  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <ol className="mt-5 space-y-3">
      {items.map((item, index) => (
        <li key={item.label} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-2 text-sm">
          <span className="font-black text-stone-400">{index + 1}</span>
          <div className="min-w-0">
            <p className="truncate font-bold" title={item.label}>{item.label}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-brand-accent"
                style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }}
              />
            </div>
          </div>
          <b>{item.count}</b>
        </li>
      ))}
    </ol>
  );
}

export function AnalyticsDashboard({ data }: { data: AdminAnalyticsData }) {
  if (!data.available) {
    return (
      <section className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-7">
        <h2 className="text-xl font-black">방문 통계 준비 중</h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          통계 저장소가 배포되면 이곳에서 방문자와 유입 경로가 집계됩니다.
          기존 홈페이지 이용에는 영향이 없습니다.
        </p>
      </section>
    );
  }

  const maxDaily = Math.max(
    ...data.daily.map((item) => Math.max(item.visitors, item.pageViews)),
    1,
  );

  return (
    <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black text-brand-accent">자체 방문 통계</p>
          <h2 className="mt-1 text-2xl font-black">홈페이지 방문 현황</h2>
          <p className="mt-2 text-sm text-stone-500">
            GA와 별개로 C.Y 서버가 익명 방문만 집계합니다.
          </p>
        </div>
        <nav className="flex rounded-xl bg-stone-100 p-1" aria-label="통계 기간">
          {ranges.map((range) => (
            <Link
              key={range.days}
              href={`/admin?range=${range.days}`}
              className={`rounded-lg px-4 py-2 text-sm font-black ${
                data.rangeDays === range.days
                  ? "bg-brand-accent text-white shadow-sm"
                  : "text-stone-500 hover:bg-white"
              }`}
            >
              {range.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["오늘 방문자", data.todayVisitors],
          ["오늘 조회수", data.todayPageViews],
          ["최근 7일 방문자", data.sevenDayVisitors],
          ["최근 30일 방문자", data.thirtyDayVisitors],
          [`선택 ${data.rangeDays}일 조회수`, data.rangePageViews],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-bold text-stone-500">{label}</p>
            <p className="mt-2 text-2xl font-black">{value.toLocaleString("ko-KR")}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 rounded-2xl border border-stone-200 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-black">일별 방문자·조회수</h3>
          <p className="text-xs font-bold text-stone-400">
            방문자 {data.rangeVisitors.toLocaleString("ko-KR")}명
          </p>
        </div>
        <div className="mt-5 overflow-x-auto pb-2">
          <div className="flex h-52 min-w-[720px] items-end gap-2 border-b border-stone-200 px-1">
            {data.daily.map((item) => (
              <div key={item.date} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center">
                <div className="flex flex-1 items-end justify-center gap-1">
                  <div
                    className="w-2.5 rounded-t bg-brand-accent"
                    style={{ height: `${Math.max(2, (item.visitors / maxDaily) * 100)}%` }}
                    title={`${item.date} 방문자 ${item.visitors}명`}
                  />
                  <div
                    className="w-2.5 rounded-t bg-brand-sage"
                    style={{ height: `${Math.max(2, (item.pageViews / maxDaily) * 100)}%` }}
                    title={`${item.date} 조회 ${item.pageViews}회`}
                  />
                </div>
                <span className="mt-2 text-[10px] font-bold text-stone-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex gap-4 text-xs font-bold text-stone-500">
          <span><i className="mr-1 inline-block size-2.5 rounded-sm bg-brand-accent" />방문자</span>
          <span><i className="mr-1 inline-block size-2.5 rounded-sm bg-brand-sage" />조회수</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {[
          ["유입 경로", data.sources, "아직 유입 기록이 없습니다."],
          ["유입 검색어", data.searches, "검색어가 전달된 방문이 없습니다."],
          ["유입 사이트", data.sites, "외부 사이트 유입이 없습니다."],
          ["많이 본 페이지", data.pages, "아직 조회 기록이 없습니다."],
        ].map(([title, items, empty]) => (
          <div key={title as string} className="rounded-2xl border border-stone-200 p-5">
            <h3 className="font-black">{title as string}</h3>
            <RankingList items={items as AnalyticsCountItem[]} emptyText={empty as string} />
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs leading-5 text-stone-400">
        검색 사이트가 개인정보 보호를 위해 검색어를 숨기면 정확한 검색어 대신
        ‘네이버 검색’ 또는 ‘Google 검색’처럼 검색엔진명만 표시됩니다.
      </p>
    </section>
  );
}
