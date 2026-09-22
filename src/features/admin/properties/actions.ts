"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseBulkPropertyRows,
  parsePropertyInputs,
} from "@/lib/properties/smart-import";
import type { Database } from "@/types/database";
import {
  propertyFormDataToValues,
  propertyFormSchema,
} from "./schema";

export interface PropertyActionState {
  error?: string;
}

export interface BulkPropertyActionState {
  error?: string;
  createdCount?: number;
}

export interface BulkPropertyManageResult {
  success: boolean;
  message: string;
  affectedCount: number;
}

const bulkPropertyManageSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).max(200),
    action: z.enum(["hide", "delete", "favorite"]),
  })
  .strict();

type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];

async function requireAdmin() {
  if (!(await getAdminSession())) redirect("/admin/login");
}

function revalidatePropertyPages() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/properties");
  revalidatePath("/favorites");
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");
}

function getStoredImagePath(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const marker = "/storage/v1/object/public/property-images/";
    const index = pathname.indexOf(marker);
    return index === -1
      ? null
      : decodeURIComponent(pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

async function removeStoredImages(urls: string[]) {
  const paths = urls
    .map(getStoredImagePath)
    .filter((path): path is string => Boolean(path));
  if (!paths.length) return;

  const { error } = await createAdminClient()
    .storage.from("property-images")
    .remove(paths);
  if (error) console.error("Property image cleanup failed:", error.message);
}

function friendlyDatabaseError(message: string) {
  if (message.includes("duplicate key")) {
    return "중복된 값이 있어 저장하지 못했습니다.";
  }
  return "저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

export async function createPropertyAction(
  _previousState: PropertyActionState,
  formData: FormData,
): Promise<PropertyActionState> {
  await requireAdmin();
  const parsed = propertyFormSchema.safeParse(
    propertyFormDataToValues(formData),
  );

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { error } = await createAdminClient()
    .from("properties")
    .insert(parsed.data);

  if (error) {
    console.error("Property creation failed:", error.message);
    return { error: friendlyDatabaseError(error.message) };
  }

  revalidatePath("/");
  revalidatePath("/admin/properties");
  redirect("/admin/properties?created=1");
}

export async function bulkCreatePropertiesAction(
  _previousState: BulkPropertyActionState,
  formData: FormData,
): Promise<BulkPropertyActionState> {
  await requireAdmin();
  const excelRows = String(formData.get("excel_rows") ?? "");
  const rows = parseBulkPropertyRows(excelRows);

  if (!rows.length) {
    return {
      error:
        "등록할 행을 찾지 못했습니다. 엑셀에서 '사진폴더명'과 '광고문' 두 컬럼을 복사해 붙여넣어 주세요.",
    };
  }

  if (rows.length > 50) {
    return {
      error:
        "한 번에 최대 50개까지 등록할 수 있습니다. 나눠서 등록해 주세요.",
    };
  }

  const values = rows.map((row) => {
    const draft = parsePropertyInputs(row.folderName, row.advertisement);
    return {
      title: draft.title || row.folderName.slice(0, 120) || "신규 매물",
      category: draft.category,
      deposit: draft.deposit,
      monthly_rent: draft.monthly_rent,
      maintenance_fee: draft.maintenance_fee,
      public_address: draft.private_address || draft.public_address,
      private_address: draft.private_address,
      latitude: null,
      longitude: null,
      exclusive_area: draft.exclusive_area,
      supply_area: draft.supply_area,
      floor: draft.floor,
      total_floor: "",
      parking_available: draft.parking_available,
      elevator_available: draft.elevator_available,
      total_parking_count: draft.total_parking_count,
      available_parking_count: draft.available_parking_count,
      building_use: draft.building_use,
      approval_date: draft.approval_date,
      building_direction: draft.building_direction,
      room_count: draft.room_count,
      restroom_count: draft.restroom_count,
      air_conditioner_type: draft.air_conditioner_type,
      is_violating_building: draft.is_violating_building,
      restroom_type: draft.restroom_type,
      move_in_date: "즉시입주",
      is_recommended: false,
      is_published: true,
      image_urls: [],
      description: draft.description,
      private_memo: draft.private_memo,
    };
  });

  const parsedValues: PropertyInsert[] = [];
  for (let index = 0; index < values.length; index += 1) {
    const parsed = propertyFormSchema.safeParse(values[index]);
    if (!parsed.success) {
      return {
        error: `${rows[index].rowNumber}번째 줄을 확인해 주세요. ${
          parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다."
        }`,
      };
    }
    parsedValues.push(parsed.data);
  }

  const { error } = await createAdminClient()
    .from("properties")
    .insert(parsedValues);

  if (error) {
    console.error("Bulk property creation failed:", error.message);
    return { error: `저장 실패: ${friendlyDatabaseError(error.message)}` };
  }

  revalidatePath("/");
  revalidatePath("/admin/properties");
  return { createdCount: values.length };
}

export async function updatePropertyAction(
  id: string,
  _previousState: PropertyActionState,
  formData: FormData,
): Promise<PropertyActionState> {
  await requireAdmin();
  const parsed = propertyFormSchema.safeParse(
    propertyFormDataToValues(formData),
  );

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const supabase = createAdminClient();
  const { data: previous } = await supabase
    .from("properties")
    .select("image_urls")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase
    .from("properties")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    console.error("Property update failed:", error.message);
    return { error: friendlyDatabaseError(error.message) };
  }

  const previousUrls = Array.isArray(previous?.image_urls)
    ? (previous.image_urls as string[])
    : [];
  await removeStoredImages(
    previousUrls.filter((url) => !parsed.data.image_urls.includes(url)),
  );

  revalidatePath("/");
  revalidatePath("/admin/properties");
  redirect("/admin/properties?updated=1");
}

export async function deletePropertyAction(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data: property } = await supabase
    .from("properties")
    .select("image_urls")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id);

  if (error) throw new Error("매물을 삭제하지 못했습니다.");
  await removeStoredImages(
    Array.isArray(property?.image_urls)
      ? (property.image_urls as string[])
      : [],
  );
  revalidatePath("/");
  revalidatePath("/admin/properties");
}

