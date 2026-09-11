import "server-only";

import { revalidatePath } from "next/cache";
import { createPropertyApiHandlers } from "./handlers";
import { supabasePropertyRepository } from "./repository";
import type { Property } from "../../types/database";

function revalidateProperty(property: Property) {
  [
    "/",
    "/office",
    "/store",
    "/etc",
    `/properties/${property.property_number}`,
    "/admin/properties",
    "/sitemap.xml",
    "/rss.xml",
  ].forEach((path) => revalidatePath(path));
}

export const propertyApiHandlers = createPropertyApiHandlers({
  repository: supabasePropertyRepository,
  getSecret: () => process.env.CY_PROPERTY_API_SECRET,
  getSupabaseUrl: () => process.env.NEXT_PUBLIC_SUPABASE_URL,
  revalidate: revalidateProperty,
});
