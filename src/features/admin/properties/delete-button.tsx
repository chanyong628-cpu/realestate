"use client";

import { useState } from "react";
import { deletePropertyAction } from "./actions";

export function DeletePropertyButton({
  id,
  propertyNumber,
  redirectTo,
}: {
  id: string;
  propertyNumber: string;
  redirectTo?: string;
}) {
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!window.confirm(`${propertyNumber} 매물을 정말 삭제할까요?`)) return;
    setPending(true);
    try {
      await deletePropertyAction(id);
      if (redirectTo) window.location.href = redirectTo;
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "삭제 중" : "삭제"}
    </button>
  );
}
