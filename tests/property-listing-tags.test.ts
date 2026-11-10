import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { propertyFormDataToValues, propertyFormSchema } from "../src/features/admin/properties/schema";
import { getThemeDefinition, themeDefinitions } from "../src/lib/properties/listing-tags";

describe("매물 복수 분류", () => {
  test("사무실과 상가 및 테마를 동시에 저장한다", () => {
    const formData = new FormData();
    formData.set("title", "복수 분류 매물");
    formData.set("category", "office");
    formData.append("listing_tags", "office");
    formData.append("listing_tags", "store");
    formData.append("listing_tags", "theme_new_build");

    const values = propertyFormDataToValues(formData);
    assert.deepEqual(values.listing_tags, ["office", "store", "theme_new_build"]);
  });

  test("기본 분류는 체크가 빠져도 자동으로 포함한다", () => {
    const formData = new FormData();
    formData.set("category", "store");
    formData.append("listing_tags", "theme_sale");

    const values = propertyFormDataToValues(formData);
    assert.deepEqual(values.listing_tags, ["store", "theme_sale"]);
  });

  test("허용하지 않은 분류는 검증에서 차단한다", () => {
    const parsed = propertyFormSchema.safeParse({
      ...propertyFormDataToValues(new FormData()),
      title: "잘못된 분류",
      category: "office",
      listing_tags: ["unknown"],
    });
    assert.equal(parsed.success, false);
  });

  test("테마는 2x2 화면에 맞는 네 종류만 제공한다", () => {
    assert.equal(themeDefinitions.length, 4);
    assert.equal(getThemeDefinition("new-build")?.label, "신축, 리모델링");
    assert.equal(getThemeDefinition("whole-rent")?.label, "통임대");
    assert.equal(getThemeDefinition("sale")?.label, "매매");
    assert.equal(getThemeDefinition("terrace")?.label, "테라스");
    assert.equal(getThemeDefinition("rooftop")?.label, "테라스");
  });
});
