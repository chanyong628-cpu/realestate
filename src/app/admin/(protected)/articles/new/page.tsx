import Link from "next/link";
import { ArticleForm } from "@/features/admin/articles/article-form";

export const metadata = { title: "게시판 글 등록" };

export default function NewArticlePage() {
  return (
    <section className="pb-20">
      <Link
        href="/admin/content/new"
        className="text-sm font-bold text-[#155EEF] hover:underline"
      >
        ← 등록 유형 선택
      </Link>
      <h1 className="mt-3 text-3xl font-black">게시판 글 등록</h1>
      <p className="mt-2 text-stone-600">
        부동산 정보 게시판에 노출할 글을 작성합니다.
      </p>
      <ArticleForm />
    </section>
  );
}
