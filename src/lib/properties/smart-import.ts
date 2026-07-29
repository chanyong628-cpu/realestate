import {
  derivePublicAddress,
  normalizeSongpaAddress,
} from "@/lib/properties/address";

export interface ImportedPropertyDraft {
  title: string;
  category: "office" | "store";
  deposit: number | null;
  monthly_rent: number | null;
  maintenance_fee: number | null;
  private_address: string;
  public_address: string;
  exclusive_area: number | null;
  floor: string;
  parking_available: boolean;
  elevator_available: boolean;
  available_parking_count: number | null;
  restroom_type: "internal_private" | "external_shared";
  room_count: number | null;
  restroom_count: number | null;
  air_conditioner_type: "유" | "무" | "시스템" | "스탠드" | "벽걸이" | null;
  building_use: string;
  approval_date: string;
  supply_area: number | null;
  total_parking_count: number | null;
  building_direction: string;
  is_violating_building: boolean;
  description: string;
  private_memo: string;
}

export interface BulkPropertyInputRow {
  rowNumber: number;
  folderName: string;
  advertisement: string;
}

function numberMatch(text: string, pattern: RegExp) {
  const value = text.match(pattern)?.[1];
  return value ? Number(value) : null;
}

function maintenanceFeeMatch(folderName: string, advertisement: string) {
  const folderMoney = folderName.match(
    /(\d+)\s*-\s*(\d+)\s*-\s*(\d+|포함|없음|무|무료|관리비포함)/i,
  );
  const folderValue = folderMoney?.[3]?.trim();

  if (folderValue) {
    return /^(포함|없음|무|무료|관리비포함|0)$/i.test(folderValue)
      ? 0
      : Number(folderValue);
  }

  const advertisementValue = advertisement.match(
    /(?:관리비|금액\s*:\s*\d+\s*\/\s*\d+\s*\/)\s*:?\s*(\d+|포함|없음|무|무료|관리비포함)/i,
  )?.[1];

  if (!advertisementValue) return null;
  return /^(포함|없음|무|무료|관리비포함|0)$/i.test(advertisementValue)
    ? 0
    : Number(advertisementValue);
}

function textMatch(text: string, pattern: RegExp) {
  return text.match(pattern)?.[1]?.trim() ?? "";
}

