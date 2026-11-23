import "server-only";

import { revalidatePublicPropertyPages } from "../properties/revalidate";
import { createPropertyApiHandlers } from "./handlers";
import { supabasePropertyRepository } from "./repository";
import type { Property } from "../../types/database";

function revalidateProperty(property: Property) {
  revalidatePublicPropertyPages(property.property_number);
}

export const propertyApiHandlers = createPropertyApiHandlers({
  repository: supabasePropertyRepository,
  getSecret: () => process.env.CY_PROPERTY_API_SECRET,
  getAdditionalSecret: () => process.env.CY_PROPERTY_CRM_SECRET,
  getSupabaseUrl: () => process.env.NEXT_PUBLIC_SUPABASE_URL,
  revalidate: revalidateProperty,
});
