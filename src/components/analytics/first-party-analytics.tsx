"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const LAST_VISIT_KEY = "cy:last-first-party-visit";
const ATTRIBUTION_KEY = "cy:first-party-attribution-sent";

function propertyNumberFromPath(pathname: string) {
  return pathname.match(/^\/properties\/(CY-\d{4,10})(?:\/|$)/i)?.[1]?.toUpperCase();
}

export function FirstPartyAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || /^\/(?:admin|api)(?:\/|$)/.test(pathname)) return;
    if (navigator.doNotTrack === "1" || navigator.webdriver) return;

    const visitKey = `${pathname}${window.location.search}`;
    const now = Date.now();
    try {
      const previous = JSON.parse(
        sessionStorage.getItem(LAST_VISIT_KEY) ?? "null",
      ) as { key?: string; at?: number } | null;
      if (
        previous?.key === visitKey &&
        typeof previous.at === "number" &&
        now - previous.at < 15_000
      ) {
        return;
      }
      sessionStorage.setItem(LAST_VISIT_KEY, JSON.stringify({ key: visitKey, at: now }));
    } catch {
      // Storage may be unavailable in privacy mode; the request can still proceed.
    }

    let referrer = "";
    let isEntry = true;
    try {
      isEntry = !sessionStorage.getItem(ATTRIBUTION_KEY);
      if (isEntry) {
        referrer = document.referrer;
        sessionStorage.setItem(ATTRIBUTION_KEY, "1");
      }
    } catch {
      referrer = document.referrer;
    }

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pathname,
        search: window.location.search,
        referrer,
        property_number: propertyNumberFromPath(pathname),
        is_entry: isEntry,
      }),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
