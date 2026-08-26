'use client';

import React from 'react';
import { Shield, Lock, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0e1e38] text-slate-400 text-sm border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#0e1e38] shadow font-bold">
                <Shield className="w-4 h-4 text-[#0e1e38]" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Rwanda Drive
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
              Minimalist, cryptographically verified digital driver and vehicle documentation platform designed for the roads of Rwanda.
            </p>

            <div className="inline-flex items-center gap-2 text-xs text-white font-medium bg-white/10 border border-white/10 px-3 py-1 rounded-full">
              <Lock className="w-3.5 h-3.5" />
              <span>Smart Rwanda Digital Blueprint</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#overview" className="hover:text-white transition-colors">
                  Overview
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Platform Features
                </a>
              </li>
              <li>
                <a href="#entrusted-users" className="hover:text-white transition-colors">
                  Entrusted Community
                </a>
              </li>
            </ul>
          </div>

          {/* Account & Access */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
              Access Portal
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/login" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Sign In</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Create Account</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Police Verifier</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Prototype Disclaimer */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 mb-8">
          <div className="font-bold text-white mb-1">Prototype Notice</div>
          <p className="leading-relaxed">
            Independent technology demonstration of unified Rwandan digital vehicle credentials. Uses simulated client-side data for proof of concept.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} Rwanda Drive. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Privacy Law Compliant</span>
            <span>&bull;</span>
            <span>Kigali, Rwanda</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
