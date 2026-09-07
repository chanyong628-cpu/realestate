import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/types/database";
import { MarkdownContent } from "./markdown-content";

export function EtcArticleDetail({ article }: { article: Property }) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:px-6 lg:py-16">
      <Link
        href="/etc"
        className="text-sm font-bold text-brand-accent hover:underline"
      >
        ← 부동산 정보 목록
      </Link>
      <header className="mt-6 border-b border-brand-line pb-8">
        <p className="text-sm font-bold text-brand-accent">
          {article.property_number.replace(/^CY-/, "")}
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-black tracking-[-0.035em] text-brand-ink sm:text-4xl">
          {article.title}
        </h1>
        <time className="mt-4 block text-sm text-brand-muted">
          {new Intl.DateTimeFormat("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date(article.created_at))}
        </time>
      </header>

      {article.image_urls[0] && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl bg-brand-soft">
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
          <p className="text-brand-muted">본문이 없습니다.</p>
        )}
      </article>

      <div className="border-t border-brand-line pt-6 text-right">
        <Link
          href="/etc"
          className="inline-flex h-11 items-center rounded-lg border border-brand-line px-5 text-sm font-bold text-brand-ink"
        >
          목록으로
        </Link>
      </div>
    </main>
  );
}
