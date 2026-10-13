export const HOMEPAGE_EXCEL_SHEET_NAME = "C.Y홈페이지";
export const HOMEPAGE_EXCEL_MAX_LISTINGS = 30;

const folderColumns = [1, 3, 5, 7, 9, 11] as const;
const firstDataRow = 3;
const lastDataRow = 7;

interface WorksheetCell {
  v?: unknown;
  w?: unknown;
}

export interface WorksheetLike {
  [address: string]: WorksheetCell | unknown;
}

export interface WorksheetBounds {
  maxRow: number;
  maxColumn: number;
}

export interface HomepageExcelItem {
  listingNumber: number;
  folderCell: string;
  advertisementCell: string;
  folderName: string;
  advertisement: string;
}

export interface HomepageExcelIncompleteItem {
  listingNumber: number;
  folderCell: string;
  advertisementCell: string;
  missing: "사진폴더명" | "광고문";
}

export interface HomepageExcelParseResult {
  items: HomepageExcelItem[];
  recognizedCount: number;
  skippedCount: number;
  incompleteItems: HomepageExcelIncompleteItem[];
  overflowCells: string[];
}

function columnName(columnNumber: number) {
  let value = columnNumber;
  let name = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }

  return name;
}

function cellAddress(row: number, column: number) {
  return `${columnName(column)}${row}`;
}

export function excelCellText(value: unknown) {
  const text = String(value ?? "").trim();
  return text.startsWith('"') && text.endsWith('"') && text.length >= 2
    ? text.slice(1, -1).replace(/""/g, '"').trim()
    : text;
}

function worksheetText(sheet: WorksheetLike, address: string) {
  const cell = sheet[address] as WorksheetCell | undefined;
  return excelCellText(cell?.w ?? cell?.v);
}

export function parseHomepageExcelSheet(
  sheet: WorksheetLike,
  bounds: WorksheetBounds,
): HomepageExcelParseResult {
  const allItems: HomepageExcelItem[] = [];

  for (let row = firstDataRow; row <= lastDataRow; row += 1) {
    for (const folderColumn of folderColumns) {
      const listingNumber =
        (row - firstDataRow) * folderColumns.length +
        folderColumns.indexOf(folderColumn) +
        1;
      const folderCell = cellAddress(row, folderColumn);
      const advertisementCell = cellAddress(row, folderColumn + 1);

      allItems.push({
        listingNumber,
        folderCell,
        advertisementCell,
        folderName: worksheetText(sheet, folderCell),
        advertisement: worksheetText(sheet, advertisementCell),
      });
    }
  }

  const incompleteItems: HomepageExcelIncompleteItem[] = allItems
    .filter(
      ({ folderName, advertisement }) =>
        Boolean(folderName) !== Boolean(advertisement),
    )
    .map(({ listingNumber, folderCell, advertisementCell, folderName }) => ({
      listingNumber,
      folderCell,
      advertisementCell,
      missing: folderName ? "광고문" : "사진폴더명",
    }));
  const items = allItems.filter(
    ({ folderName, advertisement }) => folderName && advertisement,
  );

  const overflowCells = new Set<string>();
  for (let row = lastDataRow + 1; row <= bounds.maxRow; row += 1) {
    for (let column = 1; column <= bounds.maxColumn; column += 1) {
      const address = cellAddress(row, column);
      if (worksheetText(sheet, address)) overflowCells.add(address);
    }
  }
  for (let row = firstDataRow; row <= lastDataRow; row += 1) {
    for (let column = 13; column <= bounds.maxColumn; column += 1) {
      const address = cellAddress(row, column);
      if (worksheetText(sheet, address)) overflowCells.add(address);
    }
  }

  return {
    items,
    recognizedCount: items.length,
    skippedCount: HOMEPAGE_EXCEL_MAX_LISTINGS - items.length,
    incompleteItems,
    overflowCells: [...overflowCells],
  };
}
