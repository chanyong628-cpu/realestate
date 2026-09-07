import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";

function plainText(children: ReactNode) {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    return children.every((child) => typeof child === "string")
      ? children.join("")
      : null;
  }
  return null;
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-5 text-[16px] leading-8 text-brand-slate">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-10 text-3xl font-black text-brand-ink">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-9 text-2xl font-black text-brand-ink">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-8 text-xl font-bold text-brand-ink">
              {children}
            </h3>
          ),
          p: ({ children }) => {
            const text = plainText(children);
            if (text?.startsWith("::center::")) {
              return (
                <p className="whitespace-pre-wrap text-center">
                  {text.replace(/^::center::\s*/, "")}
                </p>
              );
            }
            if (text?.startsWith("::right::")) {
              return (
                <p className="whitespace-pre-wrap text-right">
                  {text.replace(/^::right::\s*/, "")}
                </p>
              );
            }
            return <p className="whitespace-pre-wrap">{children}</p>;
          },
          strong: ({ children }) => (
            <strong className="font-black text-brand-ink">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => (
            <del className="text-brand-muted line-through">{children}</del>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-brand-accent underline underline-offset-4"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt ?? ""}
              loading="lazy"
              className="my-7 h-auto max-w-full rounded-xl border border-brand-line"
            />
          ),
          table: ({ children }) => (
            <div className="my-7 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-brand-line bg-brand-soft px-4 py-3 text-left font-bold text-brand-ink">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-brand-line px-4 py-3">{children}</td>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-2 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-2 pl-6">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-brand-accent bg-brand-soft px-5 py-3 text-brand-slate">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
