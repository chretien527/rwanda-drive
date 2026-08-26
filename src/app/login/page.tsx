'use client';

import React, { useState } from 'react';
import { Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'driver' | 'officer'>('driver');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push(`/dashboard?role=${role}`);
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-speckle-pattern font-sans p-6">
      <div className="w-full max-w-[80vw] min-h-[85vh] flex rounded-2xl overflow-hidden shadow-lg border border-slate-200/60 bg-white">

      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[44%] bg-[#0e1e38] text-white flex-col items-center justify-center p-12 relative">
        <div className="flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-center">
            Rwanda Drive
          </h2>
          <p className="text-sm text-slate-400 text-center max-w-[240px] leading-relaxed">
            Access your digital driving credentials
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12 max-w-[520px] w-full mx-auto">

          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0e1e38] mb-10 w-fit transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Heading */}
          <h1 className="text-[28px] font-bold text-[#0e1e38] tracking-tight">
            Sign in to your account
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 mb-8">
            Welcome back — enter your credentials below.
          </p>

          {/* Role toggle */}
          <div className="flex bg-[#f1f4f8] p-1.5 rounded-2xl mb-7">
            <button
              type="button"
              onClick={() => setRole('driver')}
              className={`flex-1 py-2.5 text-sm font-bold transition-all rounded-xl ${
                role === 'driver'
                  ? 'bg-white text-[#0e1e38] shadow-sm'
                  : 'text-slate-500 hover:text-[#0e1e38]'
              }`}
            >
              Driver
            </button>
            <button
              type="button"
              onClick={() => setRole('officer')}
              className={`flex-1 py-2.5 text-sm font-bold transition-all rounded-xl ${
                role === 'officer'
                  ? 'bg-white text-[#0e1e38] shadow-sm'
                  : 'text-slate-500 hover:text-[#0e1e38]'
              }`}
            >
              Police Officer
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-[#0e1e38] mb-1.5">
                {role === 'driver' ? 'Mobile number or email' : 'Badge ID'}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === 'driver' ? 'Enter your phone or email' : 'Enter your badge ID'}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:border-[#0e1e38] focus:ring-1 focus:ring-[#0e1e38]/15 transition-colors bg-white"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-[#0e1e38]">
                  Password
                </label>
                <span className="text-xs text-slate-400 hover:text-[#0e1e38] cursor-pointer transition-colors">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 rounded-lg border border-slate-200 text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:border-[#0e1e38] focus:ring-1 focus:ring-[#0e1e38]/15 transition-colors bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#0e1e38] hover:bg-[#162d4a] text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

          </form>

          {/* Switch to signup */}
          <p className="text-sm text-slate-500 text-center mt-8">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-[#0e1e38] hover:underline">
              Sign up
            </Link>
          </p>

        </div>
      </div>

      </div>
    </div>
  );
}
