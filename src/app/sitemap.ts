import type { MetadataRoute } from "next";
import { getPublishedProperties } from "@/lib/properties/queries";
import { siteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl;
  const properties = await getPublishedProperties();

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...["office", "store", "etc"].map((path) => ({
      url: `${base}/${path}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...properties.map((property) => ({
      url: `${base}/properties/${property.property_number}`,
      lastModified: property.updated_at,
      images: property.image_urls,
      changeFrequency: "weekly" as const,
      priority: property.is_recommended ? 0.9 : 0.7,
    })),
  ];
}
