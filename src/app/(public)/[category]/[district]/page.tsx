import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Building2, Check, MapPin, Ruler, WalletCards } from "lucide-react";
import { PropertyBrowser } from "@/components/properties/property-browser";
import { RegionDirectory } from "@/components/properties/region-directory";
import { formatPyeong, formatWon } from "@/lib/properties/format";
import { getPublishedProperties } from "@/lib/properties/queries";
import {
  filterPropertiesByRegion,
  getRegionPath,
  getSongpaRegionBySlug,
  songpaRegions,
} from "@/lib/songpa-regions";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPropertyItemListJsonLd,
  siteName,
} from "@/lib/seo";
import type { Property, PropertyCategory } from "@/types/database";

type RegionalCategory = Extract<PropertyCategory, "office" | "store">;

const categoryCopy: Record<
  RegionalCategory,
  { label: string; useCase: string; consultation: string }
> = {
  office: {
    label: "사무실",
    useCase: "업무 인원, 방문 고객, 주차와 엘리베이터 조건",
    consultation: "기업 이전과 신규 사무실 조건",
  },
  store: {
    label: "상가",
    useCase: "업종, 가시성, 층수와 배후수요",
    consultation: "입점 업종과 상권 조건",
  },
};

const getCategoryProperties = cache((category: RegionalCategory) =>
  getPublishedProperties(category),
);

function isRegionalCategory(value: string): value is RegionalCategory {
  return value === "office" || value === "store";
}

function numberRange(values: Array<number | null>) {
  const numbers = values.filter((value): value is number => value !== null);
  if (!numbers.length) return null;
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}

function formatRange(
  range: { min: number; max: number } | null,
  formatter: (value: number) => string,
) {
  if (!range) return "협의";
  if (range.min === range.max) return formatter(range.min);
  return `${formatter(range.min)} ~ ${formatter(range.max)}`;
}

function latestUpdatedAt(properties: Property[]) {
  return properties.reduce<string | null>(
    (latest, property) =>
      !latest || property.updated_at > latest ? property.updated_at : latest,
    null,
  );
}

export const dynamicParams = false;

