'use client';

import { HeroSection } from '@/components/landing-page/HeroSection';
import { FlowSteps } from '@/components/landing-page/FlowSteps';
import { Footer } from '@/components/landing-page/Footer';
import { WelcomeToast } from '@/components/WelcomeToast';

export default function LandingPage() {
  return (
    <main>
      <WelcomeToast />
      <HeroSection />
      <FlowSteps />
      {/* <ExamGrid /> ← Removed this section */}
      <Footer />
    </main>
  );
}
