import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  RECOMMENDED_PROPERTY_LIMIT,
  selectRecommendedProperties,
} from "../src/lib/properties/recommended";
import type { Property } from "../src/types/database";

function makeProperty(
  number: number,
  createdAt: string,
  overrides: Partial<Property> = {},
): Property {
  return {
    id: `id-${number}`,
    property_number: `CY-${String(number).padStart(4, "0")}`,
    category: "office",
    is_recommended: true,
    created_at: createdAt,
    ...overrides,
  } as Property;
}

describe("홈 추천매물 노출", () => {
  test("최대 30개로 제한한다", () => {
    assert.equal(RECOMMENDED_PROPERTY_LIMIT, 30);
    const properties = Array.from({ length: 45 }, (_, index) =>
      makeProperty(index + 1, new Date(2026, 0, index + 1).toISOString()),
    );
    assert.equal(selectRecommendedProperties(properties).length, 30);
  });

  test("등록일 최신순으로 30개를 고른다", () => {
    const properties = Array.from({ length: 45 }, (_, index) =>
      makeProperty(index + 1, new Date(2026, 0, index + 1).toISOString()),
    );
    const selected = selectRecommendedProperties(properties);
    assert.equal(selected[0].property_number, "CY-0045");
    assert.equal(selected[29].property_number, "CY-0016");
    assert.ok(!selected.some((property) => property.property_number === "CY-0015"));
  });

  test("추천이 아니거나 기타 카테고리는 제외한다", () => {
    const properties = [
      makeProperty(1, "2026-03-01T00:00:00Z"),
      makeProperty(2, "2026-03-02T00:00:00Z", { is_recommended: false }),
      makeProperty(3, "2026-03-03T00:00:00Z", { category: "etc" }),
    ];
    const selected = selectRecommendedProperties(properties);
    assert.deepEqual(
      selected.map((property) => property.property_number),
      ["CY-0001"],
    );
  });

  test("30개 이하이면 전부 보여주고 원본 배열은 바꾸지 않는다", () => {
    const properties = [
      makeProperty(1, "2026-03-01T00:00:00Z"),
      makeProperty(2, "2026-03-02T00:00:00Z"),
    ];
    const snapshot = properties.map((property) => property.property_number);
    const selected = selectRecommendedProperties(properties);
    assert.deepEqual(
      selected.map((property) => property.property_number),
      ["CY-0002", "CY-0001"],
    );
    assert.deepEqual(
      properties.map((property) => property.property_number),
      snapshot,
    );
  });

  test("등록일이 같으면 매물번호가 큰 순서로 정렬한다", () => {
    const sameTime = "2026-03-01T00:00:00Z";
    const selected = selectRecommendedProperties([
      makeProperty(5, sameTime),
      makeProperty(7, sameTime),
      makeProperty(6, sameTime),
    ]);
    assert.deepEqual(
      selected.map((property) => property.property_number),
      ["CY-0007", "CY-0006", "CY-0005"],
    );
  });
});
