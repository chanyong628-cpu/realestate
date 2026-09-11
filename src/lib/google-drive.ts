import "server-only";

import { createSign } from "node:crypto";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const STS_TOKEN_ENDPOINT = "https://sts.googleapis.com/v1/token";
const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const SERVICE_ACCOUNT_TOKEN_ENDPOINT =
  "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/cy-realty-drive%40cy-realty.iam.gserviceaccount.com:generateAccessToken";

export const GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL =
  "cy-realty-drive@cy-realty.iam.gserviceaccount.com";
export const GOOGLE_DRIVE_WIF_AUDIENCE =
  "//iam.googleapis.com/projects/706844187628/locations/global/workloadIdentityPools/vercel/providers/vercel";

export const MAX_GOOGLE_DRIVE_IMAGES = 60;
export const MAX_GOOGLE_DRIVE_IMAGE_SIZE = 25 * 1024 * 1024;

export interface GoogleDriveImageFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
}

interface GoogleDriveFileResponse {
  id?: string;
  name?: string;
  mimeType?: string;
  size?: string;
  capabilities?: { canDownload?: boolean };
}

interface GoogleDriveFileListResponse {
  nextPageToken?: string;
  files?: GoogleDriveFileResponse[];
}

let cachedAccessToken: { value: string; expiresAt: number } | null = null;

export class GoogleDriveImportError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function getServiceAccountCredentials() {
  const email = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  ).trim();

  if (!email || !privateKey) {
    throw new GoogleDriveImportError(
      "Google Drive 연결 설정이 필요합니다. 설정 화면에서 연결 상태를 확인해 주세요.",
      503,
    );
  }

  return { email, privateKey };
}

async function getServiceAccountAccessToken(oidcToken: string) {
  const tokenExchangeBody = new URLSearchParams({
    audience: GOOGLE_DRIVE_WIF_AUDIENCE,
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
    requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
    scope: "https://www.googleapis.com/auth/cloud-platform",
    subject_token: oidcToken,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
  });
  const exchangeResponse = await fetch(STS_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenExchangeBody,
    cache: "no-store",
  });
  const exchangeResult = (await exchangeResponse.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };

  if (!exchangeResponse.ok || !exchangeResult.access_token) {
    console.error("Google Workload Identity token exchange failed:", {
      status: exchangeResponse.status,
      description: exchangeResult.error_description,
    });
    throw new GoogleDriveImportError(
      "Google Drive 단기 인증에 실패했습니다. 연결 설정을 다시 확인해 주세요.",
      502,
    );
  }

  const impersonationResponse = await fetch(SERVICE_ACCOUNT_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${exchangeResult.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scope: [DRIVE_SCOPE], lifetime: "3600s" }),
    cache: "no-store",
  });
  const impersonationResult = (await impersonationResponse.json()) as {
    accessToken?: string;
    expireTime?: string;
    error?: { message?: string };
  };

  if (!impersonationResponse.ok || !impersonationResult.accessToken) {
    console.error("Google service account impersonation failed:", {
      status: impersonationResponse.status,
      description: impersonationResult.error?.message,
    });
    throw new GoogleDriveImportError(
      "Google Drive 서비스 계정 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      502,
    );
  }

  const expiresAt = impersonationResult.expireTime
    ? Math.floor(new Date(impersonationResult.expireTime).getTime() / 1000)
    : Math.floor(Date.now() / 1000) + 3600;
  return { accessToken: impersonationResult.accessToken, expiresAt };
}

async function getPrivateKeyAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const { email, privateKey } = getServiceAccountCredentials();
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({
      iss: email,
      scope: DRIVE_SCOPE,
      aud: TOKEN_ENDPOINT,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsignedToken = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const assertion = `${unsignedToken}.${signer.sign(privateKey, "base64url")}`;
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const result = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };

  if (!response.ok || !result.access_token) {
    console.error("Google Drive token request failed:", {
      status: response.status,
      description: result.error_description,
    });
    throw new GoogleDriveImportError(
      "Google Drive 인증에 실패했습니다. 연결 정보를 다시 확인해 주세요.",
      502,
    );
  }

  return {
    accessToken: result.access_token,
    expiresAt: now + (result.expires_in ?? 3600),
  };
}

