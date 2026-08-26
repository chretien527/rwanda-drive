'use client';

import React, { useState } from 'react';
import { DigitalDocument } from '@/lib/types';
import { mockDocuments, mockDriver } from '@/lib/mockData';
import { 
  ShieldCheck, 
  QrCode, 
  Car, 
  Calendar, 
  CheckCircle2, 
  RotateCw, 
  FileText, 
  Download, 
  Lock
} from 'lucide-react';

interface DigitalWalletProps {
  onShowQr: (doc: DigitalDocument) => void;
  filterVehicle?: string | null;
}

export const DigitalWallet: React.FC<DigitalWalletProps> = ({
  onShowQr,
  filterVehicle
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'DRIVER' | 'VEHICLE'>('ALL');
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const docsToDisplay = mockDocuments.filter(doc => {
    if (filterVehicle && doc.vehiclePlate && doc.vehiclePlate !== filterVehicle) {
      return false;
    }
    if (activeTab === 'DRIVER') return doc.type === 'DRIVING_LICENCE';
    if (activeTab === 'VEHICLE') return doc.type !== 'DRIVING_LICENCE';
    return true;
  });

  return (
    <div className="space-y-6 text-[#1e3a5f]">
      
      {/* Wallet Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-[#1e3a5f] flex items-center gap-2">
            <span>Digital Document Wallet</span>
            <span className="text-xs bg-[#1e3a5f] text-white font-bold px-2.5 py-0.5 rounded-full">
              {docsToDisplay.length} Documents
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Encrypted Rwandan credentials with live authoritative verification
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ALL' ? 'bg-[#1e3a5f] text-white shadow-sm' : 'text-slate-600 hover:text-[#1e3a5f]'
            }`}
          >
            All Cards
          </button>
          <button
            onClick={() => setActiveTab('DRIVER')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'DRIVER' ? 'bg-[#1e3a5f] text-white shadow-sm' : 'text-slate-600 hover:text-[#1e3a5f]'
            }`}
          >
            Driver Licence
          </button>
          <button
            onClick={() => setActiveTab('VEHICLE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'VEHICLE' ? 'bg-[#1e3a5f] text-white shadow-sm' : 'text-slate-600 hover:text-[#1e3a5f]'
            }`}
          >
            Vehicle Cards
          </button>
        </div>
      </div>

      {/* Cards List in 2-Color Design */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {docsToDisplay.map(doc => {
          const isFlipped = !!flippedCards[doc.id];
          const isLicence = doc.type === 'DRIVING_LICENCE';

          return (
            <div
              key={doc.id}
              className="relative perspective-1000 transition-all duration-300"
            >
              {/* CARD FRONT / BACK CONTAINER */}
              <div className="bg-white text-[#0e1e38] rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-200/80 relative overflow-hidden flex flex-col justify-between min-h-[340px]">
                
                {/* Subtle mesh background */}
                <div className="absolute inset-0 bg-[radial-gradient(#0e1e38_1px,transparent_1px)] [background-size:18px_18px] opacity-[0.04] pointer-events-none" />

                {!isFlipped ? (
                  /* FRONT FACE */
                  <div className="space-y-4 relative z-10 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Top Authority Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#0e1e38] flex items-center justify-center text-white font-black text-xs shadow-sm">
                            RW
                          </div>
                          <div>
                            <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                              {doc.issuingAuthority}
                            </div>
                            <div className="text-sm font-black tracking-tight text-[#0e1e38]">
                              {doc.title}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#0e1e38]/10 text-[#0e1e38] border border-[#0e1e38]/20">
                          <CheckCircle2 className="w-3 h-3 text-[#0e1e38]" />
                          <span>{doc.status === 'EXPIRING_SOON' ? 'EXPIRING 14D' : doc.status}</span>
                        </div>
                      </div>

                      {/* Middle Details Box */}
                      {isLicence ? (
                        <div className="flex gap-4 items-center my-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={mockDriver.photoUrl}
                            alt={mockDriver.fullName}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm"
                          />
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="text-sm font-black text-[#0e1e38] truncate">{mockDriver.fullName}</div>
                            <div className="text-xs font-mono text-[#0e1e38] font-bold">{doc.documentNumber}</div>
                            <div className="text-[11px] text-slate-500">NID: {mockDriver.nationalId}</div>
                            <div className="text-[11px] text-slate-600">
                              Categories: <strong className="text-[#0e1e38] font-bold">A, B, D</strong>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="my-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Vehicle:</span>
                            <span className="font-mono font-bold text-[#0e1e38] bg-slate-200/70 px-2 py-0.5 rounded border border-slate-300/50">
                              {doc.vehiclePlate} ({doc.vehicleModel})
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Doc Ref:</span>
                            <span className="font-mono text-[#0e1e38] font-semibold">{doc.documentNumber}</span>
                          </div>
                          {doc.insuranceProvider && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Underwriter:</span>
                              <span className="font-semibold text-[#0e1e38]">{doc.insuranceProvider}</span>
                            </div>
                          )}
                          {doc.inspectionCenter && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Inspection:</span>
                              <span className="font-semibold text-[#0e1e38]">{doc.inspectionCenter} (PASSED)</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata & Controls */}
                    <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-500 block">Valid Until</span>
                        <span className="font-bold text-[#0e1e38] text-xs">{doc.expiryDate}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFlip(doc.id)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0e1e38] transition-colors"
                          title="View Security Metadata"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onShowQr(doc)}
                          className="bg-[#0e1e38] hover:bg-[#182e52] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5 text-white" />
                          <span>Show QR</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* BACK FACE */
                  <div className="space-y-4 relative z-10 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
                        <div className="text-xs font-bold text-[#0e1e38]">Cryptographic Verification Spec</div>
                        <button
                          onClick={() => toggleFlip(doc.id)}
                          className="p-1 rounded-lg bg-slate-100 text-[#0e1e38] hover:bg-slate-200 text-xs flex items-center gap-1"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Flip</span>
                        </button>
                      </div>

                      <div className="space-y-2 py-3 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Digital Signature:</span>
                          <span className="font-mono text-[#0e1e38] font-semibold text-[11px]">ECDSA-SHA256 (Valid)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Issuer Token:</span>
                          <span className="font-mono text-[#0e1e38] font-semibold text-[11px]">rnp-auth-2025-v3</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Privacy Status:</span>
                          <span className="text-[#0e1e38] font-semibold">Zero PII Leakage Compliant</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Offline Caching:</span>
                          <span className="text-[#0e1e38] font-semibold">Encrypted Local Storage</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 flex justify-between items-center">
                      <span className="text-[10px] text-slate-500">Rwanda National Police Validated</span>
                      <button
                        onClick={() => onShowQr(doc)}
                        className="bg-[#0e1e38] hover:bg-[#182e52] text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm"
                      >
                        Generate QR
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
