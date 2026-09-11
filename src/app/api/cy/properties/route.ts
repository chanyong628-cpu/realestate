import { propertyApiHandlers } from "@/lib/cy-property-api/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return propertyApiHandlers.search(request);
}

export async function POST(request: Request) {
  return propertyApiHandlers.create(request);
}
