"use client";

import Image from "next/image";
import { Building, List, Map as MapIcon, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PropertyClusterMap } from "@/components/map/property-cluster-map";
import { PropertyViewTracker } from "@/components/analytics/property-view-tracker";
import { trackConversion } from "@/components/analytics/google-analytics";
import { formatPyeong, formatWon } from "@/lib/properties/format";
import type { Property } from "@/types/database";
import { FavoriteButton } from "./favorite-button";
import { PropertyCard } from "./property-card";
import {
  PropertyQuickViewContent,
  PropertyQuickViewModal,
} from "./property-quick-view";

type RentFilter =
  | "all"
  | "under100"
  | "101to200"
  | "201to300"
  | "301to500"
  | "over500";
type AreaFilter = "all" | "under20" | "under30" | "under50" | "over50";
type ViewMode = "list" | "map";

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
  dong: string;
  rent: RentFilter;
  area: AreaFilter;
};

function getDong(address: string | null) {
  return address?.match(/([가-힣0-9]+동)/)?.[1] ?? "";
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

function isDefaultSearch(state: SearchState) {
  return (
    !state.number.trim() &&
    !state.dong.trim() &&
    state.rent === "all" &&
    state.area === "all"
  );
}

function readSearchFromUrl(searchString: string): SearchState | null {
  const params = new URLSearchParams(searchString);
  const hasSearchParams =
    params.has("propertyNumber") ||
    params.has("dong") ||
    params.has("rent") ||
    params.has("area");

  if (!hasSearchParams) return null;

  return {
    number: (params.get("propertyNumber") ?? "").trim(),
    dong: (params.get("dong") ?? "").trim(),
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
      dong: String(parsed.dong ?? "").trim(),
      rent: normalizeRentFilter(parsed.rent ?? null),
      area: normalizeAreaFilter(parsed.area ?? null),
    };
  } catch {
    return null;
  }
}

function writeStateToUrl(
  pathname: string,
  state: SearchState,
  viewMode: ViewMode,
) {
  const params = new URLSearchParams();

  if (viewMode === "map") params.set("view", "map");
  if (state.number.trim()) params.set("propertyNumber", state.number.trim());
  if (state.dong.trim()) params.set("dong", state.dong.trim());
  if (state.rent !== "all") params.set("rent", state.rent);
  if (state.area !== "all") params.set("area", state.area);

  const query = params.toString();
  window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
}

