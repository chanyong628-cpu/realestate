import { getAdminSession } from "@/lib/auth/session";
import {
  downloadGoogleDriveImage,
  GoogleDriveImportError,
  listGoogleDriveImages,
} from "@/lib/google-drive";

function errorResponse(error: unknown) {
  if (error instanceof GoogleDriveImportError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("Google Drive image import failed:", error);
  return Response.json(
    { error: "Google Drive 사진을 가져오지 못했습니다." },
    { status: 500 },
  );
}

function getOidcToken(request: Request) {
  return (
    request.headers.get("x-vercel-oidc-token") ??
    process.env.VERCEL_OIDC_TOKEN ??
    undefined
  );
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { folderLink?: unknown };
    if (typeof body.folderLink !== "string") {
      throw new GoogleDriveImportError(
        "Google Drive 폴더 링크를 입력해 주세요.",
        400,
      );
    }

    const files = await listGoogleDriveImages(
      body.folderLink,
      getOidcToken(request),
    );
    if (!files.length) {
      throw new GoogleDriveImportError(
        "폴더에서 가져올 수 있는 사진을 찾지 못했습니다.",
        404,
      );
    }
    return Response.json({ files });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const fileId = new URL(request.url).searchParams.get("fileId") ?? "";
    const { response, mimeType } = await downloadGoogleDriveImage(
      fileId,
      getOidcToken(request),
    );
    return new Response(response.body, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
