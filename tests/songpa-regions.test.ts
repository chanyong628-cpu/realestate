import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  getRegionPath,
  getSongpaRegionByAddress,
  getSongpaRegionBySlug,
  songpaRegions,
} from "../src/lib/songpa-regions";

describe("송파구 동별 전문페이지", () => {
  test("송파구 법정동 13곳을 중복 없이 제공한다", () => {
    assert.equal(songpaRegions.length, 13);
    assert.equal(new Set(songpaRegions.map((region) => region.slug)).size, 13);
    assert.equal(new Set(songpaRegions.map((region) => region.name)).size, 13);
    assert.ok(songpaRegions.some((region) => region.name === "신천동"));
  });

  test("슬러그와 주소를 동 정보로 변환한다", () => {
    assert.equal(getSongpaRegionBySlug("munjeong-dong")?.name, "문정동");
    assert.equal(
      getSongpaRegionByAddress("서울특별시 송파구 가락동")?.slug,
      "garak-dong",
    );
    assert.equal(getSongpaRegionBySlug("unknown"), null);
  });

  test("카테고리별 고정 주소를 만든다", () => {
    const region = getSongpaRegionBySlug("ogeum-dong");
    assert.ok(region);
    assert.equal(getRegionPath("office", region), "/office/ogeum-dong");
    assert.equal(getRegionPath("store", region), "/store/ogeum-dong");
  });
});
