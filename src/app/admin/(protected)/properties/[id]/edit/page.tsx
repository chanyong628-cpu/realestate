import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyForm } from "@/features/admin/properties/property-form";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Property } from "@/types/database";

export const metadata = { title: "매물 수정" };

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await createAdminClient()
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const property = data as Property | null;

  if (!property) notFound();

  return (
    <section className="pb-20">
      <Link
        href="/admin/properties"
        className="text-sm font-bold text-forest-600 hover:underline"
      >
        ← 매물 목록
      </Link>
      <p className="mt-3 font-bold text-forest-600">
        {property.property_number}
      </p>
      <h1 className="mt-1 text-3xl font-black">매물 수정</h1>
      <PropertyForm property={property} />
    </section>
  );
}
