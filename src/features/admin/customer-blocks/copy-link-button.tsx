"use client";

import { useState } from "react";

export function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(
      `${location.origin}/share/customer-block/${slug}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-lg bg-forest-50 px-3 py-2 text-xs font-bold text-forest-700"
    >
      {copied ? "복사됨" : "공유 링크 복사"}
    </button>
  );
}
