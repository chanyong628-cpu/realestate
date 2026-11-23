import "server-only";

import { revalidatePath } from "next/cache";

// 매물 노출 상태(삭제=OFF, ON)가 바뀌면 정적으로 만들어진 공개 목록 페이지도
// 함께 갱신해야 계약 완료된 매물이 홈 외 페이지에 남지 않는다.
export function revalidatePublicPropertyPages(propertyNumber?: string) {
  [
    "/",
    "/favorites",
    "/sitemap.xml",
    "/rss.xml",
    "/admin",
    "/admin/properties",
    "/admin/property-db",
  ].forEach((path) => revalidatePath(path));
  revalidatePath("/[category]", "page");
  revalidatePath("/[category]/[district]", "page");
  revalidatePath("/theme", "page");
  revalidatePath("/theme/[theme]", "page");
  if (propertyNumber) revalidatePath(`/properties/${propertyNumber}`);
}
