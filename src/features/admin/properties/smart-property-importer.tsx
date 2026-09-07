"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import {
  parsePropertyInputs,
  type ImportedPropertyDraft,
} from "@/lib/properties/smart-import";

export type { ImportedPropertyDraft } from "@/lib/properties/smart-import";

export function SmartPropertyImporter({
  onImport,
}: {
  onImport: (draft: ImportedPropertyDraft) => void;
}) {
  const [folderName, setFolderName] = useState("");
  const [advertisement, setAdvertisement] = useState("");

  function importValues() {
    onImport(parsePropertyInputs(folderName, advertisement));
  }

  return (
    <section className="rounded-2xl border-2 border-brand-line bg-brand-soft/60 p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="text-brand-accent" size={21} />
        <h2 className="text-lg font-black">매물정보 자동 입력</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Google Drive 폴더명과 광고문을 붙여넣으면 아래 등록 폼을 자동으로
        채웁니다. 자동 입력 후 내용을 검토하고 저장해 주세요.
      </p>
      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-bold">사진 폴더명</span>
          <input
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            placeholder="가락동158 2층전체 1000-80-5 15평 ..."
            className="h-12 w-full rounded-xl border border-brand-line bg-white px-4 outline-none focus:border-brand-accent"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold">광고문</span>
          <textarea
            value={advertisement}
            onChange={(event) => setAdvertisement(event.target.value)}
            rows={9}
            placeholder="광고문 전체를 붙여넣으세요."
            className="w-full rounded-xl border border-brand-line bg-white p-4 outline-none focus:border-brand-accent"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={importValues}
        disabled={!folderName.trim() && !advertisement.trim()}
        className="mt-4 h-12 rounded-xl bg-brand-accent px-6 font-black text-white disabled:opacity-40"
      >
        자동 입력
      </button>
    </section>
  );
}
