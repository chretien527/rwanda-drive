'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What is the Rwanda Digital Driver & Vehicle Document Portal?',
      answer: 'It is a modern digital platform allowing Rwandan vehicle owners and drivers to securely store and present their Driving Licence, Vehicle Logbook (Carte Jaune), Motor Insurance, and RNP Vehicle Inspection (Contrôle Technique) directly from their phone.'
    },
    {
      question: 'How does dynamic QR verification protect driver privacy?',
      answer: 'Rather than exposing physical documents with sensitive personal information, our dynamic QR generates a single-use, encrypted 60-second token. Police officers only see compliance status (valid licence category, active insurance, inspection).'
    },
    {
      question: 'Does the application function offline?',
      answer: 'Yes. Encrypted local browser caching ensures your credential cards remain viewable even in locations without cell coverage. The officer verifies the token authoritatively.'
    },
    {
      question: 'How do you prevent counterfeit screenshots?',
      answer: 'Each QR token rotates dynamically every 60 seconds with a cryptographic timestamp. A static screenshot taken earlier will immediately fail roadside validation.'
    },
    {
      question: 'Can I manage multiple vehicles such as cars and motorcycles?',
      answer: 'Yes. Drivers can add multiple vehicles linked to their National ID and seamlessly switch between personal cars, motorcycles, or commercial fleets.'
    }
  ];

  return (
    <section id="faq" className="py-24 bg-white border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0e1e38]/5 text-[#0e1e38] text-xs font-bold uppercase tracking-wider mb-4 border border-[#0e1e38]/15">
            <HelpCircle className="w-3.5 h-3.5 text-[#0e1e38]" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0e1e38] tracking-tight">
            Clear Answers
          </h2>
          <p className="mt-3 text-slate-600 text-base sm:text-lg">
            Everything you need to know about digital credentials and verification in Rwanda.
          </p>
        </div>

        {/* Accordion list */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 bg-slate-50/50 hover:bg-slate-50"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-[#0e1e38] text-base sm:text-lg focus:outline-none"
                >
                  <span>{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 text-[#0e1e38] shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 bg-[#0e1e38] text-white' : ''
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed border-t border-slate-200/60 pt-4 bg-white">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
