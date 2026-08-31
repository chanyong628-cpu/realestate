"use client";

import { useEffect } from "react";
import { trackConversion } from "./google-analytics";

export function PropertyViewTracker({ propertyNumber }: { propertyNumber: string }) {
  useEffect(() => {
    trackConversion("property_view", { property_number: propertyNumber });
  }, [propertyNumber]);

  return null;
}
