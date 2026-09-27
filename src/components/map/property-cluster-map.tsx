"use client";

import { MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Property } from "@/types/database";

type MapInstance = {
  setLevel: (level: number) => void;
};

type KakaoMaps = {
  load: (callback: () => void) => void;
  LatLng: new (latitude: number, longitude: number) => unknown;
  Map: new (
    container: HTMLElement,
    options: { center: unknown; level: number },
  ) => MapInstance;
  CustomOverlay: new (options: {
    position: unknown;
    content: HTMLElement;
    yAnchor?: number;
  }) => { setMap: (map: MapInstance | null) => void };
  services?: {
    Status: { OK: string };
    Geocoder: new () => {
      addressSearch: (
        address: string,
        callback: (
          result: Array<{ x: string; y: string }>,
          status: string,
        ) => void,
      ) => void;
    };
  };
};

type KakaoWindow = Window & {
  kakao?: { maps: KakaoMaps };
};

type DongGroup = {
  dong: string;
  count: number;
  latitude: number | null;
  longitude: number | null;
};

function getDong(address: string | null) {
  return address?.match(/([가-힣0-9]+동)/)?.[1] ?? null;
}

function createGroups(properties: Property[]) {
  const groups = new Map<
    string,
    { count: number; latitudes: number[]; longitudes: number[] }
  >();

  for (const property of properties) {
    const dong = getDong(property.public_address);
    if (!dong) continue;
    const group = groups.get(dong) ?? {
      count: 0,
      latitudes: [],
      longitudes: [],
    };
    group.count += 1;
    if (
      Number.isFinite(property.latitude) &&
      Number.isFinite(property.longitude)
    ) {
      group.latitudes.push(property.latitude as number);
      group.longitudes.push(property.longitude as number);
    }
    groups.set(dong, group);
  }

  return [...groups.entries()]
    .map(([dong, group]) => ({
      dong,
      count: group.count,
      latitude: group.latitudes.length
        ? group.latitudes.reduce((sum, value) => sum + value, 0) /
          group.latitudes.length
        : null,
      longitude: group.longitudes.length
        ? group.longitudes.reduce((sum, value) => sum + value, 0) /
          group.longitudes.length
        : null,
    }))
    .sort((a, b) => a.dong.localeCompare(b.dong, "ko"));
}

function loadKakaoMaps(appKey: string) {
  return new Promise<KakaoMaps>((resolve, reject) => {
    const kakaoWindow = window as KakaoWindow;

    function finish() {
      const maps = kakaoWindow.kakao?.maps;
      if (!maps) {
        reject(new Error("Kakao Maps SDK unavailable"));
        return;
      }
      maps.load(() => resolve(maps));
    }

    if (kakaoWindow.kakao?.maps) {
      finish();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-cy-kakao-map="true"]',
    );
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("SDK error")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.dataset.cyKakaoMap = "true";
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => reject(new Error("SDK error")), {
      once: true,
    });
    document.head.appendChild(script);
  });
}

async function resolveGroupCoordinates(maps: KakaoMaps, group: DongGroup) {
  if (group.latitude !== null && group.longitude !== null) return group;
  const services = maps.services;
  if (!services) return group;

  return new Promise<DongGroup>((resolve) => {
    new services.Geocoder().addressSearch(
      `서울특별시 송파구 ${group.dong}`,
      (result, status) => {
        const first = result[0];
        const latitude = Number(first?.y);
        const longitude = Number(first?.x);
        resolve({
          ...group,
          latitude:
            status === services.Status.OK && Number.isFinite(latitude)
              ? latitude
              : null,
          longitude:
            status === services.Status.OK && Number.isFinite(longitude)
              ? longitude
              : null,
        });
      },
    );
  });
}

type MarkerTheme = {
  accent: string;
  ink: string;
  line: string;
  surface: string;
};

