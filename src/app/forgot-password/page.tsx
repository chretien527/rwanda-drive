'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft, MailCheck, KeyRound, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiService, ApiError } from '@/lib/api';

type Step = 'request' | 'reset';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [toastExiting, setToastExiting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastExiting(false);
    setToast({ message, type });
  };

  const dismissToast = () => {
    setToastExiting(true);
    setTimeout(() => setToast(null), 300);
  };

  // Auto-dismiss toast and redirect after success
  useEffect(() => {
    if (toast?.type === 'success' && toast.message.includes('Password')) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, router]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiService.forgotPassword(email);
      setStep('reset');
      showToast('Reset token sent! Check your email (or server logs).');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiService.resetPassword(token, newPassword);
      showToast('Password reset successfully! Redirecting to login…', 'success');
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-speckle-pattern font-sans p-6">
      <div className="w-full max-w-[80vw] min-h-[85vh] flex rounded-2xl overflow-hidden shadow-lg border border-slate-200/60 bg-white">

        {/* Left branding panel */}
        <div className="hidden lg:flex lg:w-[44%] bg-[#0e1e38] text-white flex-col items-center justify-center p-12 relative">
          <div className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
              {step === 'request' ? (
                <MailCheck className="w-9 h-9 text-white" />
              ) : (
                <KeyRound className="w-9 h-9 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-center">
              {step === 'request' ? 'Reset Your Password' : 'Set New Password'}
            </h2>
            <p className="text-sm text-slate-400 text-center max-w-[240px] leading-relaxed">
              {step === 'request'
                ? "Enter your email and we'll send you a reset token."
                : 'Paste the reset token from your email and choose a new password.'}
            </p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12 max-w-[520px] w-full mx-auto">

            {/* Back link */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0e1e38] mb-10 w-fit transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>

            {/* ── Toast ────────────────────────────────────────── */}
            {toast && (
              <div
                className={`fixed top-6 right-6 z-50 flex items-center gap-3 w-full max-w-sm px-4 py-3 rounded-xl shadow-lg border transition-all duration-300
                  ${toastExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
                  ${toast.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                  }`}
              >
                <CheckCircle className="w-5 h-5 shrink-0 text-green-500" />
                <p className="text-sm font-medium flex-1">{toast.message}</p>
                <button
                  onClick={dismissToast}
                  className="shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Heading */}
            <h1 className="text-[28px] font-bold text-[#0e1e38] tracking-tight">
              {step === 'request' ? 'Forgot your password?' : 'Set a new password'}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 mb-8">
              {step === 'request'
                ? "No worries — enter your email and we'll send a reset token."
                : `Enter the reset token sent to ${email} and choose a new password.`}
            </p>

            {error && (
              <p className="text-sm text-red-500 font-medium mb-4">{error}</p>
            )}

            {/* Step 1: Request reset */}
            {step === 'request' && (
              <form onSubmit={handleRequestReset} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#0e1e38] mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:border-[#0e1e38] focus:ring-1 focus:ring-[#0e1e38]/15 transition-colors bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-[#0e1e38] hover:bg-[#162d4a] text-white text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {loading ? 'Sending...' : 'Send Reset Token'}
                </button>
              </form>
            )}

            {/* Step 2: Enter token + new password */}
            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#0e1e38] mb-1.5">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste your reset token here"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:border-[#0e1e38] focus:ring-1 focus:ring-[#0e1e38]/15 transition-colors bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0e1e38] mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
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
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
