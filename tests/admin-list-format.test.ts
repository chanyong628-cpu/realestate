import assert from "node:assert/strict";
import test from "node:test";
import { mobileAreaLine, mobilePriceLine, mobileTitle, type AdminListSource } from "../src/lib/properties/admin-list-format";

const base: AdminListSource = {
  title: "테스트",
  private_address: "서울특별시 송파구 가락동 121",
  public_address: null,
  floor: null,
  private_memo: "건물명: JK빌딩\nGoogle Drive 폴더명: 가락동121 JK빌딩 6층전체 3000-270-30 50평-261120-박찬영",
  deposit: 3000,
  monthly_rent: 270,
  maintenance_fee: 30,
  exclusive_area: 165.29,
};

test("모바일 제목은 동 + 지번 + 건물명 + 층수", () => {
  assert.equal(mobileTitle(base), "가락동 121 JK빌딩 6층전체");
});

test("건물명이 없으면 건너뛴다", () => {
  assert.equal(mobileTitle({ ...base, private_memo: "Google Drive 폴더명: 가락동121 2층 2000-160-15" }), "가락동 121 2층");
});

test("금액줄은 보증금 / 월세 관리비, 평수줄은 실 N평", () => {
  assert.equal(mobilePriceLine(base), "3,000 / 270 30");
  assert.equal(mobilePriceLine({ ...base, maintenance_fee: null }), "3,000 / 270");
  assert.equal(mobileAreaLine(base), "실 50평");
});

test("관리자 메모는 폴더명·건물명 줄을 뺀 직접 적은 내용만", async () => {
  const { managerMemo } = await import("../src/lib/properties/admin-list-format");
  assert.equal(
    managerMemo("건물명: JK빌딩\nGoogle Drive 폴더명: 가락동121 6층\n공동현관 비밀번호 1234*"),
    "공동현관 비밀번호 1234*",
  );
  assert.equal(managerMemo(null), "");
});
