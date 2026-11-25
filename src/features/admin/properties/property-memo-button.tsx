"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// 상세 페이지로 넘어가지 않고 관리자 메모만 팝업(댓글 느낌)으로 보여준다.
export function PropertyMemoButton({
  propertyNumber,
  memo,
}: {
  propertyNumber: string;
  memo: string | null;
}) {
  const [open, setOpen] = useState(false);
  const text = memo?.trim() ?? "";

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-full border bg-white px-5 py-2 text-sm font-black ${text ? "border-amber-300 text-amber-800" : "border-brand-line text-stone-500"}`}
      >
        메모
      </button>
      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${propertyNumber} 관리자 메모`}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[75vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">관리자 메모</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="메모 닫기" className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100">
                <X size={20} />
              </button>
            </div>
            <div className="mt-3 rounded-2xl rounded-tl-sm bg-amber-50 px-4 py-3 text-sm leading-6 whitespace-pre-wrap text-stone-800">
              {text || "등록된 관리자 메모가 없습니다."}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
