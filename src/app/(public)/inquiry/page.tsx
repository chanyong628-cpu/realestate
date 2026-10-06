import type { Metadata } from "next";
import { InquiryForm } from "@/features/inquiries/inquiry-form";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "맞춤매물 문의",
  description:
    "송파구 사무실·상가 임대 조건을 남겨주시면 C.Y 부동산이 맞춤 매물을 찾아드립니다.",
  alternates: { canonical: "/inquiry" },
  openGraph: {
    title: "맞춤매물 문의 | C.Y 부동산",
    description:
      "지역, 보증금, 월세, 실평수 등 원하시는 조건에 맞는 송파구 매물을 찾아드립니다.",
    url: absoluteUrl("/inquiry"),
    type: "website",
    images: ["/images/office-hero.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "맞춤매물 문의 | C.Y 부동산",
    description: "원하시는 조건에 맞는 송파구 사무실·상가 매물을 찾아드립니다.",
    images: ["/images/office-hero.png"],
  },
};

export default function InquiryPage() {
  return (
    <main className="bg-brand-soft px-5 py-12 sm:py-16">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="font-bold text-brand-accent">CUSTOM INQUIRY</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-brand-ink sm:text-4xl">
            원하시는 매물을 찾아드립니다.
          </h1>
          <p className="mt-3 leading-7 text-brand-muted">
            간단한 조건을 남겨주시면 C.Y 부동산이 확인 후 직접 연락드립니다.
          </p>
        </div>
        <div className="rounded-3xl border border-brand-line bg-brand-card p-6 shadow-sm sm:p-9">
          <InquiryForm />
        </div>
      </section>
    </main>
  );
}
