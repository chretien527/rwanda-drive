'use client'

import React, { useState } from 'react'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiService, ApiError } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'driver' | 'officer'>('driver')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Email verification state
  const [needsVerification, setNeedsVerification] = useState(false)
  const [verificationToken, setVerificationToken] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifySuccess, setVerifySuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const loginResponse = await apiService.login(identifier, password)
      const redirectRole = loginResponse.user.role === 'OFFICER' ? 'officer' : 'driver'

      router.push(`/dashboard?role=${redirectRole}`)
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'AUTH_EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true)
      } else {
        setError(err.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifyLoading(true)
    setVerifyError(null)

    try {
      await apiService.verifyEmail(verificationToken)
      setVerifySuccess(true)

      const loginResponse = await apiService.login(identifier, password)
      const redirectRole = loginResponse.user.role === 'OFFICER' ? 'officer' : 'driver'
      router.push(`/dashboard?role=${redirectRole}`)
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed')
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    setResendSuccess(false)
    setVerifyError(null)

    try {
      await apiService.resendVerificationEmail(identifier)
      setResendSuccess(true)
    } catch (err: any) {
      setVerifyError(err.message || 'Could not resend verification code. Please try again later.')
    } finally {
      setResendLoading(false)
    }
  }

  // ── Verification UI ───────────────────────────────────────────────
  if (needsVerification && !verifySuccess) {
    return (
      <>
        <button
          onClick={() => { setNeedsVerification(false); setError(null) }}
          className='inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0e1e38] mb-10 w-fit transition-colors'
        >
          <ArrowLeft className='w-4 h-4' />
          Back to Login
        </button>

        <h1 className='text-[28px] font-bold text-[#0e1e38] tracking-tight'>
          Email Verification
        </h1>
        <p className='text-sm text-slate-500 mt-1.5 mb-8'>
          Enter the 6-digit verification code sent to{' '}
          <span className='font-semibold text-[#0e1e38]'>{identifier}</span>
        </p>

        <form onSubmit={handleVerifyEmail} className='space-y-5'>
          <div>
            <label className='block text-sm font-medium text-[#0e1e38] mb-1.5'>
              Verification Code
            </label>
            <input
              type='text'
              required
              value={verificationToken}
              onChange={(e) => setVerificationToken(e.target.value)}
              placeholder='Enter your 6-digit code'
              className='w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:border-[#0e1e38] focus:ring-1 focus:ring-[#0e1e38]/15 transition-colors bg-white font-mono'
            />
          </div>

          {verifyError && (
            <p className='text-sm text-red-500 font-medium'>{verifyError}</p>
          )}

          <button
            type='submit'
            disabled={verifyLoading}
            className='w-full py-3 rounded-lg bg-[#0e1e38] hover:bg-[#162d4a] text-white text-sm font-semibold transition-colors disabled:opacity-60'
          >
            {verifyLoading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className='mt-6 text-center'>
          <p className='text-sm text-slate-500 mb-2'>Didn&apos;t receive the code?</p>
          <button
            onClick={handleResendVerification}
            disabled={resendLoading}
            className='inline-flex items-center gap-1.5 text-sm font-semibold text-[#0e1e38] hover:underline disabled:opacity-60'
          >
            {resendLoading ? 'Sending...' : 'Resend Verification'}
          </button>
          {resendSuccess && (
            <p className='text-xs text-green-600 font-medium mt-2'>
              Verification email resent! Check your inbox.
            </p>
          )}
        </div>
      </>
    )
  }

  // ── Verification success ──────────────────────────────────────────
  if (verifySuccess) {
    return (
      <div className='text-center py-12'>
        <div className='w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6'>
          <svg className='w-8 h-8 text-green-600' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M4.5 12.75l6 6 9-13.5' />
          </svg>
        </div>
        <h1 className='text-2xl font-bold text-[#0e1e38] mb-2'>Email Verified!</h1>
        <p className='text-sm text-slate-500 mb-6'>
          Your account is now active. Redirecting to your dashboard…
        </p>
        <div className='animate-pulse text-sm text-slate-400'>Loading…</div>
      </div>
    )
  }

  // ── Login form ────────────────────────────────────────────────────
  return (
    <>
      <Link
        href='/'
        className='inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0e1e38] mb-10 w-fit transition-colors'
      >
        <ArrowLeft className='w-4 h-4' />
        Back to Home
      </Link>

      <h1 className='text-[28px] font-bold text-[#0e1e38] tracking-tight'>
        Sign in to your account
      </h1>
      <p className='text-sm text-slate-500 mt-1.5 mb-8'>
        Welcome back — enter your credentials below.
      </p>

      {/* Role toggle */}
      <div className='flex bg-[#f1f4f8] p-1.5 rounded-2xl mb-7'>
        <button
          type='button'
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
          type='button'
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

      <form onSubmit={handleLogin} className='space-y-5'>
        <div>
          <label className='block text-sm font-medium text-[#0e1e38] mb-1.5'>
            {role === 'driver' ? 'Email address' : 'Badge ID'}
          </label>
          <input
            type='text'
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={role === 'driver' ? 'Enter your email' : 'Enter your badge ID'}
            className='w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:border-[#0e1e38] focus:ring-1 focus:ring-[#0e1e38]/15 transition-colors bg-white'
          />
        </div>

        <div>
          <div className='flex justify-between items-center mb-1.5'>
            <label className='block text-sm font-medium text-[#0e1e38]'>
              Password
            </label>
            <Link href='/forgot-password' className='text-xs text-slate-400 hover:text-[#0e1e38] cursor-pointer transition-colors'>
              Forgot password?
            </Link>
          </div>
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter your password'
              className='w-full px-4 py-3 pr-11 rounded-lg border border-slate-200 text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:border-[#0e1e38] focus:ring-1 focus:ring-[#0e1e38]/15 transition-colors bg-white'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'
            >
              {showPassword ? <EyeOff className='w-4.5 h-4.5' /> : <Eye className='w-4.5 h-4.5' />}
            </button>
          </div>
        </div>

        {error && (
          <p className='text-sm text-red-500 font-medium'>{error}</p>
        )}

        <button
          type='submit'
          disabled={loading}
          className='w-full py-3 rounded-lg bg-[#0e1e38] hover:bg-[#162d4a] text-white text-sm font-semibold transition-colors disabled:opacity-60'
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className='text-sm text-slate-500 text-center mt-8'>
        Don&apos;t have an account?{' '}
        <Link href='/register' className='font-semibold text-[#0e1e38] hover:underline'>
          Sign up
        </Link>
      </p>
    </>
  )
}
