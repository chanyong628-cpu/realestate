import { propertyApiHandlers } from "@/lib/cy-property-api/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ identifier: string }> },
) {
  const { identifier } = await context.params;
  return propertyApiHandlers.setPublished(request, identifier, true);
}
