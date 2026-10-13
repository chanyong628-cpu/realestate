import Link from "next/link";
import { ExternalLink } from "lucide-react";
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
      <div><b>{item.label}</b><p className="mt-0.5 text-xs text-stone-400">{item.visitDays}일 방문 · 최근 {new Date(item.lastSeen).toLocaleString("ko-KR")}</p></div>
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
      <h3 className="font-black">장기 반복 방문자 TOP 5</h3>
      <p className="mt-1 text-xs leading-5 text-stone-500">서로 다른 날짜에 2일 이상 방문한 접속만 표시합니다. 실제 IP는 저장하지 않고 익명 해시로 같은 접속을 구분하며, 회사·공용망은 여러 사람이 한 방문자로 보일 수 있습니다.</p>
      <div className="mt-4 grid gap-5 lg:grid-cols-2"><div><h4 className="text-sm font-black">최근 2주</h4><RepeatList items={data.repeatVisitors14} emptyText="2주간 반복 방문 기록이 아직 없습니다." /></div><div><h4 className="text-sm font-black">최근 4주</h4><RepeatList items={data.repeatVisitors28} emptyText="4주간 반복 방문 기록이 아직 없습니다." /></div></div>
      <div className="mt-5 border-t border-amber-200 pt-4"><h4 className="text-sm font-black">최근 4주 실패한 반복 로그인 TOP 5</h4><RepeatList items={data.repeatLoginAttempts} emptyText="반복 로그인 실패가 없습니다." /></div>
    </div>

    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
      <h3 className="font-black">외부 검색 유입 자세히 보기</h3>
      <p className="mt-1 text-xs leading-5 text-stone-500">검색 노출·클릭·유입 검색어는 각 검색 서비스의 공식 도구에서 확인할 수 있습니다. 로그인 후 cy-office.com 사이트를 선택해 주세요.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <a href="https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Acy-office.com" target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-between rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-700 transition hover:border-blue-400 hover:bg-blue-50">
          <span>Google 검색 실적 보기</span><ExternalLink aria-hidden="true" className="size-4" />
        </a>
        <a href="https://searchadvisor.naver.com/console/board" target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-between rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50">
          <span>Naver 검색 실적 보기</span><ExternalLink aria-hidden="true" className="size-4" />
        </a>
      </div>
    </div>

    <p className="mt-5 text-xs leading-5 text-stone-400">이 화면의 ‘네이버 검색’은 네이버 검색 결과에서 들어왔다는 뜻이며, 방문자가 실제로 입력한 검색어까지는 알 수 없습니다. 검색 서비스가 검색어를 전달한 경우에만 검색어 문구가 표시됩니다. 클릭률은 선택 기간의 전체 매물 상세 클릭 중 해당 매물 비율입니다.</p>
  </section>;
}
