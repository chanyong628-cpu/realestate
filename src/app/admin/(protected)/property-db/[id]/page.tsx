import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { KakaoMap } from "@/components/map/kakao-map";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { DeletePropertyButton } from "@/features/admin/properties/delete-button";
import { PublishToggleButton } from "@/features/admin/properties/publish-toggle-button";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Property } from "@/types/database";

function pyeong(area: number | null) {
  if (area === null) return "-";
  const value = Number((area / 3.3058).toFixed(1));
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}평`;
}

function price(property: Property) {
  return [property.deposit, property.monthly_rent, property.maintenance_fee]
    .map((value) => (value === null ? "-" : value.toLocaleString("ko-KR")))
    .join(" / ");
}

function approvalDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(`${value}T00:00:00`));
}

export default async function AdminPropertyDatabaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await createAdminClient().from("properties").select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();
  const property = data as Property;
  const address = property.private_address || property.public_address || "주소 없음";
  const basics = [
    ["주소", address], ["금액", price(property)], ["평수", pyeong(property.exclusive_area)],
    ["룸", String(property.room_count ?? 0)], ["주차", `${property.available_parking_count ?? (property.parking_available ? 1 : 0)}대`],
    ["엘리베이터", property.elevator_available ? "있음" : "없음"],
    ["화장실", `${property.restroom_count ?? 0}`], ["냉난방기", property.air_conditioner_type || "-"],
  ];
  const building = [
    ["건축물용도", property.building_use || "-"], ["사용승인일", approvalDate(property.approval_date)],
    ["공급면적 / 전용면적", `${property.supply_area ?? "-"}㎡ / ${property.exclusive_area ?? "-"}㎡`],
    ["총주차 / 가능주차", `총 ${property.total_parking_count ?? 0}대 / 가능 ${property.available_parking_count ?? (property.parking_available ? 1 : 0)}대`],
    ["건축물방향", property.building_direction || "-"], ["룸 / 화장실", `${property.room_count ?? 0} / ${property.restroom_count ?? 0}`],
    ["냉난방", property.air_conditioner_type || "-"], ["위반건축물 여부", property.is_violating_building ? "위반" : "적법"],
  ];

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4"><Link href="/admin/property-db" className="inline-flex items-center gap-1 rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm font-black text-brand-accent"><ArrowLeft size={16} /> 목록</Link><div><h1 className="text-3xl font-black text-brand-accent">{property.property_number}</h1><p className="mt-1 font-black">{address}</p></div></div>
        <div className="flex items-center gap-2"><PublishToggleButton id={property.id} isPublished={property.is_published} /><Link href={`/admin/properties/${property.id}/edit`} className="inline-flex items-center gap-1 rounded-lg border border-brand-accent bg-white px-4 py-2 text-sm font-black text-brand-accent"><Pencil size={15} /> 수정</Link><DeletePropertyButton id={property.id} propertyNumber={property.property_number} redirectTo="/admin/property-db" /></div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-brand-line bg-white p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-black">매물 사진</h2><span className="text-sm text-stone-500">{property.image_urls.length ? `1 / ${property.image_urls.length}` : "사진 없음"}</span></div><PropertyGallery images={property.image_urls} title={property.title} carouselOnly /></section>
        <section className="rounded-2xl border border-brand-line bg-white p-4"><h2 className="mb-3 font-black">위치</h2><KakaoMap latitude={property.latitude} longitude={property.longitude} address={property.private_address} displayAddress={property.public_address} isAddressHidden={false} fiveFour /></section>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1fr_1.15fr_.9fr]">
        <section className="rounded-2xl border border-brand-line bg-white p-4"><h2 className="text-lg font-black">기본 정보</h2><dl className="mt-3 overflow-hidden rounded-xl border border-brand-line">{basics.map(([label, value]) => <div key={label} className="grid grid-cols-[105px_1fr] border-b border-brand-line last:border-b-0"><dt className="bg-brand-soft px-3 py-3 text-sm font-bold text-brand-muted">{label}</dt><dd className="px-4 py-3 text-sm font-black">{value}</dd></div>)}</dl></section>
        <section className="rounded-2xl border border-brand-line bg-white p-4"><h2 className="text-lg font-black">건축물 정보</h2><dl className="mt-3 overflow-hidden rounded-xl border border-brand-line">{building.map(([label, value]) => <div key={label} className="grid grid-cols-[145px_1fr] border-b border-brand-line last:border-b-0"><dt className="bg-brand-soft px-3 py-3 text-sm font-bold text-brand-muted">{label}</dt><dd className="px-4 py-3 text-sm font-black">{value}</dd></div>)}</dl></section>
        <section className="rounded-2xl border border-brand-line bg-white p-4"><h2 className="text-lg font-black">관리자 메모</h2><div className="mt-3 min-h-64 whitespace-pre-wrap rounded-xl border border-brand-line bg-brand-soft/40 p-4 text-sm leading-7 text-brand-ink">{property.private_memo || "등록된 메모가 없습니다."}</div></section>
      </div>
    </section>
  );
}
