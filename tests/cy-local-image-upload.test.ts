import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createLocalImageUploadHandler,
  LocalImageUploadApiError,
} from "../src/lib/cy-property-api/local-image-upload-handler";

const SECRET = "test-secret-with-at-least-32-characters";
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

function multipartRequest(options: {
  folderName?: string | null;
  fileName?: string;
  fileBytes?: Buffer;
  includeFile?: boolean;
  secret?: string | null;
}) {
  const {
    folderName = "CY-0152",
    fileName = "1.jpg",
    fileBytes = TINY_PNG,
    includeFile = true,
    secret = SECRET,
  } = options;

  const form = new FormData();
  if (folderName !== null) form.set("folder_name", folderName);
  if (includeFile) {
    form.set(
      "file",
      new File([new Uint8Array(fileBytes)], fileName, { type: "image/jpeg" }),
    );
  }

  return new Request("https://cy-office.com/api/cy/property-images/upload-local", {
    method: "POST",
    headers: secret ? { authorization: `Bearer ${secret}` } : undefined,
    body: form,
  });
}

interface ApiResponse {
  success?: boolean;
  image_urls?: string[];
  count?: number;
  error?: { code?: string };
}

async function json(response: Response) {
  return (await response.json()) as ApiResponse;
}

function setup(
  uploadImage: (
    folderName: string,
    fileName: string,
    buffer: Buffer,
  ) => Promise<{ imageUrl: string }> = async () => ({
    imageUrl:
      "https://project.supabase.co/storage/v1/object/public/property-images/a.webp",
  }),
) {
  const logs: string[] = [];
  const handler = createLocalImageUploadHandler({
    getSecret: () => SECRET,
    uploadImage,
    logger: {
      info: (message) => logs.push(message),
      error: (message) => logs.push(message),
    },
    now: () => new Date("2026-09-28T00:00:00.000Z"),
  });
  return { handler, logs };
}

describe("C.Y 로컬 OUTPUT 사진 업로드 API", () => {
  test("Secret 없이 요청하면 401", async () => {
    const { handler } = setup();
    const response = await handler(multipartRequest({ secret: null }));
    assert.equal(response.status, 401);
    assert.equal((await json(response)).error?.code, "UNAUTHORIZED");
  });

  test("잘못된 Secret이면 401", async () => {
    const { handler } = setup();
    const response = await handler(multipartRequest({ secret: "wrong" }));
    assert.equal(response.status, 401);
  });

  test("폴더명+사진을 받아 업로드하고 image_urls를 반환한다", async () => {
    let receivedFolderName = "";
    let receivedFileName = "";
    const { handler, logs } = setup(async (folderName, fileName) => {
      receivedFolderName = folderName;
      receivedFileName = fileName;
      return { imageUrl: "https://project.supabase.co/x.webp" };
    });
    const response = await handler(
      multipartRequest({ folderName: "  가락동155-2  ", fileName: "01.jpg" }),
    );
    const body = await json(response);

    assert.equal(response.status, 200);
    assert.equal(receivedFolderName, "가락동155-2");
    assert.equal(receivedFileName, "01.jpg");
    assert.deepEqual(body.image_urls, ["https://project.supabase.co/x.webp"]);
    assert.equal(body.count, 1);
    assert.match(logs[0], /UPLOAD_LOCAL_IMAGE/);
    assert.doesNotMatch(logs[0], /가락동/);
  });

  test("폴더명이 없으면 400", async () => {
    const { handler } = setup();
    const response = await handler(multipartRequest({ folderName: "   " }));
    assert.equal(response.status, 400);
    assert.equal((await json(response)).error?.code, "VALIDATION_ERROR");
  });

  test("file 항목이 없으면 400", async () => {
    const { handler } = setup();
    const response = await handler(multipartRequest({ includeFile: false }));
    assert.equal(response.status, 400);
    assert.equal((await json(response)).error?.code, "VALIDATION_ERROR");
  });

  test("multipart/form-data가 아니면 415", async () => {
    const { handler } = setup();
    const response = await handler(
      new Request("https://cy-office.com/api/cy/property-images/upload-local", {
        method: "POST",
        headers: { authorization: `Bearer ${SECRET}`, "content-type": "application/json" },
        body: JSON.stringify({ folder_name: "x" }),
      }),
    );
    assert.equal(response.status, 415);
  });

  test("파일이 너무 크면 413", async () => {
    const logs: string[] = [];
    const handler = createLocalImageUploadHandler({
      getSecret: () => SECRET,
      uploadImage: async () => ({ imageUrl: "https://x" }),
      maxFileBytes: 10,
      logger: { info: (m) => logs.push(m), error: (m) => logs.push(m) },
    });
    const response = await handler(
      multipartRequest({ fileBytes: Buffer.alloc(1024, 1) }),
    );
    assert.equal(response.status, 413);
    assert.equal((await json(response)).error?.code, "PAYLOAD_TOO_LARGE");
  });

  test("업로드 구현체가 실패하면 500", async () => {
    const { handler } = setup(async () => {
      throw new Error("supabase down");
    });
    const response = await handler(multipartRequest({}));
    assert.equal(response.status, 500);
    assert.equal((await json(response)).error?.code, "INTERNAL_ERROR");
  });

  test("uploadImage가 LocalImageUploadApiError를 던지면 그대로 전달한다", async () => {
    const { handler } = setup(async () => {
      throw new LocalImageUploadApiError(422, "IMAGE_PROCESSING_FAILED", "압축 실패");
    });
    const response = await handler(multipartRequest({}));
    assert.equal(response.status, 422);
    assert.equal((await json(response)).error?.code, "IMAGE_PROCESSING_FAILED");
  });
});
