"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  ImageIcon,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  LoaderCircle,
  Quote,
  Table2,
} from "lucide-react";
import { useRef, useState } from "react";

const MAX_WIDTH = 1600;
const TARGET_SIZE = 300 * 1024;

const articleTemplates = {
  notice: `## 안내사항

안녕하세요. C.Y 부동산입니다.

**핵심 내용**

- 내용을 입력하세요.
- 내용을 입력하세요.

문의가 필요하시면 언제든 연락 주세요.
`,
  checklist: `## 체크리스트

| 항목 | 확인 내용 |
| --- | --- |
| 위치 | 내용을 입력하세요 |
| 비용 | 내용을 입력하세요 |
| 면적 | 내용을 입력하세요 |
| 주차 | 내용을 입력하세요 |

> 위 내용은 현장 상황에 따라 달라질 수 있습니다.
`,
  market: `## 상권/입지 메모

### 위치 특징

- 내용을 입력하세요.

### 추천 업종

- 내용을 입력하세요.

### 참고 링크

[링크 이름](https://주소를-입력하세요)
`,
} as const;

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

export function RichContentEditor({
  initialValue,
  articleMode,
}: {
  initialValue: string;
  articleMode: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  function insert(before: string, placeholder: string, after = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    setValue(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + before.length + selected.length + after.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function insertBlock(block: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const prefix = start > 0 && !value.slice(0, start).endsWith("\n") ? "\n\n" : "";
    const suffix = value.slice(start).startsWith("\n") ? "" : "\n";
    const next = `${value.slice(0, start)}${prefix}${block}${suffix}${value.slice(start)}`;
    setValue(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + prefix.length + block.length + suffix.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function insertTable() {
    const table =
      "\n| 항목 | 내용 | 비고 |\n| --- | --- | --- |\n| 항목 1 | 내용을 입력하세요 |  |\n| 항목 2 | 내용을 입력하세요 |  |\n";
    insertBlock(table);
  }

  async function uploadInlineImage(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || uploading) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("사진 파일만 업로드할 수 있습니다.");
      return;
    }

    setUploading(true);
    setUploadError("");
    try {
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
      insertBlock(`![${file.name.replace(/\.[^.]+$/, "")}](${result.url})`);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "사진 저장에 실패했습니다.",
      );
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  function align(prefix: "::center:: " | "::right:: ") {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const next = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`;
    setValue(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  }

  return (
    <div>
      {articleMode && (
        <>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => uploadInlineImage(event.target.files)}
          />
          <div className="mb-2 flex flex-wrap gap-2 rounded-xl border border-stone-200 bg-stone-50 p-2">
            <button
              type="button"
              onClick={() => insert("## ", "소제목")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold"
            >
              <Heading2 size={15} /> 제목
            </button>
            <button
              type="button"
              onClick={() => insert("### ", "작은 제목")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold"
            >
              <Heading3 size={15} /> 소제목
            </button>
            <button
              type="button"
              onClick={() => insert("**", "굵은 글씨", "**")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold"
            >
              <Bold size={15} /> 굵게
            </button>
            <button
              type="button"
              onClick={() => insert("*", "기울임 글씨", "*")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold"
            >
              <Italic size={15} /> 기울임
            </button>
            <button
              type="button"
              onClick={() => insert("> ", "인용 문구")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold"
            >
              <Quote size={15} /> 인용
            </button>
            <button
              type="button"
              onClick={() => insert("- ", "목록 내용")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold"
            >
              <List size={15} /> 목록
            </button>
            <button
              type="button"
              onClick={() => insert("1. ", "목록 내용")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold"
            >
              <ListOrdered size={15} /> 번호
            </button>
            <button
              type="button"
              onClick={() => insert("[", "링크 이름", "](https://주소를-입력하세요)")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold"
            >
              <Link2 size={15} /> 링크
            </button>
            <button
              type="button"
              onClick={() => insert("![", "사진 설명", "](https://이미지-주소)")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold"
            >
              <ImageIcon size={15} /> 사진 URL
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => imageInputRef.current?.click()}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-brand-line bg-white px-3 text-xs font-bold text-brand-accent disabled:opacity-60"
            >
              {uploading ? (
                <LoaderCircle className="animate-spin" size={15} />
              ) : (
                <ImagePlus size={15} />
              )}
              사진 업로드
            </button>
            <button
              type="button"
              onClick={insertTable}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold"
            >
              <Table2 size={15} /> 표
            </button>
            <button
              type="button"
              onClick={() => insert("", "왼쪽 정렬")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold"
            >
              <AlignLeft size={15} /> 왼쪽
            </button>
            <button
              type="button"
              onClick={() => align("::center:: ")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold"
            >
              <AlignCenter size={15} /> 가운데
            </button>
            <button
              type="button"
              onClick={() => align("::right:: ")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold"
            >
              <AlignRight size={15} /> 오른쪽
            </button>
            <select
              defaultValue=""
              onChange={(event) => {
                const key = event.target.value as keyof typeof articleTemplates;
                if (key) insertBlock(articleTemplates[key]);
                event.target.value = "";
              }}
              className="h-9 rounded-lg border border-stone-300 bg-white px-3 text-xs font-bold"
            >
              <option value="">템플릿 선택</option>
              <option value="notice">안내글 템플릿</option>
              <option value="checklist">체크리스트 템플릿</option>
              <option value="market">상권/입지 템플릿</option>
            </select>
          </div>
          <p className="mb-3 rounded-lg bg-brand-soft px-3 py-2 text-xs leading-5 text-brand-slate">
            네이버 블로그처럼 버튼으로 서식을 넣는 방식입니다. 사진 업로드는
            현재 커서 위치에 본문 이미지로 삽입됩니다. 가운데/오른쪽 정렬은
            문장 맨 앞에 안전한 정렬 표시를 붙여 공개 화면에서 정렬됩니다.
          </p>
          {uploadError && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              {uploadError}
            </p>
          )}
        </>
      )}
      <textarea
        ref={textareaRef}
        name="description"
        rows={articleMode ? 16 : 7}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="w-full rounded-xl border border-stone-300 bg-white p-4 leading-7 outline-none focus:border-forest-600 focus:ring-3 focus:ring-forest-100"
        placeholder={
          articleMode
            ? "부동산 정보 글의 본문을 작성하세요."
            : "매물 상세 설명을 작성하세요."
        }
      />
    </div>
  );
}
