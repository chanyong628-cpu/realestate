import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Property, PropertyCategory } from "@/types/database";

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

export async function getPublishedProperties(category?: PropertyCategory) {
  const client = await createClient();
  let query = client
    .from("properties")
    .select(publicColumns)
    .eq("is_published", true)
    .order("is_recommended", { ascending: false })
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  const { data, error } = await query;

  if (error) {
    console.error("Published properties query failed:", error.message);
    return [];
  }

  return data as unknown as Property[];
}

export async function getPublishedProperty(propertyNumber: string) {
  const client = await createClient();
  const { data, error } = await client
    .from("properties")
    .select(publicColumns)
    .eq("property_number", propertyNumber)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("Published property query failed:", error.message);
    return null;
  }

  return data as unknown as Property | null;
}
