import Link from "next/link";
import { FavoriteButton } from "@/components/properties/favorite-button";
import { DeletePropertyButton } from "@/features/admin/properties/delete-button";
import { PropertyProposalButton } from "@/features/admin/properties/property-proposal-button";
import {
  setPropertyPublishedAction,
  setPropertyRecommendedAction,
} from "@/features/admin/properties/actions";
import { AdminLocationAutoRepair } from "@/features/admin/properties/admin-location-auto-repair";
import {
  derivePublicAddress,
  isStoredAddressHidden,
  resolvePublicAddress,
} from "@/lib/properties/address";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Property, PropertyCategory } from "@/types/database";

const categoryLabels: Record<PropertyCategory, string> = {
  office: "사무실",
  store: "상가",
  etc: "기타",
};

export const metadata = { title: "매물 관리" };

type PropertyStatusFilter = "all" | "published" | "hidden" | "recommended";

const statusLabels: Record<PropertyStatusFilter, string> = {
  all: "전체 매물",
  published: "노출 매물",
  hidden: "비노출 매물",
  recommended: "추천 매물",
};

function normalizeStatusFilter(value?: string): PropertyStatusFilter {
  return value === "published" || value === "hidden" || value === "recommended"
    ? value
    : "all";
}

function formatWon(value: number | null) {
  return value === null ? "협의" : `${value.toLocaleString("ko-KR")}만원`;
}

