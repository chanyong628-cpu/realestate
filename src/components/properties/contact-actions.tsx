"use client";

import { Check, Copy, MessageCircle, Phone } from "lucide-react";
import { trackConversion } from "@/components/analytics/google-analytics";
import { useState } from "react";

export function ContactActions({
  propertyNumber,
  compact = false,
}: {
  propertyNumber: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "01065465997";
  const message = `안녕하세요. ${propertyNumber} 매물 보고 문의드립니다.`;

  async function copyLink() {
    const value = location.href;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (compact) {
    return (
      <>
        <a
          href={`tel:${phone}`}
          onClick={() => trackConversion("phone_clicked", { property_number: propertyNumber })}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-accent font-black text-white"
        >
          <Phone size={18} /> 전화
        </a>
        <a
          href={`sms:${phone}?body=${encodeURIComponent(message)}`}
          onClick={() => trackConversion("sms_clicked", { property_number: propertyNumber })}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-brand-line bg-brand-surface font-black"
        >
          <MessageCircle size={18} /> 문자
        </a>
      </>
    );
  }

  return (
    <>
      <a
        href={`tel:${phone}`}
        onClick={() => trackConversion("phone_clicked", { property_number: propertyNumber })}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-accent font-black text-white"
      >
        <Phone size={18} /> 전화 문의
      </a>
      <a
        href={`sms:${phone}?body=${encodeURIComponent(message)}`}
        onClick={() => trackConversion("sms_clicked", { property_number: propertyNumber })}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-brand-line font-black"
      >
        <MessageCircle size={18} /> 문자 문의
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-line text-xs font-bold"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? "복사됨" : "링크 복사"}
      </button>
    </>
  );
}
