"use client";

import { Heart } from "lucide-react";
import type { Property } from "@/types/database";
import { useFavoriteIds } from "./favorite-button";
import { PropertyCard } from "./property-card";

export function FavoritesBrowser({ properties }: { properties: Property[] }) {
  const ids = useFavoriteIds();
  const favorites = properties.filter((property) => ids.includes(property.id));

  return (
    <main className="mx-auto min-h-[65vh] max-w-7xl px-5 py-14">
      <Heart className="text-brand-accent" />
      <h1 className="mt-3 text-4xl font-black">즐겨찾기</h1>
      <p className="mt-2 text-brand-muted">
        관심 있는 매물을 이 브라우저에 저장했습니다.
      </p>
      {favorites.length ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-brand-line bg-brand-surface p-16 text-center">
          저장한 매물이 없습니다.
        </div>
      )}
    </main>
  );
}
