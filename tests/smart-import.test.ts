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
});
