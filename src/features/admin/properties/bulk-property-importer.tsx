"use client";

import { FileSpreadsheet, Upload } from "lucide-react";
import { useActionState, useMemo, useRef, useState } from "react";
import { bulkCreatePropertiesAction } from "./actions";
import {
  parseBulkPropertyRows,
  parsePropertyInputs,
} from "@/lib/properties/smart-import";

const fixedExcelRanges = [
  ["B8", "C8"],
  ["E8", "F8"],
  ["H8", "I8"],
  ["K8", "L8"],
  ["N8", "O8"],
  ["Q8", "R8"],
  ["T8", "U8"],
  ["W8", "X8"],
  ["Z8", "AA8"],
  ["AC8", "AD8"],
] as const;

function formatPrice(deposit: number | null, rent: number | null) {
  return `보증금 ${deposit?.toLocaleString() ?? "-"}만원 / 월세 ${
    rent?.toLocaleString() ?? "-"
  }만원`;
}

function cellText(value: unknown) {
  const text = String(value ?? "").trim();
  return text.startsWith('"') && text.endsWith('"') && text.length >= 2
    ? text.slice(1, -1).replace(/""/g, '"').trim()
    : text;
}

function tsvCell(value: string) {
  const escaped = value.replace(/"/g, '""');
  return /[\t\r\n"]/.test(escaped) ? `"${escaped}"` : escaped;
}

function valuesToImportText(
  items: Array<{ folderName: string; advertisement: string }>,
) {
  return [
    "사진폴더명\t광고문",
    ...items.map(
      ({ folderName, advertisement }) =>
        `${tsvCell(folderName)}\t${tsvCell(advertisement)}`,
    ),
  ].join("\n");
}

export function BulkPropertyImporter() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(
    bulkCreatePropertiesAction,
    {},
  );

  const preview = useMemo(() => {
    return parseBulkPropertyRows(text).map((row) => ({
      ...row,
      draft: parsePropertyInputs(row.folderName, row.advertisement),
    }));
  }, [text]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setFileError("");

    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = sheetName ? workbook.Sheets[sheetName] : null;

      if (!sheet) {
        setFileError("엑셀 첫 번째 시트를 읽지 못했습니다.");
        return;
      }

      const fixedRows = fixedExcelRanges
        .map(([folderCell, advertisementCell]) => ({
          folderName: cellText(sheet[folderCell]?.w ?? sheet[folderCell]?.v),
          advertisement: cellText(
            sheet[advertisementCell]?.w ?? sheet[advertisementCell]?.v,
          ),
        }))
        .filter((row) => row.folderName && row.advertisement);
      const parsedText = valuesToImportText(fixedRows);
      const parsedRows = parseBulkPropertyRows(parsedText);

      if (!parsedRows.length) {
        setFileError(
          "등록할 매물을 찾지 못했습니다. B8/C8, E8/F8 ... 지정 셀에 값을 넣었는지 확인해 주세요.",
        );
        return;
      }

      setText(parsedText);
    } catch (error) {
      console.error(error);
      setFileError("엑셀 파일을 읽지 못했습니다. .xlsx 파일인지 확인해 주세요.");
    }
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-2xl border-2 border-blue-200 bg-blue-50/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-[#155EEF]" size={24} />
            <h2 className="text-xl font-black">EXCEL 일괄등록</h2>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#155EEF] px-5 text-sm font-black text-white hover:bg-[#0F4CBB]"
            >
              <Upload size={17} />
              Excel 업로드
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          엑셀 파일을 업로드하면 정해진 셀만 읽습니다. 등록 시 사진은 비워두고, 입주가능일은 자동으로
          <b> 즉시입주</b>로 저장됩니다.
        </p>
        {fileName && (
          <p className="mt-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#155EEF]">
            선택한 파일: {fileName}
          </p>
        )}
        {fileError && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {fileError}
          </p>
        )}
        <div className="mt-5 overflow-hidden rounded-xl border border-blue-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50 text-stone-600">
              <tr>
                <th className="px-4 py-3">사진폴더명</th>
                <th className="px-4 py-3">광고문</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-blue-100">
                <td className="px-4 py-3 text-stone-500">
                  사진폴더명: B8, E8, H8, K8, N8, Q8, T8, W8, Z8, AC8
                </td>
                <td className="px-4 py-3 text-stone-500">
                  광고문: C8, F8, I8, L8, O8, R8, U8, X8, AA8, AD8
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <form action={action} className="space-y-6">
        <label className="block rounded-2xl bg-white p-6 shadow-sm">
          <span className="mb-2 block text-lg font-black">
            엑셀 내용 확인 / 직접 붙여넣기
          </span>
          <p className="text-sm text-stone-500">
            Excel 업로드를 하면 이 칸에 자동으로 내용이 들어옵니다. 필요하면
            여기서 직접 수정한 뒤 등록해도 됩니다.
          </p>
          <textarea
            name="excel_rows"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={14}
            placeholder={`사진폴더명\t광고문\n가락동158 2층전체 1000-80-5 15평 ...\t광고문 전체`}
            className="mt-3 w-full rounded-xl border border-stone-300 bg-white p-4 text-sm outline-none focus:border-forest-600 focus:ring-3 focus:ring-forest-100"
          />
        </label>

        {!!preview.length && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">등록 미리보기</h2>
                <p className="mt-1 text-sm text-stone-500">
                  총 {preview.length}개 매물이 등록됩니다.
                </p>
              </div>
              <button
                disabled={pending}
                className="h-12 rounded-xl bg-forest-700 px-6 font-black text-white hover:bg-forest-900 disabled:opacity-50"
              >
                {pending ? "등록 중..." : `${preview.length}개 일괄 등록`}
              </button>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500">
                    <th className="px-4 py-3">줄</th>
                    <th className="px-4 py-3">매물명</th>
                    <th className="px-4 py-3">주소</th>
                    <th className="px-4 py-3">금액</th>
                    <th className="px-4 py-3">입주</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map(({ rowNumber, draft }) => (
                    <tr key={rowNumber} className="border-b border-stone-100">
                      <td className="px-4 py-3 font-bold">{rowNumber}</td>
                      <td className="px-4 py-3 font-bold">
                        {draft.title || "신규 매물"}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {draft.public_address || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {formatPrice(draft.deposit, draft.monthly_rent)}
                      </td>
                      <td className="px-4 py-3 text-forest-700">즉시입주</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!preview.length && (
          <p className="rounded-xl bg-white px-5 py-4 text-sm font-bold text-stone-500 shadow-sm">
            엑셀 내용을 붙여넣으면 등록 미리보기가 표시됩니다.
          </p>
        )}

        {state.error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700"
          >
            {state.error}
          </p>
        )}

        {state.createdCount && (
          <p className="rounded-xl bg-forest-50 px-4 py-3 font-bold text-forest-700">
            {state.createdCount}개 매물이 등록되었습니다. 매물 관리에서
            사진을 추가해 주세요.
          </p>
        )}
      </form>
    </div>
  );
}
