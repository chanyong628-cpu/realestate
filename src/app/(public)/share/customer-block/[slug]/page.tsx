import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertyCard } from "@/components/properties/property-card";
import { getPublishedPropertiesByIds } from "@/lib/properties/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CustomerBlock,
  CustomerBlockProperty,
  Property,
} from "@/types/database";

interface SharePageProps {
  params: Promise<{ slug: string }>;
}

async function getSharedBlock(slug: string) {
  const client = createAdminClient();
  const { data: blockData } = await client
    .from("customer_blocks")
    .select("*")
    .eq("shared_slug", slug)
    .maybeSingle();
  const block = blockData as CustomerBlock | null;
  if (!block) return null;

  const { data: relationsData } = await client
    .from("customer_block_properties")
    .select("*")
    .eq("customer_block_id", block.id);
  const relations = (relationsData ?? []) as CustomerBlockProperty[];
  const propertyIds = relations.map((relation) => relation.property_id);

  if (!propertyIds.length) return { block, properties: [] as Property[] };

  return {
    block,
    properties: await getPublishedPropertiesByIds(propertyIds),
  };
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getSharedBlock(slug);
  if (!result) return { title: "추천 매물을 찾을 수 없습니다" };
  return {
    title: result.block.shared_title || "고객님을 위한 추천 매물",
    description:
      result.block.shared_description || "CY 부동산 추천 매물 모음",
    robots: { index: false, follow: false },
  };
}

export default async function SharedCustomerBlockPage({
  params,
}: SharePageProps) {
  const { slug } = await params;
  const result = await getSharedBlock(slug);
  if (!result) notFound();

  return (
    <main className="min-h-[70vh]">
      <section className="bg-brand-dark py-16 text-white">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <p className="text-sm font-black tracking-widest text-brand-sand">
            CY REAL ESTATE
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">
            {result.block.shared_title ||
              `${result.block.customer_name} 고객님을 위한 추천 매물`}
          </h1>
          {result.block.shared_description && (
            <p className="mx-auto mt-5 max-w-2xl leading-7 text-white/70">
              {result.block.shared_description}
            </p>
          )}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14">
        {result.properties.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-brand-line bg-brand-surface p-16 text-center">
            현재 공개 중인 추천 매물이 없습니다.
          </div>
        )}
      </section>
    </main>
  );
}
