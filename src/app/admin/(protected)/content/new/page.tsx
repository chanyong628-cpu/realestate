import Link from "next/link";
import { Building2, Newspaper } from "lucide-react";

export const metadata = { title: "광고 등록" };

export default function ContentTypePage() {
  return (
    <section>
      <p className="font-bold text-brand-accent">NEW CONTENT</p>
      <h1 className="mt-1 text-3xl font-black">무엇을 등록할까요?</h1>
      <p className="mt-2 text-stone-600">
        유형에 맞는 전용 입력 화면이 열립니다.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Link
          href="/admin/properties/new"
          className="rounded-2xl border-2 border-brand-line bg-white p-7 transition hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-lg"
        >
          <Building2 size={32} className="text-brand-accent" />
          <h2 className="mt-5 text-2xl font-black">매물광고 등록</h2>
          <p className="mt-2 leading-7 text-stone-600">
            사무실·상가의 가격, 면적, 위치, 사진과 건축물 정보를 등록합니다.
          </p>
        </Link>
        <Link
          href="/admin/articles/new"
          className="rounded-2xl border-2 border-stone-200 bg-white p-7 transition hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-lg"
        >
          <Newspaper size={32} className="text-brand-accent" />
          <h2 className="mt-5 text-2xl font-black">게시판 글 등록</h2>
          <p className="mt-2 leading-7 text-stone-600">
            기타 메뉴에 표시할 부동산 정보 글을 사진·링크·표와 함께 작성합니다.
          </p>
        </Link>
      </div>
    </section>
  );
}
