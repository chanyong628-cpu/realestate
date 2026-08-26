import { z } from "zod";
import { buildStoredPublicAddress } from "@/lib/properties/address";

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null ? null : Number(value)),
  z.number().nonnegative().nullable(),
);

const optionalCoordinate = z.preprocess(
  (value) => (value === "" || value === null ? null : Number(value)),
  z.number().finite().nullable(),
);

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? null : value),
  z.string().nullable(),
);

export const propertyFormSchema = z.object({
  title: z.string().trim().min(1, "매물명을 입력해 주세요.").max(120),
  category: z.enum(["office", "store", "etc"]),
  deposit: optionalNumber,
  monthly_rent: optionalNumber,
  maintenance_fee: optionalNumber,
  public_address: z.string().trim().max(300),
  private_address: z.string().trim().max(300),
  latitude: optionalCoordinate,
  longitude: optionalCoordinate,
  exclusive_area: optionalNumber,
  supply_area: optionalNumber,
  floor: z.string().trim().max(30),
  total_floor: z.string().trim().max(30),
  parking_available: z.boolean(),
  elevator_available: z.boolean(),
  total_parking_count: optionalNumber,
  available_parking_count: optionalNumber,
  building_use: z.string().trim().max(100),
  approval_date: optionalDate,
  building_direction: z.string().trim().max(50),
  room_count: optionalNumber,
  restroom_count: optionalNumber,
  air_conditioner_type: z
    .enum(["유", "무", "시스템", "스탠드", "벽걸이"])
    .nullable(),
  is_violating_building: z.boolean(),
  restroom_type: z
    .enum([
      "internal_shared",
      "internal_private",
      "external_shared",
      "external_private",
    ])
    .nullable(),
  move_in_date: z.string().trim().max(100),
  is_recommended: z.boolean(),
  is_published: z.boolean(),
  image_urls: z.array(z.string().url("이미지 주소 형식이 올바르지 않습니다.")),
  description: z.string().trim().max(20000),
  private_memo: z.string().trim().max(5000),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export function propertyFormDataToValues(formData: FormData) {
  const restroomType = String(formData.get("restroom_type") ?? "");
  const privateAddress = String(formData.get("private_address") ?? "").trim();
  const isAddressHidden = formData.get("is_address_hidden") === "on";
  const imageUrls = String(formData.get("image_urls") ?? "")
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean);

  return {
    title: formData.get("title"),
    category: formData.get("category"),
    deposit: formData.get("deposit"),
    monthly_rent: formData.get("monthly_rent"),
    maintenance_fee: formData.get("maintenance_fee"),
    public_address:
      buildStoredPublicAddress(privateAddress, isAddressHidden) ||
      String(formData.get("public_address") ?? "").trim(),
    private_address: privateAddress,
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    exclusive_area: formData.get("exclusive_area"),
    supply_area: formData.get("supply_area"),
    floor: formData.get("floor"),
    total_floor: formData.get("total_floor"),
    parking_available: formData.get("parking_available") === "on",
    elevator_available: formData.get("elevator_available") === "on",
    total_parking_count: formData.get("total_parking_count"),
    available_parking_count: formData.get("available_parking_count"),
    building_use: formData.get("building_use"),
    approval_date: formData.get("approval_date"),
    building_direction: formData.get("building_direction"),
    room_count: formData.get("room_count"),
    restroom_count: formData.get("restroom_count"),
    air_conditioner_type:
      String(formData.get("air_conditioner_type") ?? "") || null,
    is_violating_building: formData.get("is_violating_building") === "on",
    restroom_type: restroomType || null,
    move_in_date: formData.get("move_in_date"),
    is_recommended: formData.get("is_recommended") === "on",
    is_published: formData.get("is_published") === "on",
    image_urls: imageUrls,
    description: formData.get("description"),
    private_memo: formData.get("private_memo"),
  };
}
