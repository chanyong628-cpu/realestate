import Image from "next/image";
import Link from "next/link";
import { Database, Plus, Search } from "lucide-react";
import { setPropertyPublishedAction } from "@/features/admin/properties/actions";
import { DeletePropertyButton } from "@/features/admin/properties/delete-button";
import { getPropertyDatabaseRows, type PropertyDatabaseRow } from "@/lib/properties/archive";
import type { PropertyCategory } from "@/types/database";

export const metadata = { title: "매물 DB" };

function normalize(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/[\s,]/g, "");
}

function money(value: number | null) {
  return value === null ? "-" : value.toLocaleString("ko-KR");
}

function pyeong(area: number | null) {
  if (area === null) return "-";
  const value = Number((area / 3.3058).toFixed(1));
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}평`;
}

function exactFloor(property: PropertyDatabaseRow) {
  const folderLine = (property.private_memo ?? "")
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith("Google Drive 폴더명:"));
  return folderLine?.match(/(?:B\d+층(?:전체|일부)?|\d+층(?:전체|일부)?|\d+호)/i)?.[0] ?? property.floor ?? "-";
}

function memoValue(property: PropertyDatabaseRow, prefix: string) {
  const line = (property.private_memo ?? "")
    .split(/\r?\n/)
    .find((item) => item.trim().startsWith(prefix));
  return line ? line.trim().slice(prefix.length).trim() : "";
}

// 목록 제목 줄: 주소 + 건물명 + 층수. 이미 주소에 들어 있는 말은 다시 붙이지 않는다.
function listTitle(property: PropertyDatabaseRow) {
  const address = property.private_address || property.public_address || property.title;
  const parts = [address, memoValue(property, "건물명:"), exactFloor(property)].filter(
    (part, index) => part && part !== "-" && (index === 0 || !address.includes(part)),
  );
  return parts.join(" ");
}

// 모바일 제목: 동 + 지번 + 건물명(없으면 생략) + 층수. "서울특별시 송파구" 같은 앞부분은 뺀다.
function mobileTitle(property: PropertyDatabaseRow) {
  const trimmed = (property.private_address || property.public_address || property.title)
    .replace(/^(서울특별시|서울시|서울)\s*/, "")
    .replace(/^\S+구\s+/, "");
  const address = trimmed.match(/^\S*?(?:동|가|리|로|길)\s*\d+(?:-\d+)?/)?.[0] ?? trimmed;
  const building = memoValue(property, "건물명:");
  const floor = exactFloor(property);
  return [
    address,
    building && !address.includes(building) ? building : "",
    floor !== "-" && !address.includes(floor) ? floor : "",
  ].filter(Boolean).join(" ");
}

// 태그 줄은 R·P·E·T·A만 보여준다(층수는 제목 줄로 옮겼다).
function infoTags(property: PropertyDatabaseRow) {
  return [
    `R${property.room_count ?? 0}`,
    `P${property.available_parking_count ?? (property.parking_available ? 1 : 0)}대`,
    `E ${property.elevator_available ? "있음" : "없음"}`,
    `T${property.restroom_count ?? 0}`,
    `A ${property.air_conditioner_type && property.air_conditioner_type !== "무" ? "유" : "무"}`,
  ];
}

export default async function AdminPropertyDatabasePage({ searchParams }: {
  searchParams: Promise<{ q?: string; category?: string; visibility?: string }>;
}) {
  const params = await searchParams;
  const keyword = params.q?.trim() ?? "";
  const category = ["office", "store", "etc"].includes(params.category ?? "") ? (params.category as PropertyCategory) : "all";
  const visibility = params.visibility === "published" || params.visibility === "hidden" ? params.visibility : "all";
  const { rows, error } = await getPropertyDatabaseRows();
  const properties = rows.filter((property) => {
    if (
      category !== "all" &&
      (category === "office" || category === "store"
        ? !property.listing_tags?.includes(category)
        : property.category !== category)
    ) return false;
    if (visibility === "published" && !property.is_published) return false;
    if (visibility === "hidden" && property.is_published) return false;
    if (!keyword) return true;
    return normalize([
      property.property_number, property.title, property.private_address,
      property.public_address, property.floor, property.deposit,
      property.monthly_rent, property.maintenance_fee,
      pyeong(property.exclusive_area), property.private_memo,
    ].filter(Boolean).join(" ")).includes(normalize(keyword));
  }).sort((a, b) => Number(b.is_published) - Number(a.is_published));

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold text-brand-accent">PRIVATE PROPERTY DATABASE</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-black"><Database className="text-brand-accent" /> 매물장 DB</h1>
          <p className="mt-2 text-stone-600">ON/OFF는 사이트 노출(비노출)이고, 삭제하면 사이트에서는 영구 삭제되고 여기에는 삭제됨으로 보존됩니다.</p>
        </div>
        <Link href="/admin/properties/new?source=property-db" className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-3 font-black text-white hover:bg-brand-accent-dark"><Plus size={18} /> 직접 입력</Link>
      </div>

      <form className="mt-6 grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[minmax(240px,1fr)_150px_150px_auto]">
        <label className="relative min-w-0"><span className="sr-only">매물 DB 검색</span><Search className="absolute top-1/2 left-4 -translate-y-1/2 text-stone-400" size={18} /><input name="q" defaultValue={keyword} placeholder="매물번호·주소·금액·평수 전체 검색" className="h-11 w-full rounded-xl border border-stone-300 pr-4 pl-11 text-sm outline-none focus:border-brand-accent" /></label>
        <select name="category" defaultValue={category} className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm font-bold"><option value="all">분류 전체</option><option value="office">사무실</option><option value="store">상가</option><option value="etc">기타</option></select>
        <select name="visibility" defaultValue={visibility} className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm font-bold"><option value="all">노출 전체</option><option value="published">노출 매물</option><option value="hidden">비노출 매물</option></select>
        <button className="h-11 rounded-xl bg-brand-accent px-5 text-sm font-black text-white">검색</button>
      </form>

      <div className="mt-4 flex items-center justify-between"><p className="text-sm font-bold text-stone-600">전체 {properties.length}건</p>{(keyword || category !== "all" || visibility !== "all") && <Link href="/admin/property-db" className="text-sm font-bold text-brand-accent">필터 초기화</Link>}</div>
      {error && <p className="mt-6 rounded-xl bg-red-50 p-4 font-bold text-red-700">매물 DB를 불러오지 못했습니다.</p>}

      {!!properties.length && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm max-xl:border-0 max-xl:bg-transparent max-xl:shadow-none">
          <div className="hidden grid-cols-[74px_88px_minmax(360px,560px)_340px_minmax(0,1fr)_190px] items-center gap-3 bg-brand-soft px-4 py-4 text-sm font-black text-brand-muted xl:grid">
            <span>ON/OFF</span><span>매물번호</span><span>정보</span><span>보증금 / 월세 / 관리비 / 평수</span><span /><span className="text-right">관리</span>
          </div>
          {properties.map((property) => (
            <article key={property.id} className={`p-4 xl:border-t xl:border-brand-line xl:first:border-t-0 max-xl:mb-3 max-xl:rounded-3xl max-xl:border max-xl:border-brand-line max-xl:shadow-sm ${property.is_published ? "bg-white" : "bg-stone-50/80"}`}>
              <div className="hidden grid-cols-[74px_88px_minmax(360px,560px)_340px_minmax(0,1fr)_190px] items-center gap-3 xl:grid">
                {property.archived ? <span title="사이트에서 삭제되어 매물장에만 보존된 매물입니다" className="relative mt-1 inline-flex h-8 w-[70px] items-center justify-center rounded-full bg-stone-400 text-[10px] font-black text-white">삭제됨</span> : <form action={setPropertyPublishedAction.bind(null, property.id, !property.is_published)}><button type="submit" aria-label={`${property.property_number} 노출 ${property.is_published ? "끄기" : "켜기"}`} title="클릭해서 사이트 노출 ON/OFF" className={`relative h-8 w-[70px] rounded-full transition ${property.is_published ? "bg-[#14213d]" : "bg-stone-300"}`}><span className={`absolute top-1 size-6 rounded-full bg-white shadow transition ${property.is_published ? "left-1" : "left-11"}`} /><span className={`absolute top-1/2 -translate-y-1/2 text-[10px] font-black ${property.is_published ? "right-2 text-white" : "left-2 text-stone-600"}`}>{property.is_published ? "ON" : "OFF"}</span></button></form>}
                <b className="text-brand-accent">{property.property_number}</b>
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-brand-soft">{property.image_urls[0] && <Image src={property.image_urls[0]} alt="" fill sizes="80px" className="object-cover" />}</div>
                  <div className="min-w-0"><b className="block break-keep text-xl leading-snug">{listTitle(property)}</b><div className="mt-2 flex flex-wrap gap-1.5">{infoTags(property).map((tag) => <span key={tag} className="rounded-md bg-brand-soft px-2 py-1 text-xs font-bold text-brand-accent">{tag}</span>)}</div></div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center"><div><span className="block text-sm text-stone-500">보증금</span><b className="mt-1 block text-lg font-black">{money(property.deposit)}</b></div><div><span className="block text-sm text-stone-500">월세</span><b className="mt-1 block text-lg font-black">{money(property.monthly_rent)}</b></div><div><span className="block text-sm text-stone-500">관리비</span><b className="mt-1 block text-lg font-black">{money(property.maintenance_fee)}</b></div><div><span className="block text-sm text-stone-500">평수</span><b className="mt-1 block text-lg font-black">{pyeong(property.exclusive_area)}</b></div></div>
                <span />
                <div className="flex flex-nowrap justify-end gap-2"><Link href={`/admin/property-db/${property.id}?edit=1`} className="whitespace-nowrap rounded-lg border border-brand-line px-3 py-2 text-xs font-black text-brand-accent">수정</Link><Link href={`/admin/property-db/${property.id}`} className="whitespace-nowrap rounded-lg bg-brand-soft px-3 py-2 text-xs font-black text-brand-accent">상세</Link>{!property.archived && <DeletePropertyButton id={property.id} propertyNumber={property.property_number} />}</div>
              </div>
              <div className="relative xl:hidden">
                <Link href={`/admin/property-db/${property.id}`} aria-label={`${property.property_number} 상세 보기`} className="absolute inset-0 z-0 rounded-3xl" />
                <div className="pointer-events-none relative flex gap-3">
                  <div className="relative size-[104px] shrink-0 overflow-hidden rounded-2xl bg-brand-soft">
                    {property.image_urls[0] && <Image src={property.image_urls[0]} alt="" fill sizes="104px" className="object-cover" />}
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-black text-brand-accent">{property.property_number}</span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <b className="break-keep text-lg leading-snug">{mobileTitle(property)}</b>
                      <div className="pointer-events-auto relative z-10 shrink-0">
                        {property.archived ? <span className="inline-flex h-7 items-center rounded-full bg-stone-400 px-3 text-[10px] font-black text-white">삭제됨</span> : <form action={setPropertyPublishedAction.bind(null, property.id, !property.is_published)}><button type="submit" aria-label={`${property.property_number} 노출 ${property.is_published ? "끄기" : "켜기"}`} className={`relative h-7 w-[62px] rounded-full transition ${property.is_published ? "bg-[#14213d]" : "bg-stone-300"}`}><span className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${property.is_published ? "left-1" : "left-[38px]"}`} /><span className={`absolute top-1/2 -translate-y-1/2 text-[10px] font-black ${property.is_published ? "right-2 text-white" : "left-2 text-stone-600"}`}>{property.is_published ? "ON" : "OFF"}</span></button></form>}
                      </div>
                    </div>
                    <p className="mt-1.5 text-xl font-black leading-tight">{money(property.deposit)} / {money(property.monthly_rent)}{property.maintenance_fee !== null ? ` ${money(property.maintenance_fee)}` : ""}</p>
                    <p className="mt-1 text-sm font-bold text-stone-500">실 {pyeong(property.exclusive_area)}</p>
                  </div>
                </div>
                <div className="relative z-10 mt-3 flex justify-end gap-2">
                  <Link href={`/admin/property-db/${property.id}?edit=1`} className="rounded-full border border-brand-line bg-white px-5 py-2 text-sm font-black text-brand-accent">수정</Link>
                  {!property.archived && <DeletePropertyButton id={property.id} propertyNumber={property.property_number} className="whitespace-nowrap rounded-full border border-red-200 bg-white px-5 py-2 text-sm font-black text-red-700 hover:bg-red-50 disabled:opacity-50" />}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
