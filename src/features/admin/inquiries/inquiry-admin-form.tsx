"use client";

import { useActionState } from "react";
import { updateInquiryAction } from "./actions";
import type { AdminInquiry } from "./types";

function Field({
  label,
  name,
  defaultValue,
  required = true,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="h-12 w-full rounded-xl border border-stone-300 px-4 outline-none focus:border-[#155EEF] focus:ring-3 focus:ring-blue-100"
      />
    </label>
  );
}

export function InquiryAdminForm({ inquiry }: { inquiry: AdminInquiry }) {
  const action = updateInquiryAction.bind(null, inquiry.id);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="업종" name="business_type" defaultValue={inquiry.business_type} />
          <Field label="전화번호" name="phone" defaultValue={inquiry.phone} />
          <Field label="예산" name="budget" defaultValue={inquiry.budget} />
          <Field label="평수" name="desired_area" defaultValue={inquiry.desired_area} />
          <div className="sm:col-span-2">
            <Field
              label="입주일"
              name="move_in_date"
              defaultValue={inquiry.move_in_date}
              required={false}
            />
          </div>
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-bold">기타사항</span>
            <textarea
              name="notes"
              rows={6}
              maxLength={1000}
              defaultValue={inquiry.notes ?? ""}
              className="w-full rounded-xl border border-stone-300 p-4 outline-none focus:border-[#155EEF] focus:ring-3 focus:ring-blue-100"
            />
          </label>
        </div>
      </section>

      {state.error && (
        <p className="rounded-xl bg-red-50 p-4 font-bold text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          disabled={pending}
          className="h-12 rounded-xl bg-[#155EEF] px-8 font-black text-white disabled:opacity-50"
        >
          {pending ? "저장 중..." : "변경사항 저장"}
        </button>
      </div>
    </form>
  );
}
