import Image from "next/image";
import Link from "next/link";
import { Building, Ruler } from "lucide-react";
import type { Property } from "@/types/database";
import { formatPyeong, formatWon } from "@/lib/properties/format";
import { FavoriteButton } from "./favorite-button";
import { DeletePropertyButton } from "@/features/admin/properties/delete-button";
import { PublishToggleButton } from "@/features/admin/properties/publish-toggle-button";

export function PropertyCard({
  property,
  isAdmin = false,
}: {
  property: Property;
  isAdmin?: boolean;
}) {
  const image = property.image_urls[0];
  const pyeong = property.exclusive_area
    ? `${formatPyeong(property.exclusive_area)}평`
    : "면적 협의";

  return (
    <article className="group relative rounded-xl border border-brand-line bg-brand-card shadow-card transition hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-card-hover">
      <Link
        href={`/properties/${property.property_number}`}
        aria-label={`${property.title} 상세보기`}
        className="absolute inset-0 z-10"
      />
      <div className="relative aspect-[75/46] overflow-hidden rounded-t-xl bg-brand-soft">
        {image ? (
          <Image
            src={image}
            alt={`${property.title} 대표 사진`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-contain"
          />
        ) : (
          <div className="grid h-full place-items-center text-brand-muted">
            <Building size={42} strokeWidth={1.4} />
          </div>
        )}
        <div className="absolute top-3 left-3 z-20">
          {property.is_recommended && (
            <span className="rounded-md bg-brand-accent px-2.5 py-1 text-xs font-bold text-white">
              추천매물
            </span>
          )}
        </div>
      </div>
      <div className="absolute top-3 right-3 z-30">
        <FavoriteButton propertyId={property.id} compact />
      </div>
      <div className="rounded-b-xl p-4">
        <p className="text-base font-black text-brand-accent">
          {property.property_number}
        </p>
        <h3 className="mt-1.5 line-clamp-1 text-lg font-bold tracking-[-0.02em] text-brand-ink">
          {property.title}
        </h3>
        <p className="mt-3 text-[17px] font-black tracking-[-0.025em] text-brand-ink">
          보증금 {formatWon(property.deposit)}
          <span className="mx-1.5 font-normal text-brand-line">/</span>
          월 {formatWon(property.monthly_rent)}
        </p>
        <div className="mt-2 text-sm text-brand-muted">
          <p className="flex items-center gap-1.5">
            <Ruler size={15} className="shrink-0 text-brand-slate" />
            실평수 {pyeong}
          </p>
        </div>
        {isAdmin && (
          <div className="relative z-30 mt-4 flex gap-2 border-t border-brand-line pt-3">
            <Link
              href={`/admin/properties/${property.id}/edit`}
              className="rounded-lg bg-brand-accent px-3 py-2 text-xs font-bold text-white"
            >
              매물수정
            </Link>
            <PublishToggleButton
              id={property.id}
              isPublished={property.is_published}
            />
            <DeletePropertyButton
              id={property.id}
              propertyNumber={property.property_number}
              redirectTo="/"
            />
          </div>
        )}
      </div>
    </article>
  );
}
