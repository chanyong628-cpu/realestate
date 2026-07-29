import Link from "next/link";
import { MessageSquareText } from "lucide-react";

export function InquiryQuickLink() {
  return (
    <Link
      href="/inquiry"
      className="fixed top-1/2 left-0 z-30 flex -translate-y-1/2 flex-col items-center gap-2 rounded-r-xl bg-[#0B1B3A] px-3 py-4 text-xs font-bold text-white shadow-xl transition hover:bg-[#155EEF] max-sm:top-auto max-sm:bottom-5 max-sm:left-4 max-sm:translate-y-0 max-sm:flex-row max-sm:rounded-full max-sm:px-5 max-sm:py-3"
    >
      <MessageSquareText size={19} />
      <span className="max-sm:hidden">맞<br />춤<br />문<br />의</span>
      <span className="sm:hidden">맞춤 문의</span>
    </Link>
  );
}
