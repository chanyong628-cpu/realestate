import Link from "next/link";
import { Database, Pencil, Plus, Search } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Property, PropertyCategory } from "@/types/database";

export const metadata = { title: "매물 DB" };

const categoryLabels: Record<PropertyCategory, string> = {
  office: "사무실",
  store: "상가",
  etc: "기타",
};

function normalize(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/[\s,]/g, "");
}

function price(property: Property) {
  return [property.deposit, property.monthly_rent, property.maintenance_fee]
    .map((value) => (value === null ? "-" : value.toLocaleString("ko-KR")))
    .join(" / ");
}

function pyeong(area: number | null) {
  if (area === null) return "-";
  const value = Number((area / 3.3058).toFixed(1));
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}평`;
}

export default async function AdminPropertyDatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; visibility?: string }>;
}) {
  const params = await searchParams;
  const keyword = params.q?.trim() ?? "";
  const category = ["office", "store", "etc"].includes(params.category ?? "")
    ? (params.category as PropertyCategory)
    : "all";
  const visibility = params.visibility === "published" || params.visibility === "hidden"
    ? params.visibility
    : "all";
  const { data, error } = await createAdminClient()
    .from("properties")
    .select("*")
    .order("updated_at", { ascending: false });
  const properties = ((data ?? []) as Property[]).filter((property) => {
    if (category !== "all" && property.category !== category) return false;
    if (visibility === "published" && !property.is_published) return false;
    if (visibility === "hidden" && property.is_published) return false;
    if (!keyword) return true;
    const haystack = [
      property.property_number,
      property.title,
      property.private_address,
      property.public_address,
      property.floor,
      price(property),
      pyeong(property.exclusive_area),
      property.private_memo,
    ]
      .filter(Boolean)
      .join(" ");
    return normalize(haystack).includes(normalize(keyword));
  });

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold text-forest-600">PRIVATE PROPERTY DATABASE</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-black">
            <Database className="text-brand-accent" /> 매물 DB
          </h1>
          <p className="mt-2 text-stone-600">
            홈페이지의 실제 매물 원장을 관리자 전용으로 확인합니다.
          </p>
        </div>
        <Link
          href="/admin/properties/new"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-3 font-black text-white hover:bg-brand-accent-dark"
        >
          <Plus size={18} /> 매물 등록
        </Link>
      </div>

      <form className="mt-6 grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[minmax(240px,1fr)_150px_150px_auto]">
        <label className="relative min-w-0">
          <span className="sr-only">매물 DB 검색</span>
          <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-stone-400" size={18} />
          <input
            name="q"
            defaultValue={keyword}
            placeholder="매물명·전체주소·금액·평수·매물번호 검색"
            className="h-11 w-full rounded-xl border border-stone-300 pr-4 pl-11 text-sm outline-none focus:border-brand-accent"
          />
        </label>
        <select name="category" defaultValue={category} className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm font-bold">
          <option value="all">분류 전체</option>
          <option value="office">사무실</option>
          <option value="store">상가</option>
          <option value="etc">기타</option>
        </select>
        <select name="visibility" defaultValue={visibility} className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm font-bold">
          <option value="all">노출 전체</option>
          <option value="published">노출 매물</option>
          <option value="hidden">비노출 매물</option>
        </select>
        <button className="h-11 rounded-xl bg-brand-accent px-5 text-sm font-black text-white hover:bg-brand-accent-dark">
          검색
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm font-bold text-stone-600">검색 결과 {properties.length}개</p>
        {(keyword || category !== "all" || visibility !== "all") && (
          <Link href="/admin/property-db" className="text-sm font-bold text-brand-accent hover:underline">
            필터 초기화
          </Link>
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 p-4 font-bold text-red-700">
          매물 DB를 불러오지 못했습니다.
        </p>
      )}

      {!error && properties.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <b className="text-lg">조건에 맞는 매물이 없습니다.</b>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {properties.map((property) => (
          <article key={property.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-brand-accent">{property.property_number}</span>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-600">
                    {categoryLabels[property.category]}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${property.is_published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {property.is_published ? "노출" : "비노출"}
                  </span>
                </div>
                <h2 className="mt-2 break-keep text-lg font-black">{property.title}</h2>
              </div>
              <Link
                href={`/admin/properties/${property.id}/edit`}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-stone-300 px-3 py-2 text-xs font-black hover:bg-stone-50"
              >
                <Pencil size={14} /> 수정
              </Link>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
              <div className="col-span-2">
                <dt className="text-xs font-bold text-stone-500">전체 주소</dt>
                <dd className="mt-1 break-words font-black">{property.private_address || property.public_address || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-stone-500">층수</dt>
                <dd className="mt-1 font-black">{property.floor || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-stone-500">전용 평수</dt>
                <dd className="mt-1 font-black">{pyeong(property.exclusive_area)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-bold text-stone-500">보증금 / 월세 / 관리비</dt>
                <dd className="mt-1 font-black text-brand-accent">{price(property)}</dd>
              </div>
              {property.private_memo && (
                <div className="col-span-2">
                  <dt className="text-xs font-bold text-stone-500">기타 메모</dt>
                  <dd className="mt-1 line-clamp-3 whitespace-pre-wrap text-stone-700">{property.private_memo}</dd>
                </div>
              )}
            </dl>
            <Link
              href={`/properties/${property.property_number}`}
              className="mt-5 block rounded-xl border border-brand-line bg-brand-soft px-4 py-2.5 text-center text-sm font-black text-brand-accent hover:bg-brand-line"
            >
              상세 화면 보기
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
