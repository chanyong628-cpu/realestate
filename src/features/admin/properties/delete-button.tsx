"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePropertyAction } from "./actions";

export function DeletePropertyButton({
  id,
  propertyNumber,
  redirectTo,
  className,
}: {
  id: string;
  propertyNumber: string;
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!window.confirm(`${propertyNumber} 매물을 C.Y부동산 사이트에서 영구 삭제할까요?\n사이트에서는 완전히 삭제되고, 매물장 DB에는 OFF로 보존됩니다.\n(사이트로 되돌릴 수 없으며 다시 올리려면 새로 작성해야 합니다.)`)) return;
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
      className={className ?? "whitespace-nowrap rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"}
    >
      {pending ? "처리 중" : "삭제"}
    </button>
  );
}
