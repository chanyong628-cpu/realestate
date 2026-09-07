"use client";

import { useActionState } from "react";
import { createPropertyAction } from "@/features/admin/properties/actions";
import { ImageUrlManager } from "@/features/admin/properties/image-url-manager";
import { RichContentEditor } from "@/features/admin/properties/rich-content-editor";

const hiddenDefaults = {
  category: "etc",
  deposit: "",
  monthly_rent: "",
  maintenance_fee: "",
  public_address: "",
  private_address: "",
  latitude: "",
  longitude: "",
  exclusive_area: "",
  supply_area: "",
  floor: "",
  total_floor: "",
  restroom_type: "",
  move_in_date: "",
  total_parking_count: "",
  available_parking_count: "",
  building_use: "",
  approval_date: "",
  building_direction: "",
  room_count: "",
  restroom_count: "",
  air_conditioner_type: "",
} as const;

export function ArticleForm() {
  const [state, action, pending] = useActionState(createPropertyAction, {});

  return (
    <form action={action} className="mt-8 space-y-6">
      {Object.entries(hiddenDefaults).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-2 block text-sm font-bold">게시글 제목 *</span>
          <input
            name="title"
            required
            maxLength={120}
            className="h-12 w-full rounded-xl border border-stone-300 px-4 outline-none focus:border-brand-accent focus:ring-3 focus:ring-brand-sand/40"
          />
        </label>
      </section>
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">본문</h2>
        <p className="mt-1 mb-4 text-sm text-stone-500">
          사진·링크·표·굵게·기울임·정렬·템플릿 버튼을 사용해 부동산
          정보 글을 작성할 수 있습니다.
        </p>
        <RichContentEditor initialValue="" articleMode />
      </section>
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">대표 이미지</h2>
        <div className="mt-4">
          <ImageUrlManager initialUrls={[]} />
        </div>
      </section>
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-2 block text-sm font-bold">관리자 메모</span>
          <textarea
            name="private_memo"
            rows={3}
            className="w-full rounded-xl border border-amber-300 bg-amber-50 p-4"
          />
        </label>
        <label className="mt-5 flex items-center gap-3">
          <input
            name="is_published"
            type="checkbox"
            defaultChecked
            className="size-5 accent-brand-accent"
          />
          <span className="font-bold">작성 즉시 공개</span>
        </label>
      </section>
      {state.error && (
        <p className="rounded-xl bg-red-50 p-4 font-bold text-red-700">
          {state.error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          disabled={pending}
          className="h-12 rounded-xl bg-brand-accent px-8 font-black text-white disabled:opacity-50"
        >
          {pending ? "저장 중..." : "게시글 등록"}
        </button>
      </div>
    </form>
  );
}
