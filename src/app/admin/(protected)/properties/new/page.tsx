import Link from "next/link";
import { PropertyForm } from "@/features/admin/properties/property-form";

export const metadata = { title: "매물 등록" };

export default function NewPropertyPage() {
  return (
    <section className="pb-20">
      <Link
        href="/admin/properties"
        className="text-sm font-bold text-forest-600 hover:underline"
      >
        ← 매물 목록
      </Link>
      <h1 className="mt-3 text-3xl font-black">매물 등록</h1>
      <p className="mt-2 text-stone-600">
        저장하면 매물번호가 자동으로 생성됩니다.
      </p>
      <PropertyForm propertyOnly />
    </section>
  );
}
