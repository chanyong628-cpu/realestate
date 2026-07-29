import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/types/database";
import { MarkdownContent } from "./markdown-content";

export function EtcArticleDetail({ article }: { article: Property }) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:px-6 lg:py-16">
      <Link
        href="/etc"
        className="text-sm font-bold text-[#155EEF] hover:underline"
      >
        ← 부동산 정보 목록
      </Link>
      <header className="mt-6 border-b border-[#E5E7EB] pb-8">
        <p className="text-sm font-bold text-[#155EEF]">
          {article.property_number.replace(/^CY-/, "")}
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-black tracking-[-0.035em] text-[#111827] sm:text-4xl">
          {article.title}
        </h1>
        <time className="mt-4 block text-sm text-[#6B7280]">
          {new Intl.DateTimeFormat("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date(article.created_at))}
        </time>
      </header>

      {article.image_urls[0] && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl bg-[#F3F4F6]">
          <Image
            src={article.image_urls[0]}
            alt={`${article.title} 대표 이미지`}
            fill
            priority
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
          />
        </div>
      )}

      <article className="py-9">
        {article.description ? (
          <MarkdownContent content={article.description} />
        ) : (
          <p className="text-[#6B7280]">본문이 없습니다.</p>
        )}
      </article>

      <div className="border-t border-[#E5E7EB] pt-6 text-right">
        <Link
          href="/etc"
          className="inline-flex h-11 items-center rounded-lg border border-[#D1D5DB] px-5 text-sm font-bold text-[#111827]"
        >
          목록으로
        </Link>
      </div>
    </main>
  );
}
