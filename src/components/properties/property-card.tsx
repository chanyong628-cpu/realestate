import Image from "next/image";
import Link from "next/link";
import { Building, MapPin, Ruler } from "lucide-react";
import type { Property } from "@/types/database";
import { formatPyeong, formatWon } from "@/lib/properties/format";
import { FavoriteButton } from "./favorite-button";
import { DeletePropertyButton } from "@/features/admin/properties/delete-button";
import { PublishToggleButton } from "@/features/admin/properties/publish-toggle-button";
import { derivePublicAddress } from "@/lib/properties/address";

export function PropertyCard({
  property,
  isAdmin = false,
}: {
  property: Property;
  isAdmin?: boolean;
}) {
  const image = property.image_urls[0];
  const publicAddress =
    property.public_address || derivePublicAddress(property.title);
  const pyeong = property.exclusive_area
    ? `${formatPyeong(property.exclusive_area)}평`
    : "면적 협의";

  return (
    <article className="group relative rounded-xl border border-[#E5E7EB] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-[0_8px_24px_rgba(15,76,187,0.09)]">
      <Link
        href={`/properties/${property.property_number}`}
        aria-label={`${property.title} 상세보기`}
        className="absolute inset-0 z-10"
      />
      <div className="relative aspect-[75/46] overflow-hidden rounded-t-xl bg-[#F3F4F6]">
        {image ? (
          <Image
            src={image}
            alt={`${property.title} 대표 사진`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-contain"
          />
        ) : (
          <div className="grid h-full place-items-center text-[#9CA3AF]">
            <Building size={42} strokeWidth={1.4} />
          </div>
        )}
        <div className="absolute top-3 left-3 z-20">
          {property.is_recommended && (
            <span className="rounded-md bg-[#155EEF] px-2.5 py-1 text-xs font-bold text-white">
              추천매물
            </span>
          )}
        </div>
      </div>
      <div className="absolute top-3 right-3 z-30">
        <FavoriteButton propertyId={property.id} compact />
      </div>
      <div className="rounded-b-xl p-4">
        <p className="text-base font-black text-[#155EEF]">
          {property.property_number}
        </p>
        <h3 className="mt-1.5 line-clamp-1 text-lg font-bold tracking-[-0.02em] text-[#111827]">
          {property.title}
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-[#6B7280]">
          <MapPin size={15} className="shrink-0 text-[#4B5563]" />
          <span className="truncate">{publicAddress || "주소 협의"}</span>
        </p>
        <p className="mt-3 text-[17px] font-black tracking-[-0.025em] text-[#111111]">
          보증금 {formatWon(property.deposit)}
          <span className="mx-1.5 font-normal text-[#D1D5DB]">/</span>
          월 {formatWon(property.monthly_rent)}
        </p>
        <div className="mt-2 text-sm text-[#6B7280]">
          <p className="flex items-center gap-1.5">
            <Ruler size={15} className="shrink-0 text-[#4B5563]" />
            실평수 {pyeong}
          </p>
        </div>
        {isAdmin && (
          <div className="relative z-30 mt-4 flex gap-2 border-t border-blue-100 pt-3">
            <Link
              href={`/admin/properties/${property.id}/edit`}
              className="rounded-lg bg-[#155EEF] px-3 py-2 text-xs font-bold text-white"
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
