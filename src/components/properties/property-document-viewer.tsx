import { Download, ExternalLink } from "lucide-react";
import {
  buildDocumentViewerUrl,
  getDocumentKind,
} from "@/lib/properties/document";

type Props = {
  url: string;
  name?: string | null;
  title: string;
};

// 상세 안내 문서(PDF/PPT)를 상세페이지에 보여준다. PDF는 브라우저 뷰어, PPT는 마이크로소프트 온라인 뷰어.
export function PropertyDocumentViewer({ url, name, title }: Props) {
  const kind = getDocumentKind(url) ?? getDocumentKind(name);
  if (!kind) return null;
  const label = kind === "pdf" ? "PDF" : "PPT";

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black">매물 상세 안내</h2>
        <div className="flex gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-brand-line bg-brand-surface px-3 py-2 text-sm font-bold text-brand-ink"
          >
            <ExternalLink size={15} /> 크게 보기
          </a>
          <a
            href={url}
            download={name || undefined}
            className="flex items-center gap-1.5 rounded-lg border border-brand-line bg-brand-surface px-3 py-2 text-sm font-bold text-brand-ink"
          >
            <Download size={15} /> {label} 받기
          </a>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-brand-line bg-brand-surface">
        <iframe
          src={buildDocumentViewerUrl(url, kind)}
          title={`${title} 상세 안내 ${label}`}
          loading="lazy"
          className="block h-[70vh] min-h-[480px] w-full md:h-[860px]"
        />
      </div>
    </section>
  );
}
