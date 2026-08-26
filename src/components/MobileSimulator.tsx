'use client';

import React, { useState } from 'react';
import { mockDriver, mockVehicles, mockDocuments, mockNotifications } from '@/lib/mockData';
import { DigitalDocument, Vehicle } from '@/lib/types';
import { 
  Home, 
  FileText, 
  QrCode, 
  Car, 
  User, 
  ShieldCheck, 
  Bell, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  ChevronRight
} from 'lucide-react';

interface MobileSimulatorProps {
  onShowQrModal: (doc?: DigitalDocument) => void;
  onAddVehicle: () => void;
  vehicles: Vehicle[];
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({
  onShowQrModal,
  onAddVehicle,
  vehicles
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'docs' | 'qr' | 'vehicles' | 'profile'>('home');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(vehicles[0] || mockVehicles[0]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center text-[#0e1e38]">
      
      {/* Header Info */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0e1e38]/5 text-[#0e1e38] text-xs font-bold uppercase tracking-wider mb-2 border border-[#0e1e38]/15">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Mobile Device Simulation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0e1e38]">
          Interactive Smartphone View
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
          Simulated mobile experience for Rwandan drivers and roadside police verifications.
        </p>
      </div>

      {/* Realistic Mobile Device Frame */}
      <div className="w-[360px] sm:w-[380px] h-[760px] bg-[#0e1e38] rounded-[48px] p-3.5 shadow-2xl border-4 border-[#081426] relative flex flex-col overflow-hidden">
        
        {/* Outer frame border */}
        <div className="absolute inset-0 rounded-[44px] pointer-events-none border border-white/10" />

        {/* Screen Container */}
        <div className="w-full h-full bg-slate-50 rounded-[38px] overflow-hidden flex flex-col justify-between relative shadow-inner text-[#0e1e38]">
          
          {/* Status Bar */}
          <div className="pt-2 px-6 pb-1 bg-white flex items-center justify-between text-[11px] font-bold text-[#0e1e38] shrink-0 z-20">
            <span>09:41</span>
            {/* Speaker Pill */}
            <div className="w-24 h-4 bg-[#0e1e38] rounded-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white/20 mr-2" />
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span>5G</span>
              <div className="w-4 h-2 rounded-xs border border-[#0e1e38] p-0.5 flex items-center">
                <div className="h-full w-full bg-[#0e1e38] rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Scrollable Screen Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs pb-16">
            
            {/* TAB: HOME */}
            {activeTab === 'home' && (
              <div className="space-y-4">
                
                {/* Header Card */}
                <div className="bg-[#0e1e38] text-white p-4 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mockDriver.photoUrl}
                        alt="Jean Paul"
                        className="w-10 h-10 rounded-full object-cover border border-white shadow"
                      />
                      <div>
                        <span className="text-[10px] text-slate-300 uppercase font-bold">Welcome back</span>
                        <div className="font-extrabold text-sm text-white">Jean Paul N.</div>
                      </div>
                    </div>
                    <span className="text-[9px] bg-white/15 text-white font-bold px-2 py-0.5 rounded-full border border-white/20">
                      NID ACTIVE
                    </span>
                  </div>

                  <div className="pt-2 flex justify-between items-center text-[10px] text-slate-300 border-t border-white/10">
                    <span>NID: {mockDriver.nationalId}</span>
                    <button
                      onClick={() => onShowQrModal()}
                      className="bg-white text-[#0e1e38] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>One-Touch QR</span>
                    </button>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  onClick={() => onShowQrModal()}
                  className="w-full py-3 bg-[#0e1e38] hover:bg-[#182e52] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Present 60s Anti-Fraud QR</span>
                </button>

                {/* Digital Cards Preview List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                    <span>My Digital Documents</span>
                    <button onClick={() => setActiveTab('docs')} className="text-[#0e1e38] hover:underline">
                      View All (4)
                    </button>
                  </div>

                  {mockDocuments.slice(0, 2).map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => onShowQrModal(doc)}
                      className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#0e1e38] transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#0e1e38] text-white flex items-center justify-center font-bold text-xs">
                          {doc.type === 'DRIVING_LICENCE' ? 'DL' : 'CJ'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-[11px]">{doc.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{doc.documentNumber}</div>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-[#0e1e38]">
                        VALID
                      </span>
                    </div>
                  ))}
                </div>

                {/* Vehicles Carousel */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                    <span>Registered Vehicles</span>
                    <button onClick={onAddVehicle} className="text-[#0e1e38] hover:underline flex items-center gap-0.5">
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-xs bg-[#0e1e38] text-white px-2 py-0.5 rounded">
                        {selectedVehicle.plateNumber}
                      </span>
                      <span className="text-[10px] font-bold text-[#0e1e38]">
                        {selectedVehicle.make} {selectedVehicle.model}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between border-t border-slate-100 pt-1">
                      <span>Insurance: <strong className="text-[#0e1e38]">Active</strong></span>
                      <span>Contrôle: <strong className="text-[#0e1e38]">Passed</strong></span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: DOCS */}
            {activeTab === 'docs' && (
              <div className="space-y-3">
                <div className="font-black text-sm text-[#0e1e38]">All Digital Credentials</div>
                {mockDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onShowQrModal(doc)}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2 cursor-pointer hover:border-[#0e1e38] transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-xs text-[#0e1e38]">{doc.title}</div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-[#0e1e38]">
                        {doc.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>Ref: <strong className="font-mono text-[#0e1e38]">{doc.documentNumber}</strong></span>
                      <span>Exp: {doc.expiryDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: QR */}
            {activeTab === 'qr' && (
              <div className="space-y-4 text-center py-4">
                <div className="font-black text-sm text-[#0e1e38]">Dynamic Roadside QR</div>
                <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm inline-block">
                  <div className="w-40 h-40 bg-[#0e1e38] rounded-2xl p-3 flex flex-col justify-between text-white mx-auto">
                    <div className="grid grid-cols-6 gap-1 h-full w-full opacity-90">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div key={i} className={`rounded-xs ${i % 2 === 0 ? 'bg-white' : 'bg-transparent'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">60-second rotating encrypted cryptographic token</p>
                <button
                  onClick={() => onShowQrModal()}
                  className="w-full py-2.5 bg-[#0e1e38] text-white rounded-xl font-bold text-xs"
                >
                  Open Fullscreen QR
                </button>
              </div>
            )}

            {/* TAB: VEHICLES */}
            {activeTab === 'vehicles' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-black text-sm text-[#0e1e38]">My Vehicle Garage</span>
                  <button onClick={onAddVehicle} className="text-xs font-bold text-[#0e1e38] hover:underline">
                    + Add New
                  </button>
                </div>
                {vehicles.map((v) => (
                  <div key={v.id} className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-xs bg-[#0e1e38] text-white px-2 py-0.5 rounded">
                        {v.plateNumber}
                      </span>
                      <span className="text-[10px] font-bold text-[#0e1e38]">{v.registrationStatus}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">{v.make} {v.model} ({v.year})</div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-3 text-left">
                <div className="font-black text-sm text-[#0e1e38]">Driver Profile</div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-[#0e1e38]">{mockDriver.fullName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">NID: {mockDriver.nationalId}</div>
                  <div className="text-[10px] text-slate-500">Phone: {mockDriver.phoneNumber}</div>
                  <div className="text-[10px] text-slate-500">District: {mockDriver.district}</div>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Mobile Tab Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-200 py-2.5 px-4 flex items-center justify-around z-20">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-0.5 ${activeTab === 'home' ? 'text-[#0e1e38]' : 'text-slate-400'}`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[9px] font-bold">Home</span>
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex flex-col items-center gap-0.5 ${activeTab === 'docs' ? 'text-[#0e1e38]' : 'text-slate-400'}`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-[9px] font-bold">Wallet</span>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className="w-10 h-10 rounded-full bg-[#0e1e38] text-white flex items-center justify-center -mt-4 shadow-lg"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex flex-col items-center gap-0.5 ${activeTab === 'vehicles' ? 'text-[#0e1e38]' : 'text-slate-400'}`}
            >
              <Car className="w-4 h-4" />
              <span className="text-[9px] font-bold">Vehicles</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-0.5 ${activeTab === 'profile' ? 'text-[#0e1e38]' : 'text-slate-400'}`}
            >
              <User className="w-4 h-4" />
              <span className="text-[9px] font-bold">Profile</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
