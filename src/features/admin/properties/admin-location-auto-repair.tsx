"use client";

import { useEffect, useRef } from "react";
import { normalizeSongpaAddress } from "@/lib/properties/address";
import { updatePropertyCoordinatesAction } from "./actions";

interface LocationProperty {
  id: string;
  privateAddress: string;
  publicAddress: string;
  latitude: number | null;
  longitude: number | null;
}

type KakaoWindow = Window & {
  kakao?: {
    maps: {
      load: (callback: () => void) => void;
      services?: {
        Status: { OK: string };
        AnalyzeType: { EXACT: string };
        Geocoder: new () => {
          addressSearch: (
            address: string,
            callback: (
              result: Array<{
                x: string;
                y: string;
                address?: {
                  region_2depth_name: string;
                  region_3depth_name: string;
                };
              }>,
              status: string,
            ) => void,
            options?: { analyze_type: string },
          ) => void;
        };
      };
    };
  };
};

function waitForKakao(appKey: string) {
  return new Promise<NonNullable<KakaoWindow["kakao"]>["maps"]>(
    (resolve, reject) => {
      const kakaoWindow = window as KakaoWindow;
      const finish = () => {
        const maps = kakaoWindow.kakao?.maps;
        if (!maps) {
          reject(new Error("Kakao maps unavailable"));
          return;
        }
        maps.load(() => resolve(maps));
      };

      if (kakaoWindow.kakao?.maps) {
        finish();
        return;
      }
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-cy-kakao-map="true"]',
      );
      if (existing) {
        existing.addEventListener("load", finish, { once: true });
        existing.addEventListener("error", () => reject(new Error("load failed")), {
          once: true,
        });
        return;
      }
      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
      script.async = true;
      script.dataset.cyKakaoMap = "true";
      script.addEventListener("load", finish, { once: true });
      script.addEventListener("error", () => reject(new Error("load failed")), {
        once: true,
      });
      document.head.appendChild(script);
    },
  );
}

function findExactCoordinates(
  maps: NonNullable<KakaoWindow["kakao"]>["maps"],
  property: LocationProperty,
) {
  return new Promise<{ latitude: number; longitude: number } | null>(
    (resolve) => {
      const services = maps.services;
      const address = normalizeSongpaAddress(property.privateAddress);
      const expectedDong = property.publicAddress.match(/([가-힣0-9]+동)/)?.[1];
      if (!services || !address || !expectedDong) {
        resolve(null);
        return;
      }

      new services.Geocoder().addressSearch(
        address,
        (result, status) => {
          const first = result[0];
          const matched =
            status === services.Status.OK &&
            first?.address?.region_2depth_name === "송파구" &&
            first.address.region_3depth_name === expectedDong;
          if (!matched) {
            resolve(null);
            return;
          }
          resolve({
            latitude: Number(first.y),
            longitude: Number(first.x),
          });
        },
        { analyze_type: services.AnalyzeType.EXACT },
      );
    },
  );
}

export function AdminLocationAutoRepair({
  properties,
}: {
  properties: LocationProperty[];
}) {
  const started = useRef(false);
  const appKey = process.env.NEXT_PUBLIC_MAP_API_KEY;

  useEffect(() => {
    if (started.current || !appKey || !properties.length) return;
    started.current = true;

    void (async () => {
      try {
        const maps = await waitForKakao(appKey);
        for (const property of properties) {
          const coordinates = await findExactCoordinates(maps, property);
          if (!coordinates) continue;
          const unchanged =
            property.latitude !== null &&
            property.longitude !== null &&
            Math.abs(property.latitude - coordinates.latitude) < 0.000001 &&
            Math.abs(property.longitude - coordinates.longitude) < 0.000001;
          if (!unchanged) {
            await updatePropertyCoordinatesAction(
              property.id,
              coordinates.latitude,
              coordinates.longitude,
            );
          }
        }
      } catch (error) {
        console.error("Automatic location repair failed:", error);
      }
    })();
  }, [appKey, properties]);

  return null;
}
