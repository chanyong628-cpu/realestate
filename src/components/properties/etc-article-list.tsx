import Link from "next/link";
import type { Property } from "@/types/database";

export function EtcArticleList({ properties }: { properties: Property[] }) {
  const articles = [...properties].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <section className="mx-auto min-h-[65vh] max-w-5xl px-5 py-12 sm:px-6 lg:py-16">
      <div className="border-b-2 border-brand-dark pb-6">
        <p className="text-sm font-bold text-brand-accent">C.Y REAL ESTATE</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.03em] text-brand-ink md:text-4xl">
          부동산 정보
        </h1>
      </div>

      <div className="grid grid-cols-[80px_1fr_110px] border-b border-brand-line bg-brand-soft px-4 py-3 text-center text-sm font-bold text-brand-slate sm:grid-cols-[120px_1fr_140px]">
        <span>번호</span>
        <span>제목</span>
        <span>날짜</span>
      </div>

      {articles.length ? (
        <div>
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/properties/${article.property_number}`}
              className="grid min-h-16 grid-cols-[80px_1fr_110px] items-center border-b border-brand-line px-4 text-sm transition hover:bg-brand-soft/50 sm:grid-cols-[120px_1fr_140px]"
            >
              <span className="text-center font-medium text-brand-muted">
                {article.property_number.replace(/^CY-/, "")}
              </span>
              <span className="truncate px-3 font-bold text-brand-ink">
                {article.title}
              </span>
              <time className="text-center text-brand-muted">
                {new Intl.DateTimeFormat("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(new Date(article.created_at))}
              </time>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border-b border-brand-line px-5 py-16 text-center text-brand-muted">
          등록된 부동산 정보가 없습니다.
        </div>
      )}
    </section>
  );
}
