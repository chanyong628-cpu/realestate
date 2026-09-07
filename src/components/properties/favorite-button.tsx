"use client";

import { Check, Heart, LoaderCircle, UserRound, Users, X } from "lucide-react";
import { track } from "@vercel/analytics";
import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "cy-favorite-properties";
let adminSessionStatus: "unknown" | "yes" | "no" = "unknown";

interface Destination {
  type: "admin" | "customer";
  id: string;
  label: string;
  selected: boolean;
}

export function getFavoriteIds() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) ?? "[]";
}

function subscribe(callback: () => void) {
  window.addEventListener("cy-favorites-updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("cy-favorites-updated", callback);
    window.removeEventListener("storage", callback);
  };
}

export function useFavoriteIds() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  try {
    return JSON.parse(snapshot) as string[];
  } catch {
    return [];
  }
}

export function FavoriteButton({
  propertyId,
  compact = false,
}: {
  propertyId: string;
  compact?: boolean;
}) {
  const ids = useFavoriteIds();
  const [destinations, setDestinations] = useState<Destination[] | null>(null);
  const [adminSaved, setAdminSaved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const personalSaved = ids.includes(propertyId);
  const saved = adminSaved ?? personalSaved;

  function togglePersonal() {
    const selected = !personalSaved;
    const next = personalSaved
      ? ids.filter((id) => id !== propertyId)
      : [...ids, propertyId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("cy-favorites-updated"));
    track(selected ? "favorite_added" : "favorite_removed", { propertyId });
  }

  async function openOrToggle() {
    if (adminSessionStatus === "no") {
      togglePersonal();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/favorite-destinations?propertyId=${propertyId}`,
      );
      if (response.status === 401) {
        adminSessionStatus = "no";
        togglePersonal();
        return;
      }
      if (!response.ok) throw new Error("목록을 불러오지 못했습니다.");
      const result = (await response.json()) as {
        destinations: Destination[];
      };
      adminSessionStatus = "yes";
      setDestinations(result.destinations);
      setAdminSaved(result.destinations.some((item) => item.selected));
    } finally {
      setLoading(false);
    }
  }

  async function toggleDestination(destination: Destination) {
    setSavingId(destination.id);
    const selected = !destination.selected;
    const response = await fetch("/api/admin/favorite-destinations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: destination.type,
        propertyId,
        blockId: destination.type === "customer" ? destination.id : undefined,
        selected,
      }),
    });
    if (response.ok) {
      track(selected ? "favorite_added" : "favorite_removed", {
        propertyId,
        destination: destination.type,
      });
      setDestinations((current) => {
        const next =
          current?.map((item) =>
            item.id === destination.id ? { ...item, selected } : item,
          ) ?? [];
        setAdminSaved(next.some((item) => item.selected));
        return next;
      });
    }
    setSavingId(null);
  }

  const customers = destinations?.filter((item) => item.type === "customer") ?? [];
  const myFavorite = destinations?.find((item) => item.type === "admin");

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={saved ? "즐겨찾기 관리" : "즐겨찾기 추가"}
        onClick={openOrToggle}
        disabled={loading}
        className={`flex items-center justify-center gap-2 rounded-full border font-bold transition ${
          compact ? "size-11" : "h-11 px-4"
        } ${
          saved
            ? "border-brand-accent bg-brand-accent text-white"
            : "border-brand-line bg-brand-surface text-brand-slate hover:border-brand-accent"
        }`}
      >
        {loading ? (
          <LoaderCircle size={18} className="animate-spin" />
        ) : (
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        )}
        {!compact && (saved ? "저장됨" : "즐겨찾기")}
      </button>

      {destinations && (
        <span className="absolute top-full right-0 z-[100] mt-2 block w-72 overflow-hidden rounded-2xl border border-brand-line bg-brand-surface text-left text-brand-ink shadow-2xl">
          <span className="flex items-center justify-between border-b border-brand-line px-4 py-3">
            <b>즐겨찾기 저장 위치</b>
            <button
              type="button"
              aria-label="닫기"
              onClick={() => setDestinations(null)}
              className="grid size-8 place-items-center rounded-full hover:bg-brand-soft"
            >
              <X size={17} />
            </button>
          </span>
          {myFavorite && (
            <button
              type="button"
              onClick={() => toggleDestination(myFavorite)}
              className="flex w-full items-center gap-3 px-4 py-3 hover:bg-brand-soft"
            >
              <UserRound size={18} className="text-brand-accent" />
              <span className="flex-1 font-bold">나의 즐겨찾기</span>
              {savingId === myFavorite.id ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : myFavorite.selected ? (
                <Check size={18} className="text-brand-accent" />
              ) : null}
            </button>
          )}
          <span className="block border-t border-brand-soft px-4 pt-3 pb-1 text-xs font-bold text-brand-muted">
            손님 매물블록
          </span>
          <span className="block max-h-64 overflow-y-auto pb-2">
            {customers.length ? (
              customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => toggleDestination(customer)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-brand-soft"
                >
                  <Users size={17} className="text-brand-muted" />
                  <span className="flex-1 truncate font-semibold">
                    {customer.label}
                  </span>
                  {savingId === customer.id ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : customer.selected ? (
                    <Check size={18} className="text-brand-accent" />
                  ) : null}
                </button>
              ))
            ) : (
              <span className="block px-4 py-3 text-sm text-brand-muted">
                먼저 관리자에서 고객 블록을 만들어 주세요.
              </span>
            )}
          </span>
        </span>
      )}
    </span>
  );
}
