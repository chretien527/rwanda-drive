'use client';

import React, { useState, useEffect } from 'react';
import { mockDriver, mockVehicles, mockDocuments, mockNotifications } from '@/lib/mockData';
import { DigitalDocument, Vehicle } from '@/lib/types';
import { DigitalWallet } from './DigitalWallet';
import { 
  Car, 
  FileText, 
  Clock, 
  AlertTriangle, 
  Plus, 
  QrCode, 
  Bell, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronRight, 
  Check,
  RefreshCw,
  Lock,
  Smartphone,
  Shield,
  User,
  Settings as SettingsIcon,
  Globe,
  Key,
  Database,
  Eye,
  Sliders,
  Send
} from 'lucide-react';

interface DriverDashboardProps {
  onShowQr: (doc?: DigitalDocument) => void;
  onAddVehicle: () => void;
  vehicles: Vehicle[];
  activeTab?: 'overview' | 'wallet' | 'vehicles' | 'notifications' | 'qr' | 'settings' | string;
  onTabChange?: (tab: string) => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  onShowQr,
  onAddVehicle,
  vehicles,
  activeTab: externalTab,
  onTabChange: externalTabChange
}) => {
  const [internalTab, setInternalTab] = useState<string>('overview');
  const activeTab = externalTab || internalTab;
  const setActiveTab = (tab: string) => {
    if (externalTabChange) externalTabChange(tab);
    else setInternalTab(tab);
  };

  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(mockNotifications);

  // Dedicated QR Generator Tab State
  const [selectedDocId, setSelectedDocId] = useState<string>(mockDocuments[0].id);
  const [qrCountdown, setQrCountdown] = useState<number>(58);
  const [qrFlash, setQrFlash] = useState<boolean>(false);

  // Settings State
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(true);
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState<boolean>(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState<boolean>(true);
  const [offlineCacheEnabled, setOfflineCacheEnabled] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  // QR Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          setQrFlash(true);
          setTimeout(() => setQrFlash(false), 500);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualQrRefresh = () => {
    setQrFlash(true);
    setQrCountdown(60);
    setTimeout(() => setQrFlash(false), 500);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleSaveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const activeDoc = mockDocuments.find(d => d.id === selectedDocId) || mockDocuments[0];
  const expiringDocs = mockDocuments.filter(d => d.status === 'EXPIRING_SOON');
  const validDocs = mockDocuments.filter(d => d.status === 'VALID');

  return (
    <div className="space-y-6 text-[#0e1e38]">
      
      {/* Welcome Card */}
      <div className="bg-[#0e1e38] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-radial-gradient from-white/10 to-transparent pointer-events-none -mr-16 -mt-16" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mockDriver.photoUrl}
                alt={mockDriver.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xl"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white text-[#0e1e38] rounded-full border-2 border-[#0e1e38] flex items-center justify-center font-bold">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  Driver Account
                </span>
                <span className="text-[10px] bg-white/15 text-white px-2 py-0.5 rounded-full border border-white/20 font-bold">
                  NIDA VERIFIED
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Muraho, {mockDriver.fullName.split(' ')[0]}
              </h1>
              <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                <span>NID: <strong className="text-white font-mono">{mockDriver.nationalId}</strong></span>
                <span>&bull;</span>
                <span>District: <strong className="text-white">{mockDriver.district}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex gap-2.5">
            <button
              onClick={() => setActiveTab('qr')}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-[#0e1e38] font-bold text-xs shadow-lg transition-all flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Generate Dynamic QR</span>
            </button>

            <button
              onClick={onAddVehicle}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/15 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stat 1: Verified Docs */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Documents</span>
                <div className="p-2 rounded-xl bg-slate-100 text-[#0e1e38]">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-[#0e1e38]">{mockDocuments.length}</div>
              <div className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0e1e38]" />
                <span>All cryptographically signed</span>
              </div>
            </div>

            {/* Stat 2: Registered Vehicles */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Vehicles</span>
                <div className="p-2 rounded-xl bg-slate-100 text-[#0e1e38]">
                  <Car className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-[#0e1e38]">{vehicles.length}</div>
              <div className="text-xs text-slate-500 font-semibold">
                Linked to National ID
              </div>
            </div>

            {/* Stat 3: Expiring Soon */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Renewal Radar</span>
                <div className="p-2 rounded-xl bg-slate-100 text-[#0e1e38]">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-[#0e1e38]">{expiringDocs.length}</div>
              <div className="text-xs text-slate-500 font-semibold">
                {expiringDocs.length > 0 ? 'Insurance expires in 12 days' : 'No upcoming expiries'}
              </div>
            </div>

            {/* Stat 4: Verification Status */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Road Compliance</span>
                <div className="p-2 rounded-xl bg-slate-100 text-[#0e1e38]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#0e1e38]">100% READY</div>
              <div className="text-xs text-slate-500 font-semibold">
                NIDA &bull; RNP &bull; RRA Synced
              </div>
            </div>

          </div>

          {/* Wallet Documents Preview Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#0e1e38]">Digital Driving Credentials</h2>
              <button
                onClick={() => setActiveTab('wallet')}
                className="text-xs font-bold text-[#0e1e38] hover:underline flex items-center gap-1"
              >
                <span>Open Digital Wallet</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setActiveTab('qr')}
                  className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#0e1e38] shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0e1e38] text-white">
                        {doc.type.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-bold ${doc.status === 'EXPIRING_SOON' ? 'text-amber-600' : 'text-[#0e1e38]'}`}>
                        {doc.status === 'EXPIRING_SOON' ? 'Expiring Soon' : 'Valid'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-base text-[#0e1e38] group-hover:text-[#182e52] transition-colors">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {doc.documentNumber}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0e1e38]">
                    <span>Generate QR</span>
                    <QrCode className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ================= TAB 2: DIGITAL WALLET ================= */}
      {activeTab === 'wallet' && (
        <DigitalWallet
          onShowQr={(doc) => {
            setSelectedDocId(doc.id);
            setActiveTab('qr');
          }}
          filterVehicle={selectedVehicleFilter}
        />
      )}

      {/* ================= TAB 3: MY VEHICLES ================= */}
      {activeTab === 'vehicles' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#0e1e38]">Registered Vehicles</h2>
              <p className="text-xs text-slate-500">Official vehicles linked to your Rwanda National ID</p>
            </div>
            <button
              onClick={onAddVehicle}
              className="px-4 py-2.5 bg-[#0e1e38] text-white rounded-2xl text-xs font-bold shadow-md hover:bg-[#182e52] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Vehicle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => (
              <div key={v.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{v.make} &bull; {v.year}</span>
                    <h3 className="text-lg font-black text-[#0e1e38]">{v.model}</h3>
                    <div className="font-mono text-sm font-bold text-[#0e1e38] bg-slate-100 px-2.5 py-1 rounded-xl inline-block mt-1">
                      {v.plateNumber}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0e1e38] text-white">
                    {v.category}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chassis / VIN:</span>
                    <span className="font-mono font-semibold">{v.chassisNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Logbook Status:</span>
                    <span className="font-semibold text-[#0e1e38]">Carte Jaune Verified</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Insurance Provider:</span>
                    <span className="font-semibold">{v.plateNumber === 'RAB 123A' ? 'Radiant Insurance' : 'Sanlam Rwanda'}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedVehicleFilter(v.plateNumber);
                      setActiveTab('wallet');
                    }}
                    className="flex-1 py-2.5 text-center text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0e1e38] transition-all"
                  >
                    View Vehicle Wallet
                  </button>
                  <button
                    onClick={() => setActiveTab('qr')}
                    className="px-4 py-2.5 rounded-xl bg-[#0e1e38] text-white text-xs font-bold flex items-center gap-1 hover:bg-[#182e52] transition-all"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: DEDICATED FULL-PAGE QR CODE GENERATOR ================= */}
      {activeTab === 'qr' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-[#0e1e38]">Dynamic QR Code Generator</h2>
              <p className="text-xs text-slate-500">Official anti-fraud cryptographic credential token for roadside inspection</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Offline Ready</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Col: Document Picker (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Credential to Present:
              </div>

              <div className="space-y-3">
                {mockDocuments.map((doc) => {
                  const isSelected = selectedDocId === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => { setSelectedDocId(doc.id); handleManualQrRefresh(); }}
                      className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#0e1e38] text-white border-[#0e1e38] shadow-lg'
                          : 'bg-white text-[#0e1e38] border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {doc.type.replace('_', ' ')}
                        </span>
                        <h4 className="font-extrabold text-sm">{doc.title}</h4>
                        <div className={`font-mono text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {doc.documentNumber}
                        </div>
                      </div>

                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-white text-[#0e1e38]' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Col: Dedicated Full-Page QR Display (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
              
              {/* Top Security Banner */}
              <div className="flex items-center justify-between w-full pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0e1e38]">
                  <Lock className="w-4 h-4 text-[#0e1e38]" />
                  <span>ECC-256 Encrypted Token</span>
                </div>
                <div className="text-xs font-bold text-slate-500">
                  Refreshes in <strong className="font-mono text-[#0e1e38] text-sm">{qrCountdown}s</strong>
                </div>
              </div>

              {/* Dynamic Rotating QR Matrix Frame */}
              <div className={`p-6 bg-slate-50 rounded-3xl border-2 border-slate-200 shadow-inner relative transition-all duration-300 ${
                qrFlash ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
              }`}>
                {/* 4 Corner brackets */}
                <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#0e1e38] rounded-tl-md" />
                <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#0e1e38] rounded-tr-md" />
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#0e1e38] rounded-bl-md" />
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#0e1e38] rounded-br-md" />

                {/* QR Matrix */}
                <div className="w-56 h-56 bg-[#0e1e38] rounded-2xl p-4 flex flex-col justify-between text-white relative shadow-md">
                  <div className="grid grid-cols-7 gap-1 h-full w-full opacity-90">
                    {Array.from({ length: 49 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          (i + qrCountdown) % 2 === 0 || (i + qrCountdown) % 3 === 0 ? 'bg-white' : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#0e1e38] shadow-lg">
                      <ShieldCheck className="w-7 h-7 text-[#0e1e38]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Identity Info */}
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#0e1e38]">
                  {activeDoc.title}
                </h3>
                <div className="text-xs text-slate-500 font-mono">
                  {activeDoc.documentNumber} &bull; Holder: {mockDriver.fullName}
                </div>
              </div>

              {/* Refresh Action Button */}
              <div className="flex gap-3 w-full max-w-sm">
                <button
                  onClick={handleManualQrRefresh}
                  className="flex-1 py-3 bg-[#0e1e38] hover:bg-[#182e52] text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Regenerate Token Now</span>
                </button>
              </div>

              {/* Privacy Footer Notice */}
              <div className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-2xl w-full border border-slate-100">
                Single-use dynamic token valid for 60 seconds. Traffic officers will only see verification status and essential details.
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ================= TAB 5: COMPREHENSIVE SETTINGS ================= */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8 max-w-4xl">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-black text-[#0e1e38]">Driver Account &amp; System Settings</h2>
              <p className="text-xs text-slate-500">Configure security, notifications, biometric access, and offline data sync</p>
            </div>
            {settingsSaved && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                ✓ Preferences Saved Successfully
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Section 1: Security & Biometrics */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-[#0e1e38] uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-[#0e1e38]" />
                <span>Security &amp; PIN Authentication</span>
              </h3>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#0e1e38]">Biometric FaceID / TouchID Unlock</div>
                    <div className="text-[11px] text-slate-500">Use device biometrics to generate QR</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={biometricEnabled}
                    onChange={(e) => setBiometricEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#0e1e38] cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Security Passcode:</span>
                  <button className="text-xs font-bold text-[#0e1e38] underline">
                    Change 6-Digit PIN
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Expiry Alerts & SMS Radar */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-[#0e1e38] uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#0e1e38]" />
                <span>Expiry Radar &amp; SMS Notifications</span>
              </h3>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#0e1e38]">SMS Expiry Alerts (Irembo / Police)</div>
                    <div className="text-[11px] text-slate-500">30, 15, and 3-day renewal notices</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsAlertsEnabled}
                    onChange={(e) => setSmsAlertsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#0e1e38] cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#0e1e38]">Roadside Scan History Alerts</div>
                    <div className="text-[11px] text-slate-500">Notify me whenever an officer scans my QR</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlertsEnabled}
                    onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#0e1e38] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Offline Data & Cryptographic Cache */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-[#0e1e38] uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-[#0e1e38]" />
                <span>Offline Credentials Storage</span>
              </h3>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#0e1e38]">Store Signed Credentials Locally</div>
                    <div className="text-[11px] text-slate-500">Permits QR presentation with zero mobile data</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={offlineCacheEnabled}
                    onChange={(e) => setOfflineCacheEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#0e1e38] cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Cached Cryptographic Keys:</span>
                  <span className="font-mono font-bold text-[#0e1e38]">4 Signatures Synced</span>
                </div>
              </div>
            </div>

            {/* Section 4: Language & Regional Preferences */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-[#0e1e38] uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#0e1e38]" />
                <span>Language &amp; Display</span>
              </h3>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#0e1e38] mb-1.5">
                    Platform Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-xs text-[#0e1e38] bg-white focus:outline-none"
                  >
                    <option value="en">English (Official)</option>
                    <option value="rw">Ikinyarwanda</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="px-8 py-3.5 rounded-2xl bg-[#0e1e38] hover:bg-[#182e52] text-white font-bold text-xs shadow-lg transition-all"
            >
              Save Settings
            </button>
          </div>

        </div>
      )}

      {/* ================= TAB 6: NOTIFICATIONS ================= */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-[#0e1e38]">Alerts &amp; Reminders Center</h2>
              <p className="text-xs text-slate-500">Automated vehicle road safety and regulatory notifications</p>
            </div>
            <button
              onClick={markAllRead}
              className="text-xs font-semibold text-[#0e1e38] hover:underline"
            >
              Mark all as read
            </button>
          </div>

          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${!item.isRead ? 'bg-[#0e1e38]' : 'bg-transparent'}`} />
                    <h4 className="font-bold text-sm text-[#0e1e38]">{item.title}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{item.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-4">{item.message}</p>
                </div>

                {item.type === 'URGENT' && (
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#0e1e38] text-white shrink-0 shadow-sm hover:bg-[#182e52]"
                  >
                    Action
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
