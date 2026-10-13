import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  HOMEPAGE_EXCEL_MAX_LISTINGS,
  parseHomepageExcelSheet,
  type WorksheetLike,
} from "../src/lib/properties/homepage-excel-import";

function cell(value: string) {
  return { v: value, w: value };
}

describe("C.Y홈페이지 엑셀 시트 파싱", () => {
  test("3~7행의 6개 열 쌍에서 최대 30개를 읽는다", () => {
    const sheet: WorksheetLike = {};
    const folderColumns = ["A", "C", "E", "G", "I", "K"];
    let listingNumber = 1;

    for (let row = 3; row <= 7; row += 1) {
      for (const folderColumn of folderColumns) {
        const advertisementColumn = String.fromCharCode(
          folderColumn.charCodeAt(0) + 1,
        );
        sheet[`${folderColumn}${row}`] = cell(`폴더 ${listingNumber}`);
        sheet[`${advertisementColumn}${row}`] = cell(
          `광고문 ${listingNumber}`,
        );
        listingNumber += 1;
      }
    }

    const result = parseHomepageExcelSheet(sheet, {
      maxRow: 7,
      maxColumn: 12,
    });

    assert.equal(result.recognizedCount, HOMEPAGE_EXCEL_MAX_LISTINGS);
    assert.equal(result.skippedCount, 0);
    assert.deepEqual(result.incompleteItems, []);
    assert.deepEqual(result.overflowCells, []);
    assert.equal(result.items[0]?.folderCell, "A3");
    assert.equal(result.items[29]?.advertisementCell, "L7");
  });

  test("빈 쌍과 한쪽만 있는 쌍은 건너뛰고 형식 오류를 남긴다", () => {
    const sheet: WorksheetLike = {
      A3: cell("완성 폴더"),
      B3: cell("완성 광고문"),
      C3: cell("광고문 없는 폴더"),
      F3: cell("폴더명 없는 광고문"),
    };

    const result = parseHomepageExcelSheet(sheet, {
      maxRow: 7,
      maxColumn: 12,
    });

    assert.equal(result.recognizedCount, 1);
    assert.equal(result.skippedCount, 29);
    assert.equal(result.incompleteItems.length, 2);
    assert.equal(result.incompleteItems[0]?.missing, "광고문");
    assert.equal(result.incompleteItems[1]?.missing, "사진폴더명");
  });

  test("8행 이후나 M열 이후의 값은 30개 범위 초과로 감지한다", () => {
    const sheet: WorksheetLike = {
      A3: cell("정상 폴더"),
      B3: cell("정상 광고문"),
      A8: cell("31번째 폴더"),
      B8: cell("31번째 광고문"),
      M3: cell("잘못된 추가 열"),
    };

    const result = parseHomepageExcelSheet(sheet, {
      maxRow: 8,
      maxColumn: 13,
    });

    assert.deepEqual(result.overflowCells, ["A8", "B8", "M3"]);
  });
});
