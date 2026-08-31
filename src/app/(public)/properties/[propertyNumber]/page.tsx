import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpDown,
  Building,
  Car,
  MapPin,
  Ruler,
  Toilet,
  type LucideIcon,
} from "lucide-react";
import { ContactActions } from "@/components/properties/contact-actions";
import { PropertyViewTracker } from "@/components/analytics/property-view-tracker";
import { FavoriteButton } from "@/components/properties/favorite-button";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { KakaoMap } from "@/components/map/kakao-map";
import { EtcArticleDetail } from "@/components/properties/etc-article-detail";
import { DeletePropertyButton } from "@/features/admin/properties/delete-button";
import { PublishToggleButton } from "@/features/admin/properties/publish-toggle-button";
import { getAdminSession } from "@/lib/auth/session";
import { derivePublicAddress } from "@/lib/properties/address";
import {
  categoryLabels,
  formatPyeong,
  formatWon,
} from "@/lib/properties/format";
import { getPublishedProperty } from "@/lib/properties/queries";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPropertyJsonLd,
  buildPropertySeo,
} from "@/lib/seo";

interface DetailPageProps {
  params: Promise<{ propertyNumber: string }>;
}

function formatPublicLocation(address: string | null) {
  if (!address) return "협의";
  const parts = address
    .trim()
    .split(/\s+/)
    .filter((part) => !/^(서울|서울특별시)$/.test(part));
  const neighborhoodIndex = parts.findIndex((part) => /(동|읍|면)$/.test(part));
  return neighborhoodIndex >= 0
    ? parts.slice(0, neighborhoodIndex + 1).join(" ")
    : parts.slice(0, 3).join(" ");
}

function formatFloor(floor: string | null) {
  if (!floor) return "-";
  const match = floor.match(/(\d+)\s*층?/);
  return match ? `${match[1]}층` : floor;
}

function formatTotalFloor(totalFloor: string | null) {
  if (!totalFloor?.trim()) return null;
  const match = totalFloor.match(/(\d+)\s*층?/);
  return match ? `${match[1]}층` : totalFloor.trim();
}

function DetailFloorValue({
  floor,
  totalFloor,
}: {
  floor: string | null;
  totalFloor: string | null;
}) {
  const currentFloor = formatFloor(floor);
  const formattedTotalFloor = formatTotalFloor(totalFloor);

  if (currentFloor === "-") return "-";

  return (
    <>
      <span className="text-[#155EEF]">{currentFloor}</span>
      {formattedTotalFloor && (
        <span className="text-[#111827]"> (총 {formattedTotalFloor})</span>
      )}
    </>
  );
}

function formatDetailArea(area: number | null) {
  if (area === null) return "-";
  return `${area.toLocaleString("ko-KR")}㎡ / (실${formatPyeong(area)}평)`;
}

function formatApprovalDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
}

function formatPublicDescription(description: string | null) {
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

export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { propertyNumber } = await params;
  const property = await getPublishedProperty(propertyNumber);
  if (!property) return { title: "매물을 찾을 수 없습니다" };
  const seo = buildPropertySeo(property);

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      type: "article",
      title: seo.title,
      description: seo.description,
      url: absoluteUrl(`/properties/${property.property_number}`),
      images: property.image_urls[0] ? [property.image_urls[0]] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: property.image_urls[0] ? [property.image_urls[0]] : [],
    },
    alternates: { canonical: `/properties/${property.property_number}` },
  };
}

