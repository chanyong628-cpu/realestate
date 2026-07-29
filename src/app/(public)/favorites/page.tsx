import { FavoritesBrowser } from "@/components/properties/favorites-browser";
import { PropertyBrowser } from "@/components/properties/property-browser";
import { getAdminSession } from "@/lib/auth/session";
import { getPublishedProperties } from "@/lib/properties/queries";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "즐겨찾기" };

export default async function FavoritesPage() {
  const properties = await getPublishedProperties();
  if (!(await getAdminSession())) {
    return <FavoritesBrowser properties={properties} />;
  }

  const { data } = await createAdminClient()
    .from("admin_favorite_properties")
    .select("property_id")
    .order("created_at", { ascending: false });
  const order = new Map(
    (data ?? []).map((item, index) => [item.property_id as string, index]),
  );
  const favorites = properties
    .filter((property) => order.has(property.id))
    .sort(
      (a, b) =>
        (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );

  return <PropertyBrowser properties={favorites} title="나의 즐겨찾기" />;
}
