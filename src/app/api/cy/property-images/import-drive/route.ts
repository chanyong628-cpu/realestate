import { driveImageImportHandler } from "@/lib/cy-property-api/drive-image-server";

export const runtime = "nodejs";
export const maxDuration = 300;

function getOidcToken(request: Request) {
  return (
    request.headers.get("x-vercel-oidc-token") ??
    process.env.VERCEL_OIDC_TOKEN ??
    undefined
  );
}

export async function POST(request: Request) {
  return driveImageImportHandler(request, getOidcToken(request));
}
