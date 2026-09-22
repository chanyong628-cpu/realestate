export type VisitSourceType = "direct" | "search" | "site" | "campaign";

export interface VisitAttribution {
  sourceType: VisitSourceType;
  sourceName: string;
  referrerHost: string | null;
  searchQuery: string | null;
}

const searchEngines = [
  { matches: (host: string) => host === "search.naver.com" || host === "m.search.naver.com", name: "네이버 검색", params: ["query"] },
  { matches: (host: string) => host === "search.daum.net", name: "다음 검색", params: ["q"] },
  { matches: (host: string) => host === "search.zum.com", name: "ZUM 검색", params: ["query"] },
  { matches: (host: string) => host === "www.bing.com" || host === "bing.com", name: "Bing 검색", params: ["q"] },
  { matches: (host: string) => host === "search.yahoo.com", name: "Yahoo 검색", params: ["p"] },
  { matches: (host: string) => host === "www.google.com" || host.startsWith("www.google."), name: "Google 검색", params: ["q"] },
] as const;

function cleanText(value: string | null, maxLength: number) {
  const cleaned = value
    ?.split("")
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? " " : character;
    })
    .join("")
    .trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function displayHost(host: string) {
  return host.replace(/^www\./, "").slice(0, 100);
}

export function classifyVisitSource(
  referrer: string | null | undefined,
  currentSearch: string | null | undefined,
  siteHost: string,
): VisitAttribution {
  const currentParams = new URLSearchParams(currentSearch ?? "");
  const campaign = cleanText(
    currentParams.get("utm_source") ?? currentParams.get("source"),
    100,
  );
  if (campaign) {
    return {
      sourceType: "campaign",
      sourceName: campaign,
      referrerHost: null,
      searchQuery: cleanText(currentParams.get("utm_term"), 200),
    };
  }

  if (!referrer) {
    return {
      sourceType: "direct",
      sourceName: "직접 방문",
      referrerHost: null,
      searchQuery: null,
    };
  }

  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    if (!host || host === siteHost || host.endsWith(`.${siteHost}`)) {
      return {
        sourceType: "direct",
        sourceName: "사이트 내부 이동",
        referrerHost: host || null,
        searchQuery: null,
      };
    }

    const engine = searchEngines.find((item) => item.matches(host));
    if (engine) {
      const query = engine.params
        .map((param) => cleanText(url.searchParams.get(param), 200))
        .find(Boolean);
      return {
        sourceType: "search",
        sourceName: engine.name,
        referrerHost: host.slice(0, 253),
        searchQuery: query ?? null,
      };
    }

    return {
      sourceType: "site",
      sourceName: displayHost(host),
      referrerHost: host.slice(0, 253),
      searchQuery: null,
    };
  } catch {
    return {
      sourceType: "direct",
      sourceName: "직접 방문",
      referrerHost: null,
      searchQuery: null,
    };
  }
}

export function isLikelyBot(userAgent: string) {
  return /bot|crawler|spider|slurp|preview|facebookexternalhit|kakaotalk-scrap|naverbot|yeti/i.test(
    userAgent,
  );
}
