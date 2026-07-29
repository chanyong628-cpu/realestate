import Link from "next/link";
import { BulkPropertyImporter } from "@/features/admin/properties/bulk-property-importer";

export const metadata = { title: "EXCEL 매물 등록" };

export default function BulkPropertyImportPage() {
  return (
    <section className="pb-20">
      <Link
        href="/admin/properties"
        className="text-sm font-bold text-forest-600 hover:underline"
      >
        ← 매물 목록
      </Link>
      <h1 className="mt-3 text-3xl font-black">EXCEL 등록</h1>
      <p className="mt-2 text-stone-600">
        엑셀에서 사진폴더명과 광고문 두 컬럼을 복사해 여러 매물을 한 번에
        등록합니다.
      </p>
      <BulkPropertyImporter />
    </section>
  );
}
