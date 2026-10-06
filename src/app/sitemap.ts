import type { MetadataRoute } from "next";
import { getPublishedProperties } from "@/lib/properties/queries";
import { siteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl;
  const properties = await getPublishedProperties();
  const latestUpdatedAt = properties.reduce<string | undefined>(
    (latest, property) =>
      !latest || property.updated_at > latest ? property.updated_at : latest,
    undefined,
  );
  const categoryUpdatedAt = new Map<string, string>();

  for (const property of properties) {
    const current = categoryUpdatedAt.get(property.category);
    if (!current || property.updated_at > current) {
      categoryUpdatedAt.set(property.category, property.updated_at);
    }
  }

  return [
    {
      url: base,
      ...(latestUpdatedAt ? { lastModified: latestUpdatedAt } : {}),
      changeFrequency: "daily",
      priority: 1,
    },
    ...["office", "store", "etc"].map((path) => ({
      url: `${base}/${path}`,
      ...(categoryUpdatedAt.get(path)
        ? { lastModified: categoryUpdatedAt.get(path) }
        : {}),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    {
      url: `${base}/inquiry`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    ...properties.map((property) => ({
      url: `${base}/properties/${property.property_number}`,
      lastModified: property.updated_at,
      images: property.image_urls,
      changeFrequency: "weekly" as const,
      priority: property.is_recommended ? 0.9 : 0.7,
    })),
  ];
}
