import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const disallow = ["/admin", "/favorites", "/share/customer-block"];

// 검색·AI 검색 크롤러를 명시적으로 허용한다. (그룹이 따로 있으면 "*" 규칙이
// 적용되지 않으므로 차단 경로를 동일하게 반복한다.)
const searchCrawlers = [
  "Yeti",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Applebot",
];

// OpenAI(GPT) 계열 크롤러는 전체 차단한다.
const blockedCrawlers = ["GPTBot", "OAI-SearchBot", "ChatGPT-User"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: searchCrawlers, allow: "/", disallow },
      { userAgent: blockedCrawlers, disallow: "/" },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
