"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!window.confirm(`${propertyNumber} 매물을 사이트에서 내릴까요?\n매물 DB에는 보존되고 노출만 OFF 됩니다.`)) return;
    setPending(true);
    try {
      await deletePropertyAction(id);
      if (redirectTo) window.location.href = redirectTo;
      else router.refresh();
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
      {pending ? "처리 중" : "삭제"}
    </button>
  );
}