async function getAccessToken(oidcToken?: string) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60) {
    return cachedAccessToken.value;
  }

  const token = oidcToken?.trim();
  const result = token
    ? await getServiceAccountAccessToken(token)
    : await getPrivateKeyAccessToken();
  cachedAccessToken = {
    value: result.accessToken,
    expiresAt: result.expiresAt,
  };
  return result.accessToken;
}

function validateDriveId(value: string) {
  return /^[a-zA-Z0-9_-]{10,200}$/.test(value) ? value : null;
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export function extractGoogleDriveFolderId(value: string) {
  const input = value.trim();
  const rawId = validateDriveId(input);
  if (rawId) return rawId;

  try {
    const url = new URL(input);
    if (url.hostname !== "drive.google.com") return null;

    const segments = url.pathname.split("/").filter(Boolean);
    const folderIndex = segments.findIndex((segment) => segment === "folders");
    const pathId = folderIndex >= 0 ? segments[folderIndex + 1] : null;
    return validateDriveId(pathId ?? url.searchParams.get("id") ?? "");
  } catch {
    return null;
  }
}

const naturalFileNameCollator = new Intl.Collator("ko", {
  numeric: true,
  sensitivity: "base",
});

export function sortGoogleDriveImages(files: GoogleDriveImageFile[]) {
  return [...files].sort(
    (a, b) =>
      naturalFileNameCollator.compare(a.name, b.name) ||
      a.id.localeCompare(b.id),
  );
}

export async function findGoogleDriveChildFoldersByName(
  rootFolderLink: string,
  folderName: string,
  oidcToken?: string,
) {
  const rootFolderId = extractGoogleDriveFolderId(rootFolderLink);
  if (!rootFolderId) {
    throw new GoogleDriveImportError(
      "Google Drive 상위 폴더 설정이 올바르지 않습니다.",
      500,
    );
  }

  const normalizedName = folderName.trim();
  if (!normalizedName) {
    throw new GoogleDriveImportError("폴더명을 입력해 주세요.", 400);
  }

  const url = new URL(DRIVE_FILES_ENDPOINT);
  url.searchParams.set(
    "q",
    `'${rootFolderId}' in parents and name = '${escapeDriveQueryValue(normalizedName)}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
  );
  url.searchParams.set("fields", "files(id,name)");
  url.searchParams.set("pageSize", "10");
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("includeItemsFromAllDrives", "true");

  const response = await driveFetch(url, oidcToken);
  if (!response.ok) {
    throw await parseDriveError(
      response,
      "Google Drive 폴더를 검색하지 못했습니다.",
    );
  }

  const result = (await response.json()) as GoogleDriveFileListResponse;
  return (result.files ?? []).flatMap<GoogleDriveFolder>((folder) =>
    folder.id && folder.name ? [{ id: folder.id, name: folder.name }] : [],
  );
}

async function driveFetch(url: URL, oidcToken?: string) {
  const accessToken = await getAccessToken(oidcToken);
  return fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
}

async function parseDriveError(response: Response, fallback: string) {
  let detail = "";
  try {
    const result = (await response.json()) as {
      error?: { message?: string };
    };
    detail = result.error?.message ?? "";
  } catch {
    // Google can occasionally return a non-JSON gateway response.
  }
  console.error("Google Drive API request failed:", {
    status: response.status,
    detail,
  });

  if (response.status === 403 || response.status === 404) {
    return new GoogleDriveImportError(
      "폴더를 읽을 수 없습니다. 설정 화면의 Google Drive 연결 계정을 폴더 공유에 '뷰어'로 추가해 주세요.",
      403,
    );
  }
  return new GoogleDriveImportError(fallback, 502);
}

export async function listGoogleDriveImages(
  folderLink: string,
  oidcToken?: string,
) {
  const folderId = extractGoogleDriveFolderId(folderLink);
  if (!folderId) {
    throw new GoogleDriveImportError(
      "올바른 Google Drive 폴더 링크를 입력해 주세요.",
      400,
    );
  }

  const files: GoogleDriveImageFile[] = [];
  let pageToken = "";

  do {
    const url = new URL(DRIVE_FILES_ENDPOINT);
    url.searchParams.set("q", `'${folderId}' in parents and trashed = false`);
    url.searchParams.set(
      "fields",
      "nextPageToken,files(id,name,mimeType,size,capabilities(canDownload))",
    );
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("supportsAllDrives", "true");
    url.searchParams.set("includeItemsFromAllDrives", "true");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await driveFetch(url, oidcToken);
    if (!response.ok) {
      throw await parseDriveError(
        response,
        "Google Drive 폴더의 사진 목록을 가져오지 못했습니다.",
      );
    }

    const result = (await response.json()) as GoogleDriveFileListResponse;
    for (const file of result.files ?? []) {
      const size = Number(file.size ?? 0);
      if (
        !file.id ||
        !file.name ||
        !file.mimeType?.startsWith("image/") ||
        file.capabilities?.canDownload === false
      ) {
        continue;
      }
      files.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size,
      });
    }
    pageToken = result.nextPageToken ?? "";

    if (files.length > MAX_GOOGLE_DRIVE_IMAGES) {
      throw new GoogleDriveImportError(
        `한 폴더에서 한 번에 가져올 수 있는 사진은 ${MAX_GOOGLE_DRIVE_IMAGES}장까지입니다.`,
        400,
      );
    }
  } while (pageToken);

  return sortGoogleDriveImages(files);
}

export async function downloadGoogleDriveImage(
  fileId: string,
  oidcToken?: string,
) {
  const validatedId = validateDriveId(fileId);
  if (!validatedId) {
    throw new GoogleDriveImportError("올바르지 않은 사진 번호입니다.", 400);
  }

  const metadataUrl = new URL(`${DRIVE_FILES_ENDPOINT}/${validatedId}`);
  metadataUrl.searchParams.set(
    "fields",
    "id,name,mimeType,size,capabilities(canDownload)",
  );
  metadataUrl.searchParams.set("supportsAllDrives", "true");
  const metadataResponse = await driveFetch(metadataUrl, oidcToken);
  if (!metadataResponse.ok) {
    throw await parseDriveError(
      metadataResponse,
      "Google Drive 사진 정보를 읽지 못했습니다.",
    );
  }

  const metadata = (await metadataResponse.json()) as GoogleDriveFileResponse;
  const size = Number(metadata.size ?? 0);
  if (!metadata.mimeType?.startsWith("image/")) {
    throw new GoogleDriveImportError("이미지 파일만 가져올 수 있습니다.", 400);
  }
  if (metadata.capabilities?.canDownload === false) {
    throw new GoogleDriveImportError("다운로드가 제한된 사진입니다.", 403);
  }
  if (size > MAX_GOOGLE_DRIVE_IMAGE_SIZE) {
    throw new GoogleDriveImportError(
      "원본 사진 한 장의 크기는 25MB 이하여야 합니다.",
      413,
    );
  }

  const downloadUrl = new URL(`${DRIVE_FILES_ENDPOINT}/${validatedId}`);
  downloadUrl.searchParams.set("alt", "media");
  downloadUrl.searchParams.set("supportsAllDrives", "true");
  const response = await driveFetch(downloadUrl, oidcToken);
  if (!response.ok || !response.body) {
    throw await parseDriveError(
      response,
      "Google Drive 사진을 내려받지 못했습니다.",
    );
  }
  const responseSize = Number(response.headers.get("content-length") ?? 0);
  if (responseSize > MAX_GOOGLE_DRIVE_IMAGE_SIZE) {
    await response.body.cancel();
    throw new GoogleDriveImportError(
      "원본 사진 한 장의 크기는 25MB 이하여야 합니다.",
      413,
    );
  }

  return {
    response,
    mimeType: metadata.mimeType,
  };
}

export async function readGoogleDriveImageBuffer(response: Response) {
  if (!response.body) {
    throw new GoogleDriveImportError(
      "Google Drive 사진을 내려받지 못했습니다.",
      502,
    );
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_GOOGLE_DRIVE_IMAGE_SIZE) {
      await reader.cancel();
      throw new GoogleDriveImportError(
        "원본 사진 한 장의 크기는 25MB 이하여야 합니다.",
        413,
      );
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total);
}
