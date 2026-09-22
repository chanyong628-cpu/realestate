import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AnalyticsRangeDays = 7 | 30 | 90;

interface SiteVisitRow {
  visitor_hash: string;
  pathname: string;
  property_number: string | null;
  is_entry: boolean;
  source_type: "direct" | "search" | "site" | "campaign";
  source_name: string;
  referrer_host: string | null;
  search_query: string | null;
  visited_at: string;
}

export interface AnalyticsCountItem {
  label: string;
  count: number;
}

export interface DailyVisitStat {
  date: string;
  label: string;
  visitors: number;
  pageViews: number;
}

export interface AdminAnalyticsData {
  available: boolean;
  rangeDays: AnalyticsRangeDays;
  todayVisitors: number;
  todayPageViews: number;
  sevenDayVisitors: number;
  thirtyDayVisitors: number;
  rangeVisitors: number;
  rangePageViews: number;
  daily: DailyVisitStat[];
  sources: AnalyticsCountItem[];
  searches: AnalyticsCountItem[];
  sites: AnalyticsCountItem[];
  pages: AnalyticsCountItem[];
}

const KST_TIME_ZONE = "Asia/Seoul";

function kstDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dateAtKstMidnight(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+09:00`);
}

function dateKeyDaysAgo(daysAgo: number, now = new Date()) {
  const today = dateAtKstMidnight(kstDateKey(now));
  return kstDateKey(new Date(today.getTime() - daysAgo * 86_400_000));
}

function countItems(values: string[], limit = 8): AnalyticsCountItem[] {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function uniqueVisitors(rows: SiteVisitRow[], earliestDateKey: string) {
  return new Set(
    rows
      .filter((row) => kstDateKey(new Date(row.visited_at)) >= earliestDateKey)
      .map((row) => row.visitor_hash),
  ).size;
}

function emptyData(rangeDays: AnalyticsRangeDays): AdminAnalyticsData {
  return {
    available: false,
    rangeDays,
    todayVisitors: 0,
    todayPageViews: 0,
    sevenDayVisitors: 0,
    thirtyDayVisitors: 0,
    rangeVisitors: 0,
    rangePageViews: 0,
    daily: [],
    sources: [],
    searches: [],
    sites: [],
    pages: [],
  };
}

export async function getAdminAnalytics(
  rangeDays: AnalyticsRangeDays,
): Promise<AdminAnalyticsData> {
  const now = new Date();
  const fetchDays = Math.max(30, rangeDays);
  const fetchStartKey = dateKeyDaysAgo(fetchDays - 1, now);
  const { data, error } = await createAdminClient()
    .from("site_visits")
    .select(
      "visitor_hash,pathname,property_number,is_entry,source_type,source_name,referrer_host,search_query,visited_at",
    )
    .gte("visited_at", dateAtKstMidnight(fetchStartKey).toISOString())
    .order("visited_at", { ascending: false })
    .limit(20_000);

  if (error) {
    console.error("Admin analytics query failed:", { code: error.code });
    return emptyData(rangeDays);
  }

  const rows = (data ?? []) as SiteVisitRow[];
  const todayKey = kstDateKey(now);
  const rangeStartKey = dateKeyDaysAgo(rangeDays - 1, now);
  const rangeRows = rows.filter(
    (row) => kstDateKey(new Date(row.visited_at)) >= rangeStartKey,
  );
  const todayRows = rows.filter(
    (row) => kstDateKey(new Date(row.visited_at)) === todayKey,
  );
  const daily = Array.from({ length: rangeDays }, (_, index) => {
    const date = dateKeyDaysAgo(rangeDays - index - 1, now);
    const dayRows = rangeRows.filter(
      (row) => kstDateKey(new Date(row.visited_at)) === date,
    );
    const [, month, day] = date.split("-");
    return {
      date,
      label: `${Number(month)}/${Number(day)}`,
      visitors: new Set(dayRows.map((row) => row.visitor_hash)).size,
      pageViews: dayRows.length,
    };
  });
  const entryRows = rangeRows.filter((row) => row.is_entry);

  return {
    available: true,
    rangeDays,
    todayVisitors: new Set(todayRows.map((row) => row.visitor_hash)).size,
    todayPageViews: todayRows.length,
    sevenDayVisitors: uniqueVisitors(rows, dateKeyDaysAgo(6, now)),
    thirtyDayVisitors: uniqueVisitors(rows, dateKeyDaysAgo(29, now)),
    rangeVisitors: new Set(rangeRows.map((row) => row.visitor_hash)).size,
    rangePageViews: rangeRows.length,
    daily,
    sources: countItems(entryRows.map((row) => row.source_name)),
    searches: countItems(
      entryRows
        .filter((row) => row.source_type === "search")
        .map((row) => row.search_query || row.source_name),
    ),
    sites: countItems(
      entryRows
        .filter((row) => row.source_type === "site")
        .map((row) => row.referrer_host || row.source_name),
    ),
    pages: countItems(
      rangeRows.map((row) => row.property_number || row.pathname),
      10,
    ),
  };
}
