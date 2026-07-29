"use client";

import { useActionState } from "react";
import type { CustomerBlock } from "@/types/database";
import {
  createCustomerBlockAction,
  updateCustomerBlockAction,
} from "./actions";

export function CustomerBlockForm({
  block,
}: {
  block?: CustomerBlock;
}) {
  const action = block
    ? updateCustomerBlockAction.bind(null, block.id)
    : createCustomerBlockAction;
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">고객 정보</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-bold">고객 이름 *</span>
            <input
              name="customer_name"
              required
              defaultValue={block?.customer_name}
              className="h-12 w-full rounded-xl border border-stone-300 px-4 outline-none focus:border-forest-600 focus:ring-3 focus:ring-forest-100"
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold">연락처</span>
            <input
              name="customer_phone"
              defaultValue={block?.customer_phone ?? ""}
              className="h-12 w-full rounded-xl border border-stone-300 px-4 outline-none focus:border-forest-600 focus:ring-3 focus:ring-forest-100"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-bold">
              관리자 메모
            </span>
            <textarea
              name="customer_memo"
              rows={3}
              defaultValue={block?.customer_memo ?? ""}
              className="w-full rounded-xl border border-amber-300 bg-amber-50 p-4 outline-none"
              placeholder="고객에게 공개되지 않습니다."
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">공유 페이지 문구</h2>
        <div className="mt-5 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold">공유 제목</span>
            <input
              name="shared_title"
              defaultValue={block?.shared_title ?? ""}
              placeholder="예: 고객님께 추천드리는 매물"
              className="h-12 w-full rounded-xl border border-stone-300 px-4 outline-none focus:border-forest-600 focus:ring-3 focus:ring-forest-100"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">공유 설명</span>
            <textarea
              name="shared_description"
              rows={3}
              defaultValue={block?.shared_description ?? ""}
              className="w-full rounded-xl border border-stone-300 p-4 outline-none focus:border-forest-600 focus:ring-3 focus:ring-forest-100"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">매물 저장 방법</h2>
        <p className="mt-2 leading-7 text-stone-600">
          고객 블록을 먼저 저장한 다음 공개 사이트에서 원하는 매물의
          하트를 누르고 이 고객을 선택하세요. 선택한 매물이 고객 공유
          페이지에 바로 추가됩니다.
        </p>
      </section>

      {state.error && (
        <p className="rounded-xl bg-red-50 p-4 font-bold text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          disabled={pending}
          className="h-12 rounded-xl bg-forest-700 px-8 font-black text-white disabled:opacity-50"
        >
          {pending ? "저장 중..." : block ? "변경사항 저장" : "고객 블록 생성"}
        </button>
      </div>
    </form>
  );
}
