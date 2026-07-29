import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerBlockForm } from "@/features/admin/customer-blocks/customer-block-form";
import { ProposalDownloadForm } from "@/features/admin/customer-blocks/proposal-download-form";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CustomerBlock,
  CustomerBlockProperty,
  Property,
} from "@/types/database";

export const metadata = { title: "고객 블록 수정" };

export default async function EditCustomerBlockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = createAdminClient();
  const { data: blockData } = await client
    .from("customer_blocks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const block = blockData as CustomerBlock | null;
  if (!block) notFound();

  const { data: relationData } = await client
    .from("customer_block_properties")
    .select("*")
    .eq("customer_block_id", id)
    .order("created_at", { ascending: false });
  const relations = (relationData ?? []) as CustomerBlockProperty[];
  const propertyIds = relations.map((relation) => relation.property_id);
  const { data: propertyData } = propertyIds.length
    ? await client.from("properties").select("*").in("id", propertyIds)
    : { data: [] };
  const byId = new Map(
    ((propertyData ?? []) as Property[]).map((property) => [
      property.id,
      property,
    ]),
  );
  const properties = propertyIds
    .map((propertyId) => byId.get(propertyId))
    .filter((property): property is Property => Boolean(property));

  return (
    <section className="pb-20">
      <Link
        href="/admin/customer-blocks"
        className="text-sm font-bold text-forest-600 hover:underline"
      >
        ← 고객 블록 목록
      </Link>
      <h1 className="mt-3 text-3xl font-black">고객 블록 수정</h1>
      <CustomerBlockForm block={block} />
      <ProposalDownloadForm blockId={block.id} properties={properties} />
    </section>
  );
}
