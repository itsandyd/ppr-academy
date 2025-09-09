import { StickyNav } from "./_components/sticky-nav";
import { HeroEnhanced } from "./_components/hero-enhanced";
import { SocialProofStrip } from "./_components/social-proof-strip";
import { DashboardShowcase } from "./_components/dashboard-showcase";
import { FeatureGrid } from "./_components/feature-grid";
import { IntegrationsSplit } from "./_components/integrations-split";
import { NoCodeBanner } from "./_components/no-code-banner";
import { Pricing } from "./_components/pricing";
import { ResultsGallery } from "./_components/results-gallery";
import { TrustpilotReviews } from "./_components/trustpilot-reviews";
import { ComparisonChecklist } from "./_components/comparison-checklist";
import { FinalCTA } from "./_components/final-cta";
import { Footer } from "./_components/footer";

// Force dynamic rendering to avoid build-time Clerk issues
export const dynamic = 'force-dynamic';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <HeroEnhanced />
      <SocialProofStrip />
      <DashboardShowcase />
      <FeatureGrid />
      <IntegrationsSplit />
      <NoCodeBanner />
      <Pricing />
      <ResultsGallery />
      <TrustpilotReviews />
      <ComparisonChecklist />
      <FinalCTA />
      <Footer />
    </div>
  );
}
