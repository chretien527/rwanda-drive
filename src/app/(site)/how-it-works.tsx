'use client'

import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  QrCode,
  Smartphone,
  Check,
} from 'lucide-react'

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState<number>(0)
  const [qrTimer, setQrTimer] = useState<number>(58)
  const [isScanTested, setIsScanTested] = useState<boolean>(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev <= 1 ? 60 : prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

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
    },
  ]

  return (
    <section id='how-it-works' className='py-24 bg-white border-t border-[#E4E4E7]'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <h2
          className='text-center text-sm font-medium text-muted-foreground mb-8'
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          HOW IT WORKS
        </h2>
        <div className='text-center mb-16'>
          <h2 className='text-4xl font-semibold tracking-tight mb-4'>
            How Rwanda Drive Operates
          </h2>
          <p className='text-lg text-muted-foreground'>
            Interact with the prototype to experience how vehicle credentials flow
            securely between drivers and road enforcement.
          </p>
        </div>

        {/* Step Selector Pills */}
        <div className='flex flex-wrap justify-center gap-3.5 pt-1 mb-12'>
          {steps.map((step) => {
            const Icon = step.icon
            const isActive = activeStep === step.id
            return (
              <button
                key={step.id}
                onClick={() => {
                  setActiveStep(step.id)
                  setIsScanTested(false)
                }}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm sm:text-base font-extrabold transition-all cursor-pointer shadow-sm ${
                  isActive
                    ? 'bg-[#0e1e38] text-white shadow-xl scale-102 ring-2 ring-[#0e1e38]/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-[#0e1e38] border-2 border-slate-200'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-600'}`}
                />
                <span>{step.title}</span>
              </button>
            )
          })}
        </div>

        {/* Active Phase Details */}
        <div className='max-w-2xl mx-auto text-center space-y-6'>
          <h3 className='text-2xl sm:text-3xl font-black text-[#0e1e38] leading-tight'>
            {steps[activeStep].headline}
          </h3>
          <p className='text-base sm:text-lg text-slate-600 leading-relaxed font-normal'>
            {steps[activeStep].desc}
          </p>

          {/* Interactive Controls */}
          <div className='pt-4 flex justify-center'>
            {activeStep === 0 && (
              <div className='grid grid-cols-2 gap-3 max-w-lg'>
                <div className='p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 shadow-sm'>
                  <span className='text-[11px] uppercase font-extrabold text-slate-400 block'>
                    Driving Licence
                  </span>
                  <strong className='text-base font-black text-[#0e1e38]'>
                    Valid &bull; Category B
                  </strong>
                </div>
                <div className='p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 shadow-sm'>
                  <span className='text-[11px] uppercase font-extrabold text-slate-400 block'>
                    Carte Jaune Logbook
                  </span>
                  <strong className='text-base font-black text-[#0e1e38]'>
                    RAB 123A &bull; Active
                  </strong>
                </div>
              </div>
            )}

            {activeStep === 1 && (
              <div className='p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 shadow-sm flex items-center justify-between gap-4 max-w-lg'>
                <div className='flex items-center gap-3.5'>
                  <div className='w-12 h-12 bg-[#0e1e38] rounded-xl flex items-center justify-center text-white shadow'>
                    <QrCode className='w-7 h-7' />
                  </div>
                  <div>
                    <div className='text-sm font-extrabold text-[#0e1e38]'>
                      Rotating Security Token
                    </div>
                    <div className='text-xs text-slate-500 font-medium'>
                      Regenerates in{' '}
                      <strong className='font-mono text-[#0e1e38] text-sm'>
                        {qrTimer}s
                      </strong>
                    </div>
                  </div>
                </div>
                <span className='text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-200 text-[#0e1e38] border border-slate-300'>
                  ECDSA-256
                </span>
              </div>
            )}

            {activeStep === 2 && (
              <div className='max-w-lg space-y-3'>
                {!isScanTested ? (
                  <button
                    onClick={() => setIsScanTested(true)}
                    className='w-full py-4 bg-[#0e1e38] hover:bg-[#182e52] text-white rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2.5'
                  >
                    <ShieldCheck className='w-5 h-5' />
                    <span>Simulate 2-Second Roadside Police Scan</span>
                  </button>
                ) : (
                  <div className='p-4.5 bg-slate-50 text-[#0e1e38] rounded-2xl border-2 border-slate-200 shadow-sm space-y-1.5 animate-in fade-in zoom-in-95 duration-150'>
                    <div className='flex items-center justify-between pb-2 border-b border-slate-200'>
                      <span className='text-sm font-black text-[#0e1e38] flex items-center gap-2'>
                        <Check className='w-5 h-5 stroke-[3] text-emerald-600' />
                        Police Checkpoint Matched
                      </span>
                      <span className='text-xs text-slate-500 font-semibold'>
                        &lt; 1.2s Response
                      </span>
                    </div>
                    <p className='text-xs text-slate-600 font-medium'>
                      All 4 digital credentials verified against Rwanda National
                      Police authoritative node.
                    </p>
                    <button
                      onClick={() => setIsScanTested(false)}
                      className='mt-2 text-xs font-bold text-[#0e1e38] underline underline-offset-4'
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
    </section>
  )
}
