import type { Property } from "@/types/database";

// 매물 카드(목록 화면)에 실제로 쓰이는 항목만 모은 타입.
// 클라이언트 컴포넌트로 넘기는 데이터 용량을 줄이기 위해 사용한다.
export type PropertyCardData = Pick<
  Property,
  | "id"
  | "property_number"
  | "title"
  | "category"
  | "is_recommended"
  | "is_published"
  | "created_at"
  | "deposit"
  | "monthly_rent"
  | "exclusive_area"
  | "image_urls"
>;

export function toPropertyCardData(property: Property): PropertyCardData {
  return {
    id: property.id,
    property_number: property.property_number,
    title: property.title,
    category: property.category,
    is_recommended: property.is_recommended,
    is_published: property.is_published,
    created_at: property.created_at,
    deposit: property.deposit,
    monthly_rent: property.monthly_rent,
    exclusive_area: property.exclusive_area,
    // 카드에는 대표 사진 1장만 사용한다.
    image_urls: property.image_urls.slice(0, 1),
  };
}
