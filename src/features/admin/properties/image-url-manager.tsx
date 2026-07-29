"use client";

import Image from "next/image";
import {
  ExternalLink,
  FolderOpen,
  GripVertical,
  ImagePlus,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";

const MAX_WIDTH = 1600;
const TARGET_SIZE = 300 * 1024;

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  let width = bitmap.width;
  let height = bitmap.height;

  if (width > MAX_WIDTH) {
    height = Math.round((height * MAX_WIDTH) / width);
    width = MAX_WIDTH;
  }

  let quality = 0.82;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("사진을 변환할 수 없습니다.");
    context.drawImage(bitmap, 0, 0, width, height);
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (blob && blob.size <= TARGET_SIZE) break;
    quality = Math.max(0.58, quality - 0.06);
    width = Math.round(width * 0.9);
    height = Math.round(height * 0.9);
  }

  bitmap.close();
  if (!blob) throw new Error("사진을 압축하지 못했습니다.");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
    type: "image/webp",
  });
}

export function ImageUrlManager({ initialUrls }: { initialUrls: string[] }) {
  const [urls, setUrls] = useState(initialUrls);
  const [draft, setDraft] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [uploadError, setUploadError] = useState("");
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  function addUrls() {
    const additions = draft
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter((url) => url && !urls.includes(url));
    if (!additions.length) return;
    setUrls((current) => [...current, ...additions]);
    setDraft("");
  }

  function move(from: number, to: number) {
    if (from === to) return;
    setUrls((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList?.length || uploading) return;
    const files = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/"))
      .sort((a, b) =>
        a.name.localeCompare(b.name, "ko", { numeric: true }),
      );
    if (!files.length) {
      setUploadError("선택한 항목에 사진 파일이 없습니다.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setProgress({ done: 0, total: files.length });
    const uploadedUrls: string[] = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const compressed = await compressImage(files[index]);
        const body = new FormData();
        body.append("file", compressed);
        const response = await fetch("/api/admin/property-images", {
          method: "POST",
          body,
        });
        const result = (await response.json()) as {
          url?: string;
          error?: string;
        };
        if (!response.ok || !result.url) {
          throw new Error(result.error ?? "사진 저장에 실패했습니다.");
        }
        uploadedUrls.push(result.url);
        setProgress({ done: index + 1, total: files.length });
      }

      setUrls((current) => [
        ...current,
        ...uploadedUrls.filter((url) => !current.includes(url)),
      ]);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "사진 저장에 실패했습니다.",
      );
      if (uploadedUrls.length) {
        setUrls((current) => [...current, ...uploadedUrls]);
      }
    } finally {
      setUploading(false);
      if (filesInputRef.current) filesInputRef.current.value = "";
      if (folderInputRef.current) folderInputRef.current.value = "";
    }
  }

  return (
    <div>
      <input type="hidden" name="image_urls" value={urls.join("\n")} />
      <input
        ref={filesInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => uploadFiles(event.target.files)}
      />
      <input
        ref={folderInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        {...({ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
        onChange={(event) => uploadFiles(event.target.files)}
      />
      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="font-black text-blue-950">컴퓨터 사진 한 번에 올리기</p>
        <p className="mt-1 text-sm leading-6 text-blue-800">
          선택한 사진은 자동으로 선명하게 압축되어 홈페이지에 복사
          저장됩니다. 업로드 후 컴퓨터 폴더를 옮겨도 괜찮습니다.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={uploading}
            onClick={() => filesInputRef.current?.click()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#155EEF] px-4 font-bold text-white hover:bg-[#0F4CBB] disabled:opacity-60"
          >
            {uploading ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <ImagePlus size={18} />
            )}
            사진 여러 장 선택
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => folderInputRef.current?.click()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-300 bg-white px-4 font-bold text-blue-800 hover:bg-blue-100 disabled:opacity-60"
          >
            <FolderOpen size={18} /> 폴더 전체 선택
          </button>
        </div>
        {uploading && (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-[#155EEF] transition-all"
                style={{
                  width: `${(progress.done / progress.total) * 100}%`,
                }}
              />
            </div>
            <p className="mt-2 text-sm font-bold text-blue-900">
              사진 압축·저장 중 {progress.done}/{progress.total}
            </p>
          </div>
        )}
        {uploadError && (
          <p className="mt-3 text-sm font-bold text-red-700">{uploadError}</p>
        )}
      </div>
      {process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_URL && (
        <a
          href={process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_URL}
          target="_blank"
          rel="noreferrer"
          className="mb-3 inline-flex items-center gap-2 rounded-lg bg-forest-50 px-3 py-2 text-sm font-bold text-forest-700"
        >
          Google Drive 이미지 폴더 열기 <ExternalLink size={15} />
        </a>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          placeholder={"이미지 주소를 붙여넣으세요.\n여러 개는 줄을 바꿔 입력할 수 있습니다."}
          className="min-h-24 flex-1 rounded-xl border border-stone-300 bg-white p-4 font-mono text-sm outline-none focus:border-forest-600 focus:ring-3 focus:ring-forest-100"
        />
        <button
          type="button"
          onClick={addUrls}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 px-5 font-bold hover:bg-stone-50"
        >
          <ImagePlus size={18} /> 이미지 추가
        </button>
      </div>

      {urls.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {urls.map((url, index) => (
            <article
              key={`${url}-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, index);
                setDragIndex(null);
              }}
              className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3"
            >
              <GripVertical
                size={19}
                className="shrink-0 cursor-grab text-stone-400"
              />
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-stone-200">
                <Image
                  src={url}
                  alt={`매물 이미지 ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-forest-600">
                  {index === 0 ? "대표 사진" : `${index + 1}번째 사진`}
                </p>
                <p className="mt-1 truncate text-xs text-stone-500">{url}</p>
              </div>
              <button
                type="button"
                aria-label="이미지 삭제"
                onClick={() =>
                  setUrls((current) =>
                    current.filter((_, currentIndex) => currentIndex !== index),
                  )
                }
                className="grid size-9 shrink-0 place-items-center rounded-lg text-red-600 hover:bg-red-50"
              >
                <Trash2 size={17} />
              </button>
            </article>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-stone-500">
        카드를 끌어서 순서를 바꿀 수 있습니다. 첫 번째 사진이 대표
        사진입니다. 아래 URL 입력은 외부 사진 주소가 있을 때만 사용하면
        됩니다.
      </p>
    </div>
  );
}
