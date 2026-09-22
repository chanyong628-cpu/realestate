import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { InquiryQuickLink } from "@/components/layout/inquiry-quick-link";
import { FirstPartyAnalytics } from "@/components/analytics/first-party-analytics";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <FirstPartyAnalytics />
      <PublicHeader />
      {children}
      <InquiryQuickLink />
      <PublicFooter />
    </>
  );
}
