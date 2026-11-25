"use client";

import { FileText, LoaderCircle, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MAX_PROPERTY_DOCUMENT_SIZE,
  documentExtension,
} from "@/lib/properties/document";

type Props = {
  initialUrl: string | null;
  initialName: string | null;
};

// 매물 상세 안내 문서(PDF/PPT) 올리기. 파일은 서버를 거치지 않고 저장소로 바로 올라간다.
export function DocumentUploader({ initialUrl, initialName }: Props) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [name, setName] = useState(initialName ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    const extension = documentExtension(file.name);
    if (!["pdf", "ppt", "pptx"].includes(extension)) {
      setError("PDF 또는 PPT(PPTX) 파일만 올릴 수 있습니다.");
      return;
    }
    if (file.size > MAX_PROPERTY_DOCUMENT_SIZE) {
      setError("파일 용량은 50MB 이하여야 합니다.");
      return;
    }

    setUploading(true);
    try {
      const ticketResponse = await fetch("/api/admin/property-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, size: file.size }),
      });
      const ticket = await ticketResponse.json();
      if (!ticketResponse.ok) {
        throw new Error(ticket.error ?? "문서 업로드를 준비하지 못했습니다.");
      }

      const { error: uploadError } = await createClient()
        .storage.from(ticket.bucket)
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: ticket.contentType,
        });
      if (uploadError) throw uploadError;

      setUrl(ticket.url);
      setName(file.name);
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "문서를 올리지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-brand-line bg-brand-soft/40 p-4">
      <input type="hidden" name="document_url" value={url} />
      <input type="hidden" name="document_name" value={name} />
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {url ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-2 text-sm font-bold text-brand-accent"
          >
            <FileText size={18} className="shrink-0" />
            <span className="truncate">{name || "등록된 문서"}</span>
          </a>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-brand-line bg-white px-3 py-2 text-sm font-bold disabled:opacity-60"
            >
              다른 파일로 교체
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => {
                setUrl("");
                setName("");
              }}
              className="flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-600 disabled:opacity-60"
            >
              <Trash2 size={15} /> 문서 삭제
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {uploading ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          {uploading ? "올리는 중..." : "PDF / PPT 올리기"}
        </button>
      )}

      {uploading && url ? (
        <p className="mt-2 text-xs font-semibold text-brand-muted">올리는 중...</p>
      ) : null}
      {error ? (
        <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>
      ) : null}
      <p className="mt-2 text-xs leading-5 text-brand-muted">
        문서를 올리면 상세페이지에서 매물 설명과 요약 카드 대신 이 문서가 보입니다. 저장 버튼을 눌러야
        적용됩니다. (50MB 이하, PDF·PPT·PPTX)
      </p>
    </div>
  );
}
