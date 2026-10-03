"use client";

import Link from "next/link";
import {
  ArrowUpDown,
  Building,
  Car,
  ExternalLink,
  MapPin,
  Ruler,
  Toilet,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Property } from "@/types/database";
import { categoryLabels, formatPyeong, formatWon } from "@/lib/properties/format";
import { ContactActions } from "./contact-actions";
import { FavoriteButton } from "./favorite-button";
import { PropertyGallery } from "./property-gallery";

function formatFloor(floor: string | null, totalFloor: string | null) {
  if (!floor?.trim()) return "-";
  const current = floor.match(/(\d+)\s*층?/)?.[1];
  const total = totalFloor?.match(/(\d+)\s*층?/)?.[1];
  if (!current) return floor;
  return total ? `${current}층 (총 ${total}층)` : `${current}층`;
}

function formatLocation(property: Property) {
  const address = property.public_address?.trim();
  if (!address) return "송파구";
  if (!property.address_hidden) return address;

  const parts = address
    .split(/\s+/)
    .filter((part) => !/^(서울|서울특별시)$/.test(part));
  const district = parts.find((part) => /구$/.test(part)) ?? "송파구";
  const neighborhood = parts.find((part) => /(동|읍|면)$/.test(part));
  return neighborhood ? `${district} ${neighborhood}` : district;
}

function formatDescription(description: string | null) {
  if (!description) return "자세한 내용은 전화 또는 문자로 문의해 주세요.";

  const lines = description.split(/\r?\n/);
  const startIndex = lines.findIndex(
    (line) =>
      line.includes("네이버") &&
      line.includes("당근") &&
      line.includes("매물 문의 가능"),
  );
  const endIndex = lines.findIndex(
    (line, index) =>
      index > startIndex && line.includes("송파구 전지역 사무실"),
  );

  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex + 1) {
    return description;
  }

  return lines
    .slice(startIndex + 1, endIndex)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n");
}

export function PropertyQuickViewContent({
  property,
  onClose,
  compact = false,
}: {
  property: Property;
  onClose: () => void;
  compact?: boolean;
}) {
  const metrics = [
    {
      icon: MapPin,
      label: "위치",
      value: formatLocation(property),
    },
    {
      icon: Building,
      label: "층수",
      value: formatFloor(property.floor, property.total_floor),
    },
    {
      icon: Ruler,
      label: "전용면적",
      value: property.exclusive_area
        ? `${property.exclusive_area.toLocaleString("ko-KR")}㎡ / ${formatPyeong(property.exclusive_area)}평`
        : "협의",
    },
    {
      icon: ArrowUpDown,
      label: "엘리베이터",
      value: property.elevator_available ? "있음" : "없음",
    },
    {
      icon: Toilet,
      label: "화장실",
      value:
        property.restroom_type === "internal_private"
          ? "남녀 분리형"
          : "단독 화장실",
    },
    {
      icon: Car,
      label: "주차",
      value: `총 ${property.total_parking_count ?? 0}대 / 가능 ${
        property.available_parking_count ??
        (property.parking_available ? 1 : 0)
      }대`,
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-brand-surface">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-brand-line bg-brand-surface/95 px-4 py-3 backdrop-blur sm:px-5">
        <div>
          <p className="text-xs font-bold text-brand-muted">매물 상세보기</p>
          <p className="mt-0.5 font-black text-brand-accent">
            {property.property_number}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="상세보기 닫기"
          className="grid size-10 place-items-center rounded-full border border-brand-line bg-brand-surface text-brand-ink transition hover:border-brand-accent hover:text-brand-accent"
        >
          <X size={20} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
        <PropertyGallery
          key={property.id}
          images={property.image_urls}
          title={property.title}
        />

        <article className="pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-black text-brand-ink">
                  {categoryLabels[property.category]}
                </span>
                {property.is_recommended ? (
                  <span className="rounded-md bg-brand-accent px-2.5 py-1 text-xs font-bold text-white">
                    추천매물
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 break-keep text-2xl leading-tight font-black tracking-[-0.03em] text-brand-ink sm:text-3xl">
                {property.title}
              </h2>
            </div>
            <FavoriteButton propertyId={property.id} compact />
          </div>

          <p className="mt-5 text-xl font-black tracking-[-0.025em] text-brand-ink sm:text-2xl">
            보증금 {formatWon(property.deposit)}
            <span className="mx-2 text-brand-line">/</span>
            월세 {formatWon(property.monthly_rent)}
          </p>
          <p className="mt-1.5 text-base font-semibold text-brand-muted">
            관리비 {formatWon(property.maintenance_fee)}
          </p>

          <div
            className={`mt-6 grid gap-2.5 ${
              compact ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {metrics.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-brand-line bg-brand-card p-3.5"
              >
                <Icon size={17} className="text-brand-accent" />
                <p className="mt-2 text-xs font-semibold text-brand-muted">
                  {label}
                </p>
                <b className="mt-1 block break-keep text-sm leading-snug text-brand-ink">
                  {value}
                </b>
              </div>
            ))}
          </div>

          <section className="mt-7 border-t border-brand-line pt-6">
            <h3 className="text-lg font-black text-brand-ink">매물 설명</h3>
            <p className="mt-3 whitespace-pre-wrap break-keep text-sm leading-7 text-brand-slate">
              {formatDescription(property.description)}
            </p>
          </section>

          <section className="mt-7 rounded-2xl bg-brand-card p-4">
            <h3 className="font-black text-brand-ink">
              이 매물이 궁금하신가요?
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-brand-muted">
              <b className="text-brand-accent">{property.property_number}</b>을
              말씀해 주시면 빠르게 안내해 드립니다.
            </p>
            <div className="mt-4">
              <ContactActions
                propertyNumber={property.property_number}
                sharePath={`/properties/${property.property_number}`}
              />
            </div>
          </section>

          <Link
            href={`/properties/${property.property_number}`}
            className="mt-4 flex h-12 items-center justify-center gap-2 rounded-xl border border-brand-line bg-brand-surface text-sm font-bold text-brand-ink transition hover:border-brand-accent hover:text-brand-accent"
          >
            전체 상세페이지 열기 <ExternalLink size={16} />
          </Link>
        </article>
      </div>
    </div>
  );
}

export function PropertyQuickViewModal({
  property,
  onClose,
  mobileOnly = false,
}: {
  property: Property;
  onClose: () => void;
  mobileOnly?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isEnabled, setIsEnabled] = useState(!mobileOnly);

  useEffect(() => {
    if (!mobileOnly) return;
    const media = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsEnabled(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [mobileOnly]);

  useEffect(() => {
    if (!isEnabled) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [isEnabled, onClose]);

  if (!isEnabled) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-brand-dark/65 p-2 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${property.property_number} ${property.title} 상세보기`}
        tabIndex={-1}
        className="h-[calc(100dvh-1rem)] w-full max-w-5xl overflow-hidden rounded-2xl border border-brand-line bg-brand-surface shadow-2xl outline-none sm:h-[min(90dvh,900px)] sm:rounded-3xl"
      >
        <PropertyQuickViewContent property={property} onClose={onClose} />
      </div>
    </div>
  );
}
