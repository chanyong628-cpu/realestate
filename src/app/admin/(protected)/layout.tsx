import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/features/admin/auth/actions";
import { getAdminSession } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const links = [
    ["/admin", "대시보드"],
    ["/admin/properties", "매물 관리"],
    ["/admin/properties/bulk", "EXCEL 등록"],
    ["/admin/content/new", "광고 등록"],
    ["/admin/properties/new", "매물광고 등록"],
    ["/admin/articles/new", "게시판 글 등록"],
    ["/admin/customer-blocks", "고객 블록"],
    ["/admin/inquiries", "맞춤 문의"],
    ["/admin/settings", "설정"],
  ];

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/admin" className="text-lg font-black">
            CY 부동산 관리자
          </Link>
          <form action={logoutAction}>
            <button className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-bold hover:bg-stone-50">
              로그아웃
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:grid-cols-[210px_1fr]">
        <nav className="h-fit rounded-2xl bg-white p-3 shadow-sm">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-forest-50 hover:text-forest-700"
            >
              {label}
            </Link>
          ))}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}
