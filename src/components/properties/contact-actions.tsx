"use client";

import { Check, Copy, MessageCircle, Phone, Share2 } from "lucide-react";
import { trackConversion } from "@/components/analytics/google-analytics";
import { useState } from "react";

export function ShareLinkButton({ sharePath }: { sharePath: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const value = new URL(sharePath, window.location.origin).toString();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-brand-line bg-brand-surface px-4 text-sm font-bold text-brand-slate transition hover:border-brand-accent hover:text-brand-accent"
    >
      {copied ? <Check size={18} /> : <Share2 size={18} />}
      {copied ? "복사됨" : "공유하기"}
    </button>
  );
}

export function ContactActions({
  propertyNumber,
  compact = false,
  sharePath,
}: {
  propertyNumber: string;
  compact?: boolean;
  sharePath?: string;
}) {
  const [copied, setCopied] = useState(false);
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "01065465997";
  const message = `안녕하세요. ${propertyNumber} 매물 보고 문의드립니다.`;

  async function copyLink() {
    const value = sharePath
      ? new URL(sharePath, window.location.origin).toString()
      : location.href;
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
    <div className="flex flex-col gap-2.5">
      <a
        href={`tel:${phone}`}
        onClick={() => trackConversion("phone_clicked", { property_number: propertyNumber })}
        className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-brand-accent text-[15px] font-medium text-white"
      >
        <Phone size={18} /> 전화 문의
      </a>
      <a
        href={`sms:${phone}?body=${encodeURIComponent(message)}`}
        onClick={() => trackConversion("sms_clicked", { property_number: propertyNumber })}
        className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl border border-brand-accent bg-brand-surface text-[15px] font-medium text-brand-accent"
      >
        <MessageCircle size={18} /> 문자 문의
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl border border-brand-accent bg-brand-surface text-[15px]! font-medium! text-brand-accent"
      >
        {copied ? <Check size={18} /> : <Copy size={18} />}
        {copied ? "복사됨" : "링크 복사"}
      </button>
    </div>
  );
}
