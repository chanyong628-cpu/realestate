import Link from "next/link";
import { Building2, Eye, EyeOff, MessageSquareText, Star, Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "관리자 대시보드" };

export default async function AdminDashboardPage() {
  const client = createAdminClient();
  const [
    { count: totalCount },
    { count: publishedCount },
    { count: hiddenCount },
    { count: recommendedCount },
    { count: customerBlockCount },
    { count: inquiryCount },
  ] = await Promise.all([
    client.from("properties").select("*", { count: "exact", head: true }),
    client
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),
    client
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("is_published", false),
    client
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("is_recommended", true),
    client.from("customer_blocks").select("*", { count: "exact", head: true }),
    client.from("inquiries").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    [Building2, "전체 매물", totalCount ?? 0, "/admin/properties"],
    [Eye, "노출 매물", publishedCount ?? 0, "/admin/properties?status=published"],
    [EyeOff, "비노출 매물", hiddenCount ?? 0, "/admin/properties?status=hidden"],
    [Star, "추천 매물", recommendedCount ?? 0, "/admin/properties?status=recommended"],
    [Users, "고객 블록", customerBlockCount ?? 0, "/admin/customer-blocks"],
    [MessageSquareText, "맞춤 문의", inquiryCount ?? 0, "/admin/inquiries"],
  ] as const;

  return (
    <section>
      <p className="font-bold text-forest-600">ADMIN</p>
      <h1 className="mt-1 text-3xl font-black">대시보드</h1>
      <p className="mt-2 text-stone-600">현재 운영 상태를 확인하세요.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map(([Icon, label, value, href]) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Icon size={21} className="text-forest-600" />
            <p className="mt-5 text-sm font-bold text-stone-500">{label}</p>
            <p className="mt-1 text-3xl font-black">{value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Link
          href="/admin/content/new"
          className="rounded-2xl bg-forest-700 p-7 text-white"
        >
          <p className="text-sm font-bold text-white/60">빠른 작업</p>
          <h2 className="mt-2 text-2xl font-black">새 광고 등록</h2>
          <p className="mt-2 text-sm text-white/70">
            매물광고 또는 게시판 글 유형을 선택해 등록합니다.
          </p>
        </Link>
        <Link
          href="/admin/customer-blocks/new"
          className="rounded-2xl border border-stone-200 bg-white p-7"
        >
          <p className="text-sm font-bold text-forest-600">빠른 작업</p>
          <h2 className="mt-2 text-2xl font-black">추천 매물 공유</h2>
          <p className="mt-2 text-sm text-stone-500">
            고객별 매물 모음을 만들고 링크로 전달합니다.
          </p>
        </Link>
      </div>
    </section>
  );
}