function createCountMarker(group: DongGroup, theme: MarkerTheme) {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("aria-label", `${group.dong} 매물 ${group.count}개`);
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "4px";
  wrapper.style.transform = "translateY(-8px)";

  const count = document.createElement("span");
  count.textContent = String(group.count);
  count.style.display = "grid";
  count.style.placeItems = "center";
  count.style.width = "50px";
  count.style.height = "50px";
  count.style.border = `4px solid ${theme.surface}`;
  count.style.borderRadius = "9999px";
  count.style.background = theme.accent;
  count.style.color = theme.surface;
  count.style.fontSize = "16px";
  count.style.fontWeight = "800";
  count.style.boxShadow = `0 8px 24px color-mix(in srgb, ${theme.accent} 30%, transparent)`;

  const label = document.createElement("span");
  label.textContent = group.dong;
  label.style.padding = "3px 8px";
  label.style.border = `1px solid ${theme.line}`;
  label.style.borderRadius = "9999px";
  label.style.background = `color-mix(in srgb, ${theme.surface} 96%, transparent)`;
  label.style.color = theme.ink;
  label.style.fontSize = "12px";
  label.style.fontWeight = "700";
  label.style.whiteSpace = "nowrap";

  wrapper.append(count, label);
  return wrapper;
}

export function PropertyClusterMap({ properties }: { properties: Property[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const groups = useMemo(() => createGroups(properties), [properties]);
  const appKey = process.env.NEXT_PUBLIC_MAP_API_KEY;

  useEffect(() => {
    const container = containerRef.current;
    if (!appKey || !container || !groups.length) return;
    let cancelled = false;

    loadKakaoMaps(appKey)
      .then(async (maps) => {
        const resolvedGroups = await Promise.all(
          groups.map((group) => resolveGroupCoordinates(maps, group)),
        );
        if (cancelled) return;
        const visibleGroups = resolvedGroups.filter(
          (group) => group.latitude !== null && group.longitude !== null,
        );
        if (!visibleGroups.length) {
          setFailed(true);
          return;
        }

        const centerLatitude =
          visibleGroups.reduce(
            (sum, group) => sum + (group.latitude as number),
            0,
          ) / visibleGroups.length;
        const centerLongitude =
          visibleGroups.reduce(
            (sum, group) => sum + (group.longitude as number),
            0,
          ) / visibleGroups.length;
        const map = new maps.Map(container, {
          center: new maps.LatLng(centerLatitude, centerLongitude),
          level: visibleGroups.length > 1 ? 7 : 5,
        });
        const rootStyle = getComputedStyle(document.documentElement);
        const markerTheme: MarkerTheme = {
          accent: rootStyle.getPropertyValue("--color-brand-accent").trim(),
          ink: rootStyle.getPropertyValue("--color-brand-ink").trim(),
          line: rootStyle.getPropertyValue("--color-brand-line").trim(),
          surface: rootStyle.getPropertyValue("--color-brand-surface").trim(),
        };

        for (const group of visibleGroups) {
          new maps.CustomOverlay({
            position: new maps.LatLng(
              group.latitude as number,
              group.longitude as number,
            ),
            content: createCountMarker(group, markerTheme),
            yAnchor: 0.5,
          }).setMap(map);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [appKey, groups]);

  if (!groups.length) {
    return (
      <div className="grid h-full min-h-[420px] place-items-center rounded-2xl bg-brand-soft p-8 text-center">
        <div>
          <MapPin className="mx-auto text-brand-accent" />
          <b className="mt-3 block">표시할 위치가 없습니다.</b>
          <p className="mt-1 text-sm text-brand-muted">
            다른 검색 조건으로 확인해 주세요.
          </p>
        </div>
      </div>
    );
  }

  if (!appKey || failed) {
    return (
      <div className="h-full min-h-[420px] rounded-2xl bg-brand-soft p-6">
        <div className="flex items-center gap-2 font-bold text-brand-ink">
          <MapPin className="text-brand-accent" /> 동별 매물 현황
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.dong}
              className="rounded-xl border border-brand-line bg-brand-surface p-4 text-center shadow-card"
            >
              <strong className="text-2xl text-brand-accent">
                {group.count}
              </strong>
              <span className="mt-1 block text-sm font-bold">{group.dong}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm text-brand-muted">
          지도를 불러오지 못해 동별 개수로 표시합니다.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-label="송파구 동별 매물 개수 지도"
      className="h-full min-h-[520px] w-full overflow-hidden rounded-2xl bg-brand-soft lg:min-h-[720px]"
    />
  );
}
