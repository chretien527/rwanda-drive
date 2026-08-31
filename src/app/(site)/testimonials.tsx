'use client'

import {
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  ArrowUpRight,
} from 'lucide-react'
import Link from 'next/link'

export default function Testimonials() {
  const users = [
    {
      name: 'Jean Paul Nshimiyimana',
      role: 'Private Vehicle Owner & Commuter',
      district: 'Gasabo, Kigali City',
      plate: 'RAB 123A (Toyota RAV4)',
      quote:
        'I no longer carry paper Carte Jaune or physical insurance stickers. Roadside police verification takes less than 10 seconds at checkpoints.',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      documentsVerified: '4 Documents Verified',
      category: 'Driver',
    },
    {
      name: 'Aimable Habimana',
      role: 'Fleet Manager, Kigali Logistics Express',
      district: 'Kicukiro, Kigali City',
      plate: 'RAC 459P & 14 Commercial Trucks',
      quote:
        'Managing inspection renewals and insurance certificates across 15 commercial transport vehicles used to be chaotic. The expiry radar alerts us automatically.',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      documentsVerified: '15 Vehicles Active',
      category: 'Fleet Operator',
    },
    {
      name: 'Clarisse Umutoni',
      role: 'Ride-Hailing & Taxi Driver',
      district: 'Nyarugenge, Kigali City',
      plate: 'RAD 782K (Hyundai Elantra)',
      quote:
        'The dynamic rotating QR code gives passenger trust and protects my National ID privacy during routine traffic stops on RN1 highway.',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      documentsVerified: 'Category B & D Verified',
      category: 'Professional Driver',
    },
  ]

  const partners = [
    { name: 'Kigali City Transport Co-op', members: '1,200+ Drivers' },
    { name: 'Radiant & Sanlam Motor Insurance', members: 'Direct Sync' },
    { name: 'Muhima & Remera Vehicle Inspection', members: 'RNP Linked' },
    {
      name: 'Rwanda Inter-City Transport Association',
      members: '450+ Buses',
    },
  ]

  return (
    <section id='entrusted-users' className='py-24 bg-white border-t border-[#E4E4E7] text-[#0e1e38] overflow-hidden'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        {/* Section Header */}
        <div className='text-center max-w-3xl mx-auto mb-16'>
          <div className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0e1e38]/5 text-[#0e1e38] text-xs font-bold uppercase tracking-wider mb-4 border border-[#0e1e38]/15'>
            <UserCheck className='w-3.5 h-3.5 text-[#0e1e38]' />
            <span>Community &amp; Trusted Adoption</span>
          </div>
          <h2 className='text-3xl sm:text-5xl font-black text-[#0e1e38] tracking-tight'>
            Entrusted by Thousands of Rwandan Drivers
          </h2>
          <p className='mt-4 text-slate-600 text-base sm:text-lg'>
            See how everyday vehicle owners, commercial fleets, and professional drivers in Rwanda rely on our unified digital credential platform.
          </p>
        </div>

        {/* 3 User Testimonials */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-16'>
          {users.map((u, idx) => (
            <div
              key={idx}
              className='h-full bg-slate-50 rounded-3xl p-8 border border-slate-200 hover:border-[#0e1e38] hover:shadow-xl transition-all duration-300 flex flex-col justify-between group'
            >
              <div className='space-y-4'>
                <div className='flex items-center gap-3.5'>
                  <img
                    src={u.photo}
                    alt={u.name}
                    className='w-14 h-14 rounded-2xl object-cover border border-slate-300 shadow-xs'
                  />
                  <div>
                    <div className='font-black text-base text-[#0e1e38]'>
                      {u.name}
                    </div>
                    <div className='text-xs text-slate-500 font-medium'>
                      {u.role}
                    </div>
                    <div className='text-[11px] text-slate-400 font-semibold'>
                      {u.district}
                    </div>
                  </div>
                </div>

                <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0e1e38] text-white text-[11px] font-bold'>
                  <CheckCircle2 className='w-3.5 h-3.5 text-white' />
                  <span>{u.documentsVerified}</span>
                </div>

                <p className='text-sm text-slate-700 leading-relaxed italic font-medium'>
                  &ldquo;{u.quote}&rdquo;
                </p>
              </div>

              <div className='mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs'>
                <span className='font-mono font-bold text-xs text-[#0e1e38]'>
                  {u.plate}
                </span>
                <span className='text-[10px] uppercase font-bold text-slate-400'>
                  Verified Driver
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Partner & Fleet Ecosystem Banner */}
        <div className='bg-[#0e1e38] text-white rounded-3xl p-10 sm:p-14 shadow-2xl border border-white/10'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-10 items-center'>
            <div className='lg:col-span-5 space-y-3 text-left'>
              <span className='text-xs font-bold uppercase tracking-wider text-slate-300'>
                Fleet &amp; Commercial Scale
              </span>
              <h3 className='text-3xl sm:text-4xl font-black text-white leading-tight'>
                Integrated Across Rwanda Transport Networks
              </h3>
              <p className='text-sm text-slate-300 leading-relaxed font-normal'>
                Empowering independent vehicle owners and corporate transport operators with authoritative compliance.
              </p>
            </div>

            <div className='lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center'>
              {partners.map((p, i) => (
                <div
                  key={i}
                  className='p-5 rounded-2xl bg-white/10 border border-white/15 text-left space-y-1.5 backdrop-blur-xs'
                >
                  <div className='text-base font-black text-white'>
                    {p.members}
                  </div>
                  <div className='text-xs text-slate-300 font-medium leading-snug'>
                    {p.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm'>
            <div className='flex items-center gap-2.5 text-slate-300'>
              <ShieldCheck className='w-5 h-5 text-white' />
              <span>
                Ready to digitize your vehicle documents? Setup takes less than
                2 minutes.
              </span>
            </div>
            <Link
              href='/signup'
              className='bg-white hover:bg-slate-100 text-[#0e1e38] font-black text-xs px-7 py-3 rounded-full shadow-lg transition-all flex items-center gap-2 transform hover:scale-105'
            >
              <span>Join Rwanda Drive</span>
              <ArrowUpRight className='w-4 h-4 text-[#0e1e38]' />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
