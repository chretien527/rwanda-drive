'use client'

import {
  FileCheck2,
  QrCode,
  BellRing,
  CarFront,
  EyeOff,
  WifiOff,
} from 'lucide-react'

export default function Features() {
  const features = [
    {
      title: 'Digital Credential Wallet',
      description:
        'Unified storage for Driving Licence, Carte Jaune (Logbook), Radiant/Sanlam Insurance, and RNP Contrôle Technique.',
      icon: FileCheck2,
    },
    {
      title: 'Anti-Fraud Dynamic QR',
      description:
        'Rotating 60-second cryptographic tokens prevent screenshot counterfeits and ensure roadside verifiability.',
      icon: QrCode,
    },
    {
      title: 'Proactive Expiry Radar',
      description:
        'Automated 30-day and 7-day alerts before annual vehicle inspection or insurance policy expiration.',
      icon: BellRing,
    },
    {
      title: 'Multi-Vehicle Fleet',
      description:
        'Manage personal passenger cars, commercial transport vehicles, and motorcycles under a single verified NID profile.',
      icon: CarFront,
    },
    {
      title: 'Minimal Disclosure Privacy',
      description:
        'Checkpoint officers only receive necessary road compliance validation without harvesting unrelated personal data.',
      icon: EyeOff,
    },
    {
      title: 'Offline Resilient Cache',
      description:
        'Essential credentials remain accessible even in remote areas with spotty network coverage using encrypted storage.',
      icon: WifiOff,
    },
  ]

  return (
    <section id='features' className='py-24 bg-[#F4F4F5]'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <h2
          className='text-center text-sm font-medium text-muted-foreground mb-8'
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          PLATFORM CAPABILITIES
        </h2>
        <div className='text-center mb-16'>
          <h2 className='text-4xl font-semibold tracking-tight mb-4'>
            Core Platform Capabilities
          </h2>
          <p className='text-lg text-muted-foreground'>
            Purpose-built for Rwandan transport regulations, vehicle owners, and law enforcement workflows.
          </p>
        </div>

        <div className='border border-[#E4E4E7] rounded-none overflow-hidden bg-transparent'>
          <div className='grid grid-cols-3 grid-rows-2 h-full'>
            {features.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={index}
                  className={`p-6 bg-transparent flex flex-col ${
                    index % 3 !== 2 ? 'border-r border-[#E4E4E7]' : ''
                  } ${index < 3 ? 'border-b border-[#E4E4E7]' : ''}`}
                >
                  <div className='mb-3 flex items-center gap-2'>
                    <div className='w-10 h-10 rounded-xl bg-[#0e1e38] text-white flex items-center justify-center'>
                      <Icon className='w-5 h-5' />
                    </div>
                  </div>
                  <h3 className='text-lg font-semibold mb-2'>{item.title}</h3>
                  <p className='text-sm text-muted-foreground'>
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
