import fs from "node:fs/promises";
import path from "node:path";
import { createRentalProposal } from "../src/lib/proposals/create-rental-proposal.ts";

const hero = await fs.readFile(path.resolve("public/images/office-hero.png"));
const image = `data:image/png;base64,${hero.toString("base64")}`;
const now = new Date().toISOString();

function property(id, number, title, address, floor) {
  return {
    id,
    property_number: number,
    title,
    category: "office",
    deposit: 1000,
    monthly_rent: 80,
    maintenance_fee: 5,
    public_address: "송파구 가락동",
    private_address: address,
    latitude: null,
    longitude: null,
    exclusive_area: 49.59,
    supply_area: 57.09,
    floor,
    total_floor: null,
    parking_available: true,
    elevator_available: false,
    total_parking_count: 2,
    available_parking_count: 1,
    building_use: "사무실",
    approval_date: "1990-06-18",
    building_direction: "남서향",
    room_count: 0,
    restroom_count: 1,
    air_conditioner_type: "스탠드",
    is_violating_building: false,
    restroom_type: "internal_private",
    move_in_date: "즉시",
    is_recommended: true,
    is_published: true,
    image_urls: [],
    description:
      "오금역 역세권\n시설이 깨끗하고 채광이 좋음\n베란다와 내부수도 사용 가능",
    private_memo: null,
    view_count: 0,
    created_at: now,
    updated_at: now,
    proposalImages: [image, image, image, image],
  };
}

const block = {
  id: "sample-block",
  customer_name: "홍길동",
  customer_phone: "010-0000-0000",
  customer_memo: null,
  shared_slug: "sample",
  shared_title: null,
  shared_description: null,
  created_at: now,
  updated_at: now,
};

const output = await createRentalProposal(block, [
  property("sample-1", "CY-0001", "가락동 채광 좋은 사무실", "송파구 가락동 158", "2층"),
  property("sample-2", "CY-0002", "문정동 역세권 사무실", "송파구 문정동 10-7", "3층"),
]);

await fs.mkdir(path.resolve("outputs"), { recursive: true });
await fs.writeFile(
  path.resolve("outputs/CY_임대제안서_자동생성_샘플.pptx"),
  output,
);
console.log("outputs/CY_임대제안서_자동생성_샘플.pptx");
