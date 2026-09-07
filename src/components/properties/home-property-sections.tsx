"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Property } from "@/types/database";
import { PropertyCard } from "./property-card";

type RentFilter =
  | "all"
  | "under100"
  | "101to200"
  | "201to300"
  | "301to500"
  | "over500";
type AreaFilter = "all" | "under20" | "under30" | "under50" | "over50";
type SearchState = {
  number: string;
  rent: RentFilter;
  area: AreaFilter;
};

const rentFilters: RentFilter[] = [
  "all",
  "under100",
  "101to200",
  "201to300",
  "301to500",
  "over500",
];
const areaFilters: AreaFilter[] = [
  "all",
  "under20",
  "under30",
  "under50",
  "over50",
];
const homeSearchStorageKey = "cy-property-search:/";

function createSeededRandom(seed: string) {
  let state = Array.from(seed).reduce(
    (value, character) => Math.imul(value ^ character.charCodeAt(0), 16777619),
    2166136261,
  );

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleProperties(properties: Property[], seed: string) {
  const shuffled = [...properties];
  const random = createSeededRandom(seed);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }

  return shuffled;
}

function normalizeRentFilter(value: string | null): RentFilter {
  return rentFilters.includes(value as RentFilter)
    ? (value as RentFilter)
    : "all";
}

function normalizeAreaFilter(value: string | null): AreaFilter {
  return areaFilters.includes(value as AreaFilter)
    ? (value as AreaFilter)
    : "all";
}

function readSearchFromUrl(params: URLSearchParams): SearchState | null {
  const hasSearchParams =
    params.has("propertyNumber") || params.has("rent") || params.has("area");
  if (!hasSearchParams) return null;

  return {
    number: (params.get("propertyNumber") ?? "").trim(),
    rent: normalizeRentFilter(params.get("rent")),
    area: normalizeAreaFilter(params.get("area")),
  };
}

