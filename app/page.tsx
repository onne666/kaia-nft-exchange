"use client"

import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { StatsSection } from "@/components/stats-section"
import { RedemptionCard } from "@/components/redemption-card"
import { FeaturesSection } from "@/components/features-section"
import { TimelineSection } from "@/components/timeline-section"
import { FAQSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"
import { WalletModal } from "@/components/wallet-modal"

export default function KaiaAnniversaryPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="pt-14 md:pt-16">
        {/* Hero with Countdown */}
        <HeroSection />
        {/* NFT Redemption - Right after countdown */}
        <RedemptionCard />
        {/* Stats */}
        <StatsSection />
        {/* Features */}
        <FeaturesSection />
        {/* Timeline */}
        <TimelineSection />
        {/* FAQ */}
        <FAQSection />
        {/* Footer */}
        <Footer />
      </div>
      {/* Wallet Modal - Renders at top level */}
      <WalletModal />
    </main>
  )
}
