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
import { SolutionSection } from "@/components/sections/SolutionSection";
import { UseCaseSection } from "@/components/sections/UseCaseSection";

export default function Home() {
  return (
    <div className="site-shell">
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
        <FinalCtaSection />
      </main>
      <Footer />
      <MobileStickyCta />
    </div>
  );
}
