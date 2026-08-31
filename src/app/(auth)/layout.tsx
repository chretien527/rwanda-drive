'use client'

import React from 'react'
import { Shield } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='min-h-screen flex items-center justify-center bg-[#F4F4F5] font-sans p-6'>
      <div className='w-full max-w-[80vw] min-h-[85vh] flex rounded-2xl overflow-hidden shadow-lg border border-[#E4E4E7] bg-white'>
        {/* Left branding panel */}
        <div className='hidden lg:flex lg:w-[44%] bg-[#0e1e38] text-white flex-col items-center justify-center p-12 relative'>
          <div className='flex flex-col items-center gap-5'>
            <div className='w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center'>
              <Shield className='w-9 h-9 text-white' />
            </div>
            <h2 className='text-2xl font-bold tracking-tight text-center'>
              Rwanda Drive
            </h2>
            <p className='text-sm text-slate-400 text-center max-w-[240px] leading-relaxed'>
              Your digital driving credentials, all in one place
            </p>
          </div>
        </div>

        {/* Right content panel */}
        <div className='flex-1 flex flex-col bg-white'>
          <div className='flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12 max-w-[520px] w-full mx-auto'>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
