import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createDriveImageImportHandler,
  DriveImageApiError,
} from "../src/lib/cy-property-api/drive-image-handler";

const SECRET = "test-secret-with-at-least-32-characters";

function request(
  body: Record<string, unknown>,
  secret: string | null = SECRET,
) {
  return new Request(
    "https://cy-office.com/api/cy/property-images/import-drive",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(secret ? { authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify(body),
    },
  );
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
  importFolder: (
    folderName: string,
    oidcToken?: string,
  ) => Promise<{
    imageUrls: string[];
    count: number;
    folderId: string;
  }> = async () => ({
    imageUrls: [
      "https://project.supabase.co/storage/v1/object/public/property-images/a.webp",
    ],
    count: 1,
    folderId: "test-folder-id-12345",
  }),
) {
  const logs: string[] = [];
  const handler = createDriveImageImportHandler({
    getSecret: () => SECRET,
    importFolder,
    logger: {
      info: (message) => logs.push(message),
      error: (message) => logs.push(message),
    },
    now: () => new Date("2026-09-11T00:00:00.000Z"),
  });
  return { handler, logs };
}

describe("C.Y Google Drive image import API", () => {
  test("Secret 없이 요청하면 401", async () => {
    const { handler } = setup();
    const response = await handler(request({ folder_name: "CY-0152" }, null));
    assert.equal(response.status, 401);
    assert.equal((await json(response)).error?.code, "UNAUTHORIZED");
  });

  test("잘못된 Secret이면 401", async () => {
    const { handler } = setup();
    const response = await handler(
      request({ folder_name: "CY-0152" }, "wrong"),
    );
    assert.equal(response.status, 401);
  });

  test("폴더명으로 사진을 가져오고 Tool용 JSON을 반환한다", async () => {
    let receivedFolderName = "";
    let receivedOidcToken = "";
    const { handler, logs } = setup(async (folderName, oidcToken) => {
      receivedFolderName = folderName;
      receivedOidcToken = oidcToken ?? "";
      return {
        imageUrls: ["https://project.supabase.co/image.webp"],
        count: 1,
        folderId: "test-folder-id-12345",
      };
    });
    const response = await handler(
      request({ folder_name: "  CY-0152  " }),
      "vercel-oidc-token",
    );
    const body = await json(response);

    assert.equal(response.status, 200);
    assert.equal(receivedFolderName, "CY-0152");
    assert.equal(receivedOidcToken, "vercel-oidc-token");
    assert.deepEqual(body.image_urls, ["https://project.supabase.co/image.webp"]);
    assert.equal(body.count, 1);
    assert.match(logs[0], /IMPORT_DRIVE_IMAGES/);
    assert.doesNotMatch(logs[0], /CY-0152/);
  });

  test("예상하지 못한 JSON 필드를 차단한다", async () => {
    const { handler } = setup();
    const response = await handler(
      request({ folder_name: "CY-0152", root_folder: "우회" }),
    );
    assert.equal(response.status, 400);
    assert.equal((await json(response)).error?.code, "VALIDATION_ERROR");
  });

  test("빈 폴더명을 차단한다", async () => {
    const { handler } = setup();
    const response = await handler(request({ folder_name: "   " }));
    assert.equal(response.status, 400);
    assert.equal((await json(response)).error?.code, "VALIDATION_ERROR");
  });

  test("폴더 없음 오류를 404로 전달한다", async () => {
    const { handler } = setup(async () => {
      throw new DriveImageApiError(
        404,
        "DRIVE_FOLDER_NOT_FOUND",
        "해당 이름의 Google Drive 폴더를 찾을 수 없습니다.",
      );
    });
    const response = await handler(request({ folder_name: "CY-9999" }));
    assert.equal(response.status, 404);
    assert.equal(
      (await json(response)).error?.code,
      "DRIVE_FOLDER_NOT_FOUND",
    );
  });

  test("같은 이름의 폴더 충돌을 409로 전달한다", async () => {
    const { handler } = setup(async () => {
      throw new DriveImageApiError(
        409,
        "DRIVE_FOLDER_AMBIGUOUS",
        "같은 이름의 Google Drive 폴더가 둘 이상 있습니다.",
      );
    });
    const response = await handler(request({ folder_name: "중복 폴더" }));
    assert.equal(response.status, 409);
    assert.equal(
      (await json(response)).error?.code,
      "DRIVE_FOLDER_AMBIGUOUS",
    );
  });
});
