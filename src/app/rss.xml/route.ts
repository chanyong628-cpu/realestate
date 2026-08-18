import { getPublishedProperties } from "@/lib/properties/queries";
import {
  buildPropertySeo,
  siteName,
  siteUrl,
  stripRichText,
} from "@/lib/seo";

export const revalidate = 3600;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const properties = await getPublishedProperties();
  const latestProperties = [...properties].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  const items = latestProperties
    .map((property) => {
      const url = `${siteUrl}/properties/${property.property_number}`;
      const seo = buildPropertySeo(property);
      const propertyDescription = stripRichText(property.description);
      const description = propertyDescription
        ? `${seo.description} ${propertyDescription}`
        : seo.description;

      return `    <item>
      <title>${escapeXml(property.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${new Date(property.updated_at).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${siteName} 최신 임대 매물`)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml("송파구 사무실·상가 최신 임대 매물")}</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
