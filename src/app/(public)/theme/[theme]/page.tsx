import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertyBrowser } from "@/components/properties/property-browser";
import { getThemeDefinition, themeDefinitions } from "@/lib/properties/listing-tags";
import { getPublishedPropertiesByListingTag } from "@/lib/properties/queries";
import { absoluteUrl, buildBreadcrumbJsonLd, buildPropertyItemListJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return themeDefinitions.map((theme) => ({ theme: theme.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ theme: string }>;
}): Promise<Metadata> {
  const { theme: slug } = await params;
  const theme = getThemeDefinition(slug);
  if (!theme) return { title: "페이지를 찾을 수 없습니다" };

  const title = `송파구 ${theme.label} 매물`;
  return {
    title,
    description: theme.description,
    alternates: { canonical: `/theme/${theme.slug}` },
    openGraph: {
      title: `${title} | C.Y 부동산`,
      description: theme.description,
      url: absoluteUrl(`/theme/${theme.slug}`),
      type: "website",
    },
  };
}

export default async function ThemePropertyPage({
  params,
}: {
  params: Promise<{ theme: string }>;
}) {
  const { theme: slug } = await params;
  const theme = getThemeDefinition(slug);
  if (!theme) notFound();

  const properties = await getPublishedPropertiesByListingTag(theme.tag);
  const pageTitle = `${theme.label} 매물`;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "홈", url: "/" },
    { name: "테마", url: "/theme" },
    { name: pageTitle, url: `/theme/${theme.slug}` },
  ]);
  const itemListJsonLd = buildPropertyItemListJsonLd(properties, pageTitle);

  return (
    <main className="min-h-[70vh]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <PropertyBrowser properties={properties} title={pageTitle} />
    </main>
  );
}
