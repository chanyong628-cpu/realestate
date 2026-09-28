"use client";

import { MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Property } from "@/types/database";

type MapInstance = {
  getLevel: () => number;
  setLevel: (level: number) => void;
};

type MapOverlay = {
  setMap: (map: MapInstance | null) => void;
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
  }) => MapOverlay;
  event: {
    addListener: (
      target: MapInstance,
      eventName: string,
      handler: () => void,
    ) => void;
    removeListener: (
      target: MapInstance,
      eventName: string,
      handler: () => void,
    ) => void;
  };
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

type ExactPropertyPoint = {
  propertyNumber: string;
  address: string;
  latitude: number;
  longitude: number;
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

async function resolveExactPropertyPoint(
  maps: KakaoMaps,
  property: Property,
) {
  const address = property.public_address?.trim();

  if (property.address_hidden || !address || !/\d/.test(address)) return null;

  if (
    Number.isFinite(property.latitude) &&
    Number.isFinite(property.longitude)
  ) {
    return {
      propertyNumber: property.property_number,
      address,
      latitude: property.latitude as number,
      longitude: property.longitude as number,
    } satisfies ExactPropertyPoint;
  }

  const services = maps.services;
  if (!services) return null;

  return new Promise<ExactPropertyPoint | null>((resolve) => {
    new services.Geocoder().addressSearch(address, (result, status) => {
      const first = result[0];
      const latitude = Number(first?.y);
      const longitude = Number(first?.x);

      if (
        status !== services.Status.OK ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        resolve(null);
        return;
      }

      resolve({
        propertyNumber: property.property_number,
        address,
        latitude,
        longitude,
      });
    });
  });
}

type MarkerTheme = {
  accent: string;
  ink: string;
  line: string;
  surface: string;
};

function createCountMarker(
  group: DongGroup,
  theme: MarkerTheme,
  onDongSelect: (dong: string) => void,
) {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("aria-label", `${group.dong} 매물 ${group.count}개`);
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "4px";
  wrapper.style.transform = "translateY(-8px)";

  const count = document.createElement("button");
  count.type = "button";
  count.textContent = String(group.count);
  count.setAttribute("aria-label", `${group.dong} 매물 ${group.count}개 보기`);
  count.title = `${group.dong} 매물 보기`;
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
  count.style.cursor = "pointer";
  count.style.boxShadow = `0 8px 24px color-mix(in srgb, ${theme.accent} 30%, transparent)`;
  count.addEventListener("click", () => onDongSelect(group.dong));

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

function createExactPropertyMarker(point: ExactPropertyPoint) {
  const wrapper = document.createElement("div");
  wrapper.setAttribute(
    "aria-label",
    `${point.propertyNumber} ${point.address} 실제 위치`,
  );
  wrapper.title = `${point.propertyNumber} · ${point.address}`;
  wrapper.style.position = "relative";
  wrapper.style.width = "34px";
  wrapper.style.height = "44px";
  wrapper.style.filter = "drop-shadow(0 5px 7px rgb(127 29 29 / 0.35))";

  const pin = document.createElement("span");
  pin.style.position = "absolute";
  pin.style.top = "1px";
  pin.style.left = "3px";
  pin.style.width = "28px";
  pin.style.height = "28px";
  pin.style.border = "3px solid white";
  pin.style.borderRadius = "50% 50% 50% 0";
  pin.style.background = "#dc2626";
  pin.style.transform = "rotate(-45deg)";

  const center = document.createElement("span");
  center.style.position = "absolute";
  center.style.top = "9px";
  center.style.left = "11px";
  center.style.width = "10px";
  center.style.height = "10px";
  center.style.borderRadius = "9999px";
  center.style.background = "white";

  wrapper.append(pin, center);
  return wrapper;
}

export function PropertyClusterMap({
  properties,
  onDongSelect,
}: {
  properties: Property[];
  onDongSelect: (dong: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const groups = useMemo(() => createGroups(properties), [properties]);
  const appKey = process.env.NEXT_PUBLIC_MAP_API_KEY;

  useEffect(() => {
    const container = containerRef.current;
    if (!appKey || !container || !groups.length) return;
    let cancelled = false;
    let disposeMap: (() => void) | undefined;

    loadKakaoMaps(appKey)
      .then(async (maps) => {
        const [resolvedGroups, resolvedExactPoints] = await Promise.all([
          Promise.all(
            groups.map((group) => resolveGroupCoordinates(maps, group)),
          ),
          Promise.all(
            properties.map((property) =>
              resolveExactPropertyPoint(maps, property),
            ),
          ),
        ]);
        if (cancelled) return;
        const visibleGroups = resolvedGroups.filter(
          (group) => group.latitude !== null && group.longitude !== null,
        );
        const exactPoints = resolvedExactPoints.filter(
          (point): point is ExactPropertyPoint => point !== null,
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

        const groupOverlays = visibleGroups.map(
          (group) =>
            new maps.CustomOverlay({
              position: new maps.LatLng(
                group.latitude as number,
                group.longitude as number,
              ),
              content: createCountMarker(group, markerTheme, onDongSelect),
              yAnchor: 0.5,
            }),
        );
        const exactPointOverlays = exactPoints.map(
          (point) =>
            new maps.CustomOverlay({
              position: new maps.LatLng(point.latitude, point.longitude),
              content: createExactPropertyMarker(point),
              yAnchor: 1,
            }),
        );

        const syncMarkersToZoom = () => {
          const showExactPoints =
            exactPointOverlays.length > 0 && map.getLevel() <= 4;

          groupOverlays.forEach((overlay) =>
            overlay.setMap(showExactPoints ? null : map),
          );
          exactPointOverlays.forEach((overlay) =>
            overlay.setMap(showExactPoints ? map : null),
          );
        };

        maps.event.addListener(map, "zoom_changed", syncMarkersToZoom);
        syncMarkersToZoom();

        disposeMap = () => {
          maps.event.removeListener(map, "zoom_changed", syncMarkersToZoom);
          [...groupOverlays, ...exactPointOverlays].forEach((overlay) =>
            overlay.setMap(null),
          );
        };
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      disposeMap?.();
      container.replaceChildren();
    };
  }, [appKey, groups, onDongSelect, properties]);

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
            <button
              type="button"
              key={group.dong}
              onClick={() => onDongSelect(group.dong)}
              className="rounded-xl border border-brand-line bg-brand-surface p-4 text-center shadow-card"
            >
              <strong className="text-2xl text-brand-accent">
                {group.count}
              </strong>
              <span className="mt-1 block text-sm font-bold">{group.dong}</span>
            </button>
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
