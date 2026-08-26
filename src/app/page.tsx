'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { InteractiveShowcase } from '@/components/InteractiveShowcase';
import { FeaturesGrid } from '@/components/FeaturesGrid';
import { SocialProof } from '@/components/SocialProof';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-speckle-pattern text-[#0e1e38] selection:bg-[#0e1e38] selection:text-white overflow-x-hidden">
      
      {/* Minimalist Floating Top Navbar */}
      <Navbar />

      {/* Main Landing Flow */}
      <main className="flex-1 w-full pt-20">
        
        {/* SECTION 1: HERO (2-column split with realistic mobile interactive simulator) */}
        <section id="overview" className="w-full">
          <ScrollReveal direction="up" duration={800}>
            <Hero />
          </ScrollReveal>
        </section>

        {/* SECTION 2: DYNAMIC INTERACTIVE SHOWCASE */}
        <ScrollReveal direction="scale" delay={100} duration={850}>
          <InteractiveShowcase />
        </ScrollReveal>

        {/* SECTION 3: PLATFORM CAPABILITIES */}
        <ScrollReveal direction="left" delay={150} duration={800}>
          <FeaturesGrid />
        </ScrollReveal>

        {/* SECTION 4: ENTRUSTED USERS & VERIFIED COMMUNITY */}
        <ScrollReveal direction="right" delay={150} duration={800}>
          <SocialProof />
        </ScrollReveal>

      </main>

      {/* Minimalist Footer */}
      <ScrollReveal direction="up" delay={100}>
        <Footer />
      </ScrollReveal>

    </div>
  );
}
