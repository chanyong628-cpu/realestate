export const AD_PLATFORMS = [
  { key: "naver_status", label: "N.부동산" },
  { key: "cy_status", label: "C.Y부동산" },
  { key: "karrot_status", label: "당근" },
  { key: "blog_status", label: "블로그" },
] as const;

export type AdPlatformKey = (typeof AD_PLATFORMS)[number]["key"];

export const AD_STATUS_ORDER = [
  "pending",
  "written",
  "posted",
  "hold",
  "failed",
] as const;

export type AdStatus = (typeof AD_STATUS_ORDER)[number];

export const AD_STATUS_LABEL: Record<AdStatus, string> = {
  pending: "대기",
  written: "작성됨",
  posted: "등록됨",
  hold: "보류",
  failed: "실패",
};

export const AD_STATUS_STYLE: Record<AdStatus, string> = {
  pending: "bg-stone-100 text-stone-600",
  written: "bg-sky-100 text-sky-800",
  posted: "bg-emerald-100 text-emerald-800",
  hold: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-700",
};

export interface AdStatusRow {
  id: string;
  ad_date: string;
  title: string;
  property_number: string | null;
  naver_status: AdStatus;
  cy_status: AdStatus;
  karrot_status: AdStatus;
  blog_status: AdStatus;
  note: string | null;
}

export function nextAdStatus(current: AdStatus): AdStatus {
  const index = AD_STATUS_ORDER.indexOf(current);
  return AD_STATUS_ORDER[(index + 1) % AD_STATUS_ORDER.length];
}
