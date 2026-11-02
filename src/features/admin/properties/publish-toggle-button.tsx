"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setPropertyPublishedAction } from "./actions";

export function PublishToggleButton({
  id,
  isPublished,
}: {
  id: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      await setPropertyPublishedAction(id, !isPublished);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50 ${
        isPublished
          ? "border-[#14213d] bg-[#14213d] text-white"
          : "border-stone-300 bg-stone-100 text-stone-600"
      }`}
    >
      {pending ? "변경 중" : `사이트 노출 ${isPublished ? "ON" : "OFF"}`}
    </button>
  );
}
