'use client';

import React, { useState } from 'react';
import { DigitalDocument } from '@/lib/types';
import { mockDocuments } from '@/lib/mockData';
import { ShieldCheck, QrCode, FileText, Calendar, CheckCircle2, AlertTriangle, Eye, ShieldAlert, Sparkles } from 'lucide-react';

interface DocumentShowcaseProps {
  onShowQr: (doc: DigitalDocument) => void;
}

export const DocumentShowcase: React.FC<DocumentShowcaseProps> = ({ onShowQr }) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredDocs = selectedType === 'ALL'
    ? mockDocuments
    : mockDocuments.filter(d => d.type === selectedType);

  return (
    <section className="py-20 bg-slate-100/60 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#0066cc] text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Digital Credentials</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0e1e38] tracking-tight">
              Explore Your Digital Wallet
            </h2>
            <p className="mt-2 text-slate-600 text-base max-w-xl">
              Authentic design specifications honoring Rwandan government and transport authority formats.
            </p>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'All Documents' },
              { id: 'DRIVING_LICENCE', label: 'Driving Licence' },
              { id: 'CARTE_JAUNE', label: 'Carte Jaune' },
              { id: 'INSURANCE_CERTIFICATE', label: 'Insurance' },
              { id: 'CONTROLE_TECHNIQUE', label: 'Contrôle Technique' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`text-xs font-semibold px-3.5 py-2 rounded-full transition-all ${
                  selectedType === tab.id
                    ? 'bg-[#0e1e38] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredDocs.map((doc) => {
            const isLicence = doc.type === 'DRIVING_LICENCE';
            const isCarteJaune = doc.type === 'CARTE_JAUNE';
            const isInsurance = doc.type === 'INSURANCE_CERTIFICATE';
            const isInspection = doc.type === 'CONTROLE_TECHNIQUE';

            return (
              <div
                key={doc.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top header */}
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                        isLicence ? 'bg-gradient-to-tr from-blue-700 to-blue-500' :
                        isCarteJaune ? 'bg-gradient-to-tr from-amber-600 to-yellow-500' :
                        isInsurance ? 'bg-gradient-to-tr from-indigo-700 to-indigo-500' :
                        'bg-gradient-to-tr from-emerald-700 to-teal-500'
                      }`}>
                        {isLicence ? 'DL' : isCarteJaune ? 'CJ' : isInsurance ? 'INS' : 'CT'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {doc.issuingAuthority}
                        </div>
                        <h3 className="text-lg font-extrabold text-[#0e1e38]">
                          {doc.title}
                        </h3>
                        {doc.titleKinyarwanda && (
                          <div className="text-xs text-[#0066cc] italic font-medium">
                            {doc.titleKinyarwanda}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 ${
                      doc.status === 'VALID' ? 'bg-emerald-100 text-emerald-800' :
                      doc.status === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {doc.status === 'VALID' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{doc.status === 'EXPIRING_SOON' ? 'EXPIRING IN 14D' : doc.status}</span>
                    </div>
                  </div>

                  {/* Document details box */}
                  <div className="bg-slate-50 rounded-2xl p-4 my-4 border border-slate-200/80 space-y-2.5 text-xs text-slate-700">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Document ID:</span>
                      <span className="font-mono font-bold text-[#0e1e38]">{doc.documentNumber}</span>
                    </div>

                    {doc.vehiclePlate && (
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                        <span className="text-slate-500 font-medium">Associated Vehicle:</span>
                        <span className="font-bold text-[#0066cc] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {doc.vehiclePlate} ({doc.vehicleModel})
                        </span>
                      </div>
                    )}

                    {doc.categories && (
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                        <span className="text-slate-500 font-medium">Licence Categories:</span>
                        <div className="flex gap-1">
                          {doc.categories.map(c => (
                            <span key={c} className="w-6 h-6 rounded-md bg-[#0e1e38] text-white flex items-center justify-center font-bold text-xs">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {doc.insuranceProvider && (
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                        <span className="text-slate-500 font-medium">Underwriter:</span>
                        <span className="font-semibold text-slate-900">{doc.insuranceProvider}</span>
                      </div>
                    )}

                    {doc.inspectionCenter && (
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                        <span className="text-slate-500 font-medium">Testing Station:</span>
                        <span className="font-semibold text-emerald-700">{doc.inspectionCenter} (PASSED)</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-500 font-medium">Validity Period:</span>
                      <span className="font-semibold text-slate-800">{doc.issueDate} &rarr; {doc.expiryDate}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cryptographically Signed</span>
                  </div>

                  <button
                    onClick={() => onShowQr(doc)}
                    className="bg-[#0e1e38] hover:bg-[#0066cc] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow transition-all flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Show Verification QR</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
