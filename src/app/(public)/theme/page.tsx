import type { Metadata } from "next";
import Link from "next/link";
import { Building2, KeyRound, Sparkles, Sun } from "lucide-react";
import { themeDefinitions } from "@/lib/properties/listing-tags";

export const metadata: Metadata = {
  title: "테마별 매물",
  description: "신축, 통임대, 매매, 테라스 조건으로 C.Y 부동산 매물을 모아보세요.",
  alternates: { canonical: "/theme" },
};

const themeIcons = {
  "new-build": Sparkles,
  "whole-rent": Building2,
  sale: KeyRound,
  terrace: Sun,
} as const;

export default function ThemePage() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="text-sm font-black tracking-[0.16em] text-brand-accent">THEME</p>
      <h1 className="mt-3 text-3xl font-black text-brand-dark sm:text-4xl">테마별 매물</h1>
      <p className="mt-3 text-brand-muted">원하는 조건을 선택하면 해당 테마에 등록된 매물만 모아서 보여드립니다.</p>

      <div className="mt-9 grid grid-cols-2 gap-3 sm:gap-5">
        {themeDefinitions.map((theme) => {
          const Icon = themeIcons[theme.slug];
          return (
            <Link
              key={theme.slug}
              href={`/theme/${theme.slug}`}
              className="group min-h-44 rounded-2xl border border-brand-line bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-accent hover:shadow-xl sm:min-h-52 sm:p-7"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-accent sm:size-13">
                <Icon size={24} />
              </span>
              <h2 className="mt-5 text-xl font-black text-brand-dark sm:text-2xl">{theme.label}</h2>
              <p className="mt-2 text-sm leading-6 text-brand-muted sm:text-base">{theme.description}</p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
