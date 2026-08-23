import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileStickyCta } from "@/components/layout/MobileStickyCta";
import { DataTrustSection } from "@/components/sections/DataTrustSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { FeatureSection } from "@/components/sections/FeatureSection";
import { FinalCtaSection } from "@/components/sections/FinalCtaSection";
import { FlowSection } from "@/components/sections/FlowSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { InfoChecklistSection } from "@/components/sections/InfoChecklistSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { ReviewSection } from "@/components/sections/ReviewSection";
import { SiteStructuredData } from "@/components/seo/SiteStructuredData";
import { SolutionSection } from "@/components/sections/SolutionSection";
import { UseCaseSection } from "@/components/sections/UseCaseSection";
import { SITE_DESCRIPTION, createPublicMetadata } from "@/lib/seo";

export const revalidate = 60;
export const metadata: Metadata = createPublicMetadata({
  title: "땅뷰 서비스 소개",
  description: SITE_DESCRIPTION,
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="site-shell">
      <SiteStructuredData />
      <Header />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <FeatureSection />
        <DataTrustSection />
        <InfoChecklistSection />
        <FlowSection />
        <UseCaseSection />
        <FaqSection />
        <ReviewSection />
        <FinalCtaSection />
      </main>
      <Footer />
      <MobileStickyCta />
    </div>
  );
}
