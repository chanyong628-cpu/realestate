import type { Metadata } from "next";
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
import {
  ContactActions,
  ShareLinkButton,
} from "@/components/properties/contact-actions";
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
} from "@/lib/properties/format";
import { getPublishedProperty } from "@/lib/properties/queries";
import { inferTotalFloorFromAdvertisement } from "@/lib/properties/smart-import";
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
  if (!address?.trim()) return "송파구";
  const parts = address
    .trim()
    .split(/\s+/)
    .filter((part) => !/^(서울|서울특별시)$/.test(part));
  const district = parts.find((part) => /구$/.test(part)) ?? "송파구";
  const neighborhood = parts.find((part) => /(동|읍|면)$/.test(part));
  return neighborhood ? `${district} ${neighborhood}` : district;
}

function formatExactLocationHeading(address: string | null) {
  if (!address?.trim()) return null;

  const normalized = address
    .trim()
    .replace(/^서울(?:특별시)?\s*/g, "")
    .replace(/\s+/g, " ");
  const districtAddress = /^[가-힣0-9]+구\s/.test(normalized)
    ? normalized
    : `송파구 ${normalized}`;
  const parcel = districtAddress.match(
    /([가-힣0-9]+구)\s+([가-힣0-9]+동)\s*((?:산\s*)?\d+(?:-\d+)?)/,
  );

  if (!parcel) return districtAddress;
  return `${parcel[1]} ${parcel[2]} ${parcel[3].replace(/\s+/g, " ")}`;
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

function formatPriceNumber(value: number | null) {
  return value === null ? "-" : value.toLocaleString("ko-KR");
}

function descriptionItems(description: string) {
  return description
    .split(/\r?\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
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
  const publicLocation = formatPublicLocation(publicAddress);
  const totalFloor =
    property.total_floor ||
    inferTotalFloorFromAdvertisement(property.description) ||
    null;
  const exactLocationHeading = property.address_hidden
    ? null
    : formatExactLocationHeading(publicAddress);
  const buildingRows = [
    ["건축물용도", property.building_use || "-"],
    ["사용승인일", formatApprovalDate(property.approval_date)],
    [
      "공급면적 / 전용면적",
      `${property.supply_area ?? "-"}㎡ / ${property.exclusive_area ?? "-"}㎡`,
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
      `${property.room_count ?? 0} / ${property.restroom_count ?? 0}`,
    ],
    ["냉난방", property.air_conditioner_type || "-"],
    ["위반건축물 여부", property.is_violating_building ? "위반" : "적법"],
  ];
  const publicDescriptionItems = descriptionItems(
    formatPublicDescription(property.description),
  );

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
      <div className="grid gap-8 pb-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0">
          <article>
          <div>
            <p className="text-base font-black tracking-wide text-brand-accent">
              {property.property_number}
            </p>
            <h1 className="mt-2 break-keep text-3xl leading-tight font-black tracking-[-0.03em] md:text-4xl">
              {property.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {property.is_recommended && (
                  <span className="rounded-md bg-brand-accent px-3 py-1 text-xs font-bold text-white">
                    추천매물
                  </span>
                )}
                <span className="rounded-md border border-brand-line bg-brand-surface px-3 py-1 text-xs font-black">
                  {categoryLabels[property.category]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FavoriteButton propertyId={property.id} detail />
                <ShareLinkButton
                  sharePath={`/properties/${property.property_number}`}
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <PropertyGallery
              images={property.image_urls}
              title={property.title}
              carouselOnly
            />
          </div>

          {isAdmin && (
            <div className="mt-4 flex w-full justify-end gap-2 rounded-xl border border-brand-line bg-brand-soft p-3">
              <Link
                href={`/admin/properties/${property.id}/edit`}
                className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-white"
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

          <section className="mt-6 rounded-2xl border border-brand-line bg-brand-surface p-5 shadow-card lg:hidden">
            <p className="text-2xl font-black tracking-wide text-brand-accent">
              {property.property_number}
            </p>
            <dl className="mt-4 divide-y divide-brand-line">
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm font-semibold text-brand-muted">보증금</dt>
                <dd className="text-lg font-black text-brand-ink">
                  {formatPriceNumber(property.deposit)}만원
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm font-semibold text-brand-muted">월세</dt>
                <dd className="text-lg font-black text-brand-ink">
                  {formatPriceNumber(property.monthly_rent)}만원
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm font-semibold text-brand-muted">관리비</dt>
                <dd className="text-base font-black text-brand-ink">
                  {formatPriceNumber(property.maintenance_fee)}만원
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <ContactActions propertyNumber={property.property_number} />
            </div>
          </section>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {([
              {
                icon: MapPin,
                label: "위치",
                value: publicLocation,
              },
              {
                icon: Building,
                label: "층수(해당/총)",
                value: `${formatFloor(property.floor)} / 총${formatTotalFloor(totalFloor) ?? "-층"}`,
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
              value: string;
            }>).map(({ icon: ItemIcon, label, value }) => {
              return (
                <div
                  key={label}
                  className="rounded-2xl border border-brand-line bg-brand-card p-4"
                >
                  <ItemIcon size={20} className="text-brand-accent" />
                  <p className="mt-3 text-sm text-brand-muted">
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

          <div className="mt-12 grid items-stretch gap-6 border-t border-brand-line pt-10 md:grid-cols-2">
            <section className="h-full rounded-2xl border border-brand-line bg-brand-surface p-6">
              <h2 className="text-2xl font-black">매물 설명</h2>
              <div className="mt-5 space-y-3">
                {publicDescriptionItems.map((item, itemIndex) => (
                  <p
                    key={itemIndex}
                    className="break-keep text-base leading-7 text-brand-slate"
                  >
                    {item}
                  </p>
                ))}
              </div>
            </section>

            <section className="h-full rounded-2xl border border-brand-line bg-brand-surface p-6">
              <h2 className="text-2xl font-black">건축물 정보</h2>
              <div className="mt-5 overflow-hidden rounded-xl border border-brand-line">
                {buildingRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[132px_1fr] border-b border-brand-line last:border-b-0"
                  >
                    <div className="bg-brand-soft/60 px-3 py-2.5 text-xs font-bold text-brand-slate sm:px-4 sm:text-sm">
                      {label}
                    </div>
                    <div
                      className={`px-3 py-2.5 text-xs font-semibold sm:px-4 sm:text-sm ${
                        label === "위반건축물 여부" &&
                        property.is_violating_building
                          ? "text-red-600"
                          : "text-brand-ink"
                      }`}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-12 border-t border-brand-line pt-10">
            <div className="grid items-start gap-6 md:grid-cols-[minmax(220px,0.8fr)_minmax(320px,1fr)]">
              <div>
                <h2 className="text-3xl font-black text-brand-accent">위치</h2>
                <p className="mt-4 text-lg font-bold text-brand-ink">
                  {exactLocationHeading ?? publicLocation}
                </p>
                <p className="mt-2 break-keep text-sm leading-6 text-brand-muted">
                  {property.address_hidden
                    ? "정확한 주소는 문의해 주세요. 지도에는 인근 위치만 표시됩니다."
                    : "지도에서 매물의 정확한 위치를 확인하실 수 있습니다."}
                </p>
              </div>
              <KakaoMap
                latitude={property.latitude}
                longitude={property.longitude}
                address={publicAddress}
                displayAddress={exactLocationHeading ?? publicLocation}
                isAddressHidden={property.address_hidden ?? false}
                fiveFour
              />
            </div>
          </section>
          </article>
        </div>

        <aside className="hidden h-fit rounded-3xl border border-brand-line bg-brand-surface p-6 shadow-xl shadow-brand-dark/5 lg:block lg:self-start">
          <p className="text-2xl font-black tracking-wide text-brand-accent">
            {property.property_number}
          </p>
          <dl className="mt-6 divide-y divide-brand-line">
            <div className="flex items-center justify-between py-4">
              <dt className="text-sm font-semibold text-brand-muted">보증금</dt>
              <dd className="text-lg font-black text-brand-ink">
                {formatPriceNumber(property.deposit)}만원
              </dd>
            </div>
            <div className="flex items-center justify-between py-4">
              <dt className="text-sm font-semibold text-brand-muted">월세</dt>
              <dd className="text-lg font-black text-brand-ink">
                {formatPriceNumber(property.monthly_rent)}만원
              </dd>
            </div>
            <div className="flex items-center justify-between py-4">
              <dt className="text-sm font-semibold text-brand-muted">관리비</dt>
              <dd className="text-base font-black text-brand-ink">
                {formatPriceNumber(property.maintenance_fee)}만원
              </dd>
            </div>
          </dl>
          <div className="mt-5">
            <ContactActions propertyNumber={property.property_number} />
          </div>
        </aside>
      </div>

    </main>
  );
}