export function generateStaticParams() {
  return (["office", "store"] as const).flatMap((category) =>
    songpaRegions.map((region) => ({ category, district: region.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; district: string }>;
}): Promise<Metadata> {
  const { category, district } = await params;
  const region = getSongpaRegionBySlug(district);
  if (!isRegionalCategory(category) || !region) {
    return { title: "페이지를 찾을 수 없습니다", robots: { index: false } };
  }

  const allProperties = await getCategoryProperties(category);
  const properties = filterPropertiesByRegion(allProperties, region);
  const { label } = categoryCopy[category];
  const count = properties.length;
  const title = `${region.name} ${label} 임대 | 실시간 매물 ${count}개`;
  const description = `${region.nearby} 중심의 ${region.name} ${label} 임대 매물 ${count}개를 보증금, 월세, 실평수, 주차 조건으로 비교하세요. 송파구 ${label} 전문 C.Y 부동산이 직접 안내합니다.`;
  const canonical = getRegionPath(category, region);

  return {
    title,
    description,
    keywords: [
      `${region.name} ${label} 임대`,
      `${region.name} ${label} 월세`,
      `송파구 ${region.name} ${label}`,
      `${region.name} 부동산`,
      `${region.nearby} ${label}`,
    ],
    alternates: { canonical },
    robots: { index: count > 0, follow: true },
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: absoluteUrl(canonical),
      type: "website",
      images: properties[0]?.image_urls[0]
        ? [{ url: properties[0].image_urls[0], alt: title }]
        : [{ url: "/images/office-hero.png", alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: [properties[0]?.image_urls[0] ?? "/images/office-hero.png"],
    },
  };
}

export default async function DistrictPropertyPage({
  params,
}: {
  params: Promise<{ category: string; district: string }>;
}) {
  const { category, district } = await params;
  const region = getSongpaRegionBySlug(district);
  if (!isRegionalCategory(category) || !region) notFound();

  const allProperties = await getCategoryProperties(category);
  const properties = filterPropertiesByRegion(allProperties, region);
  const copy = categoryCopy[category];
  const rentRange = numberRange(properties.map((property) => property.monthly_rent));
  const areaRange = numberRange(properties.map((property) => property.exclusive_area));
  const updatedAt = latestUpdatedAt(properties);
  const pagePath = getRegionPath(category, region);
  const pageTitle = `${region.name} ${copy.label} 임대`;

  const faqItems = [
    {
      question: `현재 ${region.name} ${copy.label} 임대 매물은 몇 개인가요?`,
      answer: properties.length
        ? `현재 홈페이지에 공개된 ${region.name} ${copy.label} 임대 매물은 ${properties.length}개입니다. 매물이 등록되거나 계약되면 이 숫자와 목록이 자동으로 갱신됩니다.`
        : `현재 공개 중인 ${region.name} ${copy.label} 매물은 없습니다. 새로운 매물이 등록되면 이 페이지에 자동으로 표시됩니다.`,
    },
    {
      question: `${region.name}에서 조건에 맞는 매물을 따로 찾을 수 있나요?`,
      answer: `가능합니다. ${copy.useCase}을 알려주시면 공개 매물과 준비 중인 매물을 함께 확인해 안내합니다.`,
    },
    {
      question: "홈페이지의 임대조건은 언제 갱신되나요?",
      answer:
        "C.Y 부동산이 매물의 공개 여부와 임대조건을 수정하면 지역별 페이지와 상세페이지에 자동으로 반영됩니다. 계약 전에는 최신 조건을 다시 확인해 드립니다.",
    },
  ];

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "홈", url: "/" },
    { name: `송파구 ${copy.label} 임대`, url: `/${category}` },
    { name: pageTitle, url: pagePath },
  ]);
  const itemListJsonLd = buildPropertyItemListJsonLd(properties, pageTitle);
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${absoluteUrl(pagePath)}#collection`,
    name: pageTitle,
    description: `${region.nearby} 중심의 ${region.name} ${copy.label} 임대 전문 페이지입니다.`,
    url: absoluteUrl(pagePath),
    inLanguage: "ko-KR",
    about: {
      "@type": "Place",
      name: `서울특별시 송파구 ${region.name}`,
    },
    isPartOf: { "@id": `${absoluteUrl()}#website` },
    provider: { "@id": `${absoluteUrl()}#realestate-agent` },
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <main className="min-h-[70vh]">
      {[breadcrumbJsonLd, itemListJsonLd, collectionJsonLd, faqJsonLd].map(
        (data, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
          />
        ),
      )}

      <section className="border-b border-brand-line bg-brand-soft/70">
        <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
          <nav aria-label="현재 위치" className="flex flex-wrap items-center gap-2 text-sm text-brand-muted">
            <Link href="/" className="hover:text-brand-accent">홈</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/${category}`} className="hover:text-brand-accent">
              송파구 {copy.label}
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="font-bold text-brand-dark">{region.name}</span>
          </nav>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)] lg:items-end">
            <div>
              <p className="text-sm font-black text-brand-accent">SONGPA LOCAL SPECIALIST</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-brand-ink sm:text-4xl lg:text-5xl">
                {pageTitle}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-brand-muted sm:text-lg">
                {region.nearby}을 중심으로 확인하는 최신 {copy.label} 매물입니다. {region.profile}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {region.strengths.map((strength) => (
                  <span key={strength} className="inline-flex items-center gap-1.5 rounded-full border border-brand-line bg-brand-surface px-3 py-1.5 text-sm font-bold text-brand-dark">
                    <Check size={14} className="text-brand-accent" aria-hidden="true" />
                    {strength}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-brand-line bg-brand-surface p-5 shadow-card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-brand-muted">현재 공개 매물</p>
                  <p className="mt-1 text-4xl font-black text-brand-accent">{properties.length}개</p>
                </div>
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand-accent">
                  <Building2 size={24} aria-hidden="true" />
                </span>
              </div>
              <p className="mt-4 border-t border-brand-line pt-4 text-xs leading-5 text-brand-muted">
                {updatedAt
                  ? `최근 매물 업데이트 ${new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(new Date(updatedAt))}`
                  : "신규 매물이 등록되면 자동으로 업데이트됩니다."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label={`${region.name} ${copy.label} 임대 현황`} className="mx-auto max-w-[1440px] px-5 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-line bg-brand-surface p-5 shadow-card">
            <WalletCards size={21} className="text-brand-accent" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold text-brand-muted">월세 범위</p>
            <p className="mt-1 text-lg font-black text-brand-ink">
              {formatRange(rentRange, (value) => formatWon(value))}
            </p>
          </div>
          <div className="rounded-2xl border border-brand-line bg-brand-surface p-5 shadow-card">
            <Ruler size={21} className="text-brand-accent" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold text-brand-muted">전용면적 범위</p>
            <p className="mt-1 text-lg font-black text-brand-ink">
              {formatRange(areaRange, (value) => `실 ${formatPyeong(value)}평`)}
            </p>
          </div>
          <div className="rounded-2xl border border-brand-line bg-brand-surface p-5 shadow-card">
            <MapPin size={21} className="text-brand-accent" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold text-brand-muted">주요 생활권</p>
            <p className="mt-1 text-lg font-black text-brand-ink">{region.nearby}</p>
          </div>
        </div>
      </section>

      {properties.length ? (
        <PropertyBrowser properties={properties} title={`${pageTitle} 매물`} headingLevel="h2" />
      ) : (
        <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-dashed border-brand-line bg-brand-surface p-10 text-center">
            <h2 className="text-2xl font-black text-brand-ink">현재 공개 중인 매물이 없습니다.</h2>
            <p className="mx-auto mt-3 max-w-2xl leading-7 text-brand-muted">
              {copy.consultation}을 알려주시면 신규 등록 예정 매물까지 확인해 드립니다.
              전체 송파구 매물도 함께 비교해 보세요.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href={`/${category}`} className="rounded-xl border border-brand-accent px-5 py-3 font-bold text-brand-accent hover:bg-brand-soft">
                송파구 전체 {copy.label} 보기
              </Link>
              <Link href="/inquiry" className="rounded-xl bg-brand-accent px-5 py-3 font-bold text-white hover:bg-brand-accent-dark">
                맞춤 매물 문의
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1440px] px-5 sm:px-6 lg:px-8">
        <div className="grid gap-8 border-y border-brand-line py-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-black text-brand-accent">C.Y LOCAL GUIDE</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-brand-ink sm:text-3xl">
              {region.name}에서 {copy.label}를 찾을 때
            </h2>
            <p className="mt-4 leading-8 text-brand-muted">
              같은 {region.name} 안에서도 역과 도로, 건물의 출입동선에 따라 실제 업무환경과 고객 접근성이 달라집니다.
              C.Y 부동산은 표시된 금액뿐 아니라 {copy.useCase}을 함께 확인해 조건에 맞는 매물을 비교합니다.
            </p>
          </div>
          <div className="grid gap-3">
            {faqItems.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-brand-line bg-brand-surface p-5 open:shadow-card">
                <summary className="cursor-pointer list-none pr-6 font-black text-brand-ink">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-7 text-brand-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
        <RegionDirectory category={category} currentRegion={region} compact />
      </section>
    </main>
  );
}
