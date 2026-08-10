"use client";

import { CheckCircle2, Send } from "lucide-react";
import { track } from "@vercel/analytics";
import { useActionState, useEffect } from "react";
import { createInquiryAction } from "./actions";

function InquiryField({
  label,
  name,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#111827]">
        {label}{" "}
        {required ? (
          <span className="text-[#155EEF]">*</span>
        ) : (
          <span className="font-normal text-stone-400">(선택)</span>
        )}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="h-13 w-full rounded-xl border border-[#D1D5DB] bg-white px-4 outline-none transition focus:border-[#155EEF] focus:ring-3 focus:ring-blue-100"
      />
    </label>
  );
}

export function InquiryForm() {
  const [state, action, pending] = useActionState(createInquiryAction, {});

  useEffect(() => {
    if (state.success) track("inquiry_submitted");
  }, [state.success]);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-14 text-center">
        <CheckCircle2 className="mx-auto text-[#155EEF]" size={46} />
        <h2 className="mt-4 text-2xl font-black">문의가 접수되었습니다.</h2>
        <p className="mt-2 leading-7 text-[#4B5563]">
          확인 후 입력하신 전화번호로 빠르게 연락드리겠습니다.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <InquiryField
          label="업종"
          name="business_type"
          placeholder="예: 사무실, 음식점, 미용실"
        />
        <InquiryField
          label="전화번호"
          name="phone"
          type="tel"
          placeholder="예: 010-1234-5678"
        />
        <InquiryField
          label="예산"
          name="budget"
          placeholder="예: 보증금 2,000 / 월세 150"
        />
        <InquiryField
          label="평수"
          name="desired_area"
          placeholder="예: 실 20~30평"
        />
        <div className="sm:col-span-2">
          <InquiryField
            label="입주일"
            name="move_in_date"
            placeholder="예: 즉시, 협의, 8월 중"
            required={false}
          />
        </div>
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-bold text-[#111827]">
            기타사항
          </span>
          <textarea
            name="notes"
            rows={6}
            maxLength={1000}
            placeholder="원하시는 지역, 주차, 룸 개수 등 추가 조건을 자유롭게 적어주세요."
            className="w-full rounded-xl border border-[#D1D5DB] bg-white p-4 outline-none transition focus:border-[#155EEF] focus:ring-3 focus:ring-blue-100"
          />
        </label>
      </div>

      {state.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#155EEF] text-lg font-black text-white transition hover:bg-[#0F4CBB] disabled:opacity-60"
      >
        <Send size={19} />
        {pending ? "문의 접수 중..." : "맞춤매물 문의하기"}
      </button>
      <p className="text-center text-xs leading-5 text-[#6B7280]">
        문의 상담을 위해 입력하신 정보를 확인하며 상담 외 목적으로 사용하지
        않습니다.
      </p>
    </form>
  );
}
