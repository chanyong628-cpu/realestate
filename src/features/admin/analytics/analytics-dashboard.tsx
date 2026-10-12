import Link from "next/link";
import type { AdminAnalyticsData, AnalyticsClickItem, AnalyticsCountItem, AnalyticsRangeDays, RepeatVisitorItem } from "@/lib/analytics/dashboard";

const ranges: Array<{ days: AnalyticsRangeDays; label: string }> = [
  { days: 7, label: "7일" }, { days: 30, label: "30일" }, { days: 90, label: "90일" },
];

function RankingList({ items, emptyText, showRate = false }: { items: Array<AnalyticsCountItem | AnalyticsClickItem>; emptyText: string; showRate?: boolean }) {
  if (!items.length) return <p className="mt-5 text-sm text-stone-400">{emptyText}</p>;
  return <ol className="mt-5 space-y-3">{items.map((item, index) => (
    <li key={item.label} className="flex items-center gap-3 text-sm">
      <span className="font-black text-stone-400">{index + 1}</span>
      <b className="min-w-0 flex-1 truncate" title={item.label}>{item.label}</b>
      <span className="font-bold text-stone-500">{showRate && "rate" in item ? `${item.rate}% · ` : ""}{item.count}회</span>
    </li>
  ))}</ol>;
}

function RepeatList({ items, emptyText }: { items: RepeatVisitorItem[]; emptyText: string }) {
  if (!items.length) return <p className="mt-4 text-sm text-stone-400">{emptyText}</p>;
  return <ol className="mt-4 space-y-3">{items.map((item, index) => (
    <li key={item.label} className="grid grid-cols-[1.5rem_1fr_auto] gap-2 text-sm">
      <b className="text-stone-400">{index + 1}</b>
      <div><b>{item.label}</b><p className="mt-0.5 text-xs text-stone-400">최근 {new Date(item.lastSeen).toLocaleString("ko-KR")}</p></div>
      <b>{item.count}회</b>
    </li>
  ))}</ol>;
}

export function AnalyticsDashboard({ data }: { data: AdminAnalyticsData }) {
  if (!data.available) return <section className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-7"><h2 className="text-xl font-black">방문 통계 준비 중</h2><p className="mt-2 text-sm leading-6 text-stone-500">통계 데이터베이스 연결을 확인하고 있습니다.</p></section>;

  return <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-black text-brand-accent">익명 방문 통계</p><h2 className="mt-1 text-2xl font-black">홈페이지 방문 현황</h2><p className="mt-2 text-sm text-stone-500">관리자로 로그인한 기기 방문은 집계하지 않습니다.</p></div>
      <nav className="flex rounded-xl bg-stone-100 p-1" aria-label="통계 기간">{ranges.map((range) => <Link key={range.days} href={`/admin?range=${range.days}`} className={`rounded-lg px-4 py-2 text-sm font-black ${data.rangeDays === range.days ? "bg-brand-accent text-white" : "text-stone-500 hover:bg-white"}`}>{range.label}</Link>)}</nav>
    </div>

    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl bg-brand-accent p-6 text-white"><p className="text-sm font-bold text-white/75">오늘 방문자수</p><p className="mt-2 text-4xl font-black">{data.todayVisitors.toLocaleString("ko-KR")}명</p></div>
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6"><p className="text-sm font-bold text-stone-500">총 방문자수</p><p className="mt-2 text-4xl font-black">{data.totalVisitors.toLocaleString("ko-KR")}명</p></div>
    </div>

    <div className="mt-5 grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-stone-200 p-5"><h3 className="font-black">클릭률 높은 매물 TOP 5</h3><RankingList items={data.topProperties} emptyText="아직 매물 클릭 기록이 없습니다." showRate /></div>
      <div className="rounded-2xl border border-stone-200 p-5"><h3 className="font-black">들어온 경로</h3><RankingList items={data.sources} emptyText="아직 유입 기록이 없습니다." /></div>
      <div className="rounded-2xl border border-stone-200 p-5"><h3 className="font-black">검색키워드</h3><RankingList items={data.searches} emptyText="전달된 검색어가 없습니다." /></div>
    </div>

    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h3 className="font-black">반복 방문·로그인 TOP 3</h3>
      <p className="mt-1 text-xs leading-5 text-stone-500">실제 IP는 저장하거나 표시하지 않고, 익명 해시로 같은 접속만 구분합니다. 회사·공용망은 여러 사람이 한 방문자로 보일 수 있습니다.</p>
      <div className="mt-4 grid gap-5 lg:grid-cols-2"><div><h4 className="text-sm font-black">반복 방문</h4><RepeatList items={data.repeatVisitors} emptyText="반복 방문 기록이 아직 없습니다." /></div><div><h4 className="text-sm font-black">실패한 반복 로그인</h4><RepeatList items={data.repeatLoginAttempts} emptyText="반복 로그인 실패가 없습니다." /></div></div>
    </div>

    <p className="mt-5 text-xs leading-5 text-stone-400">검색 서비스가 검색어를 숨긴 경우 검색엔진 이름만 표시됩니다. 클릭률은 선택 기간의 전체 매물 상세 클릭 중 해당 매물 비율입니다.</p>
  </section>;
}
