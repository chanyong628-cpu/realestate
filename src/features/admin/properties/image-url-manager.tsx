"use client";

import Image from "next/image";
import {
  CheckCircle2,
  Download,
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
const DEFAULT_DRIVE_FOLDER_URL =
  process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_URL ??
  "https://drive.google.com/drive/folders/1CY01o2w0MH7KQ-RT8orJCC8PIK4w-YDj";

interface DriveImageFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

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
  const [driveFolderLink, setDriveFolderLink] = useState(
    DEFAULT_DRIVE_FOLDER_URL,
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSource, setUploadSource] = useState<"computer" | "drive">(
    "computer",
  );
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [uploadError, setUploadError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
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

  async function saveImage(file: File) {
    const compressed = await compressImage(file);
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
    return result.url;
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
    setUploadSource("computer");
    setUploadError("");
    setUploadMessage("");
    setProgress({ done: 0, total: files.length });
    const uploadedUrls: string[] = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        uploadedUrls.push(await saveImage(files[index]));
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

  async function importDriveFolder() {
    const folderLink = driveFolderLink.trim();
    if (!folderLink || uploading) {
      if (!folderLink) {
        setUploadError("Google Drive 폴더 링크를 입력해 주세요.");
      }
      return;
    }

    setUploading(true);
    setUploadSource("drive");
    setUploadError("");
    setUploadMessage("");
    setProgress({ done: 0, total: 0 });
    const uploadedUrls: string[] = [];
    const failedNames: string[] = [];

    try {
      const listResponse = await fetch("/api/admin/google-drive-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderLink }),
      });
      const listResult = (await listResponse.json()) as {
        files?: DriveImageFile[];
        error?: string;
      };
      if (!listResponse.ok || !listResult.files?.length) {
        throw new Error(
          listResult.error ?? "Google Drive 폴더에서 사진을 찾지 못했습니다.",
        );
      }

      setProgress({ done: 0, total: listResult.files.length });
      for (let index = 0; index < listResult.files.length; index += 1) {
        const driveFile = listResult.files[index];
        try {
          const imageResponse = await fetch(
            `/api/admin/google-drive-images?fileId=${encodeURIComponent(driveFile.id)}`,
          );
          if (!imageResponse.ok) {
            const result = (await imageResponse.json()) as { error?: string };
            throw new Error(result.error ?? "사진을 내려받지 못했습니다.");
          }
          const blob = await imageResponse.blob();
          const file = new File([blob], driveFile.name, {
            type: driveFile.mimeType,
          });
          uploadedUrls.push(await saveImage(file));
        } catch (error) {
          console.error(`Drive image import failed: ${driveFile.name}`, error);
          failedNames.push(driveFile.name);
        }
        setProgress({ done: index + 1, total: listResult.files.length });
      }

      if (uploadedUrls.length) {
        setUrls((current) => [
          ...current,
          ...uploadedUrls.filter((url) => !current.includes(url)),
        ]);
      }

      if (failedNames.length) {
        setUploadError(
          `${uploadedUrls.length}장은 저장했고 ${failedNames.length}장은 가져오지 못했습니다: ${failedNames.join(", ")}`,
        );
      } else {
        setUploadMessage(
          `${uploadedUrls.length}장을 파일명 순서대로 가져왔습니다.`,
        );
      }
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Google Drive 사진을 가져오지 못했습니다.",
      );
    } finally {
      setUploading(false);
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
      <div className="mb-4 rounded-xl border border-brand-line bg-brand-soft p-4">
        <p className="font-black text-brand-dark">컴퓨터 사진 한 번에 올리기</p>
        <p className="mt-1 text-sm leading-6 text-brand-slate">
          선택한 사진은 자동으로 선명하게 압축되어 홈페이지에 복사
          저장됩니다. 업로드 후 컴퓨터 폴더를 옮겨도 괜찮습니다.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={uploading}
            onClick={() => filesInputRef.current?.click()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 font-bold text-white hover:bg-brand-accent-dark disabled:opacity-60"
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-brand-line bg-white px-4 font-bold text-brand-slate hover:bg-brand-line disabled:opacity-60"
          >
            <FolderOpen size={18} /> 폴더 전체 선택
          </button>
        </div>
        <div className="mt-4 border-t border-brand-line pt-4">
          <p className="font-black text-brand-dark">
            Google Drive 폴더에서 가져오기
          </p>
          <p className="mt-1 text-sm leading-6 text-brand-slate">
            폴더를 연결 계정에 뷰어로 공유한 뒤 폴더 링크를 붙여넣으세요.
            사진은 1, 2, 3, 10처럼 파일명 숫자 순서대로 저장됩니다.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={driveFolderLink}
              disabled={uploading}
              onChange={(event) => setDriveFolderLink(event.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="h-11 min-w-0 flex-1 rounded-lg border border-brand-line bg-white px-4 text-sm outline-none focus:border-brand-accent focus:ring-3 focus:ring-brand-line disabled:opacity-60"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={importDriveFolder}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 font-bold text-white hover:bg-brand-accent-dark disabled:opacity-60"
            >
              {uploading && uploadSource === "drive" ? (
                <LoaderCircle className="animate-spin" size={18} />
              ) : (
                <Download size={18} />
              )}
              Drive 사진 가져오기
            </button>
          </div>
        </div>
        {uploading && (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-brand-line">
              <div
                className={`h-full rounded-full bg-brand-accent transition-all ${
                  progress.total ? "" : "animate-pulse"
                }`}
                style={{
                  width: progress.total
                    ? `${(progress.done / progress.total) * 100}%`
                    : "18%",
                }}
              />
            </div>
            <p className="mt-2 text-sm font-bold text-brand-dark">
              {uploadSource === "drive"
                ? progress.total
                  ? `Drive 사진 압축·저장 중 ${progress.done}/${progress.total}`
                  : "Drive 폴더 확인 중..."
                : `사진 압축·저장 중 ${progress.done}/${progress.total}`}
            </p>
          </div>
        )}
        {uploadError && (
          <p className="mt-3 text-sm font-bold text-red-700">{uploadError}</p>
        )}
        {uploadMessage && (
          <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-forest-700">
            <CheckCircle2 size={16} /> {uploadMessage}
          </p>
        )}
      </div>
      <a
        href={DEFAULT_DRIVE_FOLDER_URL}
        target="_blank"
        rel="noreferrer"
        className="mb-3 inline-flex items-center gap-2 rounded-lg bg-forest-50 px-3 py-2 text-sm font-bold text-forest-700"
      >
        Google Drive 이미지 폴더 열기 <ExternalLink size={15} />
      </a>
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
