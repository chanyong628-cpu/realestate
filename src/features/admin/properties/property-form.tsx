"use client";

import { useActionState, useRef, useState } from "react";
import { isStoredAddressHidden } from "@/lib/properties/address";
import type { Property } from "@/types/database";
import {
  createPropertyAction,
  updatePropertyAction,
} from "./actions";
import { ImageUrlManager } from "./image-url-manager";
import { RichContentEditor } from "./rich-content-editor";
import {
  SmartPropertyImporter,
  type ImportedPropertyDraft,
} from "./smart-property-importer";
import { AddressLocationFields } from "./address-location-fields";

interface PropertyFormProps {
  property?: Property;
  propertyOnly?: boolean;
}

const categories = [
  ["office", "사무실"],
  ["store", "상가"],
  ["etc", "기타"],
];

const restroomTypes = [
  ["", "선택 안 함"],
  ["internal_private", "남녀 분리형 화장실"],
  ["external_shared", "단독 화장실"],
];

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
        className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none focus:border-forest-600 focus:ring-3 focus:ring-forest-100"
      />
    </label>
  );
}

export function PropertyForm({
  property,
  propertyOnly = false,
}: PropertyFormProps) {
  const [category, setCategory] = useState(property?.category ?? "office");
  const [importedDescription, setImportedDescription] = useState<string | null>(
    null,
  );
  const [descriptionVersion, setDescriptionVersion] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const action = property
    ? updatePropertyAction.bind(null, property.id)
    : createPropertyAction;
  const [state, formAction, pending] = useActionState(action, {});

  function applyImportedDraft(draft: ImportedPropertyDraft) {
    const form = formRef.current;
    if (!form) return;
    setCategory(draft.category);
    setImportedDescription(draft.description);
    setDescriptionVersion((version) => version + 1);

    Object.entries(draft).forEach(([name, value]) => {
      if (name === "category" || name === "description") return;
      const field = form.elements.namedItem(name);
      if (
        !(
          field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement
        )
      ) {
        return;
      }
      if (field instanceof HTMLInputElement && field.type === "checkbox") {
        field.checked = Boolean(value);
      } else {
        field.value = value === null ? "" : String(value);
      }
    });
    window.setTimeout(
      () => window.dispatchEvent(new Event("cy:geocode-address")),
      0,
    );
  }

  return (
    <form ref={formRef} action={formAction} className="mt-8 space-y-8">
      {!property && <SmartPropertyImporter onImport={applyImportedDraft} />}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">기본 정보</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-bold">매물명 *</span>
            <input
              name="title"
              required
              maxLength={120}
              defaultValue={property?.title}
              placeholder="예: 역삼역 도보 3분 신축 사무실"
              className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none focus:border-forest-600 focus:ring-3 focus:ring-forest-100"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">카테고리 *</span>
            <select
              name="category"
              required
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as "office" | "store" | "etc")
              }
              className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4"
            >
              {categories
                .filter(([value]) => !propertyOnly || value !== "etc")
                .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="입주 가능일"
            name="move_in_date"
            defaultValue={property?.move_in_date ?? "즉시입주"}
            placeholder="예: 즉시 입주, 협의"
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">건축물 기본정보</h2>
        <p className="mt-1 text-sm text-stone-500">
          건축물대장을 기준으로 입력해 주세요.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="건축물용도"
            name="building_use"
            defaultValue={property?.building_use}
            placeholder="예: 제2종근린생활시설"
          />
          <Field
            label="사용승인일"
            name="approval_date"
            type="date"
            defaultValue={property?.approval_date}
          />
          <Field
            label="건축물방향"
            name="building_direction"
            defaultValue={property?.building_direction}
            placeholder="예: 동향"
          />
          <Field
            label="룸 개수"
            name="room_count"
            type="number"
            defaultValue={property?.room_count}
          />
          <Field
            label="화장실 개수"
            name="restroom_count"
            type="number"
            defaultValue={property?.restroom_count}
          />
          <label className="block">
            <span className="mb-2 block text-sm font-bold">에어컨</span>
            <select
              name="air_conditioner_type"
              defaultValue={property?.air_conditioner_type ?? ""}
              className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4"
            >
              <option value="">선택 안 함</option>
              {["유", "무", "시스템", "스탠드", "벽걸이"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 self-end rounded-xl border border-stone-200 p-3.5">
            <input
              name="is_violating_building"
              type="checkbox"
              defaultChecked={property?.is_violating_building}
              className="size-5 accent-red-600"
            />
            <span>
              <b className="block">위반건축물</b>
              <small className="text-stone-500">위반인 경우에만 체크</small>
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">금액</h2>
        <p className="mt-1 text-sm text-stone-500">단위: 만원</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <Field
            label="보증금"
            name="deposit"
            type="number"
            defaultValue={property?.deposit}
          />
          <Field
            label="월세"
            name="monthly_rent"
            type="number"
            defaultValue={property?.monthly_rent}
          />
          <Field
            label="관리비"
            name="maintenance_fee"
            type="number"
            defaultValue={property?.maintenance_fee}
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">주소와 위치</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <input type="hidden" name="public_address" defaultValue="" />
          <AddressLocationFields
            address={property?.private_address}
            latitude={property?.latitude}
            longitude={property?.longitude}
          />
          <label className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:col-span-2">
            <input
              name="is_address_hidden"
              type="checkbox"
              defaultChecked={isStoredAddressHidden(property?.public_address)}
              className="size-5 accent-amber-600"
            />
            <span>
              <b className="block">주소 비노출</b>
              <small className="text-stone-600">
                체크하면 정확한 주소 대신 동 단위 주소와 400m 반경을 표시합니다.
              </small>
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">공간 정보</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            label="전용면적(㎡)"
            name="exclusive_area"
            type="number"
            defaultValue={property?.exclusive_area}
          />
          <Field
            label="공급면적(㎡)"
            name="supply_area"
            type="number"
            defaultValue={property?.supply_area}
          />
          <Field label="층수" name="floor" defaultValue={property?.floor} />
          <Field
            label="전체 층수"
            name="total_floor"
            defaultValue={property?.total_floor}
          />
          <Field
            label="총 주차대수"
            name="total_parking_count"
            type="number"
            defaultValue={property?.total_parking_count}
          />
          <Field
            label="가능 주차대수"
            name="available_parking_count"
            type="number"
            defaultValue={property?.available_parking_count}
          />
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-bold">화장실 유형</span>
            <select
              name="restroom_type"
              defaultValue={property?.restroom_type ?? ""}
              className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4"
            >
              {restroomTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 self-end rounded-xl border border-stone-200 p-3.5">
            <input
              name="parking_available"
              type="checkbox"
              defaultChecked={property?.parking_available}
              className="size-5 accent-forest-700"
            />
            <span className="font-bold">주차 가능</span>
          </label>
          <label className="flex items-center gap-3 self-end rounded-xl border border-stone-200 p-3.5">
            <input
              name="elevator_available"
              type="checkbox"
              defaultChecked={property?.elevator_available}
              className="size-5 accent-forest-700"
            />
            <span className="font-bold">엘리베이터 있음</span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">설명과 사진</h2>
        <div className="mt-5 space-y-5">
          <div>
            <span className="mb-2 block text-sm font-bold">
              {category === "etc" ? "부동산 정보 본문" : "상세 설명"}
            </span>
            <RichContentEditor
              key={descriptionVersion}
              initialValue={
                importedDescription ?? property?.description ?? ""
              }
              articleMode={category === "etc"}
            />
          </div>
          <div>
            <span className="mb-2 block text-sm font-bold">매물 사진</span>
            <ImageUrlManager initialUrls={property?.image_urls ?? []} />
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">
              비공개 메모
            </span>
            <textarea
              name="private_memo"
              rows={4}
              defaultValue={property?.private_memo ?? ""}
              placeholder="관리자 화면에서만 보입니다."
              className="w-full rounded-xl border border-amber-300 bg-amber-50 p-4 outline-none focus:ring-3 focus:ring-amber-100"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">노출 설정</h2>
        <div className="mt-5 flex flex-wrap gap-4">
          <label className="flex items-center gap-3 rounded-xl border border-stone-200 p-4">
            <input
              name="is_published"
              type="checkbox"
              defaultChecked={property?.is_published ?? true}
              className="size-5 accent-forest-700"
            />
            <span>
              <b className="block">공개</b>
              <small className="text-stone-500">공개 사이트에 표시</small>
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-stone-200 p-4">
            <input
              name="is_recommended"
              type="checkbox"
              defaultChecked={property?.is_recommended}
              className="size-5 accent-forest-700"
            />
            <span>
              <b className="block">추천매물</b>
              <small className="text-stone-500">추천 배지 표시</small>
            </span>
          </label>
        </div>
      </section>

      {state.error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700"
        >
          {state.error}
        </p>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="h-13 rounded-xl bg-forest-700 px-8 font-black text-white shadow-lg transition hover:bg-forest-900 disabled:opacity-60"
        >
          {pending ? "저장 중..." : property ? "변경사항 저장" : "매물 등록"}
        </button>
      </div>
    </form>
  );
}
