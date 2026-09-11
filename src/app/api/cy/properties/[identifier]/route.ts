import { propertyApiHandlers } from "@/lib/cy-property-api/server";

export const dynamic = "force-dynamic";

interface PropertyRouteContext {
  params: Promise<{ identifier: string }>;
}

export async function GET(request: Request, context: PropertyRouteContext) {
  const { identifier } = await context.params;
  return propertyApiHandlers.get(request, identifier);
}

export async function PATCH(request: Request, context: PropertyRouteContext) {
  const { identifier } = await context.params;
  return propertyApiHandlers.update(request, identifier);
}
