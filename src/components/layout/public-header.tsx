"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Heart, Menu, MessageSquareText, Phone, X } from "lucide-react";
import { useState } from "react";
import { themeDefinitions } from "@/lib/properties/listing-tags";

const navigation = [
  ["/?view=all", "전체보기"],
  ["/office", "사무실"],
  ["/store", "상가"],
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-line bg-brand-base/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="C.Y 부동산 홈">
          <Image
            src="/images/cy-realestate-logo-header.png"
            alt="C.Y REALESTATE"
            width={500}
            height={119}
            priority
            sizes="(max-width: 640px) 180px, 220px"
            className="h-auto w-[180px] sm:w-[220px]"
          />
        </Link>
        <nav className="hidden items-center gap-7 lg:flex">
          {navigation.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={(event) => {
                if (label !== "전체보기") return;
                event.preventDefault();
                window.location.assign(href);
              }}
              className="text-[15px] font-bold text-brand-dark transition hover:text-brand-accent"
            >
              {label}
            </Link>
          ))}
          <div className="relative">
            <button
              type="button"
              onClick={() => setThemeOpen((value) => !value)}
              aria-expanded={themeOpen}
              className="flex items-center gap-1 text-[15px] font-bold text-brand-dark transition hover:text-brand-accent"
            >
              테마 <ChevronDown size={16} className={themeOpen ? "rotate-180" : ""} />
            </button>
            {themeOpen && (
              <div className="absolute left-1/2 top-9 grid w-[360px] -translate-x-1/2 grid-cols-2 gap-2 rounded-2xl border border-brand-line bg-white p-3 shadow-2xl">
                {themeDefinitions.map((theme) => (
                  <Link
                    key={theme.slug}
                    href={`/theme/${theme.slug}`}
                    onClick={() => setThemeOpen(false)}
                    className="rounded-xl border border-brand-soft bg-brand-base p-4 transition hover:border-brand-accent hover:bg-brand-soft"
                  >
                    <b className="block text-brand-dark">{theme.label}</b>
                    <small className="mt-1 block leading-5 text-brand-muted">{theme.description}</small>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/favorites"
            className="text-[15px] font-bold text-brand-dark transition hover:text-brand-accent"
          >
            즐겨찾기
          </Link>
          <a
            href="tel:01065465997"
            className="flex h-11 items-center gap-2 rounded-lg bg-brand-accent px-5 text-sm font-bold text-white transition hover:bg-brand-accent-dark"
          >
            <Phone size={17} /> 02-6425-8090
          </a>
          <Link
            href="/inquiry"
            className="flex h-11 items-center gap-2 rounded-lg border border-brand-slate bg-brand-surface px-4 text-sm font-bold text-brand-slate transition hover:bg-brand-soft"
          >
            <MessageSquareText size={17} /> 맞춤 문의
          </Link>
        </nav>
        <button
          type="button"
          aria-label="메뉴"
          className="grid size-11 place-items-center rounded-lg border border-brand-line text-brand-dark lg:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-brand-line bg-brand-base px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-[1440px] flex-col">
            {navigation.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                onClick={(event) => {
                  setOpen(false);
                  if (label !== "전체보기") return;
                  event.preventDefault();
                  window.location.assign(href);
                }}
                className="flex min-h-12 items-center gap-2 border-b border-brand-soft px-2 font-bold text-brand-dark"
              >
                {label === "즐겨찾기" && <Heart size={17} />}
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setThemeOpen((value) => !value)}
              className="flex min-h-12 items-center justify-between border-b border-brand-soft px-2 font-bold text-brand-dark"
              aria-expanded={themeOpen}
            >
              테마 <ChevronDown size={17} className={themeOpen ? "rotate-180" : ""} />
            </button>
            {themeOpen && (
              <div className="grid grid-cols-2 gap-2 py-3">
                {themeDefinitions.map((theme) => (
                  <Link
                    key={theme.slug}
                    href={`/theme/${theme.slug}`}
                    onClick={() => {
                      setThemeOpen(false);
                      setOpen(false);
                    }}
                    className="rounded-xl border border-brand-line bg-brand-soft p-3 text-center font-bold text-brand-dark"
                  >
                    {theme.label}
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/favorites"
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center gap-2 border-b border-brand-soft px-2 font-bold text-brand-dark"
            >
              <Heart size={17} /> 즐겨찾기
            </Link>
            <a
              href="tel:01065465997"
              className="mt-3 flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-accent font-bold text-white"
            >
              <Phone size={18} /> 02-6425-8090
            </a>
            <Link
              href="/inquiry"
              onClick={() => setOpen(false)}
              className="mt-2 flex h-12 items-center justify-center gap-2 rounded-lg border border-brand-slate font-bold text-brand-slate"
            >
              <MessageSquareText size={18} /> 맞춤 문의
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
