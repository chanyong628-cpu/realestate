import { localImageUploadHandler } from "@/lib/cy-property-api/local-image-upload-server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  return localImageUploadHandler(request);
}
