import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "property-images";
const MAX_COMPRESSED_FILE_SIZE = 700 * 1024;

async function ensureBucket() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.getBucket(BUCKET);

  if (data) return supabase;
  if (error && !error.message.toLowerCase().includes("not found")) {
    throw error;
  }

  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_COMPRESSED_FILE_SIZE,
    allowedMimeTypes: ["image/webp"],
  });

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw createError;
  }
  return supabase;
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.type !== "image/webp") {
    return NextResponse.json(
      { error: "자동 압축된 WebP 이미지만 업로드할 수 있습니다." },
      { status: 400 },
    );
  }
  if (file.size > MAX_COMPRESSED_FILE_SIZE) {
    return NextResponse.json(
      { error: "압축된 사진의 용량이 너무 큽니다." },
      { status: 413 },
    );
  }

  try {
    const supabase = await ensureBucket();
    const now = new Date();
    const path = `${now.getUTCFullYear()}/${String(
      now.getUTCMonth() + 1,
    ).padStart(2, "0")}/${randomUUID()}.webp`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, await file.arrayBuffer(), {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    console.error("Property image upload failed:", error);
    return NextResponse.json(
      { error: "사진 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
