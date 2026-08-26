'use client';

import React, { useState } from 'react';
import { Shield, Menu, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isLoggedIn = false, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-4 inset-x-0 z-50 w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pointer-events-none">
      {/* Floating Nav Bar pinned to top of screen as user scrolls */}
      <nav className="pointer-events-auto bg-[#0e1e38] text-white rounded-2xl px-6 py-4 min-h-[64px] shadow-2xl border border-white/15 flex items-center justify-between transition-all duration-300 backdrop-blur-md">
        
        {/* Brand Logo & Name */}
        <Link 
          href="/"
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#0e1e38] shadow-md group-hover:scale-105 transition-transform font-bold">
            <Shield className="w-4 h-4 text-[#0e1e38]" />
          </div>
          <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
            Rwanda Drive
          </span>
        </Link>

        {/* Center Public Nav Links */}
        {!isLoggedIn ? (
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#overview" className="hover:text-white transition-colors">
              Overview
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#entrusted-users" className="hover:text-white transition-colors">
              Entrusted Drivers
            </a>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-300">
            <Link href="/dashboard" className="text-white hover:underline">
              Dashboard View
            </Link>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {!isLoggedIn ? (
            <>
              <Link 
                href="/login" 
                className="hidden sm:inline-flex text-xs font-bold text-slate-200 hover:text-white transition-colors px-3 py-2"
              >
                Sign In
              </Link>
              
              <Link
                href="/login"
                className="bg-white hover:bg-slate-100 text-[#0e1e38] text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-1.5 transform hover:scale-102"
              >
                <span>Driver Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          ) : (
            <button
              onClick={onLogout}
              className="bg-white hover:bg-slate-100 text-[#0e1e38] text-xs font-bold px-4 py-2 rounded-xl transition-all"
            >
              Sign Out
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-white/10 text-white transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </nav>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="pointer-events-auto md:hidden mt-2 bg-[#0e1e38] text-white rounded-2xl p-5 border border-white/15 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-3 text-sm font-semibold text-slate-200">
            <a 
              href="#overview" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-white py-1 transition-colors"
            >
              Overview
            </a>
            <a 
              href="#how-it-works" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-white py-1 transition-colors"
            >
              How It Works
            </a>
            <a 
              href="#features" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-white py-1 transition-colors"
            >
              Features
            </a>
            <a 
              href="#entrusted-users" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-white py-1 transition-colors"
            >
              Entrusted Drivers
            </a>
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-xs font-bold text-white bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-xs font-bold text-[#0e1e38] bg-white rounded-xl shadow hover:bg-slate-100 transition-all"
            >
              Register Driver Profile
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
