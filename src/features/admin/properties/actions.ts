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

  revalidatePropertyPages();
  revalidatePath("/admin/property-db");
  const returnTo = String(formData.get("return_to") ?? "");
  redirect(
    returnTo === "/admin/property-db"
      ? "/admin/property-db?created=1"
      : "/admin/properties?created=1",
  );
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
      total_floor: draft.total_floor,
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
  revalidatePropertyPages();
  revalidatePath("/admin/property-db");
  revalidatePath(`/admin/property-db/${id}`);
}

const propertyDatabaseEditSchema = z.object({
  private_address: z.string().trim().min(1, "주소를 입력해 주세요.").max(300),
  building_name: z.string().trim().max(100),
  deposit: z.coerce.number().nonnegative().nullable(),
  monthly_rent: z.coerce.number().nonnegative().nullable(),
  maintenance_fee: z.coerce.number().nonnegative().nullable(),
  exclusive_area_pyeong: z.coerce.number().int().nonnegative().nullable(),
  supply_area: z.coerce.number().nonnegative().nullable(),
  floor: z.string().trim().max(30),
  total_floor: z.string().trim().max(30),
  room_count: z.coerce.number().nonnegative().nullable(),
  restroom_count: z.coerce.number().nonnegative().nullable(),
  total_parking_count: z.coerce.number().nonnegative().nullable(),
  available_parking_count: z.coerce.number().nonnegative().nullable(),
  building_use: z.string().trim().max(100),
  approval_date: z.string().nullable(),
  building_direction: z.string().trim().max(50),
  air_conditioner_type: z
    .enum(["유", "무", "시스템", "스탠드", "벽걸이"])
    .nullable(),
  parking_available: z.boolean(),
  elevator_available: z.boolean(),
  is_violating_building: z.boolean(),
});

function nullableFormNumber(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value === "" ? null : Number(value);
}

export async function updatePropertyDatabaseAction(
  id: string,
  formData: FormData,
) {
  await requireAdmin();
  const airConditionerType = String(
    formData.get("air_conditioner_type") ?? "",
  );
  const approvalDate = String(formData.get("approval_date") ?? "").trim();
  const parsed = propertyDatabaseEditSchema.safeParse({
    private_address: formData.get("private_address"),
    building_name: formData.get("building_name"),
    deposit: nullableFormNumber(formData, "deposit"),
    monthly_rent: nullableFormNumber(formData, "monthly_rent"),
    maintenance_fee: nullableFormNumber(formData, "maintenance_fee"),
    exclusive_area_pyeong: nullableFormNumber(formData, "exclusive_area_pyeong"),
    supply_area: nullableFormNumber(formData, "supply_area"),
    floor: formData.get("floor"),
    total_floor: formData.get("total_floor"),
    room_count: nullableFormNumber(formData, "room_count"),
    restroom_count: nullableFormNumber(formData, "restroom_count"),
    total_parking_count: nullableFormNumber(formData, "total_parking_count"),
    available_parking_count: nullableFormNumber(
      formData,
      "available_parking_count",
    ),
    building_use: formData.get("building_use"),
    approval_date: approvalDate || null,
    building_direction: formData.get("building_direction"),
    air_conditioner_type: airConditionerType || null,
    parking_available: formData.get("parking_available") === "on",
    elevator_available: formData.get("elevator_available") === "on",
    is_violating_building:
      formData.get("is_violating_building") === "on",
  });

  if (!parsed.success) {
    redirect(
      `/admin/property-db/${id}?edit=1&error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
      )}`,
    );
  }

  const supabase = createAdminClient();
  const { data: previous } = await supabase
    .from("properties")
    .select("private_memo")
    .eq("id", id)
    .maybeSingle();
  const folderLine = metadataMemoLine(previous?.private_memo, "Google Drive 폴더명:");
  const memoBody = managerMemoBody(previous?.private_memo);
  const { building_name, exclusive_area_pyeong, ...databaseFields } = parsed.data;
  const buildingLine = building_name ? `건물명: ${building_name}` : undefined;
  const updateFields = {
    ...databaseFields,
    exclusive_area:
      exclusive_area_pyeong === null
        ? null
        : Number((exclusive_area_pyeong * 3.3058).toFixed(2)),
    private_memo: [folderLine, buildingLine, memoBody].filter(Boolean).join("\n"),
  };

  const { error } = await supabase
    .from("properties")
    .update(updateFields)
    .eq("id", id);
  if (error) throw new Error("매물장 정보를 저장하지 못했습니다.");

  revalidatePropertyPages();
  revalidatePath("/admin/property-db");
  revalidatePath(`/admin/property-db/${id}`);
  redirect(`/admin/property-db/${id}?saved=1`);
}

function metadataMemoLine(value: string | null | undefined, prefix: string) {
  return (value ?? "")
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith(prefix))
    ?.trim();
}

function managerMemoBody(value: string | null | undefined) {
  return (value ?? "")
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith("Google Drive 폴더명:") && !trimmed.startsWith("건물명:");
    })
    .join("\n")
    .trim();
}

export async function savePropertyPrivateMemoAction(
  id: string,
  formData: FormData,
) {
  await requireAdmin();
  const memo = String(formData.get("private_memo") ?? "").trim().slice(0, 5000);
  const supabase = createAdminClient();
  const { data: previous } = await supabase
    .from("properties")
    .select("private_memo")
    .eq("id", id)
    .maybeSingle();
  const folderLine = metadataMemoLine(previous?.private_memo, "Google Drive 폴더명:");
  const buildingLine = metadataMemoLine(previous?.private_memo, "건물명:");
  const privateMemo = [folderLine, buildingLine, memo].filter(Boolean).join("\n");
  const { error } = await supabase
    .from("properties")
    .update({ private_memo: privateMemo })
    .eq("id", id);
  if (error) throw new Error("관리자 메모를 저장하지 못했습니다.");

  revalidatePath("/admin/property-db");
  revalidatePath(`/admin/property-db/${id}`);
  redirect(`/admin/property-db/${id}?memoSaved=1`);
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
