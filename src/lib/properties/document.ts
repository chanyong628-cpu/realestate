// 매물 상세 안내 문서(PDF/PPT) 공통 규칙. 서버/브라우저 어디서나 쓸 수 있도록 순수 함수만 둔다.

export const PROPERTY_DOCUMENT_BUCKET = "property-documents";
export const MAX_PROPERTY_DOCUMENT_SIZE = 50 * 1024 * 1024;

export const PROPERTY_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export type PropertyDocumentKind = "pdf" | "powerpoint";

const EXTENSION_KIND: Record<string, PropertyDocumentKind> = {
  pdf: "pdf",
  ppt: "powerpoint",
  pptx: "powerpoint",
};

export function documentExtension(nameOrUrl: string) {
  const clean = nameOrUrl.split(/[?#]/)[0] ?? "";
  const match = /\.([a-z0-9]+)$/i.exec(clean);
  return match ? match[1].toLowerCase() : "";
}

export function getDocumentKind(nameOrUrl: string | null | undefined) {
  if (!nameOrUrl) return null;
  return EXTENSION_KIND[documentExtension(nameOrUrl)] ?? null;
}

// 저장소에 올릴 때 쓰는 MIME 형식. 브라우저가 비워 보내는 경우가 있어 확장자로 정한다.
export function documentContentType(extension: string) {
  if (extension === "pdf") return "application/pdf";
  if (extension === "ppt") return "application/vnd.ms-powerpoint";
  if (extension === "pptx") {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  return null;
}

// 화면에 끼워 넣을 주소. PDF는 브라우저 뷰어, PPT는 마이크로소프트 온라인 뷰어를 쓴다.
export function buildDocumentViewerUrl(url: string, kind: PropertyDocumentKind) {
  if (kind === "pdf") return `${url}#view=FitH`;
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
}