export default async function PropertyDetailPage({
  params,
}: DetailPageProps) {
  const { propertyNumber } = await params;
  const property = await getPublishedProperty(propertyNumber);
  if (!property) notFound();
  const isAdmin = Boolean(await getAdminSession());
  const publicAddress =
    property.public_address || derivePublicAddress(property.title);

  if (property.category === "etc") {
    return <EtcArticleDetail article={property} />;
  }

  const jsonLd = buildPropertyJsonLd(property, publicAddress);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "홈", url: "/" },
    { name: categoryLabels[property.category], url: `/${property.category}` },
    {
      name: property.property_number,
      url: `/properties/${property.property_number}`,
    },
  ]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <PropertyViewTracker propertyNumber={property.property_number} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PropertyGallery images={property.image_urls} title={property.title} />
      {isAdmin && (
        <div className="mx-auto mt-4 flex w-full max-w-[960px] justify-end gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <Link
            href={`/admin/properties/${property.id}/edit`}
            className="rounded-lg bg-[#155EEF] px-4 py-2 text-sm font-bold text-white"
          >
            매물수정
          </Link>
          <PublishToggleButton
            id={property.id}
            isPublished={property.is_published}
          />
          <DeletePropertyButton
            id={property.id}
            propertyNumber={property.property_number}
            redirectTo="/"
          />
        </div>
      )}

      <div className="grid gap-12 py-10 lg:grid-cols-[1fr_360px]">
        <article>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-black tracking-wide text-forest-600">
                  {property.property_number}
                </p>
                {property.is_recommended && (
                  <span className="rounded-md bg-[#155EEF] px-3 py-1 text-xs font-bold text-white">
                    추천매물
                  </span>
                )}
                <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-black">
                  {categoryLabels[property.category]}
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-black md:text-5xl">
                {property.title}
              </h1>
            </div>
            <FavoriteButton propertyId={property.id} compact />
          </div>

          <p className="mt-8 whitespace-nowrap text-xl font-black sm:text-2xl md:text-3xl">
            보증금 {formatWon(property.deposit)}
            <span className="mx-2 text-stone-300 sm:mx-3">/</span>
            월세 {formatWon(property.monthly_rent)}
          </p>
          <p className="mt-2 text-lg font-semibold text-stone-700">
            관리비 {formatWon(property.maintenance_fee)}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {([
              {
                icon: MapPin,
                label: "위치",
                value: property.address_hidden
                  ? formatPublicLocation(publicAddress)
                  : publicAddress,
              },
              {
                icon: Building,
                label: "층수",
                value: (
                  <DetailFloorValue
                    floor={property.floor}
                    totalFloor={property.total_floor}
                  />
                ),
              },
              {
                icon: Ruler,
                label: "면적",
                value: formatDetailArea(property.exclusive_area),
              },
              {
                icon: ArrowUpDown,
                label: "E/V",
                value: property.elevator_available ? "有" : "無",
              },
              {
                icon: Toilet,
                label: "화장실",
                value:
                  property.restroom_type === "internal_private"
                    ? "남녀 분리형 화장실"
                    : "단독 화장실",
              },
              {
                icon: Car,
                label: "주차대수",
                value: `총 ${property.total_parking_count ?? 0}대 / 가능 ${
                  property.available_parking_count ??
                  (property.parking_available ? 1 : 0)
                }대`,
              },
            ] satisfies Array<{
              icon: LucideIcon;
              label: string;
              value: ReactNode;
            }>).map(({ icon: ItemIcon, label, value }) => {
              return (
                <div
                  key={label}
                  className="rounded-2xl border border-stone-200 bg-white p-4"
                >
                  <ItemIcon size={20} className="text-forest-600" />
                  <p className="mt-3 text-sm text-stone-500">
                    {label}
                  </p>
                  <b
                    className="mt-1 block break-keep text-base leading-snug sm:text-lg"
                  >
                    {value}
                  </b>
                </div>
              );
            })}
          </div>

          <section className="mt-12 border-t border-stone-200 pt-10">
            <h2 className="text-2xl font-black">매물 설명</h2>
            <p className="mt-5 whitespace-pre-wrap text-lg leading-9 text-stone-700">
              {formatPublicDescription(property.description)}
            </p>
          </section>

          <section className="mt-12 border-t border-stone-200 pt-10">
            <h2 className="text-2xl font-black">건축물 기본정보</h2>
            <div className="mt-5 overflow-hidden rounded-2xl border border-[#E5E7EB]">
              {[
                ["건축물용도", property.building_use || "-"],
                ["사용승인일", formatApprovalDate(property.approval_date)],
                [
                  "공급면적 / 전용면적",
                  `${property.supply_area ?? "-"}㎡ / ${
                    property.exclusive_area ?? "-"
                  }㎡`,
                ],
                [
                  "총주차 / 가능주차",
                  `총 ${property.total_parking_count ?? 0}대 / 가능 ${
                    property.available_parking_count ??
                    (property.parking_available ? 1 : 0)
                  }대`,
                ],
                ["건축물방향", property.building_direction || "-"],
                [
                  "룸 / 화장실",
                  `${property.room_count ?? 0} / ${
                    property.restroom_count ?? 0
                  }`,
                ],
                ["냉난방", property.air_conditioner_type || "-"],
                [
                  "위반건축물 여부",
                  property.is_violating_building ? "위반" : "적법",
                ],
              ].map(([label, value], index) => (
                <div
                  key={label as string}
                  className={`grid grid-cols-[140px_1fr] sm:grid-cols-[190px_1fr] ${
                    index > 0 ? "border-t border-[#E5E7EB]" : ""
                  }`}
                >
                  <div className="bg-[#F8FAFC] px-4 py-3.5 text-sm font-bold text-[#374151] sm:px-5">
                    {label as string}
                  </div>
                  <div
                    className={`px-4 py-3.5 text-sm font-semibold sm:px-5 ${
                      label === "위반건축물 여부" &&
                      property.is_violating_building
                        ? "text-red-600"
                        : "text-[#111827]"
                    }`}
                  >
                    {value as string}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 border-t border-stone-200 pt-10">
            <h2 className="text-2xl font-black">위치</h2>
            <div className="mt-5">
              <KakaoMap
                latitude={property.latitude}
                longitude={property.longitude}
                address={publicAddress}
                displayAddress={publicAddress}
                isAddressHidden={property.address_hidden ?? false}
              />
            </div>
          </section>
        </article>

        <aside className="h-fit rounded-3xl bg-white p-6 shadow-xl shadow-black/5 lg:sticky lg:top-24">
          <h2 className="text-xl font-black">이 매물이 궁금하신가요?</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            매물번호 {property.property_number}을 말씀해 주시면 빠르게
            안내해 드립니다.
          </p>
          <div className="mt-6">
            <ContactActions propertyNumber={property.property_number} />
          </div>
        </aside>
      </div>

    </main>
  );
}
