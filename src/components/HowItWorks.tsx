'use client';

import React from 'react';
import { UserCheck, Wallet, QrCode, ArrowRight, ShieldCheck, RefreshCw, Smartphone } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Register & Verify Identity',
      titleKinyarwanda: 'Kwiyandikisha & Kwemeza Umwirondoro',
      description: 'Connect securely using your Rwandan National ID (NID) and facial liveness verification. Your identity is matched against authoritative civil registration records.',
      icon: UserCheck,
      badge: 'NID & Irembo Linked',
      accentColor: 'from-blue-600 to-indigo-600',
      tagColor: 'bg-blue-100 text-blue-800'
    },
    {
      step: '02',
      title: 'Access Centralized Wallet',
      titleKinyarwanda: 'Kugera ku Madosiye yawe Yose',
      description: 'Instantly view your Driving Licence, Carte Jaune (Logbook), Motor Insurance, and RNP Contrôle Technique in one high-security digital vault with expiry radar.',
      icon: Wallet,
      badge: '4 Core Documents',
      accentColor: 'from-[#0066cc] to-[#00a3ff]',
      tagColor: 'bg-sky-100 text-sky-800'
    },
    {
      step: '03',
      title: 'Present Dynamic Anti-Fraud QR',
      titleKinyarwanda: 'Kwereka Polisi Kode ya QR',
      description: 'When stopped at a checkpoint, generate an encrypted, revocable 60-second QR token. Officers scan it to confirm real-time validity with zero risk of screenshot tampering.',
      icon: QrCode,
      badge: '60s Rotating Token',
      accentColor: 'from-emerald-600 to-teal-500',
      tagColor: 'bg-emerald-100 text-emerald-800'
    }
  ];

  return (
    <section className="py-20 bg-slate-50/80 relative border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#0066cc] text-xs font-bold uppercase tracking-wider mb-3">
            Simple on the surface &bull; Secure underneath
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0e1e38] tracking-tight">
            How Rwanda Drive Works
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg">
            A seamless bridge between Rwandan vehicle owners, insurance issuers, and Rwanda National Police traffic enforcement.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.step}
                className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-4xl font-black text-slate-200 group-hover:text-blue-200 transition-colors">
                      {item.step}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.tagColor}`}>
                      {item.badge}
                    </span>
                  </div>

                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${item.accentColor} text-white flex items-center justify-center shadow-md mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>

                  <h3 className="text-xl font-bold text-[#0e1e38] mb-1">
                    {item.title}
                  </h3>
                  <div className="text-xs text-[#0066cc] font-medium mb-3">
                    {item.titleKinyarwanda}
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-slate-500 group-hover:text-[#0066cc] transition-colors">
                  <span>Learn more</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}

        </div>

        {/* Recommended QR Lifecycle callout box */}
        <div className="mt-14 bg-[#0e1e38] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Authoritative Architecture</span>
              </div>
              <h4 className="text-xl font-bold text-white">
                Live Server Verification vs. Static Screenshots
              </h4>
              <p className="text-slate-300 text-sm max-w-2xl">
                Because credentials rotate dynamically, revoked licences or expired insurance policies are detected immediately at roadside stops.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono bg-white/10 px-4 py-3 rounded-2xl border border-white/15">
              <span className="text-blue-300">Document</span>
              <span className="text-slate-400">&rarr;</span>
              <span className="text-yellow-300">Signed Token</span>
              <span className="text-slate-400">&rarr;</span>
              <span className="text-cyan-300">Dynamic QR</span>
              <span className="text-slate-400">&rarr;</span>
              <span className="text-purple-300">Scan</span>
              <span className="text-slate-400">&rarr;</span>
              <span className="text-emerald-400 font-bold">Live Status</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