function MapPropertyCard({
  property,
  selected,
  narrowList = false,
  onSelect,
}: {
  property: Property;
  selected: boolean;
  narrowList?: boolean;
  onSelect: () => void;
}) {
  const image = property.image_urls[0];
  const pyeong = property.exclusive_area
    ? `${formatPyeong(property.exclusive_area)}평`
    : "협의";

  return (
    <article
      aria-current={selected ? "true" : undefined}
      className={`group relative grid min-h-[172px] grid-cols-[34%_66%] overflow-hidden rounded-2xl border bg-brand-surface shadow-card transition hover:border-brand-accent hover:shadow-card-hover sm:grid-cols-[42%_58%] ${
        narrowList ? "xl:grid-cols-[36%_64%]" : ""
      } ${
        selected
          ? "border-brand-accent ring-2 ring-brand-accent/20"
          : "border-brand-line"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={`${property.property_number} ${property.title} 상세보기`}
        className="absolute inset-0 z-10 cursor-pointer"
      >
        <span className="sr-only">매물 상세보기</span>
      </button>
      <div className="relative min-h-[172px] bg-brand-soft">
        {image ? (
          <Image
            src={image}
            alt={`${property.title} 대표 사진`}
            fill
            sizes="(max-width: 1024px) 42vw, 280px"
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full place-items-center text-brand-muted">
            <Building size={36} strokeWidth={1.4} />
          </div>
        )}
      </div>
      <div className="min-w-0 p-2 sm:p-4">
        <p className="text-base font-black text-brand-accent">
          {property.property_number}
        </p>
        <h3 className="mt-1 line-clamp-1 text-[17px] font-black tracking-[-0.025em] text-brand-ink">
          {property.title}
        </h3>
        <div className="mt-3 grid grid-cols-[1.4fr_1fr_0.7fr] gap-1 border-t border-brand-line pt-3 text-[13px] text-brand-muted sm:grid-cols-3 sm:gap-2 sm:text-sm">
          <div>
            <span className="block text-sm font-bold sm:text-[15px]">
              보증금
            </span>
            <b className="mt-1 block whitespace-nowrap text-[17px] leading-tight font-black text-brand-ink">
              {formatWon(property.deposit)}
            </b>
          </div>
          <div>
            <span className="block text-sm font-bold sm:text-[15px]">월세</span>
            <b className="mt-1 block whitespace-nowrap text-[17px] leading-tight font-black text-brand-accent">
              {formatWon(property.monthly_rent)}
            </b>
          </div>
          <div>
            <span className="block text-sm font-bold sm:hidden">면적</span>
            <span className="hidden text-[15px] font-bold sm:block">
              전용면적
            </span>
            <b className="mt-1 block whitespace-nowrap text-[17px] leading-tight font-black text-brand-ink">
              {pyeong}
            </b>
          </div>
        </div>
      </div>
      <div className="absolute top-3 left-3 z-30">
        <FavoriteButton propertyId={property.id} compact />
      </div>
    </article>
  );
}

export function PropertyBrowser({
  properties,
  title = "최신매물",
}: {
  properties: Property[];
  title?: string;
}) {
  const [propertyNumber, setPropertyNumber] = useState("");
  const [dong, setDong] = useState("");
  const [rentFilter, setRentFilter] = useState<RentFilter>("all");
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [mapVisiblePropertyIds, setMapVisiblePropertyIds] = useState<
    string[] | null
  >(null);
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState<
    string | null
  >(null);
  const [selectedListPropertyId, setSelectedListPropertyId] = useState<
    string | null
  >(null);
  const mapListRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState<SearchState>({
    number: "",
    dong: "",
    rent: "all",
    area: "all",
  });

  const neighborhoods = useMemo(
    () =>
      [...new Set(properties.map((property) => getDong(property.public_address)))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "ko")),
    [properties],
  );

  useEffect(() => {
    const pathname = window.location.pathname;
    const storageKey = `${searchStoragePrefix}${pathname}`;
    const restoredSearch =
      readSearchFromUrl(window.location.search) ??
      readSearchFromStorage(storageKey);
    const nextViewMode =
      new URLSearchParams(window.location.search).get("view") === "map"
        ? "map"
        : "list";

    queueMicrotask(() => {
      setViewMode(nextViewMode);
      if (!restoredSearch) return;
      setPropertyNumber(restoredSearch.number);
      setDong(restoredSearch.dong);
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
      const dongMatch =
        !search.dong || getDong(property.public_address) === search.dong;

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

      return numberMatch && dongMatch && rentMatch && areaMatch;
    });
  }, [properties, search]);

  const mapVisibleProperties = useMemo(() => {
    const visibleIds = mapVisiblePropertyIds
      ? new Set(mapVisiblePropertyIds)
      : null;
    const visibleProperties = visibleIds
      ? filtered.filter((property) => visibleIds.has(property.id))
      : filtered;

    if (!selectedMapPropertyId) return visibleProperties;

    return [...visibleProperties].sort((a, b) => {
      if (a.id === selectedMapPropertyId) return -1;
      if (b.id === selectedMapPropertyId) return 1;
      return 0;
    });
  }, [filtered, mapVisiblePropertyIds, selectedMapPropertyId]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const nextSearch: SearchState = {
      number: propertyNumber.trim(),
      dong,
      rent: rentFilter,
      area: areaFilter,
    };
    const pathname = window.location.pathname;
    const storageKey = `${searchStoragePrefix}${pathname}`;

    setPropertyNumber(nextSearch.number);
    setSearch(nextSearch);
    setMapVisiblePropertyIds(null);
    setSelectedMapPropertyId(null);
    writeStateToUrl(pathname, nextSearch, viewMode);

    if (isDefaultSearch(nextSearch)) {
      window.sessionStorage.removeItem(storageKey);
      return;
    }

    window.sessionStorage.setItem(storageKey, JSON.stringify(nextSearch));
  }

  function changeViewMode(nextViewMode: ViewMode) {
    setViewMode(nextViewMode);
    setMapVisiblePropertyIds(null);
    setSelectedMapPropertyId(null);
    setSelectedListPropertyId(null);
    writeStateToUrl(window.location.pathname, search, nextViewMode);
  }

  const updateMapVisibleProperties = useCallback(
    (propertyIds: string[] | null) => {
      setMapVisiblePropertyIds(propertyIds);
    },
    [],
  );

  const selectPropertyFromMap = useCallback((propertyId: string | null) => {
    setSelectedMapPropertyId(propertyId);
    if (!propertyId) return;

    window.requestAnimationFrame(() => {
      mapListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, []);

  const selectPropertyFromList = useCallback((property: Property) => {
    trackConversion("property_card_click", {
      property_number: property.property_number,
      property_category: property.category,
      source_path: window.location.pathname,
    });
    setSelectedMapPropertyId(property.id);
    window.requestAnimationFrame(() => {
      mapListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, []);

  const visiblePropertyCount =
    viewMode === "map" ? mapVisibleProperties.length : filtered.length;
  const selectedMapProperty = selectedMapPropertyId
    ? properties.find((property) => property.id === selectedMapPropertyId) ?? null
    : null;
  const selectedListProperty = selectedListPropertyId
    ? properties.find((property) => property.id === selectedListPropertyId) ?? null
    : null;

  const openPreviewFromCard = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      const link = target.closest<HTMLAnchorElement>('a[href^="/properties/"]');
      if (!link) return;

      const propertyNumber = decodeURIComponent(
        link.getAttribute("href")?.split("/").filter(Boolean).at(-1) ?? "",
      );
      const property = properties.find(
        (item) => item.property_number === propertyNumber,
      );
      if (!property) return;

      event.preventDefault();
      event.stopPropagation();
      trackConversion("property_card_click", {
        property_number: property.property_number,
        property_category: property.category,
        source_path: window.location.pathname,
      });
      setSelectedListPropertyId(property.id);
    },
    [properties],
  );

  return (
    <section
      className="mx-auto min-h-[65vh] max-w-[1440px] px-5 py-12 sm:px-6 lg:px-8 lg:py-16"
      id="properties"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-bold text-brand-accent">
            {visiblePropertyCount}개의 매물
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.03em] text-brand-ink md:text-4xl">
            {title}
          </h1>
        </div>
        <div className="inline-flex rounded-xl border border-brand-line bg-brand-surface p-1 shadow-card">
          <button
            type="button"
            onClick={() => changeViewMode("list")}
            className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold transition ${
              viewMode === "list"
                ? "bg-brand-accent text-white"
                : "text-brand-muted hover:bg-brand-soft"
            }`}
          >
            <List size={17} /> 목록
          </button>
          <button
            type="button"
            onClick={() => changeViewMode("map")}
            className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold transition ${
              viewMode === "map"
                ? "bg-brand-accent text-white"
                : "text-brand-muted hover:bg-brand-soft"
            }`}
          >
            <MapIcon size={17} /> 지도
          </button>
        </div>
      </div>

      <div className={viewMode === "map" ? "flex flex-col" : undefined}>
        <form
          onSubmit={submitSearch}
          className={`grid gap-3 rounded-2xl border border-brand-line bg-brand-soft p-4 shadow-card md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1fr_auto] ${
            viewMode === "map"
              ? "order-2 mt-6 mb-4 lg:order-1 lg:mt-0 lg:mb-8"
              : "mb-8"
          }`}
        >
        <label className="relative">
          <Search
            size={18}
            className="absolute top-1/2 left-4 -translate-y-1/2 text-brand-accent"
          />
          <input
            value={propertyNumber}
            onChange={(event) => setPropertyNumber(event.target.value)}
            placeholder="매물번호 검색"
            className="h-13 w-full rounded-xl border border-brand-line bg-brand-surface pr-4 pl-11 outline-none transition focus:border-brand-accent focus:ring-3 focus:ring-brand-sand/50"
          />
        </label>
        <select
          aria-label="동 선택"
          value={dong}
          onChange={(event) => setDong(event.target.value)}
          className="h-13 rounded-xl border border-brand-line bg-brand-surface px-4 outline-none focus:border-brand-accent"
        >
          <option value="">동 전체</option>
          {neighborhoods.map((neighborhood) => (
            <option key={neighborhood} value={neighborhood}>
              {neighborhood}
            </option>
          ))}
        </select>
        <select
          aria-label="월세 선택"
          value={rentFilter}
          onChange={(event) => setRentFilter(event.target.value as RentFilter)}
          className="h-13 rounded-xl border border-brand-line bg-brand-surface px-4 outline-none focus:border-brand-accent"
        >
          <option value="all">월세 전체</option>
          <option value="under100">100만원 미만</option>
          <option value="101to200">101~200만원</option>
          <option value="201to300">201~300만원</option>
          <option value="301to500">301~500만원</option>
          <option value="over500">500만원 초과</option>
        </select>
        <select
          aria-label="평수 선택"
          value={areaFilter}
          onChange={(event) => setAreaFilter(event.target.value as AreaFilter)}
          className="h-13 rounded-xl border border-brand-line bg-brand-surface px-4 outline-none focus:border-brand-accent"
        >
          <option value="all">평수 전체</option>
          <option value="under20">20평 이하</option>
          <option value="under30">30평 이하</option>
          <option value="under50">50평 이하</option>
          <option value="over50">50평 초과</option>
        </select>
        <button
          type="submit"
          className="h-13 rounded-xl bg-brand-accent px-7 font-bold text-white transition hover:bg-brand-accent-dark md:col-span-2 lg:col-span-1"
        >
          검색하기
        </button>
        </form>

        {filtered.length ? (
          viewMode === "map" ? (
          <div
            className={`order-1 grid gap-5 lg:order-2 lg:items-start ${
              selectedMapProperty
                ? "lg:grid-cols-2 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,0.95fr)_minmax(0,1.15fr)]"
                : "lg:grid-cols-2"
            }`}
          >
            <div
              ref={mapListRef}
              className="hidden min-w-0 lg:order-1 lg:block lg:max-h-[720px] lg:overflow-y-auto lg:pr-2"
            >
              <div className="space-y-3">
                {mapVisibleProperties.map((property) => (
                  <MapPropertyCard
                    key={property.id}
                    property={property}
                    selected={property.id === selectedMapPropertyId}
                    narrowList={Boolean(selectedMapProperty)}
                    onSelect={() => selectPropertyFromList(property)}
                  />
                ))}
                {!mapVisibleProperties.length ? (
                  <div className="rounded-2xl border border-dashed border-brand-line bg-brand-surface p-10 text-center text-sm text-brand-muted">
                    현재 지도 범위에 표시할 매물이 없습니다.
                  </div>
                ) : null}
              </div>
            </div>
            {selectedMapProperty ? (
              <aside className="order-2 hidden h-[720px] min-w-0 overflow-hidden rounded-2xl border border-brand-line bg-brand-surface shadow-card xl:sticky xl:top-[92px] xl:block">
                <PropertyQuickViewContent
                  key={selectedMapProperty.id}
                  property={selectedMapProperty}
                  onClose={() => setSelectedMapPropertyId(null)}
                  compact
                />
              </aside>
            ) : null}
            <div className="order-1 min-h-[520px] min-w-0 lg:order-2 lg:sticky lg:top-[92px] lg:h-[720px] xl:order-3">
              <PropertyClusterMap
                properties={filtered}
                onVisiblePropertiesChange={updateMapVisibleProperties}
                onPropertySelect={selectPropertyFromMap}
              />
            </div>
          </div>
          ) : (
          <div
            onClickCapture={openPreviewFromCard}
            className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filtered.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
          )
        ) : (
          <div className="order-1 rounded-2xl border border-dashed border-brand-line bg-brand-surface p-16 text-center lg:order-2">
            <h2 className="text-xl font-bold">조건에 맞는 매물이 없습니다.</h2>
            <p className="mt-2 text-brand-muted">검색 조건을 바꿔 확인해 주세요.</p>
          </div>
        )}
        {viewMode === "map" ? (
          <button
            type="button"
            onClick={() => changeViewMode("list")}
            className="order-3 h-14 w-full rounded-xl bg-brand-accent text-base font-black text-white shadow-card transition hover:bg-brand-accent-dark lg:hidden"
          >
            사무실 매물 전체보기
          </button>
        ) : null}
      </div>
      {selectedMapProperty ? (
        <>
          <PropertyViewTracker
            propertyNumber={selectedMapProperty.property_number}
          />
          <PropertyQuickViewModal
            property={selectedMapProperty}
            onClose={() => setSelectedMapPropertyId(null)}
            mobileOnly
          />
        </>
      ) : null}
      {selectedListProperty ? (
        <>
          <PropertyViewTracker
            propertyNumber={selectedListProperty.property_number}
          />
          <PropertyQuickViewModal
            property={selectedListProperty}
            onClose={() => setSelectedListPropertyId(null)}
            fullDetail
          />
        </>
      ) : null}
    </section>
  );
}
