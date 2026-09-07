"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Menu, MessageSquareText, Phone, X } from "lucide-react";
import { useState } from "react";

const navigation = [
  ["/?view=all", "전체보기"],
  ["/office", "사무실"],
  ["/store", "상가"],
  ["/etc", "기타"],
  ["/favorites", "즐겨찾기"],
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-line bg-brand-surface/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="C.Y 부동산 홈">
          <Image
            src="/images/cy-realestate-logo.png"
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
        <nav className="border-t border-brand-line bg-brand-surface px-4 py-3 lg:hidden">
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
