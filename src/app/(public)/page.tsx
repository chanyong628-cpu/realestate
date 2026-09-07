import { randomUUID } from "node:crypto";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomePropertySections } from "@/components/properties/home-property-sections";
import { getAdminSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminLocationAutoRepair } from "@/features/admin/properties/admin-location-auto-repair";
import { getPublishedProperties } from "@/lib/properties/queries";
import { derivePublicAddress } from "@/lib/properties/address";
import { buildRealEstateAgentJsonLd } from "@/lib/seo";

export default async function HomePage() {
  const [properties, adminSession] = await Promise.all([
    getPublishedProperties(),
    getAdminSession(),
  ]);
  const isAdmin = Boolean(adminSession);
  const locationProperties = isAdmin
    ? (
        (
          await createAdminClient()
            .from("properties")
            .select(
              "id,private_address,public_address,latitude,longitude",
            )
            .neq("private_address", "")
        ).data ?? []
      ).map((property) => {
        const privateAddress = property.private_address ?? "";
        return {
          id: property.id,
          privateAddress,
          publicAddress:
            property.public_address || derivePublicAddress(privateAddress),
          latitude: property.latitude,
          longitude: property.longitude,
        };
      })
    : [];
  const businessJsonLd = buildRealEstateAgentJsonLd();

  return (
    <main className="bg-brand-base">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
      />
      {isAdmin && (
        <AdminLocationAutoRepair properties={locationProperties} />
      )}
      <section className="border-b border-brand-line">
        <div className="mx-auto grid max-w-[1440px] items-center gap-8 px-5 py-10 sm:px-6 md:py-14 lg:grid-cols-[.86fr_1.14fr] lg:px-8 lg:py-16">
          <div className="order-2 lg:order-1">
            <p className="text-lg font-bold tracking-[-0.025em] text-brand-ink sm:text-xl">
              송파구 사무실 · 상가 전문
            </p>
            <h1 className="mt-4 text-[42px] leading-[1.12] font-black tracking-[-0.045em] text-brand-ink sm:text-6xl lg:text-[68px]">
              신뢰를 중개합니다.
              <br />
              <span className="text-brand-accent">C.Y 부동산</span>
            </h1>
            <Link
              href="#properties"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-brand-accent px-6 font-bold text-white transition hover:bg-brand-accent-dark"
            >
              매물 둘러보기 <ArrowRight size={18} />
            </Link>
          </div>
          <div className="order-1 overflow-hidden rounded-xl bg-brand-soft lg:order-2">
            <Image
              src="/images/office-hero.png"
              alt="밝고 현대적인 프리미엄 오피스"
              width={1536}
              height={1024}
              priority
              sizes="(max-width: 1024px) 100vw, 56vw"
              className="aspect-[16/9] w-full object-cover lg:aspect-[1.55/1]"
            />
          </div>
        </div>
      </section>
      <HomePropertySections
        properties={properties}
        isAdmin={isAdmin}
        shuffleSeed={randomUUID()}
      />
    </main>
  );
}
