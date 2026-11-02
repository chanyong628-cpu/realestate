import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  inferTotalFloorFromAdvertisement,
  parsePropertyInputs,
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
