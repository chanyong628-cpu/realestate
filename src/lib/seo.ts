import type { Property } from "@/types/database";
import { categoryLabels, formatPyeong, formatWon } from "@/lib/properties/format";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://cy-office.com";

export const siteName = "C.Y 부동산";
export const companyName = "씨와이(C.Y)부동산중개";
export const serviceArea = "서울특별시 송파구";
export const mainPhone = "02-6425-8090";
export const mobilePhone = "010-6546-5997";

export const songpaNeighborhoods = [
  "가락동",
  "문정동",
  "방이동",
  "석촌동",
  "삼전동",
  "송파동",
  "오금동",
  "거여동",
  "마천동",
  "잠실동",
  "풍납동",
  "장지동",
];

export const baseKeywords = [
  "송파구 사무실 임대",
  "송파구 상가 임대",
  "송파 사무실 월세",
  "송파 상가 월세",
  "송파 소형사무실",
  "가락동 사무실 임대",
  "문정동 사무실 임대",
  "방이동 사무실 임대",
  "석촌동 사무실 임대",
  "삼전동 사무실 임대",
  "C.Y 부동산",
  "CY 부동산",
];

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

export function stripRichText(value: string | null | undefined) {
  return (value ?? "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|]/g, " ")
    .replace(/::(?:center|right)::/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

export function extractSongpaDong(value: string | null | undefined) {
  const match = (value ?? "").match(
    /(가락|문정|방이|석촌|삼전|송파|오금|거여|마천|잠실|풍납|장지)동/,
  );
  return match ? match[0] : null;
}

export function formatPriceSummary(property: Property) {
  return `보증금 ${formatWon(property.deposit)} / 월세 ${formatWon(
    property.monthly_rent,
  )}`;
}

export function formatPropertyAreaSummary(property: Property) {
  if (property.exclusive_area === null) return null;
  return `실평수 ${formatPyeong(property.exclusive_area)}평`;
}

export function buildRealEstateAgentJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${siteUrl}/#realestate-agent`,
    name: companyName,
    alternateName: "C.Y REAL ESTATE",
    url: siteUrl,
    telephone: mainPhone,
    description:
      "송파구 사무실·상가 임대 매물을 전문으로 중개하는 C.Y 부동산입니다.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "오금로53길 9, 101호",
      addressLocality: "송파구",
      addressRegion: "서울특별시",
      addressCountry: "KR",
    },
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: serviceArea,
      },
      ...songpaNeighborhoods.map((name) => ({
        "@type": "Place",
        name: `송파구 ${name}`,
      })),
    ],
    knowsAbout: [
      "사무실 임대",
      "상가 임대",
      "송파구 부동산",
      "업무시설 임대",
      "근린생활시설 임대",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: mobilePhone,
      contactType: "customer service",
      areaServed: "KR",
      availableLanguage: "ko",
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function buildPropertySeo(property: Property) {
  const publicAddress = property.public_address ?? serviceArea;
  const dong = extractSongpaDong(publicAddress);
  const categoryLabel = categoryLabels[property.category];
  const price = formatPriceSummary(property);
  const area = formatPropertyAreaSummary(property);
  const title = [
    property.property_number,
    dong ? `송파구 ${dong}` : publicAddress,
    `${categoryLabel} 임대`,
    price.replace(" / ", " "),
  ]
    .filter(Boolean)
    .join(" | ");
  const description = truncate(
    [
      property.title,
      publicAddress,
      price,
      property.maintenance_fee !== null
        ? `관리비 ${formatWon(property.maintenance_fee)}`
        : null,
      area,
      property.floor ? `${property.floor} 매물` : null,
      property.move_in_date ? `입주 ${property.move_in_date}` : "즉시입주",
    ]
      .filter(Boolean)
      .join(". "),
    155,
  );

  const keywords = [
    property.property_number,
    property.title,
    categoryLabel,
    publicAddress,
    dong ? `송파구 ${dong}` : null,
    dong ? `${dong} ${categoryLabel} 임대` : null,
    area,
    ...baseKeywords,
  ].filter((keyword): keyword is string => Boolean(keyword));

  return { title, description, keywords };
}

export function buildPropertyJsonLd(property: Property, publicAddress: string) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    identifier: property.property_number,
    description:
      stripRichText(property.description) ||
      `${publicAddress} ${categoryLabels[property.category]} 임대 매물입니다.`,
    url: absoluteUrl(`/properties/${property.property_number}`),
    image: property.image_urls,
    datePosted: property.created_at,
    dateModified: property.updated_at,
    category: categoryLabels[property.category],
    address: {
      "@type": "PostalAddress",
      addressLocality: publicAddress,
      addressRegion: "서울특별시",
      addressCountry: "KR",
    },
    seller: {
      "@id": `${siteUrl}/#realestate-agent`,
    },
    offers: {
      "@type": "Offer",
      price:
        property.monthly_rent === null ? undefined : property.monthly_rent * 10000,
      priceCurrency: "KRW",
      availability: "https://schema.org/InStock",
      seller: {
        "@id": `${siteUrl}/#realestate-agent`,
      },
    },
    floorSize:
      property.exclusive_area === null
        ? undefined
        : {
            "@type": "QuantitativeValue",
            value: property.exclusive_area,
            unitCode: "MTK",
          },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "보증금",
        value: formatWon(property.deposit),
      },
      {
        "@type": "PropertyValue",
        name: "월세",
        value: formatWon(property.monthly_rent),
      },
      {
        "@type": "PropertyValue",
        name: "관리비",
        value: formatWon(property.maintenance_fee),
      },
      { "@type": "PropertyValue", name: "층수", value: property.floor ?? "-" },
      {
        "@type": "PropertyValue",
        name: "엘리베이터",
        value: property.elevator_available ? "有" : "無",
      },
      {
        "@type": "PropertyValue",
        name: "주차",
        value: `총 ${property.total_parking_count ?? 0}대 / 가능 ${
          property.available_parking_count ?? (property.parking_available ? 1 : 0)
        }대`,
      },
    ],
  };
}
