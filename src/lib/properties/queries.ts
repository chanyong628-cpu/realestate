import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Property, PropertyCategory } from "@/types/database";
import {
  isStoredAddressHidden,
  resolvePublicAddress,
} from "./address";

const publicColumns = [
  "id",
  "property_number",
  "title",
  "category",
  "deposit",
  "monthly_rent",
  "maintenance_fee",
  "public_address",
  "latitude",
  "longitude",
  "exclusive_area",
  "supply_area",
  "floor",
  "total_floor",
  "parking_available",
  "elevator_available",
  "total_parking_count",
  "available_parking_count",
  "building_use",
  "approval_date",
  "building_direction",
  "room_count",
  "restroom_count",
  "air_conditioner_type",
  "is_violating_building",
  "restroom_type",
  "move_in_date",
  "is_recommended",
  "is_published",
  "image_urls",
  "description",
  "view_count",
  "created_at",
  "updated_at",
].join(",");

const privatePublicColumns = `${publicColumns},private_address`;

function sanitizePublishedProperties(data: unknown[] | null) {
  return (data ?? []).map((row) => {
    const property = row as Property;
    const addressHidden = isStoredAddressHidden(property.public_address);

    return {
      ...property,
      public_address: resolvePublicAddress(
        property.public_address,
        property.private_address,
      ),
      private_address: null,
      address_hidden: addressHidden,
    } satisfies Property;
  });
}

export async function getPublishedProperties(category?: PropertyCategory) {
  const client = createAdminClient();
  let query = client
    .from("properties")
    .select(privatePublicColumns)
    .eq("is_published", true)
    .order("is_recommended", { ascending: false })
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  const { data, error } = await query;

  if (error) {
    console.error("Published properties query failed:", error.message);
    return [];
  }

  return sanitizePublishedProperties(data);
}

export async function getPublishedProperty(propertyNumber: string) {
  const client = createAdminClient();
  const { data, error } = await client
    .from("properties")
    .select(privatePublicColumns)
    .eq("property_number", propertyNumber)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("Published property query failed:", error.message);
    return null;
  }

  return sanitizePublishedProperties(data ? [data] : [])[0] ?? null;
}

export async function getPublishedPropertiesByIds(ids: string[]) {
  if (!ids.length) return [];

  const { data, error } = await createAdminClient()
    .from("properties")
    .select(privatePublicColumns)
    .in("id", ids)
    .eq("is_published", true);

  if (error) {
    console.error("Shared properties query failed:", error.message);
    return [];
  }

  return sanitizePublishedProperties(data);
}
