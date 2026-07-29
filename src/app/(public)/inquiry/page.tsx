import type { Metadata } from "next";
import { InquiryForm } from "@/features/inquiries/inquiry-form";

export const metadata: Metadata = {
  title: "맞춤매물 문의",
  description: "원하시는 조건을 남겨주시면 맞춤 매물을 찾아드립니다.",
};

export default function InquiryPage() {
  return (
    <main className="bg-[#F8FAFC] px-5 py-12 sm:py-16">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="font-bold text-[#155EEF]">CUSTOM INQUIRY</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#111827] sm:text-4xl">
            원하시는 매물을 찾아드립니다.
          </h1>
          <p className="mt-3 leading-7 text-[#6B7280]">
            간단한 조건을 남겨주시면 C.Y 부동산이 확인 후 직접 연락드립니다.
          </p>
        </div>
        <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-9">
          <InquiryForm />
        </div>
      </section>
    </main>
  );
}
