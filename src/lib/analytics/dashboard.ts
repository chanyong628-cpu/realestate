import "server-only";

import {
  createAnalyticsClient,
  getAnalyticsSharedSecret,
} from "@/lib/supabase/analytics";

export type AnalyticsRangeDays = 7 | 30 | 90;

export interface AnalyticsCountItem {
  label: string;
  count: number;
}

export interface AnalyticsClickItem extends AnalyticsCountItem {
  rate: number;
}

export interface RepeatVisitorItem extends AnalyticsCountItem {
  lastSeen: string;
}

export interface AdminAnalyticsData {
  available: boolean;
  rangeDays: AnalyticsRangeDays;
  todayVisitors: number;
  totalVisitors: number;
  topProperties: AnalyticsClickItem[];
  sources: AnalyticsCountItem[];
  searches: AnalyticsCountItem[];
  repeatVisitors: RepeatVisitorItem[];
  repeatLoginAttempts: RepeatVisitorItem[];
}

interface DashboardRpcResult {
  today_visitors?: number;
  total_visitors?: number;
  top_properties?: Array<{ label: string; count: number; rate: number }>;
  sources?: Array<{ label: string; count: number }>;
  searches?: Array<{ label: string; count: number }>;
  repeat_visitors?: Array<{ visitor_hash: string; count: number; last_seen: string }>;
  repeat_logins?: Array<{ visitor_hash: string; count: number; last_seen: string }>;
}

function repeatItems(
  items: DashboardRpcResult["repeat_visitors"] = [],
): RepeatVisitorItem[] {
  return (items ?? []).map((item) => ({
    label: `익명 방문자 ${item.visitor_hash.slice(0, 6).toUpperCase()}`,
    count: item.count,
    lastSeen: item.last_seen,
  }));
}

function emptyData(rangeDays: AnalyticsRangeDays): AdminAnalyticsData {
  return {
    available: false,
    rangeDays,
    todayVisitors: 0,
    totalVisitors: 0,
    topProperties: [],
    sources: [],
    searches: [],
    repeatVisitors: [],
    repeatLoginAttempts: [],
  };
}

export async function getAdminAnalytics(
  rangeDays: AnalyticsRangeDays,
): Promise<AdminAnalyticsData> {
  try {
    const { data, error } = await createAnalyticsClient().rpc(
      "get_analytics_dashboard",
      {
        p_secret: getAnalyticsSharedSecret(),
        p_range_days: rangeDays,
      },
    );
    if (error) {
      console.error("Admin analytics query failed:", { code: error.code });
      return emptyData(rangeDays);
    }

    const result = (data ?? {}) as DashboardRpcResult;
    return {
      available: true,
      rangeDays,
      todayVisitors: Number(result.today_visitors ?? 0),
      totalVisitors: Number(result.total_visitors ?? 0),
      topProperties: result.top_properties ?? [],
      sources: result.sources ?? [],
      searches: result.searches ?? [],
      repeatVisitors: repeatItems(result.repeat_visitors),
      repeatLoginAttempts: repeatItems(result.repeat_logins),
    };
  } catch (error) {
    console.error("Admin analytics unavailable:", {
      code: error instanceof Error ? error.name : "UNKNOWN",
    });
    return emptyData(rangeDays);
  }
}
