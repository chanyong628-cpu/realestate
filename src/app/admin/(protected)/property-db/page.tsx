import Image from "next/image";
import Link from "next/link";
import { Database, Eye, Pencil, Plus, Search } from "lucide-react";
import { setPropertyPublishedAction } from "@/features/admin/properties/actions";
import { DeletePropertyButton } from "@/features/admin/properties/delete-button";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Property, PropertyCategory } from "@/types/database";

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

function date(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function infoTags(property: Property) {
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
  const { data, error } = await createAdminClient().from("properties").select("*").order("updated_at", { ascending: false });
  const properties = ((data ?? []) as Property[]).filter((property) => {
    if (category !== "all" && property.category !== category) return false;
    if (visibility === "published" && !property.is_published) return false;
    if (visibility === "hidden" && property.is_published) return false;
    if (!keyword) return true;
    return normalize([
      property.property_number, property.title, property.private_address,
      property.public_address, property.floor, property.deposit,
      property.monthly_rent, property.maintenance_fee,
      pyeong(property.exclusive_area), property.private_memo,
    ].filter(Boolean).join(" ")).includes(normalize(keyword));
  });

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold text-brand-accent">PRIVATE PROPERTY DATABASE</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-black"><Database className="text-brand-accent" /> 매물장 DB</h1>
          <p className="mt-2 text-stone-600">홈페이지 실제 매물을 한 줄씩 빠르게 확인하고 관리합니다.</p>
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
        <div className="mt-6 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm">
          <div className="hidden grid-cols-[70px_88px_minmax(250px,1fr)_230px_82px_210px] items-center gap-3 bg-brand-soft px-4 py-4 text-sm font-black text-brand-muted xl:grid">
            <span>ON/OFF</span><span>매물번호</span><span>정보</span><span>보증금 / 월세 / 관리비 / 평수</span><span>확인일</span><span className="text-right">관리</span>
          </div>
          {properties.map((property) => (
            <article key={property.id} className={`border-t border-brand-line p-4 first:border-t-0 ${property.is_published ? "bg-white" : "bg-stone-50/80"}`}>
              <div className="hidden grid-cols-[70px_88px_minmax(250px,1fr)_230px_82px_210px] items-center gap-3 xl:grid">
                <form action={setPropertyPublishedAction.bind(null, property.id, !property.is_published)}><button aria-label={`${property.property_number} 노출 전환`} className={`relative h-8 w-14 rounded-full transition ${property.is_published ? "bg-[#14213d]" : "bg-stone-300"}`}><span className={`absolute top-1 size-6 rounded-full bg-white shadow transition ${property.is_published ? "left-7" : "left-1"}`} /></button></form>
                <b className="text-brand-accent">{property.property_number}</b>
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-brand-soft">{property.image_urls[0] && <Image src={property.image_urls[0]} alt="" fill sizes="80px" className="object-cover" />}</div>
                  <div className="min-w-0"><b className="block break-keep text-lg leading-snug">{property.private_address || property.public_address || property.title}</b><div className="mt-2 flex flex-wrap gap-1.5">{infoTags(property).map((tag) => <span key={tag} className="rounded-md bg-brand-soft px-2 py-1 text-xs font-bold text-brand-accent">{tag}</span>)}</div></div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center"><div><span className="block text-[11px] text-stone-500">보증금</span><b className="mt-1 block text-sm">{money(property.deposit)}</b></div><div><span className="block text-[11px] text-stone-500">월세</span><b className="mt-1 block text-sm">{money(property.monthly_rent)}</b></div><div><span className="block text-[11px] text-stone-500">관리비</span><b className="mt-1 block text-sm">{money(property.maintenance_fee)}</b></div><div><span className="block text-[11px] text-stone-500">평수</span><b className="mt-1 block text-sm">{pyeong(property.exclusive_area)}</b></div></div>
                <span className="text-sm text-stone-600">{date(property.updated_at)}</span>
                <div className="flex justify-end gap-2"><Link href={`/admin/property-db/${property.id}?edit=1`} className="rounded-lg border border-brand-line px-3 py-2 text-xs font-black text-brand-accent"><Pencil size={14} className="inline" /> 수정</Link><Link href={`/admin/property-db/${property.id}`} className="rounded-lg bg-brand-soft px-3 py-2 text-xs font-black text-brand-accent"><Eye size={14} className="inline" /> 상세보기</Link><DeletePropertyButton id={property.id} propertyNumber={property.property_number} /></div>
              </div>
              <div className="xl:hidden"><div className="flex items-start gap-3"><form action={setPropertyPublishedAction.bind(null, property.id, !property.is_published)}><button aria-label={`${property.property_number} 노출 전환`} className={`relative mt-1 h-8 w-14 rounded-full transition ${property.is_published ? "bg-[#14213d]" : "bg-stone-300"}`}><span className={`absolute top-1 size-6 rounded-full bg-white shadow transition ${property.is_published ? "left-7" : "left-1"}`} /></button></form><div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-brand-soft">{property.image_urls[0] && <Image src={property.image_urls[0]} alt="" fill sizes="80px" className="object-cover" />}</div><div className="min-w-0"><b className="text-brand-accent">{property.property_number}</b><h2 className="mt-1 text-lg font-black">{property.private_address || property.public_address || property.title}</h2><p className="mt-1 text-sm text-stone-500">보증금 {money(property.deposit)} · 월세 {money(property.monthly_rent)} · 관리비 {money(property.maintenance_fee)} · {pyeong(property.exclusive_area)}</p></div></div><div className="mt-4 flex gap-2"><Link href={`/admin/property-db/${property.id}?edit=1`} className="flex-1 rounded-lg border border-brand-line px-3 py-2 text-center text-sm font-black">수정</Link><Link href={`/admin/property-db/${property.id}`} className="flex-1 rounded-lg bg-brand-soft px-3 py-2 text-center text-sm font-black text-brand-accent">상세보기</Link></div></div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
