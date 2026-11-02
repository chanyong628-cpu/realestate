import Link from "next/link";
import { MapPin } from "lucide-react";
import {
  getRegionPath,
  songpaRegions,
  type SongpaRegion,
} from "@/lib/songpa-regions";

type RegionalCategory = "office" | "store";

const categoryLabels: Record<RegionalCategory, string> = {
  office: "사무실",
  store: "상가",
};

export function RegionDirectory({
  category,
  currentRegion,
  compact = false,
}: {
  category: RegionalCategory;
  currentRegion?: SongpaRegion;
  compact?: boolean;
}) {
  const label = categoryLabels[category];

  return (
    <section
      aria-labelledby="region-directory-title"
      className={
        compact
          ? "border-t border-brand-line py-10"
          : "mx-auto max-w-[1440px] px-5 pt-10 sm:px-6 lg:px-8 lg:pt-14"
      }
    >
      <div className="rounded-2xl border border-brand-line bg-brand-surface p-5 shadow-card sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-accent">
            <MapPin size={20} aria-hidden="true" />
          </span>
          <div>
            <h2
              id="region-directory-title"
              className="text-xl font-black tracking-[-0.025em] text-brand-ink sm:text-2xl"
            >
              송파구 동별 {label} 임대
            </h2>
            <p className="mt-1 text-sm leading-6 text-brand-muted">
              찾으시는 동을 선택하면 해당 지역의 최신 {label} 매물과 임대조건을
              한 번에 확인할 수 있습니다.
            </p>
          </div>
        </div>
        <nav
          aria-label={`송파구 동별 ${label} 임대 페이지`}
          className="mt-5 flex flex-wrap gap-2"
        >
          {songpaRegions.map((region) => {
            const active = currentRegion?.slug === region.slug;
            return (
              <Link
                key={region.slug}
                href={getRegionPath(category, region)}
                aria-current={active ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                  active
                    ? "border-brand-accent bg-brand-accent text-white"
                    : "border-brand-line bg-brand-base text-brand-dark hover:border-brand-accent hover:text-brand-accent"
                }`}
              >
                {region.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
