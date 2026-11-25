import { AdminChrome } from "@/features/admin/admin-chrome";
import { redirect } from "next/navigation";
import { logoutAction } from "@/features/admin/auth/actions";
import { getAdminSession } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const links: [string, string][] = [
    ["/admin", "대시보드"],
    ["/admin/properties/new", "광고 등록"],
    ["/admin/properties/bulk", "EXCEL 등록"],
    ["/admin/properties", "매물 관리"],
    ["/admin/property-db", "매물 DB"],
    ["/admin/ad-status", "광고현황판"],
    ["/admin/customer-blocks", "고객 블록"],
    ["/admin/inquiries", "맞춤 문의"],
    ["/admin/settings", "설정"],
  ];

  return (
    <AdminChrome
      links={links}
      logout={
        <form action={logoutAction}>
          <button className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-bold hover:bg-stone-50">
            로그아웃
          </button>
        </form>
      }
    >
      {children}
    </AdminChrome>
  );
}
