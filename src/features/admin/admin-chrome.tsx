"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

// 관리자 공통 틀. 모바일에서는 메뉴 패널을 숨겨 두고 "CY 부동산 관리자"를 누르면 펼친다.
export function AdminChrome({
  links,
  logout,
  children,
}: {
  links: [string, string][];
  logout: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4">
          <Link href="/admin" className="text-lg font-black max-md:hidden">
            CY 부동산 관리자
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="admin-menu"
            className="flex items-center gap-2 text-lg font-black md:hidden"
          >
            CY 부동산 관리자
            <span aria-hidden="true" className={`text-sm transition ${open ? "rotate-180" : ""}`}>▾</span>
          </button>
          {logout}
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] gap-6 px-5 py-8 max-md:gap-0 max-md:py-4 md:grid-cols-[190px_minmax(0,1fr)]">
        <nav
          id="admin-menu"
          className={`h-fit rounded-2xl bg-white p-3 shadow-sm max-md:mb-4 ${open ? "" : "max-md:hidden"}`}
        >
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-forest-50 hover:text-forest-700"
            >
              {label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
