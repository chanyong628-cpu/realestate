"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

const rentFilters = [
  "all",
  "under100",
  "101to200",
  "201to300",
  "301to500",
  "over500",
] satisfies RentFilter[];
const areaFilters = [
  "all",
  "under20",
  "under30",
  "under50",
  "over50",
] satisfies AreaFilter[];
const searchStoragePrefix = "cy-property-search:";

type SearchState = {
  number: string;
  rent: RentFilter;
  area: AreaFilter;
};

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

function isDefaultSearch(state: SearchState) {
  return !state.number.trim() && state.rent === "all" && state.area === "all";
}

function readSearchFromUrl(searchString: string): SearchState | null {
  const params = new URLSearchParams(searchString);
  const hasSearchParams =
    params.has("propertyNumber") || params.has("rent") || params.has("area");

  if (!hasSearchParams) return null;

  return {
    number: (params.get("propertyNumber") ?? "").trim(),
    rent: normalizeRentFilter(params.get("rent")),
    area: normalizeAreaFilter(params.get("area")),
  };
}

function readSearchFromStorage(key: string): SearchState | null {
  try {
    const stored = window.sessionStorage.getItem(key);
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

function writeSearchToUrl(pathname: string, state: SearchState) {
  const params = new URLSearchParams(window.location.search);
  params.delete("propertyNumber");
  params.delete("rent");
  params.delete("area");

  if (state.number.trim()) params.set("propertyNumber", state.number.trim());
  if (state.rent !== "all") params.set("rent", state.rent);
  if (state.area !== "all") params.set("area", state.area);

  const query = params.toString();
  window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
}

export function PropertyBrowser({
  properties,
  title = "최신매물",
}: {
  properties: Property[];
  title?: string;
}) {
  const [propertyNumber, setPropertyNumber] = useState("");
  const [rentFilter, setRentFilter] = useState<RentFilter>("all");
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("all");
  const [search, setSearch] = useState<SearchState>({
    number: "",
    rent: "all",
    area: "all",
  });

  useEffect(() => {
    const pathname = window.location.pathname;
    const storageKey = `${searchStoragePrefix}${pathname}`;
    const restoredSearch =
      readSearchFromUrl(window.location.search) ??
      readSearchFromStorage(storageKey);

    if (!restoredSearch) return;

    queueMicrotask(() => {
      setPropertyNumber(restoredSearch.number);
      setRentFilter(restoredSearch.rent);
      setAreaFilter(restoredSearch.area);
      setSearch(restoredSearch);
    });
  }, []);

  const filtered = useMemo(() => {
    return properties.filter((property) => {
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
    const nextSearch = {
      number: propertyNumber.trim(),
      rent: rentFilter,
      area: areaFilter,
    };
    const pathname = window.location.pathname;
    const storageKey = `${searchStoragePrefix}${pathname}`;

    setPropertyNumber(nextSearch.number);
    setSearch(nextSearch);
    writeSearchToUrl(pathname, nextSearch);

    if (isDefaultSearch(nextSearch)) {
      window.sessionStorage.removeItem(storageKey);
      return;
    }

    window.sessionStorage.setItem(storageKey, JSON.stringify(nextSearch));
  }

  return (
    <section
      className="mx-auto min-h-[65vh] max-w-[1440px] px-5 py-12 sm:px-6 lg:px-8 lg:py-16"
      id="properties"
    >
      <div className="mb-8">
        <p className="text-sm font-bold text-brand-accent">
          {filtered.length}개의 매물
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.03em] text-brand-ink md:text-4xl">
          {title}
        </h1>
      </div>

      <form
        onSubmit={submitSearch}
        className="mb-10 grid gap-3 rounded-xl border border-brand-line bg-brand-soft p-4 md:grid-cols-[2fr_1fr_1fr_auto]"
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

      {filtered.length ? (
        <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-brand-line bg-brand-surface p-16 text-center">
          <h2 className="text-xl font-bold">조건에 맞는 매물이 없습니다.</h2>
          <p className="mt-2 text-brand-muted">검색 조건을 바꿔 확인해 주세요.</p>
        </div>
      )}
    </section>
  );
}