function readStoredSearch(): SearchState | null {
  try {
    const stored = window.sessionStorage.getItem(homeSearchStorageKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<SearchState>;
    return {
      number: String(parsed.number ?? "").trim(),
      rent: normalizeRentFilter(parsed.rent ?? null),
      area: normalizeAreaFilter(parsed.area ?? null),
    };
  } catch {
    return null;
  }
}

function writeSearchToUrl(search: SearchState | null) {
  const params = new URLSearchParams(window.location.search);
  params.delete("view");
  params.delete("propertyNumber");
  params.delete("rent");
  params.delete("area");

  if (search?.number) params.set("propertyNumber", search.number);
  if (search?.rent && search.rent !== "all") params.set("rent", search.rent);
  if (search?.area && search.area !== "all") params.set("area", search.area);

  const query = params.toString();
  window.history.replaceState(null, "", query ? `/?${query}` : "/");
}

function SectionHeading({
  title,
  count,
  href,
}: {
  title: string;
  count?: number;
  href: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black tracking-[-0.025em] text-brand-ink sm:text-3xl">
          {title}
        </h2>
        {count !== undefined && (
          <p className="mt-1 text-sm text-brand-muted">{count}개의 매물</p>
        )}
      </div>
      <Link
        href={href}
        className="shrink-0 text-sm font-bold text-brand-accent hover:underline"
      >
        전체보기 →
      </Link>
    </div>
  );
}

function PropertyGrid({
  properties,
  emptyText,
  isAdmin,
}: {
  properties: Property[];
  emptyText: string;
  isAdmin: boolean;
}) {
  if (!properties.length) {
    return (
      <div className="rounded-xl border border-dashed border-brand-line px-5 py-14 text-center text-brand-muted">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}

function RecommendedSlider({
  properties,
  isAdmin,
}: {
  properties: Property[];
  isAdmin: boolean;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);

  function move(direction: number) {
    sliderRef.current?.scrollBy({
      left: sliderRef.current.clientWidth * 0.85 * direction,
      behavior: "smooth",
    });
  }

  if (!properties.length) {
    return (
      <div className="rounded-xl border border-dashed border-brand-line px-5 py-14 text-center text-brand-muted">
        현재 추천매물을 준비하고 있습니다.
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={sliderRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {properties.map((property) => (
          <div
            key={property.id}
            className="w-[86%] shrink-0 snap-start sm:w-[calc((100%_-_20px)/2)] lg:w-[calc((100%_-_40px)/3)] xl:w-[calc((100%_-_60px)/4)]"
          >
            <PropertyCard property={property} isAdmin={isAdmin} />
          </div>
        ))}
      </div>
      {properties.length > 1 && (
        <>
          <button
            type="button"
            aria-label="이전 추천매물"
            onClick={() => move(-1)}
            className="absolute top-1/2 left-2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-brand-surface text-brand-ink shadow-lg hover:bg-brand-soft"
          >
            <ChevronLeft size={23} />
          </button>
          <button
            type="button"
            aria-label="다음 추천매물"
            onClick={() => move(1)}
            className="absolute top-1/2 right-2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-brand-surface text-brand-ink shadow-lg hover:bg-brand-soft"
          >
            <ChevronRight size={23} />
          </button>
        </>
      )}
    </div>
  );
}

export function HomePropertySections({
  properties,
  isAdmin,
  shuffleSeed,
}: {
  properties: Property[];
  isAdmin: boolean;
  shuffleSeed: string;
}) {
  const [propertyNumber, setPropertyNumber] = useState("");
  const [rentFilter, setRentFilter] = useState<RentFilter>("all");
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("all");
  const [search, setSearch] = useState<SearchState | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "all") {
      window.sessionStorage.removeItem(homeSearchStorageKey);
      writeSearchToUrl(null);
      return;
    }

    const restoredSearch = readSearchFromUrl(params) ?? readStoredSearch();
    if (!restoredSearch) return;

    queueMicrotask(() => {
      setPropertyNumber(restoredSearch.number);
      setRentFilter(restoredSearch.rent);
      setAreaFilter(restoredSearch.area);
      setSearch(restoredSearch);
      writeSearchToUrl(restoredSearch);
    });
  }, []);

  const latest = useMemo(
    () =>
      shuffleProperties(
        [...properties]
        .filter((property) => property.category !== "etc")
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 12),
        `${shuffleSeed}:latest`,
      ),
    [properties, shuffleSeed],
  );
  const recommended = useMemo(
    () =>
      shuffleProperties(
        properties.filter(
          (property) =>
            property.category !== "etc" && property.is_recommended,
        ),
        `${shuffleSeed}:recommended`,
      ),
    [properties, shuffleSeed],
  );
  const results = useMemo(() => {
    if (!search) return [];
    return properties.filter((property) => {
      if (property.category === "etc") return false;
      const normalizedNumber = search.number
        .trim()
        .toLowerCase()
        .replace(/^cy-?/, "");
      const propertyNumberOnly = property.property_number
        .toLowerCase()
        .replace(/^cy-?/, "");
      const numberMatch =
        !normalizedNumber ||
        propertyNumberOnly.includes(normalizedNumber) ||
        Number(propertyNumberOnly) === Number(normalizedNumber);
      const rent = property.monthly_rent ?? 0;
      const rentMatch =
        search.rent === "all" ||
        (search.rent === "under100" && rent < 100) ||
        (search.rent === "101to200" && rent >= 101 && rent <= 200) ||
        (search.rent === "201to300" && rent >= 201 && rent <= 300) ||
        (search.rent === "301to500" && rent >= 301 && rent <= 500) ||
        (search.rent === "over500" && rent > 500);
      const pyeong = (property.exclusive_area ?? 0) / 3.3058;
      const areaMatch =
        search.area === "all" ||
        (search.area === "under20" && pyeong <= 20) ||
        (search.area === "under30" && pyeong <= 30) ||
        (search.area === "under50" && pyeong <= 50) ||
        (search.area === "over50" && pyeong > 50);
      return numberMatch && rentMatch && areaMatch;
    });
  }, [properties, search]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const nextSearch: SearchState = {
      number: propertyNumber.trim(),
      rent: rentFilter,
      area: areaFilter,
    };
    setPropertyNumber(nextSearch.number);
    setSearch(nextSearch);
    window.sessionStorage.setItem(
      homeSearchStorageKey,
      JSON.stringify(nextSearch),
    );
    writeSearchToUrl(nextSearch);
    requestAnimationFrame(() =>
      document.getElementById("properties")?.scrollIntoView({ behavior: "smooth" }),
    );
  }

  function clearSearch() {
    setPropertyNumber("");
    setRentFilter("all");
    setAreaFilter("all");
    setSearch(null);
    window.sessionStorage.removeItem(homeSearchStorageKey);
    writeSearchToUrl(null);
  }

  return (
    <>
      <section className="border-b border-brand-line bg-brand-soft">
        <form
          onSubmit={submitSearch}
          className="mx-auto grid max-w-[1440px] gap-3 px-5 py-5 sm:px-6 md:grid-cols-[2fr_1fr_1fr_auto] lg:px-8"
        >
          <label className="relative">
            <Search
              size={18}
              className="absolute top-1/2 left-4 -translate-y-1/2 text-brand-muted"
            />
            <input
              value={propertyNumber}
              onChange={(event) => setPropertyNumber(event.target.value)}
              placeholder="매물번호 검색"
              className="h-13 w-full rounded-lg border border-brand-line bg-brand-surface pr-4 pl-11 outline-none transition focus:border-brand-accent focus:ring-3 focus:ring-brand-sand/40"
            />
          </label>
          <select
            value={rentFilter}
            onChange={(event) => setRentFilter(event.target.value as RentFilter)}
            className="h-13 rounded-lg border border-brand-line bg-brand-surface px-4 outline-none focus:border-brand-accent"
          >
            <option value="all">월세 전체</option>
            <option value="under100">100만원 미만</option>
            <option value="101to200">101~200만원</option>
            <option value="201to300">201~300만원</option>
            <option value="301to500">301~500만원</option>
            <option value="over500">500만원 초과</option>
          </select>
          <select
            value={areaFilter}
            onChange={(event) => setAreaFilter(event.target.value as AreaFilter)}
            className="h-13 rounded-lg border border-brand-line bg-brand-surface px-4 outline-none focus:border-brand-accent"
          >
            <option value="all">평수 전체</option>
            <option value="under20">20평 이하</option>
            <option value="under30">30평 이하</option>
            <option value="under50">50평 이하</option>
            <option value="over50">50평 초과</option>
          </select>
          <button
            type="submit"
            className="h-13 rounded-lg bg-brand-accent px-7 font-bold text-white transition hover:bg-brand-accent-dark"
          >
            검색하기
          </button>
        </form>
      </section>

      <div
        id="properties"
        className="mx-auto max-w-[1440px] space-y-16 px-5 py-12 sm:px-6 lg:px-8 lg:py-16"
      >
        {search ? (
          <section>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-brand-ink sm:text-3xl">
                  검색 결과
                </h2>
                <p className="mt-1 text-sm text-brand-muted">
                  {results.length}개의 매물
                </p>
              </div>
              <button
                type="button"
                onClick={clearSearch}
                className="text-sm font-bold text-brand-accent"
              >
                검색 초기화
              </button>
            </div>
            <PropertyGrid
              properties={results}
              emptyText="조건에 맞는 매물이 없습니다."
              isAdmin={isAdmin}
            />
          </section>
        ) : (
          <>
            <section>
              <SectionHeading
                title="추천매물"
                count={recommended.length}
                href="/office"
              />
              <RecommendedSlider
                properties={recommended}
                isAdmin={isAdmin}
              />
            </section>
            <section>
              <SectionHeading title="최신매물" count={latest.length} href="/office" />
              <PropertyGrid
                properties={latest}
                emptyText="현재 등록된 매물이 없습니다."
                isAdmin={isAdmin}
              />
            </section>
          </>
        )}
      </div>
    </>
  );
}
