import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/favorites", "/share/customer-block"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
