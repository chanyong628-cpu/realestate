"use client";

import { MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeSongpaAddress } from "@/lib/properties/address";

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
              result: Array<{ x: string; y: string }>,
              status: string,
            ) => void,
            options?: { analyze_type: string },
          ) => void;
        };
      };
    };
  };
};

function loadKakaoMap(appKey: string) {
  return new Promise<NonNullable<KakaoWindow["kakao"]>["maps"]>(
    (resolve, reject) => {
      const kakaoWindow = window as KakaoWindow;

      function finish() {
        const maps = kakaoWindow.kakao?.maps;
        if (!maps) {
          reject(new Error("Kakao maps unavailable"));
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

export function AddressLocationFields({
  address,
  latitude,
  longitude,
}: {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const addressRef = useRef<HTMLInputElement>(null);
  const latitudeRef = useRef<HTMLInputElement>(null);
  const longitudeRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState(
    latitude && longitude
      ? "저장된 위치 좌표가 있습니다."
      : "주소를 입력하면 위치를 자동으로 찾습니다.",
  );
  const appKey = process.env.NEXT_PUBLIC_MAP_API_KEY;

  const geocode = useCallback(async () => {
    const normalizedAddress = normalizeSongpaAddress(
      addressRef.current?.value ?? "",
    );
    if (!normalizedAddress) {
      setStatus("동과 번지를 입력해 주세요.");
      return;
    }
    if (!appKey) {
      setStatus("지도 API 설정을 확인해 주세요.");
      return;
    }

    setStatus("위치를 찾는 중...");
    if (latitudeRef.current) latitudeRef.current.value = "";
    if (longitudeRef.current) longitudeRef.current.value = "";
    try {
      const maps = await loadKakaoMap(appKey);
      const services = maps.services;
      if (!services) throw new Error("services unavailable");

      const applyResult = (result: Array<{ x: string; y: string }>) => {
        if (!result[0] || !latitudeRef.current || !longitudeRef.current) {
          return false;
        }
        latitudeRef.current.value = result[0].y;
        longitudeRef.current.value = result[0].x;
        setStatus(`위치 확인 완료 · ${normalizedAddress}`);
        return true;
      };

      new services.Geocoder().addressSearch(
        normalizedAddress,
        (result, resultStatus) => {
          if (
            resultStatus === services.Status.OK &&
            applyResult(result)
          ) {
            return;
          }
          setStatus("정확한 주소를 찾지 못했습니다. 동과 번지를 확인해 주세요.");
        },
        { analyze_type: services.AnalyzeType.EXACT },
      );
    } catch {
      setStatus("지도 연결에 실패했습니다. 잠시 후 다시 눌러 주세요.");
    }
  }, [appKey]);

  useEffect(() => {
    const listener = () => void geocode();
    window.addEventListener("cy:geocode-address", listener);
    return () => window.removeEventListener("cy:geocode-address", listener);
  }, [geocode]);

  return (
    <>
      <label className="block">
        <span className="mb-2 block text-sm font-bold">정확한 주소</span>
        <div className="flex overflow-hidden rounded-xl border border-stone-300 bg-white focus-within:border-[#155EEF] focus-within:ring-3 focus-within:ring-blue-100">
          <span className="flex items-center bg-stone-100 px-3 text-sm font-bold text-stone-600">
            서울특별시 송파구
          </span>
          <input
            ref={addressRef}
            name="private_address"
            defaultValue={address ?? ""}
            onBlur={() => void geocode()}
            placeholder="가락동 160-8, 2층"
            className="h-12 min-w-0 flex-1 px-3 outline-none"
          />
        </div>
      </label>
      <div className="self-end rounded-xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
        공개 화면에는 `송파구 가락동`까지만 표시하고, 지도에는 정확한 주소
        주변 400m만 표시합니다.
      </div>
      <input
        ref={latitudeRef}
        type="hidden"
        name="latitude"
        defaultValue={latitude ?? ""}
      />
      <input
        ref={longitudeRef}
        type="hidden"
        name="longitude"
        defaultValue={longitude ?? ""}
      />
      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="button"
          onClick={() => void geocode()}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-bold text-[#155EEF]"
        >
          <MapPin size={17} />
          주소로 위치 다시 찾기
        </button>
        <p className="text-sm text-stone-500">{status}</p>
      </div>
    </>
  );
}
