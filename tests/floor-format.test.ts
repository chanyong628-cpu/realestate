import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { formatCurrentFloor } from "../src/lib/properties/floor";

describe("상세페이지 층수 표시", () => {
  test("B1층을 지상 1층으로 바꾸지 않는다", () => {
    assert.equal(formatCurrentFloor("B1층"), "B1층");
    assert.equal(formatCurrentFloor("b2층전체"), "B2층");
  });

  test("지하 한글 표기도 B층으로 표시한다", () => {
    assert.equal(formatCurrentFloor("지하 1층"), "B1층");
  });

  test("일반 층수 표시는 기존과 동일하다", () => {
    assert.equal(formatCurrentFloor("3층전체"), "3층");
    assert.equal(formatCurrentFloor(null), "-");
  });
});
