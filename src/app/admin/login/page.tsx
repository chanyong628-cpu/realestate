import { redirect } from "next/navigation";
import { LoginForm } from "@/features/admin/auth/login-form";
import { getAdminSession } from "@/lib/auth/session";

export const metadata = { title: "관리자 로그인" };

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");

  return (
    <main className="grid min-h-screen place-items-center bg-forest-900 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl bg-cream p-7 shadow-2xl sm:p-10">
        <p className="text-sm font-black tracking-widest text-forest-600">
          CY REAL ESTATE
        </p>
        <h1 className="mt-3 text-3xl font-black">관리자 로그인</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          매물과 고객 공유 블록을 관리하려면 로그인해 주세요.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
