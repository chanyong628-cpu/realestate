import "server-only";

import {
  buildStoredPublicAddress,
  isStoredAddressHidden,
  resolvePublicAddress,
} from "../properties/address";
import { createAdminClient } from "../supabase/admin";
import type { Property } from "../../types/database";
import type { CreatePropertyInput, UpdatePropertyInput } from "./schema";
import { isUuidIdentifier } from "./schema";
import { PropertyStoreError, type PropertyRepository } from "./types";

const propertyColumns = [
  "id",
  "property_number",
  "title",
  "category",
  "deposit",
  "monthly_rent",
  "maintenance_fee",
  "public_address",
  "private_address",
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
  "private_memo",
  "view_count",
  "created_at",
  "updated_at",
].join(",");

function toApiProperty(row: unknown) {
  const property = row as Property;
  const addressHidden = isStoredAddressHidden(property.public_address);
  return {
    ...property,
    public_address: resolvePublicAddress(
      property.public_address,
      property.private_address,
    ),
    address_hidden: addressHidden,
  } satisfies Property;
}

function storeError(error: { message: string; code?: string }) {
  return new PropertyStoreError(error.message, error.code);
}

async function findStoredProperty(identifier: string) {
  const client = createAdminClient();
  const query = client.from("properties").select(propertyColumns);
  const { data, error } = isUuidIdentifier(identifier)
    ? await query.eq("id", identifier).maybeSingle()
    : await query.eq("property_number", identifier).maybeSingle();

  if (error) throw storeError(error);
  return (data as Property | null) ?? null;
}

export const supabasePropertyRepository: PropertyRepository = {
  async findByIdentifier(identifier) {
    const property = await findStoredProperty(identifier);
    return property ? toApiProperty(property) : null;
  },

  async search(query, limit) {
    const { data, error } = await createAdminClient()
      .from("properties")
      .select(propertyColumns)
      .or(
        `property_number.ilike.*${query}*,title.ilike.*${query}*,public_address.ilike.*${query}*,private_address.ilike.*${query}*`,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw storeError(error);
    return (data ?? []).map(toApiProperty);
  },

  async existsByPropertyNumber(propertyNumber) {
    const { data, error } = await createAdminClient()
      .from("properties")
      .select("id")
      .eq("property_number", propertyNumber)
      .maybeSingle();
    if (error) throw storeError(error);
    return Boolean(data);
  },

  async create(input: CreatePropertyInput) {
    const values = {
      ...input,
      is_published: false,
      is_recommended: input.is_recommended ?? false,
      parking_available: input.parking_available ?? false,
      elevator_available: input.elevator_available ?? false,
      is_violating_building: input.is_violating_building ?? false,
      image_urls: input.image_urls ?? [],
      ...(input.private_address !== undefined && input.public_address === undefined
        ? { public_address: input.private_address }
        : {}),
    };
    const { data, error } = await createAdminClient()
      .from("properties")
      .insert(values)
      .select(propertyColumns)
      .single();

    if (error) throw storeError(error);
    return toApiProperty(data);
  },

  async update(identifier: string, input: UpdatePropertyInput) {
    const existing = await findStoredProperty(identifier);
    if (!existing) return null;

    const values: UpdatePropertyInput & { public_address?: string | null } = {
      ...input,
    };
    if (
      input.private_address !== undefined &&
      input.public_address === undefined &&
      isStoredAddressHidden(existing.public_address)
    ) {
      values.public_address = buildStoredPublicAddress(
        input.private_address ?? "",
        true,
      );
    }

    const { data, error } = await createAdminClient()
      .from("properties")
      .update(values)
      .eq("id", existing.id)
      .select(propertyColumns)
      .single();

    if (error) throw storeError(error);
    return toApiProperty(data);
  },

  async setPublished(identifier: string, isPublished: boolean) {
    const existing = await findStoredProperty(identifier);
    if (!existing) return null;

    const { data, error } = await createAdminClient()
      .from("properties")
      .update({ is_published: isPublished })
      .eq("id", existing.id)
      .select(propertyColumns)
      .single();

    if (error) throw storeError(error);
    return toApiProperty(data);
  },
};
