import type { PropertyCategory, RestroomType } from "@/types/database";

export const categoryLabels: Record<PropertyCategory, string> = {
  office: "사무실",
  store: "상가",
  etc: "기타",
};

export const restroomLabels: Record<RestroomType, string> = {
  internal_shared: "내부 공용",
  internal_private: "내부 단독",
  external_shared: "외부 공용",
  external_private: "외부 단독",
};

export function formatWon(value: number | null) {
  return value === null ? "협의" : `${value.toLocaleString("ko-KR")}만원`;
}

export function formatPyeong(areaInSquareMeters: number | null) {
  if (areaInSquareMeters === null) return null;
  const roundedToOneDecimal = Number((areaInSquareMeters / 3.3058).toFixed(1));
  return Number.isInteger(roundedToOneDecimal)
    ? roundedToOneDecimal.toFixed(0)
    : roundedToOneDecimal.toFixed(1);
}

export function formatArea(value: number | null) {
  if (value === null) return "-";
  return `${value.toLocaleString("ko-KR")}㎡ (${formatPyeong(value)}평)`;
}
