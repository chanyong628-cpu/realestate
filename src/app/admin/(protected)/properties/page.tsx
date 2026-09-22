import Link from "next/link";
import { AdminPropertyTable } from "@/features/admin/properties/admin-property-table";
import { AdminLocationAutoRepair } from "@/features/admin/properties/admin-location-auto-repair";
import {
  derivePublicAddress,
} from "@/lib/properties/address";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Property } from "@/types/database";

export const metadata = { title: "매물 관리" };

type PropertyStatusFilter =
  | "all"
  | "published"
  | "hidden"
  | "recommended"
  | "no-image";

const statusLabels: Record<PropertyStatusFilter, string> = {
  all: "전체 매물",
  published: "노출 매물",
  hidden: "비노출 매물",
  recommended: "추천 매물",
  "no-image": "사진 없음",
};

function normalizeStatusFilter(value?: string): PropertyStatusFilter {
  return value === "published" ||
    value === "hidden" ||
    value === "recommended" ||
    value === "no-image"
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
      if (status === "no-image") return property.image_urls.length === 0;
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
        <AdminPropertyTable properties={filteredProperties} />
      )}
    </section>
  );
}
