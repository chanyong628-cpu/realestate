import Link from "next/link";
import { CustomerBlockForm } from "@/features/admin/customer-blocks/customer-block-form";

export const metadata = { title: "고객 블록 생성" };

export default async function NewCustomerBlockPage() {
  return (
    <section className="pb-20">
      <Link
        href="/admin/customer-blocks"
        className="text-sm font-bold text-forest-600 hover:underline"
      >
        ← 고객 블록 목록
      </Link>
      <h1 className="mt-3 text-3xl font-black">고객 블록 생성</h1>
      <CustomerBlockForm />
    </section>
  );
}
