'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  Smartphone, 
  Sparkles, 
  Check,
  Zap,
  Lock,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export const InteractiveShowcase: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [qrTimer, setQrTimer] = useState<number>(58);
  const [isScanTested, setIsScanTested] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      id: 0,
      title: 'Digital Credential Vault',
      headline: 'Instant Access to All Official Documents',
      desc: 'Drivers no longer carry physical cards. Driving Licence, Carte Jaune logbook, Insurance, and Contrôle Technique are securely unified under your National ID.',
      icon: Smartphone,
    },
    {
      id: 1,
      title: 'Anti-Fraud Dynamic QR',
      headline: '60-Second Rotating Cryptographic Nonce',
      desc: 'Generate single-use, rotating QR codes that update continuously. Prevents screenshot forgery and ensures zero disclosure of unnecessary personal details.',
      icon: QrCode,
    },
    {
      id: 2,
      title: 'Instant Officer Verification',
      headline: 'Roadside Checkpoint Verification in <2s',
      desc: 'Traffic officers scan with standard police terminal to retrieve authoritative live status directly from Rwanda National Police and RRA registries.',
      icon: ShieldCheck,
    }
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 text-[#0e1e38] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* LEFT COLUMN: Lifestyle Tablet Mockup (image2.png) */}
          <div className="lg:col-span-6 flex justify-center items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/image2.png"
              alt="Rwanda Drive displayed on a tablet"
              className="w-full max-w-[650px] h-auto rounded-3xl shadow-2xl select-none pointer-events-none transform scale-[1.02] sm:scale-[1.05] lg:scale-[1.08] origin-center"
              draggable={false}
            />
          </div>

          {/* RIGHT COLUMN: Clean, Bold Typography & Interactive Controls (No clutter underneath buttons) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            {/* Main Title */}
            <div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0e1e38] tracking-tight leading-tight">
                How Rwanda Drive Operates
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
                Interact with the prototype to experience how vehicle credentials flow securely between drivers and road enforcement.
              </p>
            </div>

            {/* Step Selector Pills (Bigger, Bolder, Darker #0e1e38) */}
            <div className="flex flex-wrap gap-3.5 pt-1">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => { setActiveStep(step.id); setIsScanTested(false); }}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm sm:text-base font-extrabold transition-all cursor-pointer shadow-sm ${
                      isActive
                        ? 'bg-[#0e1e38] text-white shadow-xl scale-102 ring-2 ring-[#0e1e38]/20'
                        : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-[#0e1e38] border-2 border-slate-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                    <span>{step.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Phase Details (Bigger typography, fits perfectly, no extra clutter) */}
            <div className="space-y-4 pt-2">
              <h3 className="text-2xl sm:text-3xl font-black text-[#0e1e38] leading-tight">
                {steps[activeStep].headline}
              </h3>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
                {steps[activeStep].desc}
              </p>

              {/* Interactive Controls */}
              <div className="pt-2">
                {activeStep === 0 && (
                  <div className="grid grid-cols-2 gap-3 max-w-lg">
                    <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
                      <span className="text-[11px] uppercase font-extrabold text-slate-400 block">Driving Licence</span>
                      <strong className="text-base font-black text-[#0e1e38]">Valid &bull; Category B</strong>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
                      <span className="text-[11px] uppercase font-extrabold text-slate-400 block">Carte Jaune Logbook</span>
                      <strong className="text-base font-black text-[#0e1e38]">RAB 123A &bull; Active</strong>
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm flex items-center justify-between gap-4 max-w-lg">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-[#0e1e38] rounded-xl flex items-center justify-center text-white shadow">
                        <QrCode className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-[#0e1e38]">Rotating Security Token</div>
                        <div className="text-xs text-slate-500 font-medium">
                          Regenerates in <strong className="font-mono text-[#0e1e38] text-sm">{qrTimer}s</strong>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-[#0e1e38] border border-slate-200">
                      ECDSA-256
                    </span>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="max-w-lg space-y-3">
                    {!isScanTested ? (
                      <button
                        onClick={() => setIsScanTested(true)}
                        className="w-full py-4 bg-[#0e1e38] hover:bg-[#182e52] text-white rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2.5"
                      >
                        <ShieldCheck className="w-5 h-5" />
                        <span>Simulate 2-Second Roadside Police Scan</span>
                      </button>
                    ) : (
                      <div className="p-4.5 bg-white text-[#0e1e38] rounded-2xl border-2 border-slate-200 shadow-sm space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-sm font-black text-[#0e1e38] flex items-center gap-2">
                            <Check className="w-5 h-5 stroke-[3] text-emerald-600" />
                            Police Checkpoint Matched
                          </span>
                          <span className="text-xs text-slate-500 font-semibold">&lt; 1.2s Response</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          All 4 digital credentials verified against Rwanda National Police authoritative node.
                        </p>
                        <button
                          onClick={() => setIsScanTested(false)}
                          className="mt-2 text-xs font-bold text-[#0e1e38] underline underline-offset-4"
                        >
                          Reset Demo
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
