'use client';

import React, { useState } from 'react';
import { Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<'driver' | 'officer'>('driver');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [officerBadge, setOfficerBadge] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
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
            Your digital driving credentials, all in one place
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
            Create your account
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 mb-8">
            Register to access the Rwanda Drive portal.
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
          <form onSubmit={handleSignup} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-[#0e1e38] mb-1.5">
                Full name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:border-[#0e1e38] focus:ring-1 focus:ring-[#0e1e38]/15 transition-colors bg-white"
              />
            </div>

            {role === 'driver' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#0e1e38] mb-1.5">
                    Mobile number
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+250 788 000 000"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:border-[#0e1e38] focus:ring-1 focus:ring-[#0e1e38]/15 transition-colors bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0e1e38] mb-1.5">
                    National ID
                  </label>
                  <input
                    type="text"
                    required
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="1 1994 8 0023456 1 45"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:border-[#0e1e38] focus:ring-1 focus:ring-[#0e1e38]/15 transition-colors bg-white"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[#0e1e38] mb-1.5">
                  Badge ID
                </label>
                <input
                  type="text"
                  required
                  value={officerBadge}
                  onChange={(e) => setOfficerBadge(e.target.value)}
                  placeholder="RNP-TFP-0842"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:border-[#0e1e38] focus:ring-1 focus:ring-[#0e1e38]/15 transition-colors bg-white"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#0e1e38] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
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
              {loading ? 'Creating account...' : 'Create account'}
            </button>

          </form>

          {/* Switch to login */}
          <p className="text-sm text-slate-500 text-center mt-8">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#0e1e38] hover:underline">
              Log in
            </Link>
          </p>

        </div>
      </div>

      </div>
    </div>
  );
}
