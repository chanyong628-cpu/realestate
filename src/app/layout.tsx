import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import "./globals.css";
import { absoluteUrl, baseKeywords, siteUrl } from "@/lib/seo";

const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
const naverVerification = process.env.NAVER_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "C.Y 부동산 | 송파구 사무실·상가 임대 전문",
    template: "%s | CY 부동산",
  },
  description:
    "송파구 가락동·문정동·방이동·석촌동·삼전동 사무실·상가 임대 매물. 보증금, 월세, 실평수, 주차, 엘리베이터 정보를 한눈에 확인하세요.",
  keywords: baseKeywords,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "C.Y 부동산",
    title: "C.Y 부동산 | 송파구 사무실·상가 임대 전문",
    description:
      "송파구 사무실과 상가 임대 매물을 전문으로 중개하는 C.Y 부동산입니다.",
    url: absoluteUrl("/"),
    images: [
      {
        url: "/icons/cy-app-icon-512.png",
        width: 512,
        height: 512,
        alt: "C.Y 부동산",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "C.Y 부동산 | 송파구 사무실·상가 임대 전문",
    description:
      "송파구 사무실과 상가 임대 매물을 전문으로 중개하는 C.Y 부동산입니다.",
    images: ["/icons/cy-app-icon-512.png"],
  },
  applicationName: "C.Y 부동산",
  ...(googleVerification || naverVerification
    ? {
        verification: {
          ...(googleVerification ? { google: googleVerification } : {}),
          ...(naverVerification
            ? { other: { "naver-site-verification": naverVerification } }
            : {}),
        },
      }
    : {}),
  appleWebApp: {
    capable: true,
    title: "C.Y 부동산",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/cy-app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/cy-app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/cy-app-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1B3A",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <GoogleAnalytics />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
