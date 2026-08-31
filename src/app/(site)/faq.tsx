'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'What is the Rwanda Digital Driver & Vehicle Document Portal?',
      answer:
        'It is a modern digital platform allowing Rwandan vehicle owners and drivers to securely store and present their Driving Licence, Vehicle Logbook (Carte Jaune), Motor Insurance, and RNP Vehicle Inspection (Contrôle Technique) directly from their phone.',
    },
    {
      question: 'How does dynamic QR verification protect driver privacy?',
      answer:
        'Rather than exposing physical documents with sensitive personal information, our dynamic QR generates a single-use, encrypted 60-second token. Police officers only see compliance status (valid licence category, active insurance, inspection).',
    },
    {
      question: 'Does the application function offline?',
      answer:
        'Yes. Encrypted local browser caching ensures your credential cards remain viewable even in locations without cell coverage. The officer verifies the token authoritatively.',
    },
    {
      question: 'How do you prevent counterfeit screenshots?',
      answer:
        'Each QR token rotates dynamically every 60 seconds with a cryptographic timestamp. A static screenshot taken earlier will immediately fail roadside validation.',
    },
    {
      question: 'Can I manage multiple vehicles such as cars and motorcycles?',
      answer:
        'Yes. Drivers can add multiple vehicles linked to their National ID and seamlessly switch between personal cars, motorcycles, or commercial fleets.',
    },
  ]

  return (
    <section id='faq' className='py-24 border-t border-b border-[#E4E4E7] bg-[#F4F4F5]'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <h2
          className='text-center text-sm font-medium text-muted-foreground mb-8'
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          FAQ
        </h2>
        <div className='grid md:grid-cols-2 gap-12 md:gap-16'>
          {/* Left Section */}
          <div>
            <h2 className='text-4xl font-semibold tracking-tight mb-4'>
              Frequently Asked Questions
            </h2>
            <p className='text-lg text-muted-foreground'>
              Have another question?{' '}
              <a
                href='mailto:support@rwandadrive.rw'
                className='underline underline-offset-4 hover:text-foreground transition-colors'
              >
                Contact us by email
              </a>
              .
            </p>
          </div>

          {/* Right Section - Accordion */}
          <div>
            <div className='space-y-0'>
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index
                return (
                  <div
                    key={index}
                    className='border-b border-[#E4E4E7] last:border-b-0'
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className='w-full text-left py-4 text-base font-medium hover:no-underline flex items-center justify-between gap-4'
                    >
                      <span>{faq.question}</span>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 ${
                          isOpen
                            ? 'rotate-180 bg-[#0e1e38] text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <ChevronDown className='w-4 h-4' />
                      </div>
                    </button>
                    {isOpen && (
                      <div className='text-muted-foreground text-sm pb-4 animate-in fade-in duration-200'>
                        {faq.answer}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
