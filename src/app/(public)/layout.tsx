import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { InquiryQuickLink } from "@/components/layout/inquiry-quick-link";
import { FirstPartyAnalytics } from "@/components/analytics/first-party-analytics";
import { PublicContentProtection } from "@/components/layout/public-content-protection";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <PublicContentProtection />
      <FirstPartyAnalytics />
      <PublicHeader />
      {children}
      <InquiryQuickLink />
      <PublicFooter />
    </>
  );
}