function removeBuildingConfirmation(text: string) {
  return text
    .replace(
      /\n?\s*<기본확인사항>\s*[\s\S]*?(?=\n\s*(?:❤️|❤|상호\s*:)|$)/,
      "\n",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripSongpaPrefix(address: string) {
  return address
    .replace(/^서울(?:특별시)?\s*/g, "")
    .replace(/^송파구\s*/g, "")
    .trim();
}

function normalizePrivateAddress(address: string) {
  return stripSongpaPrefix(normalizeSongpaAddress(address));
}

function addressCandidates(folderName: string, advertisement: string) {
  const labeledAddresses = advertisement
    .split(/\r?\n/)
    .map((line) =>
      line.match(
        /^\s*(?:정확한\s*)?(?:주소|위치|소재지)\s*[:：]\s*(.+?)\s*$/,
      )?.[1],
    )
    .filter((value): value is string => Boolean(value));

  return [
    folderName,
    ...labeledAddresses,
    ...advertisement.split(/\r?\n/),
    `${folderName}\n${advertisement}`,
  ];
}

function extractPrivateAddress(folderName: string, advertisement: string) {
  for (const candidate of addressCandidates(folderName, advertisement)) {
    const parcelMatch = candidate.match(
      /((?:서울(?:특별시)?\s*)?(?:송파구\s*)?[가-힣0-9]+동)\s*((?:산\s*)?\d+(?:-\d+)?)(?!\s*층)/,
    );
    if (parcelMatch) {
      return normalizePrivateAddress(`${parcelMatch[1]} ${parcelMatch[2]}`);
    }
  }

  for (const candidate of addressCandidates(folderName, advertisement)) {
    const dongMatch = candidate.match(
      /(?:서울(?:특별시)?\s*)?(?:송파구\s*)?([가-힣0-9]+동)(?=\s|,|$)/,
    );
    if (dongMatch) return normalizePrivateAddress(dongMatch[1]);
  }

  return "";
}

export function parsePropertyInputs(
  folderName: string,
  advertisement: string,
): ImportedPropertyDraft {
  const combined = `${folderName}\n${advertisement}`;
  const exactAddress = extractPrivateAddress(folderName, advertisement);
  const dong =
    exactAddress.match(/([가-힣0-9]+동)/)?.[1] ??
    combined.match(/([가-힣0-9]+동)/)?.[1] ??
    "";
  const floorNumber =
    folderName.match(/(\d+)층/)?.[1] ??
    advertisement.match(/층수\s*:\s*(\d+)층/)?.[1] ??
    "";
  const money = folderName.match(
    /(\d+)\s*-\s*(\d+)\s*-\s*(\d+|포함|없음|무|무료|관리비포함)/i,
  );
  const areaPyeong =
    numberMatch(folderName, /(\d+(?:\.\d+)?)평/) ??
    numberMatch(advertisement, /평수\s*:\s*실\s*(\d+(?:\.\d+)?)평/);
  const toiletCode = folderName.match(
    /T(외부분리|내부분리|층별분리|외부공용|내부공용|외분|내분|층분|외공|내공)/i,
  )?.[1];
  const separatedToiletCodes = [
    "외분",
    "내분",
    "층별분리",
    "층분",
    "외부분리",
    "내부분리",
  ];
  const airConditionerCode = folderName.match(
    /A(시스템|스탠드|벽걸이|유|무)/i,
  )?.[1] as ImportedPropertyDraft["air_conditioner_type"];
  const keyFeature =
    folderName
      .split(/\s+/)
      .find((item) => /가성비|채광|역세권|단독층|신축/.test(item))
      ?.split("-")[0]
      ?.replace(/[가-힣0-9]+역\s*역세권/g, "역세권")
      .replace(/[가-힣0-9]+역세권/g, "역세권") ?? "";

  return {
    title: [dong, floorNumber && `${floorNumber}층`, keyFeature, "사무실"]
      .filter(Boolean)
      .join(" "),
    category:
      /상가/.test(combined) && !/사무실/.test(combined) ? "store" : "office",
    deposit: money
      ? Number(money[1])
      : numberMatch(advertisement, /금액\s*:\s*(\d+)/),
    monthly_rent: money
      ? Number(money[2])
      : numberMatch(advertisement, /금액\s*:\s*\d+\s*\/\s*(\d+)/),
    maintenance_fee: maintenanceFeeMatch(folderName, advertisement),
    private_address: exactAddress,
    public_address: derivePublicAddress(exactAddress),
    exclusive_area:
      numberMatch(advertisement, /전용면적\s*:\s*[\d.]+㎡\s*\/\s*([\d.]+)㎡/) ??
      (areaPyeong ? Number((areaPyeong * 3.3058).toFixed(2)) : null),
    floor: floorNumber ? `${floorNumber}층` : "",
    parking_available: !/P0|주차\s*불가/.test(combined),
    elevator_available: /E유|엘리베이터\s*있/.test(combined),
    available_parking_count:
      numberMatch(folderName, /P(\d+)/) ??
      numberMatch(advertisement, /가능주차\s*:\s*\d+대\s*\/\s*(\d+)대/),
    restroom_type:
      toiletCode && separatedToiletCodes.includes(toiletCode)
        ? "internal_private"
        : "external_shared",
    room_count:
      numberMatch(folderName, /R(\d+)/) ??
      numberMatch(advertisement, /룸\s*\/\s*화장실\s*:\s*(\d+)/),
    restroom_count:
      numberMatch(advertisement, /룸\s*\/\s*화장실\s*:\s*\d+\s*\/\s*(\d+)/) ??
      1,
    air_conditioner_type: airConditionerCode ?? null,
    building_use: textMatch(advertisement, /건축물용도\s*:\s*([^\r\n]+)/),
    approval_date: textMatch(
      advertisement,
      /사용승인일자?\s*:\s*(\d{4}[.-]\d{2}[.-]\d{2})/,
    ).replace(/\./g, "-"),
    supply_area: numberMatch(
      advertisement,
      /공급면적\s*\/\s*전용면적\s*:\s*([\d.]+)㎡/,
    ),
    total_parking_count: numberMatch(
      advertisement,
      /총주차\s*\/\s*가능주차\s*:\s*(\d+)대/,
    ),
    building_direction: textMatch(
      advertisement,
      /(?:건물출입방향|건축물방향)\s*:\s*([^\r\n]+)/,
    ),
    is_violating_building:
      /위반건축(?:여부)?\s*:\s*(위법|위반)/.test(advertisement),
    description: removeBuildingConfirmation(advertisement),
    private_memo: `Google Drive 폴더명: ${folderName.trim()}`,
  };
}

function normalizeHeader(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function isFolderHeader(value: string) {
  return /사진폴더명|폴더명|folder/.test(normalizeHeader(value));
}

function isAdvertisementHeader(value: string) {
  return /광고문|광고글|본문|advertisement|description/.test(
    normalizeHeader(value),
  );
}

function isNumberLabel(value: string) {
  return /^\d+$/.test(value.trim());
}

function isHeaderOnlyRow(row: BulkPropertyInputRow) {
  return isFolderHeader(row.folderName) || isAdvertisementHeader(row.advertisement);
}

function isEmptyNumberOnlyRow(row: BulkPropertyInputRow) {
  return isNumberLabel(row.folderName) && !row.advertisement.trim();
}

function parseDelimitedRows(input: string) {
  const delimiter = input.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && char === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows.filter((items) => items.some((item) => item.trim()));
}

export function parseBulkPropertyRows(input: string): BulkPropertyInputRow[] {
  const rows = parseDelimitedRows(input.trim());
  if (!rows.length) return [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const pairs: Array<{ folderIndex: number; advertisementIndex: number }> =
      [];

    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      if (
        isFolderHeader(row[columnIndex] ?? "") &&
        isAdvertisementHeader(row[columnIndex + 1] ?? "")
      ) {
        pairs.push({
          folderIndex: columnIndex,
          advertisementIndex: columnIndex + 1,
        });
      }
    }

    if (!pairs.length) continue;

    const parsedRows = pairs
      .flatMap((pair, pairIndex) =>
        rows.slice(rowIndex + 1).map((dataRow, dataIndex) => ({
          rowNumber: rowIndex + dataIndex + 2 + pairIndex * 1000,
          folderName: dataRow[pair.folderIndex]?.trim() ?? "",
          advertisement: dataRow[pair.advertisementIndex]?.trim() ?? "",
        })),
      )
      .filter((row) => row.folderName || row.advertisement)
      .filter((row) => !isHeaderOnlyRow(row))
      .filter((row) => !isEmptyNumberOnlyRow(row));

    return parsedRows.map((row, index) => ({
      ...row,
      rowNumber: index + 1,
    }));
  }

  const firstRow = rows[0].map(normalizeHeader);
  const hasHeader =
    firstRow.some((header) => /사진폴더명|폴더명|folder/.test(header)) &&
    firstRow.some((header) =>
      /광고문|광고글|본문|advertisement|description/.test(header),
    );

  const header = hasHeader ? firstRow : [];
  const folderIndex = hasHeader
    ? header.findIndex((value) => /사진폴더명|폴더명|folder/.test(value))
    : 0;
  const advertisementIndex = hasHeader
    ? header.findIndex((value) =>
        /광고문|광고글|본문|advertisement|description/.test(value),
      )
    : 1;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .map((row, index) => ({
      rowNumber: hasHeader ? index + 2 : index + 1,
      folderName: row[folderIndex]?.trim() ?? "",
      advertisement: row[advertisementIndex]?.trim() ?? "",
    }))
    .filter((row) => row.folderName || row.advertisement)
    .filter((row) => !isHeaderOnlyRow(row))
    .filter((row) => !isEmptyNumberOnlyRow(row));
}
