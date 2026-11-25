import assert from "node:assert/strict";
import test from "node:test";
import { nextAdStatus } from "../src/features/admin/ad-status/types";

test("광고 상태는 대기→작성됨→등록됨→보류→실패→대기로 순환한다", () => {
  assert.equal(nextAdStatus("pending"), "written");
  assert.equal(nextAdStatus("written"), "posted");
  assert.equal(nextAdStatus("posted"), "hold");
  assert.equal(nextAdStatus("hold"), "failed");
  assert.equal(nextAdStatus("failed"), "pending");
});
