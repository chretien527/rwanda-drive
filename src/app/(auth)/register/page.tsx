'use client'

import React, { useState, useCallback } from 'react'
import { Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiService, ApiError } from '@/lib/api'

// Rwanda phone: +250XXXXXXXXX, 07XXXXXXXX, 08XXXXXXXX, 250XXXXXXXXX
const RW_PHONE_REGEX = /^(\+250|250)?(7[0-9]{8}|8[0-9]{8})$/

// Rwanda National ID: 16 digits (after removing spaces), first digit is 1 or 2
const RW_NID_REGEX = /^[12]\d{15}$/

function validatePhone(value: string): string | null {
  const normalized = value.replace(/[\s\-]/g, '')
  if (!normalized) return null // phone is optional
  if (!RW_PHONE_REGEX.test(normalized)) {
    return 'Enter a valid Rwandan phone number (e.g. +250 788 123 456)'
  }
  return null
}

function validateNationalId(value: string): string | null {
  const normalized = value.replace(/\s/g, '')
  if (!normalized) return null
  if (!RW_NID_REGEX.test(normalized)) {
    return 'Enter a valid 16-digit National ID (e.g. 1 1994 8 0023456 1 45)'
  }
  return null
}

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<'driver' | 'officer'>('driver')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [officerBadge, setOfficerBadge] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validation errors
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [nidError, setNidError] = useState<string | null>(null)

  // Email verification state
  const [needsVerification, setNeedsVerification] = useState(false)
  const [verificationToken, setVerificationToken] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifySuccess, setVerifySuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  // Signup success animation
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [signupRedirect, setSignupRedirect] = useState(false)

  const handlePhoneChange = useCallback((value: string) => {
    setPhone(value)
    setPhoneError(validatePhone(value))
  }, [])

  const handleNidChange = useCallback((value: string) => {
    setNationalId(value)
    setNidError(validateNationalId(value))
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const newPhoneError = validatePhone(phone)
    const newNidError = validateNationalId(nationalId)
    setPhoneError(newPhoneError)
    setNidError(newNidError)

    if (newPhoneError || newNidError) return
    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }

    setLoading(true)

    try {
      const phoneNumber = role === 'driver' && phone ? phone : undefined

      await apiService.register(email, password, fullName.trim(), phoneNumber)
      setNeedsVerification(true)
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'AUTH_EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true)
      } else {
        setError(err.message || 'Signup failed')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Signup success animation ─────────────────────────────────────
  if (signupSuccess && !signupRedirect) {
    return (
      <div className='text-center py-12'>
        <div className='relative w-20 h-20 mx-auto mb-6'>
          <div className='absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30' />
          <div className='relative w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center'>
            <svg
              className='w-10 h-10 text-green-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2.5}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M4.5 12.75l6 6 9-13.5'
                style={{
                  strokeDasharray: 50,
                  strokeDashoffset: 50,
                  animation: 'draw 0.5s 0.2s ease forwards',
                }}
              />
            </svg>
          </div>
        </div>
        <h1 className='text-2xl font-bold text-[#0e1e38] mb-2'>
          Welcome to Rwanda Drive!
        </h1>
        <p className='text-sm text-slate-500'>
          Your account has been created successfully. Taking you to your
          dashboard…
        </p>
        <div className='mt-6 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden'>
          <div
            className='h-full bg-[#0e1e38] rounded-full'
            style={{
              width: '0%',
              animation: 'progress 1.8s ease-in-out forwards',
            }}
          />
        </div>
        <style jsx>{`
          @keyframes draw {
            to {
              stroke-dashoffset: 0;
            }
          }
          @keyframes progress {
            0% {
              width: 0%;
            }
            100% {
              width: 100%;
            }
          }
        `}</style>
      </div>
    )
  }

  // ── Verification UI ──────────────────────────────────────────────
  if (needsVerification && !verifySuccess) {
    return (
      <>
        <button
          onClick={() => {
            setNeedsVerification(false)
            setError(null)
          }}
          className='inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0e1e38] mb-10 w-fit transition-colors'
        >
          <ArrowLeft className='w-4 h-4' />
          Back to Sign Up
        </button>

        <h1 className='text-[28px] font-bold text-[#0e1e38] tracking-tight'>
          Email Verification Required
        </h1>
        <p className='text-sm text-slate-500 mt-1.5 mb-8'>
          Enter the 6-digit verification code sent to{' '}
          <span className='font-semibold text-[#0e1e38]'>{email}</span>
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setVerifyLoading(true)
            setVerifyError(null)
            try {
              await apiService.verifyEmail(verificationToken)
              setVerifySuccess(true)
              const loginResponse = await apiService.login(email, password)
              const redirectRole =
                loginResponse.user.role === 'OFFICER' ? 'officer' : 'driver'
              router.push(`/dashboard?role=${redirectRole}`)
            } catch (err: any) {
              setVerifyError(err.message || 'Verification failed')
            } finally {
              setVerifyLoading(false)
            }
          }}
          className='space-y-5'
        >
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
            {verifyLoading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <div className='mt-6 text-center'>
          <p className='text-sm text-slate-500 mb-2'>Didn&apos;t receive the code?</p>
          <button
            type='button'
            onClick={async () => {
              setResendLoading(true)
              setResendSuccess(false)
              setVerifyError(null)
              try {
                await apiService.resendVerificationEmail(email)
                setResendSuccess(true)
              } catch (err: any) {
                setVerifyError(err.message || 'Could not resend verification code.')
              } finally {
                setResendLoading(false)
              }
            }}
            disabled={resendLoading}
            className='inline-flex items-center gap-1.5 text-sm font-semibold text-[#0e1e38] hover:underline disabled:opacity-60'
          >
            {resendLoading ? 'Sending...' : 'Resend Verification Code'}
          </button>
          {resendSuccess && (
            <p className='text-xs text-green-600 font-medium mt-2'>
              Verification code resent! Check your inbox.
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
          <Shield className='w-8 h-8 text-green-600' />
        </div>
        <h1 className='text-2xl font-bold text-[#0e1e38] mb-2'>
          Account Activated!
        </h1>
        <p className='text-sm text-slate-500 mb-6'>
          Your email has been verified. Redirecting to your dashboard…
        </p>
        <div className='animate-pulse text-sm text-slate-400'>Loading…</div>
      </div>
    )
  }

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
        Create your account
      </h1>
      <p className='text-sm text-slate-500 mt-1.5 mb-8'>
        Register to access the Rwanda Drive portal.
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

      <form onSubmit={handleSignup} className='space-y-5'>
        <div>
          <label className='block text-sm font-medium text-[#0e1e38] mb-1.5'>
            Full name
          </label>
          <input
            type='text'
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder='Enter your full name'
            className='w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:border-[#0e1e38] focus:ring-1 focus:ring-[#0e1e38]/15 transition-colors bg-white'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-[#0e1e38] mb-1.5'>
            Email address
          </label>
          <input
            type='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='you@example.com'
            className='w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:border-[#0e1e38] focus:ring-1 focus:ring-[#0e1e38]/15 transition-colors bg-white'
          />
        </div>

        {role === 'driver' ? (
          <>
            <div>
              <label className='block text-sm font-medium text-[#0e1e38] mb-1.5'>
                Mobile number
              </label>
              <input
                type='text'
                required
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder='+250 788 000 000'
                className={`w-full px-4 py-3 rounded-lg border text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-colors bg-white ${
                  phoneError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
                    : 'border-slate-200 focus:border-[#0e1e38] focus:ring-[#0e1e38]/15'
                }`}
              />
              {phoneError && (
                <p className='mt-1.5 text-xs text-red-500 font-medium'>
                  {phoneError}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-[#0e1e38] mb-1.5'>
                National ID
              </label>
              <input
                type='text'
                required
                value={nationalId}
                onChange={(e) => handleNidChange(e.target.value)}
                placeholder='1 1994 8 0023456 1 45'
                className={`w-full px-4 py-3 rounded-lg border text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-colors bg-white ${
                  nidError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
                    : 'border-slate-200 focus:border-[#0e1e38] focus:ring-[#0e1e38]/15'
                }`}
              />
              {nidError && (
                <p className='mt-1.5 text-xs text-red-500 font-medium'>
                  {nidError}
                </p>
              )}
            </div>
          </>
        ) : (
          <div>
            <label className='block text-sm font-medium text-[#0e1e38] mb-1.5'>
              Badge ID
            </label>
            <input
              type='text'
              required
              value={officerBadge}
              onChange={(e) => setOfficerBadge(e.target.value)}
              placeholder='RNP-TFP-0842'
              className='w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:border-[#0e1e38] focus:ring-1 focus:ring-[#0e1e38]/15 transition-colors bg-white'
            />
          </div>
        )}

        <div>
          <label className='block text-sm font-medium text-[#0e1e38] mb-1.5'>
            Password
          </label>
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Create a password'
              className='w-full px-4 py-3 pr-11 rounded-lg border border-slate-200 text-sm text-[#0e1e38] placeholder:text-slate-400 focus:outline-none focus:border-[#0e1e38] focus:ring-1 focus:ring-[#0e1e38]/15 transition-colors bg-white'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'
            >
              {showPassword ? (
                <EyeOff className='w-4.5 h-4.5' />
              ) : (
                <Eye className='w-4.5 h-4.5' />
              )}
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
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className='text-sm text-slate-500 text-center mt-8'>
        Already have an account?{' '}
        <Link href='/login' className='font-semibold text-[#0e1e38] hover:underline'>
          Log in
        </Link>
      </p>
    </>
  )
}
