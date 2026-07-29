import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { InquiryQuickLink } from "@/components/layout/inquiry-quick-link";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <PublicHeader />
      {children}
      <InquiryQuickLink />
      <PublicFooter />
    </>
  );
}