function formatPyeong(value: number | null) {
  if (value === null) return "";
  const rounded = Number((value / 3.3058).toFixed(1));
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}평`;
}

function memoPreview(property: Property) {
  const memo = property.private_memo
    ?.replace(/^Google Drive\s*폴더명\s*:\s*/i, "")
    .trim();
  const source = memo || "";
  const address =
    source.match(/([가-힣0-9]+동)\s*((?:산\s*)?\d+(?:-\d+)?)/)?.slice(1, 3)
      .filter(Boolean)
      .join(" ") ||
    property.private_address ||
    property.public_address;
  const floor =
    source.match(/((?:지하\s*)?\d+\s*층)(?:전체|일부)?/)?.[1]?.replace(/\s+/g, "") ||
    property.floor;
  const money =
    source.match(/(\d+\s*-\s*\d+\s*-\s*(?:\d+|포함|없음|무|무료|관리비포함))/i)?.[1]
      ?.replace(/\s+/g, "") ||
    `보증금 ${formatWon(property.deposit)} / 월세 ${formatWon(
      property.monthly_rent,
    )}`;
  const area =
    source.match(/(\d+(?:\.\d+)?\s*평)/)?.[1]?.replace(/\s+/g, "") ||
    formatPyeong(property.exclusive_area);

  return [address, floor, money, area]
    .filter(Boolean)
    .join(" · ");
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/cy-?/g, "cy")
    .replace(/[,\s]/g, "")
    .trim();
}

function propertySearchText(property: Property) {
  const preview = memoPreview(property);
  const moneyCompact = [
    property.deposit,
    property.monthly_rent,
    property.maintenance_fee,
  ]
    .map((value) => (value === null ? "" : String(value)))
    .filter(Boolean)
    .join("-");

  return [
    property.property_number,
    property.property_number.replace(/^CY-/i, ""),
    property.title,
    property.private_address,
    property.public_address,
    preview,
    moneyCompact,
    formatPyeong(property.exclusive_area),
  ]
    .filter(Boolean)
    .join(" ");
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    q?: string;
    status?: string;
  }>;
}) {
  const notice = await searchParams;
  const keyword = (notice.q ?? "").trim();
  const status = normalizeStatusFilter(notice.status);
  const normalizedKeyword = normalizeSearchText(keyword);
  const { data, error } = await createAdminClient()
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });
  const properties = data as Property[] | null;
  const statusFilteredProperties =
    properties?.filter((property) => {
      if (status === "published") return property.is_published;
      if (status === "hidden") return !property.is_published;
      if (status === "recommended") return property.is_recommended;
      return true;
    }) ?? [];
  const filteredProperties = statusFilteredProperties.filter((property) => {
      if (!normalizedKeyword) return true;
      return normalizeSearchText(propertySearchText(property)).includes(
        normalizedKeyword,
      );
    });
  const locationProperties =
    properties
      ?.filter((property) => property.private_address)
      .map((property) => ({
        id: property.id,
        privateAddress: property.private_address ?? "",
        publicAddress:
          property.public_address ||
          derivePublicAddress(property.private_address ?? ""),
        latitude: property.latitude,
        longitude: property.longitude,
      })) ?? [];

  return (
    <section>
      <AdminLocationAutoRepair properties={locationProperties} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold text-forest-600">PROPERTIES</p>
          <h1 className="mt-1 text-3xl font-black">매물 관리</h1>
          <p className="mt-2 text-stone-600">
            공개 여부와 추천 상태를 바로 변경할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/properties/bulk"
            className="rounded-xl border border-forest-700 bg-white px-5 py-3 font-bold text-forest-700 hover:bg-forest-50"
          >
            EXCEL 등록
          </Link>
          <Link
            href="/admin/properties/new"
            className="rounded-xl bg-forest-700 px-5 py-3 font-bold text-white hover:bg-forest-900"
          >
            + 매물 등록
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
        <nav className="flex flex-wrap gap-2 md:col-span-2" aria-label="매물 상태 필터">
          {(Object.keys(statusLabels) as PropertyStatusFilter[]).map((value) => (
            <Link
              key={value}
              href={value === "all" ? "/admin/properties" : `/admin/properties?status=${value}`}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                status === value
                  ? "bg-brand-accent text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {statusLabels[value]}
            </Link>
          ))}
        </nav>
        <form action="/admin/properties" className="flex min-w-0 gap-2">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={keyword}
            placeholder="주소, 금액, 평수, 매물번호 검색 예: 방이동163-10 / 2000-150-30 / 30평 / CY-0029"
            className="h-11 min-w-0 flex-1 rounded-xl border border-stone-300 px-4 text-sm outline-none focus:border-brand-accent focus:ring-3 focus:ring-brand-sand/40"
          />
          <button className="h-11 rounded-xl bg-brand-accent px-5 text-sm font-black text-white hover:bg-brand-accent-dark">
            검색
          </button>
          {keyword && (
            <Link
              href={status === "all" ? "/admin/properties" : `/admin/properties?status=${status}`}
              className="grid h-11 place-items-center rounded-xl border border-stone-300 px-4 text-sm font-bold hover:bg-stone-50"
            >
              전체
            </Link>
          )}
        </form>
        <p className="text-sm font-bold text-stone-500">
          {keyword
            ? `${filteredProperties.length}개 검색됨 / ${statusLabels[status]} ${statusFilteredProperties.length}개`
            : `${statusLabels[status]} ${statusFilteredProperties.length}개 / 전체 ${properties?.length ?? 0}개`}
        </p>
      </div>

      {(notice.created || notice.updated) && (
        <p className="mt-4 rounded-xl bg-forest-50 px-4 py-3 font-bold text-forest-700">
          {notice.created ? "매물이 등록되었습니다." : "매물이 수정되었습니다."}
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 p-4 font-bold text-red-700">
          매물 목록을 불러오지 못했습니다. Supabase 연결 정보를 확인해 주세요.
        </p>
      )}

      {!error && properties?.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-14 text-center">
          <h2 className="text-xl font-black">아직 등록된 매물이 없습니다.</h2>
          <p className="mt-2 text-stone-500">첫 매물을 등록해 보세요.</p>
        </div>
      )}

      {!error && Boolean(properties?.length) && filteredProperties.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-14 text-center">
          <h2 className="text-xl font-black">검색 결과가 없습니다.</h2>
          <p className="mt-2 text-stone-500">
            주소, 금액, 평수, 매물번호를 다시 확인해 주세요.
          </p>
        </div>
      )}

      {!!filteredProperties.length && (
        <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[1160px] border-collapse text-left">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500">
                <th className="px-5 py-4">매물</th>
                <th className="px-4 py-4">카테고리</th>
                <th className="px-4 py-4">공개 주소</th>
                <th className="px-4 py-4 text-center">주소 표시</th>
                <th className="px-4 py-4 text-center">노출</th>
                <th className="px-4 py-4 text-center">추천</th>
                <th className="px-4 py-4 text-center" title="사진 등록 여부">
                  ✓
                </th>
                <th className="px-3 py-4 text-center">즐겨찾기</th>
                <th className="px-4 py-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((property) => {
                const hasImages = property.image_urls.length > 0;
                const preview = memoPreview(property);

                return (
                  <tr
                    key={property.id}
                    className="border-b border-stone-100 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/properties/${property.property_number}`}
                        className="group block"
                      >
                        <b className="block group-hover:text-forest-700 group-hover:underline">
                          {property.title}
                        </b>
                        <span className="mt-1 block text-xs font-bold text-forest-600">
                          {property.property_number}
                        </span>
                        {preview && (
                          <span className="mt-1.5 block max-w-[390px] truncate text-xs font-semibold text-red-600">
                            {preview}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {categoryLabels[property.category]}
                    </td>
                    <td className="max-w-56 truncate px-4 py-4 text-sm text-stone-600">
                      {resolvePublicAddress(
                        property.public_address,
                        property.private_address,
                      ) || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-black ${
                          isStoredAddressHidden(property.public_address)
                            ? "bg-amber-100 text-amber-800"
                            : "bg-brand-line text-brand-accent"
                        }`}
                      >
                        {isStoredAddressHidden(property.public_address)
                          ? "반경 표시"
                          : "주소 공개"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center">
                      <form
                        className="inline-flex"
                        action={setPropertyPublishedAction.bind(
                          null,
                          property.id,
                          !property.is_published,
                        )}
                      >
                        <button
                          className={`rounded-full px-3 py-1.5 text-xs font-black ${
                            property.is_published
                              ? "bg-forest-100 text-forest-700"
                              : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          {property.is_published ? "노출" : "비노출"}
                        </button>
                      </form>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center">
                      <form
                        className="inline-flex"
                        action={setPropertyRecommendedAction.bind(
                          null,
                          property.id,
                          !property.is_recommended,
                        )}
                      >
                        <button
                          className={`rounded-full px-3 py-1.5 text-xs font-black ${
                            property.is_recommended
                              ? "bg-amber-100 text-amber-800"
                              : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          {property.is_recommended ? "추천" : "일반"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {hasImages ? (
                        <span
                          className="inline-grid size-7 place-items-center rounded-full bg-brand-line text-sm font-black text-brand-accent"
                          title={`${property.image_urls.length}장 등록됨`}
                        >
                          ✓
                        </span>
                      ) : (
                        <span
                          className="inline-grid size-7 place-items-center rounded-full bg-red-50 text-sm font-black text-red-600"
                          title="사진 미등록"
                        >
                          ✓
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <FavoriteButton propertyId={property.id} compact />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex min-w-[184px] flex-nowrap justify-end gap-2">
                        <PropertyProposalButton
                          id={property.id}
                          propertyNumber={property.property_number}
                        />
                        <Link
                          href={`/admin/properties/${property.id}/edit`}
                          className="whitespace-nowrap rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold hover:bg-stone-50"
                        >
                          수정
                        </Link>
                        <DeletePropertyButton
                          id={property.id}
                          propertyNumber={property.property_number}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
