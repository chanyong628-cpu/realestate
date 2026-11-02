import Link from "next/link";
import { PropertyForm } from "@/features/admin/properties/property-form";

export const metadata = { title: "매물 등록" };

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const { source } = await searchParams;
  const fromPropertyDatabase = source === "property-db";
  return (
    <section className="pb-20">
      <Link
        href={fromPropertyDatabase ? "/admin/property-db" : "/admin/properties"}
        className="text-sm font-bold text-forest-600 hover:underline"
      >
        ← {fromPropertyDatabase ? "매물 DB" : "매물 목록"}
      </Link>
      <h1 className="mt-3 text-3xl font-black">매물 등록</h1>
      <p className="mt-2 text-stone-600">
        {fromPropertyDatabase
          ? "매물DB에 비노출 상태로 저장됩니다. 필요할 때 ON으로 전환해 홈페이지에 게시하세요."
          : "저장하면 매물번호가 자동으로 생성되고 홈페이지와 매물DB에 함께 등록됩니다."}
      </p>
      <PropertyForm
        propertyOnly
        defaultPublished={!fromPropertyDatabase}
        returnTo={fromPropertyDatabase ? "/admin/property-db" : undefined}
      />
    </section>
  );
}
