"use client";

import Script from "next/script";
import { track } from "@vercel/analytics";

type EventProperties = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/** Sends the same business event to Vercel Web Analytics and GA4 when configured. */
export function trackConversion(name: string, properties: EventProperties = {}) {
  track(name, properties);
  if (typeof window !== "undefined" && measurementId && window.gtag) {
    window.gtag("event", name, properties);
  }
}

export function GoogleAnalytics() {
  if (!measurementId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="ga4-config" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${measurementId}');`}
      </Script>
    </>
  );
}