export async function setPropertyPublishedAction(
  id: string,
  isPublished: boolean,
) {
  await requireAdmin();
  const { error } = await createAdminClient()
    .from("properties")
    .update({ is_published: isPublished })
    .eq("id", id);

  if (error) throw new Error("노출 상태를 변경하지 못했습니다.");
  revalidatePath("/");
  revalidatePath("/admin/properties");
}

export async function setPropertyRecommendedAction(
  id: string,
  isRecommended: boolean,
) {
  await requireAdmin();
  const { error } = await createAdminClient()
    .from("properties")
    .update({ is_recommended: isRecommended })
    .eq("id", id);

  if (error) throw new Error("추천 상태를 변경하지 못했습니다.");
  revalidatePath("/");
  revalidatePath("/admin/properties");
}

export async function bulkManagePropertiesAction(
  input: unknown,
): Promise<BulkPropertyManageResult> {
  await requireAdmin();
  const parsed = bulkPropertyManageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "선택한 매물 정보를 확인해 주세요.",
      affectedCount: 0,
    };
  }

  const ids = [...new Set(parsed.data.ids)];
  const supabase = createAdminClient();
  const { data: selected, error: selectError } = await supabase
    .from("properties")
    .select("id,image_urls")
    .in("id", ids);
  if (selectError) {
    console.error("Bulk property selection failed:", selectError.message);
    return {
      success: false,
      message: "선택한 매물을 불러오지 못했습니다.",
      affectedCount: 0,
    };
  }

  const existing = selected ?? [];
  const existingIds = existing.map((property) => property.id as string);
  if (!existingIds.length) {
    return {
      success: false,
      message: "처리할 매물을 찾지 못했습니다.",
      affectedCount: 0,
    };
  }

  if (parsed.data.action === "hide") {
    const { error } = await supabase
      .from("properties")
      .update({ is_published: false })
      .in("id", existingIds);
    if (error) {
      console.error("Bulk property hide failed:", error.message);
      return {
        success: false,
        message: "선택 매물을 비노출로 바꾸지 못했습니다.",
        affectedCount: 0,
      };
    }
    revalidatePropertyPages();
    return {
      success: true,
      message: `${existingIds.length}개 매물을 비노출로 변경했습니다.`,
      affectedCount: existingIds.length,
    };
  }

  if (parsed.data.action === "favorite") {
    const { error } = await supabase
      .from("admin_favorite_properties")
      .upsert(
        existingIds.map((propertyId) => ({ property_id: propertyId })),
        { onConflict: "property_id" },
      );
    if (error) {
      console.error("Bulk property favorite failed:", error.message);
      return {
        success: false,
        message: "선택 매물을 즐겨찾기에 저장하지 못했습니다.",
        affectedCount: 0,
      };
    }
    revalidatePropertyPages();
    return {
      success: true,
      message: `${existingIds.length}개 매물을 나의 즐겨찾기에 저장했습니다.`,
      affectedCount: existingIds.length,
    };
  }

  const imageUrls = existing.flatMap((property) =>
    Array.isArray(property.image_urls) ? (property.image_urls as string[]) : [],
  );
  const { error: deleteError } = await supabase
    .from("properties")
    .delete()
    .in("id", existingIds);
  if (deleteError) {
    console.error("Bulk property deletion failed:", deleteError.message);
    return {
      success: false,
      message: "선택 매물을 삭제하지 못했습니다.",
      affectedCount: 0,
    };
  }
  await removeStoredImages(imageUrls);
  revalidatePropertyPages();
  return {
    success: true,
    message: `${existingIds.length}개 매물을 삭제했습니다.`,
    affectedCount: existingIds.length,
  };
}

export async function updatePropertyCoordinatesAction(
  id: string,
  latitude: number,
  longitude: number,
) {
  await requireAdmin();
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < 37.45 ||
    latitude > 37.58 ||
    longitude < 127.05 ||
    longitude > 127.18
  ) {
    throw new Error("송파구 범위를 벗어난 좌표입니다.");
  }

  const { error } = await createAdminClient()
    .from("properties")
    .update({ latitude, longitude })
    .eq("id", id);
  if (error) throw new Error("매물 위치를 저장하지 못했습니다.");

  revalidatePath("/");
  revalidatePath("/admin/properties");
}
