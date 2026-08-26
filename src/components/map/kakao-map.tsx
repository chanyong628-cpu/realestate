"use client";

import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface KakaoAddressResult {
  x: string;
  y: string;
  address?: {
    region_2depth_name: string;
    region_3depth_name: string;
  };
}

type KakaoWindow = Window & {
  kakao?: {
    maps: {
      load: (callback: () => void) => void;
      LatLng: new (latitude: number, longitude: number) => unknown;
      Map: new (
        container: HTMLElement,
        options: { center: unknown; level: number },
      ) => unknown;
      Marker: new (options: { position: unknown; image?: unknown }) => {
        setMap: (map: unknown) => void;
      };
      Size: new (width: number, height: number) => unknown;
      MarkerImage: new (src: string, size: unknown) => unknown;
      Circle: new (options: {
        center: unknown;
        radius: number;
        strokeWeight: number;
        strokeColor: string;
        strokeOpacity: number;
        strokeStyle: string;
        fillColor: string;
        fillOpacity: number;
      }) => {
        setMap: (map: unknown) => void;
      };
      services?: {
        Status: { OK: string };
        Geocoder: new () => {
          addressSearch: (
            address: string,
            callback: (
              result: KakaoAddressResult[],
              status: string,
            ) => void,
          ) => void;
          coord2Address: (
            longitude: number,
            latitude: number,
            callback: (
              result: Array<{
                address?: {
                  region_2depth_name: string;
                  region_3depth_name: string;
                };
              }>,
              status: string,
            ) => void,
          ) => void;
        };
      };
    };
  };
};

function toSongpaAddress(address: string) {
  const trimmed = address.trim();
  if (/^서울(?:특별시)?\s/.test(trimmed)) return trimmed;
  if (/^송파구\s/.test(trimmed)) return `서울특별시 ${trimmed}`;
  return `서울특별시 송파구 ${trimmed}`;
}

export function KakaoMap({
  latitude,
  longitude,
  address,
  displayAddress,
  isAddressHidden,
}: {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  displayAddress?: string | null;
  isAddressHidden: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const appKey = process.env.NEXT_PUBLIC_MAP_API_KEY;
  const locationAddress = address?.trim() || displayAddress?.trim() || null;
  const hasStoredCoordinates =
    Number.isFinite(latitude) && Number.isFinite(longitude);

  useEffect(() => {
    if (!appKey || !containerRef.current) return;
    if (!hasStoredCoordinates && !locationAddress) return;

    let cancelled = false;
    const kakaoWindow = window as KakaoWindow;

    function fail() {
      if (!cancelled) setFailed(true);
    }

    function renderMap() {
      const maps = kakaoWindow.kakao?.maps;
      const container = containerRef.current;
      if (!maps || !container) {
        fail();
        return;
      }
      const mapApi = maps;
      const mapContainer = container;

      mapApi.load(() => {
        const services = mapApi.services;
        if (!services || cancelled) {
          fail();
          return;
        }

        const expectedDong = displayAddress?.match(/([가-힣0-9]+동)/)?.[1];

        function drawMap(mapLatitude: number, mapLongitude: number) {
          if (cancelled) return;
          const position = new mapApi.LatLng(mapLatitude, mapLongitude);
          const map = new mapApi.Map(mapContainer, {
            center: position,
            level: isAddressHidden ? 5 : 3,
          });

          if (isAddressHidden) {
            new mapApi.Circle({
              center: position,
              radius: 400,
              strokeWeight: 2,
              strokeColor: "#155EEF",
              strokeOpacity: 0.85,
              strokeStyle: "solid",
              fillColor: "#155EEF",
              fillOpacity: 0.12,
            }).setMap(map);
          } else {
            new mapApi.Marker({ position }).setMap(map);
          }
        }

        function isExpectedAddress(resultAddress?: {
          region_2depth_name: string;
          region_3depth_name: string;
        }) {
          return (
            resultAddress?.region_2depth_name === "송파구" &&
            (!expectedDong || resultAddress.region_3depth_name === expectedDong)
          );
        }

        if (hasStoredCoordinates) {
          const mapLatitude = latitude as number;
          const mapLongitude = longitude as number;
          new services.Geocoder().coord2Address(
            mapLongitude,
            mapLatitude,
            (result, status) => {
              if (
                status === services.Status.OK &&
                isExpectedAddress(result[0]?.address)
              ) {
                drawMap(mapLatitude, mapLongitude);
                return;
              }
              fail();
            },
          );
          return;
        }

        new services.Geocoder().addressSearch(
          toSongpaAddress(locationAddress as string),
          (result, status) => {
            const first = result[0];
            const resolvedLatitude = Number(first?.y);
            const resolvedLongitude = Number(first?.x);
            if (
              status === services.Status.OK &&
              Number.isFinite(resolvedLatitude) &&
              Number.isFinite(resolvedLongitude) &&
              isExpectedAddress(first?.address)
            ) {
              drawMap(resolvedLatitude, resolvedLongitude);
              return;
            }
            fail();
          },
        );
      });
    }

    if (kakaoWindow.kakao?.maps) {
      renderMap();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-cy-kakao-map="true"]',
    );
    if (existing) {
      existing.addEventListener("load", renderMap, { once: true });
      existing.addEventListener("error", fail, { once: true });
      return () => {
        cancelled = true;
        existing.removeEventListener("load", renderMap);
        existing.removeEventListener("error", fail);
      };
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.dataset.cyKakaoMap = "true";
    script.addEventListener("load", renderMap, { once: true });
    script.addEventListener("error", fail, { once: true });
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener("load", renderMap);
      script.removeEventListener("error", fail);
    };
  }, [
    appKey,
    displayAddress,
    hasStoredCoordinates,
    isAddressHidden,
    latitude,
    locationAddress,
    longitude,
  ]);

  if (!appKey || (!hasStoredCoordinates && !locationAddress) || failed) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center rounded-3xl bg-[#e5e5db] text-center">
        <div>
          <MapPin className="mx-auto text-rose-600" />
          <b className="mt-3 block">
            {displayAddress || "위치 정보 준비 중"}
          </b>
          <p className="mt-1 text-sm text-stone-500">
            정확한 위치를 확인 중입니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-label={
        isAddressHidden
          ? `${displayAddress ?? "매물"} 인근 400m 지도`
          : `${displayAddress ?? "매물"} 정확한 위치 지도`
      }
      className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[#e5e5db]"
    />
  );
}
