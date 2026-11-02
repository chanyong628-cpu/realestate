import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { savePropertyPrivateMemoAction, updatePropertyDatabaseAction } from "@/features/admin/properties/actions";
import { DeletePropertyButton } from "@/features/admin/properties/delete-button";
import { PublishToggleButton } from "@/features/admin/properties/publish-toggle-button";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Property } from "@/types/database";

function pyeongNumber(area: number | null) { return area === null ? null : Math.round(area / 3.3058); }
function money(value: number | null) { return value === null ? "-" : value.toLocaleString("ko-KR"); }
function approvalDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(`${value}T00:00:00`));
}
function metadataValue(value: string | null, prefix: string) {
  return (value ?? "").split(/\r?\n/).find((line) => line.trim().startsWith(prefix))?.trim().slice(prefix.length).trim() ?? "";
}
function managerMemo(value: string | null) {
  return (value ?? "").split(/\r?\n/).filter((line) => {
    const trimmed = line.trim();
    return !trimmed.startsWith("Google Drive 폴더명:") && !trimmed.startsWith("건물명:");
  }).join("\n").trim();
}
function exactFloor(property: Property) {
  const folderName = metadataValue(property.private_memo, "Google Drive 폴더명:");
  return folderName.match(/(?:B\d+층(?:전체|일부)?|\d+층(?:전체|일부)?|\d+호)/i)?.[0] ?? property.floor ?? "";
}
function InfoRow({ label, children, emphasized = false }: { label: string; children: React.ReactNode; emphasized?: boolean }) {
  return <div className="grid grid-cols-[118px_minmax(0,1fr)] border-b border-brand-line last:border-b-0"><dt className="bg-brand-soft px-3 py-3 text-sm font-bold text-brand-muted">{label}</dt><dd className={`min-w-0 px-4 py-3 font-black ${emphasized ? "text-lg" : "text-sm"}`}>{children}</dd></div>;
}
const inputClass = "h-10 w-full min-w-0 rounded-lg border border-brand-line bg-white px-3 text-sm font-bold outline-none focus:border-brand-accent focus:ring-2 focus:ring-blue-100";

export default async function AdminPropertyDatabaseDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; error?: string; saved?: string; memoSaved?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const editMode = query.edit === "1";
  const { data, error } = await createAdminClient().from("properties").select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();
  const property = data as Property;
  const address = property.private_address || property.public_address || "주소 없음";
  const buildingName = metadataValue(property.private_memo, "건물명:");
  const floor = exactFloor(property);
  const areaPyeong = pyeongNumber(property.exclusive_area);
  const availableParking = property.available_parking_count ?? (property.parking_available ? 1 : 0);

  return <section className="min-w-0 pb-10">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4"><Link href="/admin/property-db" className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm font-black text-brand-accent"><ArrowLeft size={16} /> 목록</Link><div className="min-w-0 sm:flex sm:items-baseline sm:gap-3"><h1 className="text-3xl font-black text-brand-accent">{property.property_number}</h1><p className="mt-1 truncate text-lg font-black sm:mt-0">{address}</p>{floor && <span className="mt-1 inline-flex shrink-0 rounded-md bg-brand-soft px-2 py-1 text-sm font-black text-brand-accent sm:mt-0">{floor}</span>}</div></div>
      <div className="flex flex-wrap items-center gap-2"><PublishToggleButton id={property.id} isPublished={property.is_published} />{editMode ? <><Link href={`/admin/property-db/${property.id}`} className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-black text-stone-600"><X size={15} /> 취소</Link><button type="submit" form="property-db-edit-form" className="inline-flex items-center gap-1 rounded-lg bg-brand-accent px-4 py-2 text-sm font-black text-white"><Save size={15} /> 저장</button></> : <Link href={`/admin/property-db/${property.id}?edit=1`} className="inline-flex items-center gap-1 rounded-lg border border-brand-accent bg-white px-4 py-2 text-sm font-black text-brand-accent"><Pencil size={15} /> 수정</Link>}<DeletePropertyButton id={property.id} propertyNumber={property.property_number} redirectTo="/admin/property-db" /></div>
    </div>
    {query.error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{query.error}</p>}
    {(query.saved === "1" || query.memoSaved === "1") && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">저장되었습니다.</p>}

    <div className="mt-6 grid min-w-0 items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <section className="min-w-0 rounded-2xl border border-brand-line bg-white p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-black">매물 사진</h2><span className="text-sm text-stone-500">{property.image_urls.length ? `1 / ${property.image_urls.length}` : "사진 없음"}</span></div><PropertyGallery images={property.image_urls} title={property.title} carouselOnly /></section>
      <section className="flex min-w-0 flex-col rounded-2xl border border-brand-line bg-white p-4"><h2 className="text-lg font-black">관리자 메모</h2><form action={savePropertyPrivateMemoAction.bind(null, property.id)} className="flex min-h-0 flex-1 flex-col"><textarea name="private_memo" rows={12} defaultValue={managerMemo(property.private_memo)} placeholder="관리자만 볼 수 있는 메모를 입력하세요." className="mt-3 min-h-64 w-full flex-1 resize-y rounded-xl border border-brand-line bg-brand-soft/40 p-4 text-sm leading-7 text-brand-ink outline-none focus:border-brand-accent focus:ring-2 focus:ring-blue-100" /><button className="mt-3 w-full rounded-lg bg-[#14213d] px-4 py-3 text-sm font-black text-white">관리자 메모 저장</button></form></section>
    </div>

    <form id="property-db-edit-form" action={updatePropertyDatabaseAction.bind(null, property.id)} className="mt-4 grid min-w-0 items-start gap-4 lg:grid-cols-2">
      <section className="min-w-0 rounded-2xl border border-brand-line bg-white p-4"><h2 className="text-lg font-black">기본 정보</h2><dl className="mt-3 overflow-hidden rounded-xl border border-brand-line">
        <InfoRow label="주소" emphasized>{editMode ? <div className="flex items-center gap-2"><input name="private_address" defaultValue={address} className={inputClass} />{floor && <span className="shrink-0 rounded-md bg-brand-soft px-2 py-1 text-sm font-black text-brand-accent">{floor}</span>}</div> : <div className="flex flex-wrap items-center gap-2"><span className="break-words">{address}</span>{floor && <span className="rounded-md bg-brand-soft px-2 py-1 text-sm font-black text-brand-accent">{floor}</span>}</div>}</InfoRow>
        <InfoRow label="건물명">{editMode ? <input name="building_name" defaultValue={buildingName} placeholder="선택 입력" className={inputClass} /> : buildingName || "-"}</InfoRow>
        <InfoRow label="금액">{editMode ? <div className="grid grid-cols-3 gap-2"><input name="deposit" type="number" min="0" defaultValue={property.deposit ?? ""} placeholder="보증금" className={inputClass} /><input name="monthly_rent" type="number" min="0" defaultValue={property.monthly_rent ?? ""} placeholder="월세" className={inputClass} /><input name="maintenance_fee" type="number" min="0" defaultValue={property.maintenance_fee ?? ""} placeholder="관리비" className={inputClass} /></div> : `${money(property.deposit)} / ${money(property.monthly_rent)} / ${money(property.maintenance_fee)}`}</InfoRow>
        <InfoRow label="실평수">{editMode ? <div className="flex items-center gap-2"><input name="exclusive_area_pyeong" type="number" min="0" step="1" defaultValue={areaPyeong ?? ""} className={inputClass} /><span className="text-xs text-stone-500">평</span></div> : `실 ${areaPyeong ?? "-"}평`}</InfoRow>
        <InfoRow label="층수">{editMode ? <div className="grid grid-cols-2 gap-2"><input name="floor" defaultValue={floor} placeholder="2층일부·202호" className={inputClass} /><input name="total_floor" defaultValue={property.total_floor ?? ""} placeholder="총층" className={inputClass} /></div> : `${floor || "-"} / 총 ${property.total_floor || "-"}`}</InfoRow>
        <InfoRow label="주차">{editMode ? <label className="flex items-center gap-2"><input name="parking_available" type="checkbox" defaultChecked={property.parking_available} className="size-5 accent-blue-700" /><input name="available_parking_count" type="number" min="0" defaultValue={availableParking} className={inputClass} /><span className="text-xs">대</span></label> : `${availableParking}대`}</InfoRow>
        <InfoRow label="엘리베이터">{editMode ? <label className="flex items-center gap-2"><input name="elevator_available" type="checkbox" defaultChecked={property.elevator_available} className="size-5 accent-blue-700" /> 있음</label> : property.elevator_available ? "있음" : "없음"}</InfoRow>
      </dl></section>

      <section className="min-w-0 rounded-2xl border border-brand-line bg-white p-4"><h2 className="text-lg font-black">건축물 정보</h2><dl className="mt-3 overflow-hidden rounded-xl border border-brand-line">
        <InfoRow label="건축물용도">{editMode ? <input name="building_use" defaultValue={property.building_use ?? ""} className={inputClass} /> : property.building_use || "-"}</InfoRow>
        <InfoRow label="사용승인일">{editMode ? <input name="approval_date" type="date" defaultValue={property.approval_date ?? ""} className={inputClass} /> : approvalDate(property.approval_date)}</InfoRow>
        <InfoRow label="공급 / 전용">{editMode ? <div className="flex items-center gap-2"><input name="supply_area" type="number" min="0" step="any" defaultValue={property.supply_area ?? ""} className={inputClass} /><span className="text-xs">㎡ / 전용은 실평수로 계산</span></div> : `${property.supply_area ?? "-"}㎡ / ${property.exclusive_area ?? "-"}㎡`}</InfoRow>
        <InfoRow label="총주차 / 가능">{editMode ? <div className="flex items-center gap-2"><input name="total_parking_count" type="number" min="0" defaultValue={property.total_parking_count ?? ""} className={inputClass} /><span className="text-xs">대 / 가능 {availableParking}대</span></div> : `총 ${property.total_parking_count ?? 0}대 / 가능 ${availableParking}대`}</InfoRow>
        <InfoRow label="건축물방향">{editMode ? <input name="building_direction" defaultValue={property.building_direction ?? ""} className={inputClass} /> : property.building_direction || "-"}</InfoRow>
        <InfoRow label="룸 / 화장실">{editMode ? <div className="grid grid-cols-2 gap-2"><input name="room_count" type="number" min="0" defaultValue={property.room_count ?? ""} placeholder="룸" className={inputClass} /><input name="restroom_count" type="number" min="0" defaultValue={property.restroom_count ?? ""} placeholder="화장실" className={inputClass} /></div> : `${property.room_count ?? 0} / ${property.restroom_count ?? 0}`}</InfoRow>
        <InfoRow label="냉난방">{editMode ? <select name="air_conditioner_type" defaultValue={property.air_conditioner_type ?? ""} className={inputClass}><option value="">선택 안 함</option>{["유", "무", "시스템", "스탠드", "벽걸이"].map((value) => <option key={value} value={value}>{value}</option>)}</select> : property.air_conditioner_type || "-"}</InfoRow>
        <InfoRow label="위반건축물">{editMode ? <label className="flex items-center gap-2"><input name="is_violating_building" type="checkbox" defaultChecked={property.is_violating_building} className="size-5 accent-red-600" /> 위반인 경우 체크</label> : property.is_violating_building ? <span className="text-red-600">위반</span> : <span className="text-emerald-700">적법</span>}</InfoRow>
      </dl></section>
    </form>
  </section>;
}
