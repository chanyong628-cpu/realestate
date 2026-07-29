"use client";

import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
              result: Array<{ x: string; y: string }>,
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

export function KakaoMap({
  latitude,
  longitude,
  address,
  displayAddress,
}: {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  displayAddress?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const appKey = process.env.NEXT_PUBLIC_MAP_API_KEY;

  useEffect(() => {
    if (!latitude || !longitude) {
      return;
    }
    const mapLatitude = latitude;
    const mapLongitude = longitude;
    if (!appKey || !containerRef.current) return;
    const kakaoWindow = window as KakaoWindow;

    function renderMap() {
      const maps = kakaoWindow.kakao?.maps;
      const container = containerRef.current;
      if (!maps || !container) {
        setFailed(true);
        return;
      }
      const mapApi = maps;
      const mapContainer = container;
      mapApi.load(() => {
        function drawMap(mapLatitude: number, mapLongitude: number) {
          const position = new mapApi.LatLng(mapLatitude, mapLongitude);
          const map = new mapApi.Map(mapContainer, {
            center: position,
            level: 5,
          });
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
        }

        const services = mapApi.services;
        if (!services) {
          setFailed(true);
          return;
        }
        const expectedDong = displayAddress?.match(/([가-힣0-9]+동)/)?.[1];
        new services.Geocoder().coord2Address(
          mapLongitude,
          mapLatitude,
          (result, status) => {
            const resolved = result[0]?.address;
            const isSongpa = resolved?.region_2depth_name === "송파구";
            const isExpectedDong =
              !expectedDong || resolved?.region_3depth_name === expectedDong;
            if (
              status === services.Status.OK &&
              isSongpa &&
              isExpectedDong
            ) {
              drawMap(mapLatitude, mapLongitude);
              return;
            }
            setFailed(true);
          },
        );
      });
    }

    if (kakaoWindow.kakao?.maps) {
      renderMap();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-cy-kakao-map="true"]',
    );
    if (existing) {
      existing.addEventListener("load", renderMap, { once: true });
      existing.addEventListener("error", () => setFailed(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.dataset.cyKakaoMap = "true";
    script.addEventListener("load", renderMap, { once: true });
    script.addEventListener("error", () => setFailed(true), { once: true });
    document.head.appendChild(script);
  }, [address, appKey, displayAddress, latitude, longitude]);

  if (!latitude || !longitude || !appKey || failed) {
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
      aria-label={`${displayAddress ?? "매물"} 인근 400m 지도`}
      className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[#e5e5db]"
    />
  );
}
