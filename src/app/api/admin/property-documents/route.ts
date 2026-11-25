import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MAX_PROPERTY_DOCUMENT_SIZE,
  PROPERTY_DOCUMENT_BUCKET,
  PROPERTY_DOCUMENT_MIME_TYPES,
  documentContentType,
  documentExtension,
} from "@/lib/properties/document";

// PDF/PPT는 용량이 커서 서버로 보내지 않는다. 여기서는 "업로드 허가증"(서명된 업로드 주소)만 발급하고,
// 파일은 브라우저가 저장소로 바로 올린다.
async function ensureBucket() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.getBucket(
    PROPERTY_DOCUMENT_BUCKET,
  );
  if (data) return supabase;
  if (error && !error.message.toLowerCase().includes("not found")) throw error;

  const { error: createError } = await supabase.storage.createBucket(
    PROPERTY_DOCUMENT_BUCKET,
    {
      public: true,
      fileSizeLimit: MAX_PROPERTY_DOCUMENT_SIZE,
      allowedMimeTypes: [...PROPERTY_DOCUMENT_MIME_TYPES],
    },
  );
  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw createError;
  }
  return supabase;
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    fileName?: unknown;
    size?: unknown;
  } | null;
  const fileName = typeof body?.fileName === "string" ? body.fileName : "";
  const size = typeof body?.size === "number" ? body.size : 0;
  const extension = documentExtension(fileName);
  const contentType = documentContentType(extension);

  if (!contentType) {
    return NextResponse.json(
      { error: "PDF 또는 PPT(PPTX) 파일만 올릴 수 있습니다." },
      { status: 400 },
    );
  }
  if (size <= 0 || size > MAX_PROPERTY_DOCUMENT_SIZE) {
    return NextResponse.json(
      { error: "파일 용량은 50MB 이하여야 합니다." },
      { status: 413 },
    );
  }

  try {
    const supabase = await ensureBucket();
    const now = new Date();
    const path = `${now.getUTCFullYear()}/${String(
      now.getUTCMonth() + 1,
    ).padStart(2, "0")}/${randomUUID()}.${extension}`;
    const { data, error } = await supabase.storage
      .from(PROPERTY_DOCUMENT_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data) throw error ?? new Error("signed upload url missing");

    const { data: publicData } = supabase.storage
      .from(PROPERTY_DOCUMENT_BUCKET)
      .getPublicUrl(path);
    return NextResponse.json({
      bucket: PROPERTY_DOCUMENT_BUCKET,
      path,
      token: data.token,
      contentType,
      url: publicData.publicUrl,
    });
  } catch (error) {
    console.error("Property document upload ticket failed:", error);
    return NextResponse.json(
      { error: "문서 업로드를 준비하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
