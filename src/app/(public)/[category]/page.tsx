import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertyBrowser } from "@/components/properties/property-browser";
import { EtcArticleList } from "@/components/properties/etc-article-list";
import { categoryLabels } from "@/lib/properties/format";
import { getPublishedProperties } from "@/lib/properties/queries";
import { absoluteUrl, baseKeywords } from "@/lib/seo";
import type { PropertyCategory } from "@/types/database";

export function generateStaticParams() {
  return [{ category: "office" }, { category: "store" }, { category: "etc" }];
}

const categorySeo: Record<
  PropertyCategory,
  { title: string; description: string }
> = {
  office: {
    title: "송파구 사무실 임대 매물",
    description:
      "송파구 가락동·문정동·방이동·석촌동·삼전동 사무실 임대 매물을 보증금, 월세, 실평수 기준으로 확인하세요.",
  },
  store: {
    title: "송파구 상가 임대 매물",
    description:
      "송파구 상가 임대 매물을 월세, 면적, 위치, 주차 조건과 함께 확인하세요.",
  },
  etc: {
    title: "송파구 부동산 정보",
    description:
      "C.Y 부동산이 전하는 송파구 사무실·상가 임대 정보와 부동산 안내 글입니다.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!["office", "store", "etc"].includes(category)) {
    return { title: "페이지를 찾을 수 없습니다" };
  }
  const typedCategory = category as PropertyCategory;
  const seo = categorySeo[typedCategory];

  return {
    title: seo.title,
    description: seo.description,
    keywords: [
      `${categoryLabels[typedCategory]} 임대`,
      `송파구 ${categoryLabels[typedCategory]}`,
      ...baseKeywords,
    ],
    alternates: { canonical: `/${typedCategory}` },
    openGraph: {
      title: `${seo.title} | C.Y 부동산`,
      description: seo.description,
      url: absoluteUrl(`/${typedCategory}`),
      type: "website",
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!["office", "store", "etc"].includes(category)) notFound();
  const typedCategory = category as PropertyCategory;
  const properties = await getPublishedProperties(typedCategory);

  if (typedCategory === "etc") {
    return (
      <main>
        <EtcArticleList properties={properties} />
      </main>
    );
  }

  return (
    <main className="min-h-[70vh]">
      <PropertyBrowser
        properties={properties}
        title={`${categoryLabels[typedCategory]} 매물`}
      />
    </main>
  );
}
