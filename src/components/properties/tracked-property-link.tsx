"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { trackConversion } from "@/components/analytics/google-analytics";
import type { PropertyCategory } from "@/types/database";

export function TrackedPropertyLink({
  propertyNumber,
  propertyCategory,
  propertyTitle,
}: {
  propertyNumber: string;
  propertyCategory: PropertyCategory;
  propertyTitle: string;
}) {
  const pathname = usePathname();

  return (
    <Link
      href={`/properties/${propertyNumber}`}
      className="absolute inset-0 z-10"
      onClick={() =>
        trackConversion("property_card_click", {
          property_number: propertyNumber,
          property_category: propertyCategory,
          source_path: pathname,
        })
      }
    >
      <span className="sr-only">
        {propertyNumber} {propertyTitle} 상세보기
      </span>
    </Link>
  );
}
