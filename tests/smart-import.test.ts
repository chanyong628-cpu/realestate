import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  inferTotalFloorFromAdvertisement,
  parsePropertyInputs,
  withListingMeta,
} from "../src/lib/properties/smart-import";

describe("매물 광고문 총층수 자동 입력", () => {
  test("기존 광고문 형식의 괄호 안 총층수를 읽는다", () => {
    const advertisement = [
      "위치 : 송파구 송파동",
      "층수 : 2층 (총 5층)",
      "금액 : 2500 / 190 / 20",
    ].join("\n");

    assert.equal(inferTotalFloorFromAdvertisement(advertisement), "5층");
    assert.equal(
      parsePropertyInputs("송파동 2층 2500-190-20 30평", advertisement)
        .total_floor,
      "5층",
    );
  });

  test("해당층/총층 컬럼 형식도 읽는다", () => {
    assert.equal(
      inferTotalFloorFromAdvertisement("층수(해당/총) : 3층 / 총 7층"),
      "7층",
    );
  });

  test("총층 정보가 없으면 빈 값으로 둔다", () => {
    assert.equal(inferTotalFloorFromAdvertisement("층수 : 3층"), "");
  });

  test("폴더명에 적힌 해당층 표현을 그대로 유지한다", () => {
    assert.equal(
      parsePropertyInputs("문정동 54-9 2층일부 2200-160-25 22평", "")
        .floor,
      "2층일부",
    );
    assert.equal(
      parsePropertyInputs("가락동 48-11 202호 6000-450-75 45평", "")
        .floor,
      "202호",
    );
    assert.equal(
      parsePropertyInputs("방이동 188 2층전체 3000-200-20 30평", "")
        .floor,
      "2층전체",
    );
  });
});

describe("광고프로그램이 보낸 매물명·층표기", () => {
  const folder = "가락동 1-1 가락시장역 B1층~7층 통임대 20000-2000-없음 R2 E유";
  const advertisement = "광고문 첫 줄\n층수 : B1~7층 통임대";

  test("매물명 줄이 있으면 제목으로 쓰고 설명에는 남기지 않는다", () => {
    const draft = parsePropertyInputs(
      folder,
      withListingMeta(advertisement, {
        title: "가락시장역 실 300평 월세2000만원 통임대",
        floor: "B1층~6층",
      }),
    );

    assert.equal(draft.title, "가락시장역 실 300평 월세2000만원 통임대");
    assert.equal(draft.floor, "B1~6층");
    assert.ok(!draft.description.includes("매물명"));
    assert.ok(!draft.description.includes("층표기"));
    assert.ok(draft.description.includes("광고문 첫 줄"));
    assert.equal(draft.maintenance_fee, 0);
  });

  test("매물명 줄이 없으면 예전 방식 제목을 그대로 만든다", () => {
    const draft = parsePropertyInputs("문정동 54-9 2층일부 2200-160-25 22평", "");
    assert.equal(draft.title, "문정동 2층일부 사무실");
    assert.equal(draft.floor, "2층일부");
  });

  test("폴더명의 여러 층 표기를 범위로 저장한다", () => {
    assert.equal(
      parsePropertyInputs("가락동 100-1 3~4층 5000-450-45 40평", "").floor,
      "3~4층",
    );
    assert.equal(
      parsePropertyInputs("가락동 100-1 3,4층 5000-450-45 40평", "").floor,
      "3~4층",
    );
    assert.equal(
      parsePropertyInputs("가락동 100-1 3층,4층 5000-450-45 40평", "").floor,
      "3~4층",
    );
  });
});
