import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  formatCurrentFloor,
  normalizeFloorRange,
} from "../src/lib/properties/floor";

describe("상세페이지 층수 표시", () => {
  test("B층 표기를 지하층으로 표시한다", () => {
    assert.equal(formatCurrentFloor("B1층"), "지하1층");
    assert.equal(formatCurrentFloor("b2층전체"), "지하2층");
  });

  test("음수 층 표기를 지하층으로 표시한다", () => {
    assert.equal(formatCurrentFloor("-1층"), "지하1층");
    assert.equal(formatCurrentFloor("-1층전체"), "지하1층");
    assert.equal(formatCurrentFloor("-2층"), "지하2층");
  });

  test("지하 한글 표기는 공백만 정리한다", () => {
    assert.equal(formatCurrentFloor("지하 1층"), "지하1층");
  });

  test("호수는 앞자리로 해당 층을 계산한다", () => {
    assert.equal(formatCurrentFloor("201호"), "2층");
    assert.equal(formatCurrentFloor("410호"), "4층");
    assert.equal(formatCurrentFloor("410호층"), "4층");
    assert.equal(formatCurrentFloor("1203호"), "12층");
  });

  test("일반 층수 표시는 기존과 동일하다", () => {
    assert.equal(formatCurrentFloor("3층전체"), "3층");
    assert.equal(formatCurrentFloor(null), "-");
  });

  test("여러 층은 범위로 표시한다", () => {
    assert.equal(formatCurrentFloor("3~4층"), "3~4층");
    assert.equal(formatCurrentFloor("3,4층"), "3~4층");
    assert.equal(formatCurrentFloor("3층,4층"), "3~4층");
    assert.equal(formatCurrentFloor("2,3,4층"), "2~4층");
    assert.equal(formatCurrentFloor("B1~7층"), "B1~7층");
    assert.equal(formatCurrentFloor("B1층~7층 통임대"), "B1~7층");
    assert.equal(formatCurrentFloor("지하1층~6층"), "B1~6층");
  });

  test("범위 표기 해석은 이어지지 않는 층과 한 개 층을 건드리지 않는다", () => {
    assert.equal(normalizeFloorRange("3층"), null);
    assert.equal(normalizeFloorRange("2층,4층"), null);
    assert.equal(normalizeFloorRange("30평~40평"), null);
    assert.equal(normalizeFloorRange("3~4층"), "3~4층");
  });
});
