"use client";

import { useState } from "react";
import { deleteInquiryAction } from "./actions";

export function DeleteInquiryButton({
  id,
  businessType,
}: {
  id: string;
  businessType: string;
}) {
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!window.confirm(`${businessType} 문의를 삭제할까요?`)) return;
    setPending(true);
    try {
      await deleteInquiryAction(id);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "삭제 중" : "삭제"}
    </button>
  );
}
