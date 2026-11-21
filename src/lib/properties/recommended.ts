import type { Property } from "@/types/database";

/** 홈 화면에 노출하는 추천매물의 최대 개수 */
export const RECOMMENDED_PROPERTY_LIMIT = 30;

/**
 * 추천매물(is_recommended)만 골라 등록일(created_at) 최신순으로 정렬한 뒤
 * 최대 limit개까지만 반환합니다. 등록일이 같으면 매물번호가 큰(최근) 순입니다.
 * 기타(etc) 카테고리는 제외합니다.
 */
export function selectRecommendedProperties<
  T extends Pick<
    Property,
    "category" | "is_recommended" | "created_at" | "property_number"
  >,
>(properties: T[], limit = RECOMMENDED_PROPERTY_LIMIT): T[] {
  return properties
    .filter((property) => property.category !== "etc" && property.is_recommended)
    .sort((a, b) => {
      const diff =
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (diff !== 0) return diff;
      return b.property_number.localeCompare(a.property_number);
    })
    .slice(0, limit);
}
