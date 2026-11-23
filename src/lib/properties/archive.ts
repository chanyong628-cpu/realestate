import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Property } from "@/types/database";

export type PropertyDatabaseRow = Property & { archived: boolean };

// 사이트에서 영구 삭제하고 매물장(property_archive)에는 OFF로 보존한다. 이미 보관 중이면 false.
export async function archivePropertyById(id: string) {
  const { data, error } = await createAdminClient().rpc("archive_property", {
    p_id: id,
  });
  if (error) throw new Error("매물을 사이트에서 삭제하지 못했습니다.");
  return data === true;
}

// 매물장 DB: 사이트 매물(ON) + 보관 매물(OFF)을 함께 조회한다.
export async function getPropertyDatabaseRows() {
  const client = createAdminClient();
  const [live, archived] = await Promise.all([
    client.from("properties").select("*"),
    client.from("property_archive").select("*"),
  ]);
  const error = live.error ?? archived.error;
  const rows: PropertyDatabaseRow[] = [
    ...((live.data ?? []) as Property[]).map((property) => ({
      ...property,
      archived: false,
    })),
    ...((archived.data ?? []) as Property[]).map((property) => ({
      ...property,
      is_published: false,
      archived: true,
    })),
  ].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return { rows, error };
}

export async function getPropertyDatabaseRow(id: string) {
  const client = createAdminClient();
  const live = await client.from("properties").select("*").eq("id", id).maybeSingle();
  if (live.error) return null;
  if (live.data) return { ...(live.data as Property), archived: false } as PropertyDatabaseRow;
  const archived = await client
    .from("property_archive")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (archived.error || !archived.data) return null;
  return {
    ...(archived.data as Property),
    is_published: false,
    archived: true,
  } as PropertyDatabaseRow;
}

// 사이트 매물이든 보관 매물이든 같은 id의 매물장 정보를 수정한다.
export async function updatePropertyDatabaseFields(
  id: string,
  fields: Record<string, unknown>,
) {
  const client = createAdminClient();
  const live = await client.from("properties").update(fields).eq("id", id).select("id");
  if (live.error) return live.error;
  if (live.data?.length) return null;
  const archived = await client.from("property_archive").update(fields).eq("id", id);
  return archived.error;
}
