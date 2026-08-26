'use client';

import React from 'react';
import { 
  FileCheck2, 
  QrCode, 
  BellRing, 
  CarFront, 
  EyeOff, 
  WifiOff 
} from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export const FeaturesGrid: React.FC = () => {
  const features = [
    {
      title: 'Digital Credential Wallet',
      description: 'Unified storage for Driving Licence, Carte Jaune (Logbook), Radiant/Sanlam Insurance, and RNP Contrôle Technique.',
      icon: FileCheck2,
      direction: 'left' as const,
    },
    {
      title: 'Anti-Fraud Dynamic QR',
      description: 'Rotating 60-second cryptographic tokens prevent screenshot counterfeits and ensure roadside verifiability.',
      icon: QrCode,
      direction: 'up' as const,
    },
    {
      title: 'Proactive Expiry Radar',
      description: 'Automated 30-day and 7-day alerts before annual vehicle inspection or insurance policy expiration.',
      icon: BellRing,
      direction: 'right' as const,
    },
    {
      title: 'Multi-Vehicle Fleet',
      description: 'Manage personal passenger cars, commercial transport vehicles, and motorcycles under a single verified NID profile.',
      icon: CarFront,
      direction: 'left' as const,
    },
    {
      title: 'Minimal Disclosure Privacy',
      description: 'Checkpoint officers only receive necessary road compliance validation without harvesting unrelated personal data.',
      icon: EyeOff,
      direction: 'up' as const,
    },
    {
      title: 'Offline Resilient Cache',
      description: 'Essential credentials remain accessible even in remote areas with spotty network coverage using encrypted storage.',
      icon: WifiOff,
      direction: 'right' as const,
    }
  ];

  return (
    <section 
      id="features" 
      className="relative py-24 border-t border-slate-200 overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(248, 250, 252, 0.72), rgba(241, 245, 249, 0.78)), url('/image3.png')`,
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Subtle ambient light glow */}
      <div className="absolute inset-0 bg-radial-gradient from-white/30 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0e1e38] bg-white/80 px-4 py-1.5 rounded-full border border-[#0e1e38]/15 shadow-sm backdrop-blur-md">
            Engineered for Rwanda
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0e1e38] tracking-tight mt-4">
            Core Platform Capabilities
          </h2>
          <p className="mt-4 text-slate-700 text-base sm:text-lg font-medium">
            Purpose-built for Rwandan transport regulations, vehicle owners, and law enforcement workflows.
          </p>
        </div>

        {/* 6 Features Grid in glassmorphism with scroll animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <ScrollReveal
                key={idx}
                direction={feat.direction}
                delay={idx * 80}
                duration={650}
              >
                <div className="h-full p-8 rounded-3xl bg-white/95 backdrop-blur-md border border-white/40 hover:border-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between shadow-lg">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#0e1e38] text-white flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0e1e38] mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-[#0e1e38]">
                    <span>Built for Rwanda Mobility</span>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

      </div>
    </section>
  );
};
