'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  RotateCw, 
  QrCode, 
  Check, 
  Lock, 
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export const Hero: React.FC = () => {
  const [mobileTab, setMobileTab] = useState<'preview' | 'qr'>('preview');
  const [isFlipped, setIsFlipped] = useState(false);
  const [tokenTimer, setTokenTimer] = useState(58);
  const [isScanVerified, setIsScanVerified] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTokenTimer((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSimulateScan = () => {
    setIsScanVerified(true);
    setTimeout(() => {
      setIsScanVerified(false);
    }, 4000);
  };

  return (
    <section className="relative overflow-hidden pt-4 pb-8 md:pt-6 md:pb-14 text-[#0e1e38]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 2-Column Split Hero Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: Headline, Text, CTAs, and Entrusted Metrics */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0e1e38] tracking-tight leading-[1.08]">
              Your Driving Documents.{' '}
              <span className="block text-[#2354a8] font-black mt-1 tracking-tight">Instant. Dynamic. Secure.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed font-normal">
              A unified digital credential platform for Rwandan drivers and traffic officers. Access your licence, logbook, and insurance with zero paper clutter.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-1">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0e1e38] text-white font-bold text-sm shadow-xl hover:bg-[#182e52] hover:shadow-2xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 group"
              >
                <span>Access Driver Portal</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-[#0e1e38] font-bold text-sm border-2 border-[#0e1e38] shadow-sm hover:bg-slate-50 transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                <span>Create Free Account</span>
              </Link>
            </div>

            {/* Quick Entrusted Stats Banner */}
            <div className="pt-4 border-t border-slate-200/80 grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-[#0e1e38]">100%</div>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">NIDA Verified</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-[#0e1e38]">60,000+</div>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">Linked Vehicles</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-[#0e1e38]">&lt; 2s</div>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">Instant Roadside Scan</div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Realistic Interactive Smartphone (Positioned 20px Down as Requested) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end lg:pr-2 translate-y-[20px]">
            
            {/* Outer Phone Frame */}
            <div className="relative">
              
              {/* Left Hardware Buttons */}
              <div className="absolute -left-[5px] top-24 w-[4px] h-8 bg-slate-300 rounded-l-md border-l border-slate-400" />
              <div className="absolute -left-[5px] top-36 w-[4px] h-8 bg-slate-300 rounded-l-md border-l border-slate-400" />

              {/* Right Hardware Button */}
              <div className="absolute -right-[5px] top-28 w-[4px] h-10 bg-slate-300 rounded-r-md border-r border-slate-400" />

              {/* Slender Smartphone Chassis */}
              <div className="w-[295px] sm:w-[310px] h-[610px] sm:h-[625px] bg-slate-100 rounded-[48px] p-2.5 shadow-[0_20px_50px_-15px_rgba(14,30,56,0.3)] border-[3px] border-slate-300 relative flex flex-col overflow-hidden ring-1 ring-black/5 transform hover:scale-[1.01] transition-transform duration-300">
                
                {/* Inner Screen with Light Background */}
                <div className="w-full h-full bg-white rounded-[38px] overflow-hidden flex flex-col justify-between relative shadow-inner text-[#0e1e38] border border-slate-200">
                  
                  {/* Dynamic Island & Status Bar */}
                  <div className="pt-2.5 px-4 pb-1 flex items-center justify-between text-[11px] font-bold text-slate-700 shrink-0 z-30 bg-white/90 backdrop-blur-xs">
                    <span className="font-semibold tracking-tight">09:41</span>
                    
                    {/* Dynamic Island Notch */}
                    <div className="w-22 h-3.5 bg-black rounded-full flex items-center justify-between px-2.5 shadow-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="font-semibold">5G</span>
                      <div className="w-3.5 h-2 rounded-xs border border-slate-700 p-0.5 flex items-center">
                        <div className="h-full w-full bg-slate-800 rounded-2xs" />
                      </div>
                    </div>
                  </div>

                  {/* Mobile Screen Body - Showing The Landing Page Experience */}
                  <div className="flex-1 overflow-y-auto px-3.5 py-2 space-y-3 text-xs pb-14 bg-slate-50/60">
                    
                    {/* Mobile Landing Floating Navbar */}
                    <div className="bg-[#0e1e38] text-white rounded-xl px-3 py-1.5 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[#0e1e38] font-black text-[7px]">
                          RW
                        </div>
                        <span className="font-extrabold text-[10px] text-white">Rwanda Drive</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-bold bg-white text-[#0e1e38] px-2 py-0.5 rounded-full">
                          Live Demo
                        </span>
                      </div>
                    </div>

                    {/* Mobile Landing Hero Headline */}
                    <div className="text-center space-y-0.5 pt-0.5">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Digital Mobility Platform
                      </div>
                      <h2 className="text-sm font-black text-[#0e1e38] leading-tight">
                        Your Driving Documents.{' '}
                        <span className="block text-[#2354a8] text-[11px] font-bold">Instant. Dynamic. Secure.</span>
                      </h2>
                    </div>

                    {/* Interactive Widget Toggle inside Mobile Screen */}
                    <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-[9px] font-bold text-slate-600">
                      <button
                        onClick={() => { setMobileTab('preview'); setIsScanVerified(false); }}
                        className={`flex-1 py-1 rounded-lg transition-all ${
                          mobileTab === 'preview' ? 'bg-white text-[#0e1e38] shadow-xs' : 'hover:text-[#0e1e38]'
                        }`}
                      >
                        Licence Card
                      </button>
                      <button
                        onClick={() => { setMobileTab('qr'); setIsScanVerified(false); }}
                        className={`flex-1 py-1 rounded-lg transition-all ${
                          mobileTab === 'qr' ? 'bg-white text-[#0e1e38] shadow-xs' : 'hover:text-[#0e1e38]'
                        }`}
                      >
                        Dynamic QR
                      </button>
                    </div>

                    {/* VIEW 1: DRIVING LICENCE IN PHONE */}
                    {mobileTab === 'preview' && (
                      <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                        
                        {/* Light Mode Licence Card */}
                        <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xs space-y-2 text-left relative">
                          
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Republic of Rwanda</div>
                              <div className="text-[10px] font-black text-[#0e1e38]">DIGITAL DRIVING LICENCE</div>
                            </div>
                            <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-[#0e1e38] text-white font-bold">
                              VALID &bull; CAT B
                            </span>
                          </div>

                          {!isFlipped ? (
                            <div className="flex gap-2 items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                                alt="Jean Paul N."
                                className="w-10 h-10 rounded-lg object-cover border border-slate-300 shrink-0"
                              />
                              <div className="flex-1 min-w-0 text-left space-y-0.5">
                                <div className="text-[10px] font-black truncate text-[#0e1e38]">Jean Paul Nshimiyimana</div>
                                <div className="text-[8px] text-slate-500 font-mono">DL-RWA-2024-98745</div>
                                <div className="text-[8px] text-slate-400">NID: 1 1994 8 0023456 1 45</div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1 text-[8px] bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Categories:</span>
                                <strong className="text-[#0e1e38]">A, B, D</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Authority:</span>
                                <span className="text-[#0e1e38]">RNP Muhima HQ</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Security:</span>
                                <span className="font-mono text-[#0e1e38]">ECDSA-256</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[8px]">
                            <button
                              onClick={() => setIsFlipped(!isFlipped)}
                              className="text-[#0e1e38] font-bold hover:underline flex items-center gap-1"
                            >
                              <RotateCw className="w-2.5 h-2.5" />
                              <span>{isFlipped ? 'Show Front' : 'Flip Back Details'}</span>
                            </button>
                            <span className="text-slate-400 font-semibold">Exp: 12 Jan 2026</span>
                          </div>

                        </div>

                        {/* Interactive Buttons */}
                        <div className="space-y-1.5">
                          <button
                            onClick={() => setMobileTab('qr')}
                            className="w-full py-2 bg-[#0e1e38] hover:bg-[#182e52] text-white rounded-xl font-bold text-[10px] shadow transition-all flex items-center justify-center gap-1"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>Present 60s Dynamic QR</span>
                          </button>

                          <button
                            onClick={() => { setMobileTab('qr'); handleSimulateScan(); }}
                            className="w-full py-1.5 bg-white hover:bg-slate-50 text-[#0e1e38] rounded-xl font-bold text-[9px] border border-slate-200 transition-all flex items-center justify-center gap-1"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Simulate Police Roadside Scan</span>
                          </button>
                        </div>

                      </div>
                    )}

                    {/* VIEW 2: DYNAMIC QR IN PHONE */}
                    {mobileTab === 'qr' && (
                      <div className="space-y-2 text-center animate-in fade-in zoom-in-95 duration-200">
                        
                        {!isScanVerified ? (
                          <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xs space-y-1.5">
                            <div className="space-y-0.5">
                              <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                                Anti-Screenshot Rotating Token
                              </div>
                              <div className="text-[8px] text-slate-400">
                                Expires in <strong className="text-[#0e1e38] font-mono">{tokenTimer}s</strong>
                              </div>
                            </div>

                            {/* Rotating QR Matrix */}
                            <div className="p-1.5 bg-slate-50 rounded-xl inline-block border border-slate-200">
                              <div className="w-18 h-18 bg-[#0e1e38] rounded-lg p-1.5 flex flex-col justify-between text-white relative">
                                <div className="grid grid-cols-5 gap-0.5 h-full w-full opacity-90">
                                  {Array.from({ length: 25 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className={`rounded-2xs ${
                                        (i + tokenTimer) % 2 === 0 || (i + tokenTimer) % 3 === 0 ? 'bg-white' : 'bg-transparent'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-4.5 h-4.5 rounded-xs bg-white flex items-center justify-center text-[#0e1e38] shadow">
                                    <ShieldCheck className="w-2.5 h-2.5 text-[#0e1e38]" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={handleSimulateScan}
                              className="w-full py-1.5 bg-[#0e1e38] text-white rounded-xl font-bold text-[9px] shadow transition-all flex items-center justify-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Simulate Police Scan</span>
                            </button>
                          </div>
                        ) : (
                          /* Verification Match Success State */
                          <div className="p-2.5 bg-white text-[#0e1e38] rounded-2xl shadow space-y-1 animate-in fade-in zoom-in-95 duration-150 text-left border border-slate-200">
                            <div className="flex items-center gap-1 pb-1 border-b border-slate-100">
                              <div className="w-4 h-4 rounded-full bg-[#0e1e38] text-white flex items-center justify-center font-bold text-[8px]">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                              <div>
                                <div className="text-[9px] font-black text-[#0e1e38]">POLICE SCAN VERIFIED</div>
                                <div className="text-[7px] text-slate-500">Database Match &bull; &lt;1.2s</div>
                              </div>
                            </div>

                            <div className="space-y-0.5 text-[8px]">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Driver:</span>
                                <strong>Jean Paul N.</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Licence:</span>
                                <span className="font-bold">Category B (VALID)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Insurance:</span>
                                <span className="font-bold">Radiant (Active)</span>
                              </div>
                            </div>

                            <button
                              onClick={() => setIsScanVerified(false)}
                              className="w-full py-1 bg-slate-100 hover:bg-slate-200 text-[#0e1e38] font-bold text-[8px] rounded-lg transition-all"
                            >
                              Reset Demo
                            </button>
                          </div>
                        )}

                      </div>
                    )}

                    {/* Quick Mini Features on Landing Page in Phone */}
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <div className="bg-white p-1.5 rounded-xl border border-slate-200 text-left">
                        <div className="text-[7px] font-bold text-slate-400">Security</div>
                        <div className="text-[9px] font-black text-[#0e1e38]">Zero PII Leak</div>
                      </div>
                      <div className="bg-white p-1.5 rounded-xl border border-slate-200 text-left">
                        <div className="text-[7px] font-bold text-slate-400">Offline</div>
                        <div className="text-[9px] font-black text-[#0e1e38]">Cached ECDSA</div>
                      </div>
                    </div>

                  </div>

                  {/* Light Mode Mobile Home Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-xs border-t border-slate-200 py-2 px-4 flex flex-col items-center z-20">
                    <div className="w-20 h-1 bg-slate-300 rounded-full" />
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
