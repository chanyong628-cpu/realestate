import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// 매물 관리와 매물장 DB가 함께 쓰는 모바일 카드(당근식 가로 카드).
// 사진·카드 빈 곳은 상세로 이동하고, topRight와 actions 안의 버튼만 따로 눌린다.
export function MobilePropertyCard({
  href,
  propertyNumber,
  imageUrl,
  title,
  priceLine,
  areaLine,
  topRight,
  actions,
  checkbox,
  className = "",
}: {
  href: string;
  propertyNumber: string;
  imageUrl: string | null;
  title: string;
  priceLine: string;
  areaLine: string;
  topRight?: ReactNode;
  actions: ReactNode;
  checkbox?: { checked: boolean; onChange: () => void };
  className?: string;
}) {
  return (
    <article className={`relative mb-3 rounded-3xl border p-4 shadow-sm ${className}`}>
      <Link href={href} aria-label={`${propertyNumber} 상세 보기`} className="absolute inset-0 z-0 rounded-3xl" />
      <div className="pointer-events-none relative flex gap-3">
        <div className="relative size-[104px] shrink-0 overflow-hidden rounded-2xl bg-brand-soft">
          {imageUrl && <Image src={imageUrl} alt="" fill sizes="104px" className="object-cover" />}
          <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-black text-brand-accent">{propertyNumber}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <b className="break-keep text-lg leading-snug">{title}</b>
            {checkbox ? (
              <label className="pointer-events-auto relative z-10 shrink-0 p-1">
                <input type="checkbox" checked={checkbox.checked} onChange={checkbox.onChange} aria-label={`${propertyNumber} 선택`} className="size-7 cursor-pointer accent-violet-700" />
              </label>
            ) : (
              topRight && <div className="pointer-events-auto relative z-10 shrink-0">{topRight}</div>
            )}
          </div>
          <p className="mt-1.5 text-xl font-black leading-tight">{priceLine}</p>
          <p className="mt-1 text-sm font-bold text-stone-500">{areaLine}</p>
        </div>
      </div>
      <div className="pointer-events-none relative z-10 mt-3 flex justify-end gap-2 *:pointer-events-auto">{actions}</div>
    </article>
  );
}
