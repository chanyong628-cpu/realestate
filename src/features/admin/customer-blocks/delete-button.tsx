"use client";

import { useState } from "react";
import { deleteCustomerBlockAction } from "./actions";

export function DeleteCustomerBlockButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!confirm(`${name} 고객 블록을 삭제할까요?`)) return;
    setPending(true);
    try {
      await deleteCustomerBlockAction(id);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
    >
      {pending ? "삭제 중" : "삭제"}
    </button>
  );
}
