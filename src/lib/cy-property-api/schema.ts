import { z } from "zod";

const PROPERTY_NUMBER_PATTERN = /^CY-\d{4,10}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_SEARCH_PATTERN = /^[\p{L}\p{N}\s-]+$/u;
const PROPERTY_IMAGE_PATH = "/storage/v1/object/public/property-images/";

const nullableText = (maximum: number) =>
  z.string().trim().max(maximum).nullable();
const nullableAmount = z.number().int().nonnegative().max(2_147_483_647).nullable();
const nullableCount = z.number().int().nonnegative().max(100_000).nullable();
const nullableArea = z.number().finite().nonnegative().max(10_000_000).nullable();

const nullableDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜는 YYYY-MM-DD 형식이어야 합니다.")
  .refine(
    (value) => {
      const [year, month, day] = value.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
      );
    },
    { message: "유효하지 않은 날짜입니다." },
  )
  .nullable();

const propertyImageUrlSchema = z
  .url("이미지 주소 형식이 올바르지 않습니다.")
  .max(2_048)
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && url.pathname.startsWith(PROPERTY_IMAGE_PATH);
  }, "Supabase property-images 공개 URL만 사용할 수 있습니다.");

export const propertyNumberSchema = z
  .string()
  .trim()
  .regex(PROPERTY_NUMBER_PATTERN, "매물번호는 CY-0001 형식이어야 합니다.")
  .transform((value) => value.toUpperCase());

const writablePropertyShape = {
  title: z.string().trim().min(1, "매물명을 입력해 주세요.").max(120),
  category: z.enum(["office", "store", "etc"]),
  deposit: nullableAmount,
  monthly_rent: nullableAmount,
  maintenance_fee: nullableAmount,
  public_address: nullableText(300).refine(
    (value) => !value?.startsWith("__CY_"),
    "내부 주소 표시값은 직접 입력할 수 없습니다.",
  ),
  private_address: nullableText(300),
  latitude: z.number().finite().min(-90).max(90).nullable(),
  longitude: z.number().finite().min(-180).max(180).nullable(),
  exclusive_area: nullableArea,
  supply_area: nullableArea,
  floor: nullableText(30),
  total_floor: nullableText(30),
  parking_available: z.boolean(),
  elevator_available: z.boolean(),
  total_parking_count: nullableCount,
  available_parking_count: nullableCount,
  building_use: nullableText(100),
  approval_date: nullableDate,
  building_direction: nullableText(50),
  room_count: nullableCount,
  restroom_count: nullableCount,
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
  move_in_date: nullableText(100),
  is_recommended: z.boolean(),
  image_urls: z
    .array(propertyImageUrlSchema)
    .max(40, "사진은 최대 40장까지 등록할 수 있습니다.")
    .refine((urls) => new Set(urls).size === urls.length, {
      message: "중복된 이미지 주소가 있습니다.",
    }),
  description: nullableText(20_000),
  private_memo: nullableText(5_000),
};

export const createPropertySchema = z
  .object({
    property_number: propertyNumberSchema.optional(),
    title: writablePropertyShape.title,
    category: writablePropertyShape.category,
    deposit: writablePropertyShape.deposit.optional(),
    monthly_rent: writablePropertyShape.monthly_rent.optional(),
    maintenance_fee: writablePropertyShape.maintenance_fee.optional(),
    public_address: writablePropertyShape.public_address.optional(),
    private_address: writablePropertyShape.private_address.optional(),
    latitude: writablePropertyShape.latitude.optional(),
    longitude: writablePropertyShape.longitude.optional(),
    exclusive_area: writablePropertyShape.exclusive_area.optional(),
    supply_area: writablePropertyShape.supply_area.optional(),
    floor: writablePropertyShape.floor.optional(),
    total_floor: writablePropertyShape.total_floor.optional(),
    parking_available: writablePropertyShape.parking_available.optional(),
    elevator_available: writablePropertyShape.elevator_available.optional(),
    total_parking_count: writablePropertyShape.total_parking_count.optional(),
    available_parking_count: writablePropertyShape.available_parking_count.optional(),
    building_use: writablePropertyShape.building_use.optional(),
    approval_date: writablePropertyShape.approval_date.optional(),
    building_direction: writablePropertyShape.building_direction.optional(),
    room_count: writablePropertyShape.room_count.optional(),
    restroom_count: writablePropertyShape.restroom_count.optional(),
    air_conditioner_type: writablePropertyShape.air_conditioner_type.optional(),
    is_violating_building: writablePropertyShape.is_violating_building.optional(),
    restroom_type: writablePropertyShape.restroom_type.optional(),
    move_in_date: writablePropertyShape.move_in_date.optional(),
    is_recommended: writablePropertyShape.is_recommended.optional(),
    image_urls: writablePropertyShape.image_urls.optional(),
    description: writablePropertyShape.description.optional(),
    private_memo: writablePropertyShape.private_memo.optional(),
  })
  .strict();

export const updatePropertySchema = z
  .object(writablePropertyShape)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 필드를 하나 이상 입력해 주세요.",
  });

export const searchPropertiesSchema = z
  .object({
    q: z
      .string()
      .trim()
      .min(1, "검색어를 입력해 주세요.")
      .max(100)
      .regex(SAFE_SEARCH_PATTERN, "검색어에 허용되지 않은 문자가 있습니다."),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const propertyIdentifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .transform((value) =>
    PROPERTY_NUMBER_PATTERN.test(value.toUpperCase()) ? value.toUpperCase() : value,
  )
  .refine(
    (value) => PROPERTY_NUMBER_PATTERN.test(value) || UUID_PATTERN.test(value),
    "매물 ID 또는 CY-0001 형식의 매물번호를 입력해 주세요.",
  );

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

export function isUuidIdentifier(value: string) {
  return UUID_PATTERN.test(value);
}

export function hasAllowedPropertyImageHosts(
  imageUrls: string[] | undefined,
  supabaseUrl: string | undefined,
) {
  if (!imageUrls?.length) return true;
  if (!supabaseUrl) return false;

  let expectedOrigin: string;
  try {
    expectedOrigin = new URL(supabaseUrl).origin;
  } catch {
    return false;
  }

  return imageUrls.every((value) => new URL(value).origin === expectedOrigin);
}
