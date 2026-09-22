import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  classifyVisitSource,
  isLikelyBot,
} from "../src/lib/analytics/source";

describe("C.Y 자체 방문 통계 유입 분류", () => {
  test("referrer가 없으면 직접 방문으로 분류한다", () => {
    const result = classifyVisitSource("", "", "cy-office.com");
    assert.equal(result.sourceType, "direct");
    assert.equal(result.sourceName, "직접 방문");
  });

  test("네이버 검색 유입과 검색어를 분류한다", () => {
    const result = classifyVisitSource(
      "https://search.naver.com/search.naver?query=%EC%86%A1%ED%8C%8C%EA%B5%AC+%EC%82%AC%EB%AC%B4%EC%8B%A4",
      "",
      "cy-office.com",
    );
    assert.equal(result.sourceType, "search");
    assert.equal(result.sourceName, "네이버 검색");
    assert.equal(result.searchQuery, "송파구 사무실");
  });

  test("외부 사이트 유입은 도메인만 저장한다", () => {
    const result = classifyVisitSource(
      "https://example.com/private/path?token=secret",
      "",
      "cy-office.com",
    );
    assert.equal(result.sourceType, "site");
    assert.equal(result.sourceName, "example.com");
    assert.equal(result.referrerHost, "example.com");
  });

  test("UTM 유입은 캠페인으로 우선 분류한다", () => {
    const result = classifyVisitSource(
      "",
      "?utm_source=naver-blog&utm_term=%EB%AC%B8%EC%A0%95%EB%8F%99",
      "cy-office.com",
    );
    assert.equal(result.sourceType, "campaign");
    assert.equal(result.sourceName, "naver-blog");
    assert.equal(result.searchQuery, "문정동");
  });

  test("검색 로봇 User-Agent를 제외한다", () => {
    assert.equal(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
    assert.equal(isLikelyBot("Mozilla/5.0 Chrome/140.0"), false);
  });
});
