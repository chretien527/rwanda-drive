'use client';

import React, { useState, useEffect } from 'react';
import { VerificationResult } from '@/lib/types';
import { mockVerificationScenarios } from '@/lib/mockData';
import { 
  ShieldCheck, 
  ShieldAlert, 
  QrCode, 
  Camera, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  MapPin, 
  Lock, 
  ArrowRight,
  Search,
  Wifi,
  Smartphone,
  Car,
  FileText,
  BadgeAlert,
  Send,
  Check,
  Zap,
  ChevronRight,
  Layers,
  History,
  CheckCircle
} from 'lucide-react';

interface PoliceDashboardProps {
  onSimulateScan?: (token: string) => void;
  activeSection?: string;
  onNavigateSection?: (section: string) => void;
}

export const PoliceDashboard: React.FC<PoliceDashboardProps> = ({
  activeSection = 'overview',
  onNavigateSection
}) => {
  // Police Active Tab inside dashboard - synced with parent sidebar
  const [policeTab, setPoliceTab] = useState<'overview' | 'scanner' | 'checkpoints' | 'radar' | 'citations' | 'audit'>(
    (activeSection as any) || 'overview'
  );

  useEffect(() => {
    if (activeSection && activeSection !== policeTab) {
      setPoliceTab(activeSection as any);
    }
  }, [activeSection]);

  const handleTabChange = (newTab: 'overview' | 'scanner' | 'checkpoints' | 'radar' | 'citations' | 'audit') => {
    setPoliceTab(newTab);
    if (onNavigateSection) {
      onNavigateSection(newTab);
    }
  };

  // Scan Method / Path Selection
  const [scanMethod, setScanMethod] = useState<'camera' | 'nfc' | 'plate' | 'mesh'>('camera');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<VerificationResult | null>(null);
  const [plateQuery, setPlateQuery] = useState<string>('');
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>('cp_01');
  
  // Citation Modal State
  const [showCitationModal, setShowCitationModal] = useState<boolean>(false);
  const [citationReason, setCitationReason] = useState<string>('Expired Insurance Policy');
  const [citationAmount, setCitationAmount] = useState<string>('25,000');
  const [citationSuccessMsg, setCitationSuccessMsg] = useState<string | null>(null);

  // Flash / Torch state for camera
  const [torchOn, setTorchOn] = useState<boolean>(false);

  // Police Shift Logs
  const [shiftLogs, setShiftLogs] = useState<Array<{
    id: string;
    time: string;
    plate: string;
    driver: string;
    status: 'VALID' | 'EXPIRED' | 'SUSPENDED';
    checkpoint: string;
    actionTaken: string;
  }>>([
    {
      id: 'log_01',
      time: '14:28:12',
      plate: 'RAB 123A',
      driver: 'Jean Paul Nshimiyimana',
      status: 'VALID',
      checkpoint: 'KN 3 Rd - Nyabugogo Corridor',
      actionTaken: 'Cleared / Pass'
    },
    {
      id: 'log_02',
      time: '14:05:40',
      plate: 'RAC 459P',
      driver: 'Eric Mugisha',
      status: 'EXPIRED',
      checkpoint: 'KN 3 Rd - Nyabugogo Corridor',
      actionTaken: 'E-Citation Issued (RWF 25,000)'
    },
    {
      id: 'log_03',
      time: '13:30:19',
      plate: 'RAD 902K',
      driver: 'Gervais Hakizimana',
      status: 'SUSPENDED',
      checkpoint: 'KG 1 Roundabout - Gishushu',
      actionTaken: 'Vehicle Detained / Flagged'
    }
  ]);

  // Kigali Checkpoints List
  const checkpoints = [
    {
      id: 'cp_01',
      name: 'Nyabugogo Transport Hub',
      code: 'RNP-CP-04',
      district: 'Nyarugenge',
      corridor: 'KN 1 Rd / KN 3 Rd',
      activeOfficers: 4,
      queueCount: 12,
      complianceRate: '94%',
      status: 'HIGH_PRIORITY'
    },
    {
      id: 'cp_02',
      name: 'Remera - Gishushu Corridor',
      code: 'RNP-CP-09',
      district: 'Gasabo',
      corridor: 'KG 11 Ave / Airport Rd',
      activeOfficers: 3,
      queueCount: 5,
      complianceRate: '98%',
      status: 'ACTIVE_PATROL'
    },
    {
      id: 'cp_03',
      name: 'Kicukiro Sonatubes Junction',
      code: 'RNP-CP-12',
      district: 'Kicukiro',
      corridor: 'KK 15 Rd / Bugesera Highway',
      activeOfficers: 2,
      queueCount: 8,
      complianceRate: '91%',
      status: 'SPEED_RADAR'
    },
    {
      id: 'cp_04',
      name: 'Downtown Commercial Roundabout',
      code: 'RNP-CP-01',
      district: 'Nyarugenge',
      corridor: 'KN 2 Ave',
      activeOfficers: 3,
      queueCount: 3,
      complianceRate: '99%',
      status: 'ACTIVE_PATROL'
    }
  ];

  // Scan triggers
  const executeScan = (scenarioKey: 'valid' | 'expiredInsurance' | 'suspended') => {
    setIsScanning(true);
    setCurrentResult(null);

    setTimeout(() => {
      const res = mockVerificationScenarios[scenarioKey];
      setCurrentResult(res);
      setIsScanning(false);

      // Add to log
      const activeCp = checkpoints.find(c => c.id === selectedCheckpoint)?.name || 'Kigali Central';
      setShiftLogs(prev => [
        {
          id: 'log_' + Date.now(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          plate: res.vehiclePlate || 'RAB 123A',
          driver: res.driverName,
          status: res.status === 'VALID' ? 'VALID' : res.status === 'SUSPENDED' ? 'SUSPENDED' : 'EXPIRED',
          checkpoint: activeCp,
          actionTaken: res.isValid ? 'Cleared / Pass' : res.status === 'SUSPENDED' ? 'Impound Escort' : 'E-Citation Pending'
        },
        ...prev
      ]);
    }, 600);
  };

  const handlePlateSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateQuery.trim()) return;

    const query = plateQuery.toUpperCase().trim();
    if (query.includes('459') || query.includes('RAC')) {
      executeScan('expiredInsurance');
    } else if (query.includes('902') || query.includes('RAD')) {
      executeScan('suspended');
    } else {
      executeScan('valid');
    }
  };

  const handleIssueCitation = () => {
    if (!currentResult) return;
    setCitationSuccessMsg(`Electronic Citation of RWF ${citationAmount} successfully filed for ${currentResult.vehiclePlate || 'vehicle'}. Official RNP SMS notification sent to driver.`);
    setTimeout(() => {
      setShowCitationModal(false);
      setCitationSuccessMsg(null);
    }, 3000);
  };

  return (
    <div className="space-y-8 text-[#0e1e38] max-w-7xl mx-auto">
      
      {/* 1. POLICE COMMAND BADGE & QUICK STATUS BAR */}
      <div className="bg-white text-[#0e1e38] p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-radial-gradient from-[#0e1e38]/5 to-transparent pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0e1e38] text-white flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck className="w-9 h-9 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0e1e38]/10 text-[#0e1e38] border border-[#0e1e38]/20">
                  RNP Traffic Enforcement Command
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0e1e38] bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Patrol Radar
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0e1e38] tracking-tight mt-1">
                Inspector Eric Habimana
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Badge: <span className="font-mono font-bold text-[#0e1e38]">RNP-TFP-0842</span> &bull; Patrol Unit: <span className="font-semibold text-[#0e1e38]">Cruiser Alpha-7</span> &bull; Station: <span className="font-semibold text-[#0e1e38]">Kigali Central</span>
              </p>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="text-center px-3 border-r border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500">Shift Scans</div>
              <div className="text-xl font-black text-[#0e1e38] font-mono">{shiftLogs.length + 38}</div>
            </div>
            <div className="text-center px-3 border-r border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500">Compliance</div>
              <div className="text-xl font-black text-[#0e1e38] font-mono">96.4%</div>
            </div>
            <div className="text-center px-3">
              <div className="text-[10px] uppercase font-bold text-slate-500">Flagged</div>
              <div className="text-xl font-black text-[#0e1e38] font-mono">2</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TAB: PATROL OVERVIEW */}
      {policeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Quick Operational Launch Paths */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-[#0e1e38]">
                Enforcement Scanning Methods & Paths
              </h2>
              <span className="text-xs text-slate-500 font-semibold">Select an enforcement method to verify approaching drivers</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Path 1 */}
              <div 
                onClick={() => { handleTabChange('scanner'); setScanMethod('camera'); }}
                className="p-6 bg-white rounded-3xl border border-slate-200 hover:border-[#0e1e38] shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#0e1e38] text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-md">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-[#0e1e38] mb-1">
                    1. Live Optical Camera
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Point viewfinder at driver&apos;s 60-second rotating cryptographic QR token for roadside validation.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0e1e38]">
                  <span>Launch Viewfinder</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Path 2 */}
              <div 
                onClick={() => { handleTabChange('scanner'); setScanMethod('nfc'); }}
                className="p-6 bg-white rounded-3xl border border-slate-200 hover:border-[#0e1e38] shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#0e1e38] text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-md">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-[#0e1e38] mb-1">
                    2. NFC Proximity Tap
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tap officer terminal to driver&apos;s phone for instant 0.2s high-throughput checkpoint flow.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0e1e38]">
                  <span>Start Proximity Tap</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Path 3 */}
              <div 
                onClick={() => { handleTabChange('radar'); }}
                className="p-6 bg-white rounded-3xl border border-slate-200 hover:border-[#0e1e38] shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#0e1e38] text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-md">
                    <Car className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-[#0e1e38] mb-1">
                    3. Rapid Plate Lookup
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Query plate numbers (e.g. RAB 123A) or National ID when physical QR display is unavailable.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0e1e38]">
                  <span>Open Plate Radar</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Path 4 */}
              <div 
                onClick={() => { handleTabChange('checkpoints'); }}
                className="p-6 bg-white rounded-3xl border border-slate-200 hover:border-[#0e1e38] shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#0e1e38] text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-md">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-[#0e1e38] mb-1">
                    4. Active Checkpoints
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Deploy to Nyabugogo, Remera, Sonatubes or Downtown to initiate coordinated perimeter scans.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0e1e38]">
                  <span>View Kigali Hubs</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Shift Activity & Checkpoint Feeds */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Active Checkpoint Status */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-[#0e1e38]">Current Assigned Checkpoint</h3>
                  <p className="text-xs text-slate-500">Live operational perimeter & traffic flow</p>
                </div>
                <span className="px-3 py-1 bg-[#0e1e38] text-white rounded-full text-xs font-bold">
                  KN 3 Rd - Nyabugogo Corridor
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Target Vehicle Inspection Rate:</span>
                  <strong className="text-[#0e1e38] font-mono">100% Digital Verified</strong>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0e1e38] rounded-full w-[84%]" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                  <span>84 Verified Vehicles this hour</span>
                  <span>Target: 100/hr</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Radiant / Sanlam Valid</div>
                  <div className="text-lg font-black text-[#0e1e38] mt-0.5">97.8%</div>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Contrôle Technique</div>
                  <div className="text-lg font-black text-[#0e1e38] mt-0.5">95.2%</div>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Average Scan Time</div>
                  <div className="text-lg font-black text-[#0e1e38] mt-0.5 font-mono">1.2s</div>
                </div>
              </div>

              <button
                onClick={() => { handleTabChange('scanner'); }}
                className="w-full py-3.5 bg-[#0e1e38] hover:bg-[#182e52] text-white rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Launch Roadside Scanner at this Checkpoint</span>
              </button>
            </div>

            {/* Right: Recent Scans stream */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-lg text-[#0e1e38]">Live Shift Feed</h3>
                <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Real-time</span>
              </div>

              <div className="space-y-3">
                {shiftLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-[#0e1e38]">{log.plate}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0e1e38] text-white">
                          {log.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-semibold mt-0.5 truncate">{log.driver}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-[11px] text-slate-500">{log.time}</div>
                      <div className="text-[10px] font-bold text-[#0e1e38]">{log.actionTaken}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleTabChange('audit')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0e1e38] rounded-xl text-xs font-bold transition-all text-center"
              >
                View Full Audit Logs ({shiftLogs.length})
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 3. TAB: ROADSIDE QR SCANNER TERMINAL (MULTI-METHOD) */}
      {policeTab === 'scanner' && (
        <div className="space-y-6">
          
          {/* Method Switching Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Pathway:</span>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  onClick={() => { setScanMethod('camera'); setCurrentResult(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    scanMethod === 'camera' ? 'bg-[#0e1e38] text-white shadow-sm' : 'text-slate-600 hover:text-[#0e1e38]'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>1. Camera QR</span>
                </button>
                <button
                  onClick={() => { setScanMethod('nfc'); setCurrentResult(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    scanMethod === 'nfc' ? 'bg-[#0e1e38] text-white shadow-sm' : 'text-slate-600 hover:text-[#0e1e38]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>2. NFC Proximity</span>
                </button>
                <button
                  onClick={() => { setScanMethod('plate'); setCurrentResult(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    scanMethod === 'plate' ? 'bg-[#0e1e38] text-white shadow-sm' : 'text-slate-600 hover:text-[#0e1e38]'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>3. Plate Lookup</span>
                </button>
                <button
                  onClick={() => { setScanMethod('mesh'); setCurrentResult(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    scanMethod === 'mesh' ? 'bg-[#0e1e38] text-white shadow-sm' : 'text-slate-600 hover:text-[#0e1e38]'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>4. Offline Mesh</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTorchOn(!torchOn)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                  torchOn ? 'bg-[#0e1e38] text-white border-[#0e1e38]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-[#0e1e38]'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{torchOn ? 'Torch Active' : 'Torch Off'}</span>
              </button>

              <button
                onClick={() => { setCurrentResult(null); setIsScanning(false); }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#0e1e38] transition-all flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Frame</span>
              </button>
            </div>
          </div>

          {/* Scanner Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Col: Viewfinder / Capture Frame (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                
                {/* Method 1: Optical Camera */}
                {scanMethod === 'camera' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[#0e1e38] flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-[#0e1e38]" />
                        <span>High-Speed Reticle Viewfinder</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#0e1e38] text-white">
                        60 FPS
                      </span>
                    </div>

                    <div className="relative aspect-square w-full bg-[#0e1e38] rounded-2xl overflow-hidden border border-white/10 flex flex-col items-center justify-center p-6 text-white shadow-inner">
                      {/* Corner markers */}
                      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg" />
                      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg" />
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg" />

                      {/* Laser Line */}
                      <div className="absolute top-8 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-white to-transparent scanner-laser shadow-[0_0_12px_#ffffff]" />

                      {/* Reticle Target */}
                      <div className="w-40 h-40 border border-dashed border-white/40 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                        <QrCode className="w-12 h-12 text-white/80 mb-2" />
                        <span className="text-[11px] text-slate-200 font-medium">
                          {isScanning ? 'Decoding cryptographic payload...' : 'Align driver dynamic QR inside frame'}
                        </span>
                      </div>

                      {/* Privacy Shield Info */}
                      <div className="absolute bottom-3 inset-x-4 bg-white/10 backdrop-blur-md rounded-xl py-1.5 px-3 text-[10px] text-slate-200 text-center flex items-center justify-center gap-1.5 border border-white/10">
                        <Lock className="w-3 h-3 text-white shrink-0" />
                        <span>RNP Authoritative Verification Node</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Method 2: NFC Proximity */}
                {scanMethod === 'nfc' && (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-24 h-24 rounded-full bg-[#0e1e38] text-white flex items-center justify-center mx-auto animate-pulse shadow-xl">
                      <Smartphone className="w-12 h-12" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-[#0e1e38]">NFC Proximity Radar Active</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                        Hold officer phone within 4cm of driver handset to read encrypted credential token.
                      </p>
                    </div>
                    <button
                      onClick={() => executeScan('valid')}
                      className="px-6 py-2.5 bg-[#0e1e38] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#182e52] transition-all"
                    >
                      Simulate Driver Handset Tap
                    </button>
                  </div>
                )}

                {/* Method 3: Plate Lookup */}
                {scanMethod === 'plate' && (
                  <div className="space-y-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Vehicle Plate / Chassis Query
                    </div>
                    <form onSubmit={handlePlateSearch} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. RAB 123A or RAC 459P"
                        value={plateQuery}
                        onChange={(e) => setPlateQuery(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#0e1e38]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-[#0e1e38] text-white rounded-xl text-xs font-bold hover:bg-[#182e52] transition-all"
                      >
                        Search
                      </button>
                    </form>
                    <p className="text-[11px] text-slate-500">
                      Instantly reconciles RRA vehicle registry, Radiant Insurance, and RNP Contrôle Technique.
                    </p>
                  </div>
                )}

                {/* Method 4: Offline Mesh */}
                {scanMethod === 'mesh' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-[#0e1e38] text-white flex items-center justify-center mx-auto shadow-lg">
                      <Wifi className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="font-black text-base text-[#0e1e38]">Offline Bluetooth Mesh Terminal</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                        Validates ECC cryptographic signatures against local cached authority keys without internet.
                      </p>
                    </div>
                    <button
                      onClick={() => executeScan('valid')}
                      className="px-6 py-2.5 bg-[#0e1e38] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#182e52] transition-all"
                    >
                      Verify via Local Cache
                    </button>
                  </div>
                )}

                {/* Instant Roadside Scenario Simulator Buttons */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Simulate Live Driver Approaching:
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => executeScan('valid')}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0e1e38] text-xs font-bold transition-all flex items-center justify-between text-left"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#0e1e38]" />
                        <span>Driver A: 100% Compliant (Toyota RAV4 - RAB 123A)</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>

                    <button
                      onClick={() => executeScan('expiredInsurance')}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0e1e38] text-xs font-bold transition-all flex items-center justify-between text-left"
                    >
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#0e1e38]" />
                        <span>Driver B: Expired Insurance (Hyundai - RAC 459P)</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>

                    <button
                      onClick={() => executeScan('suspended')}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0e1e38] text-xs font-bold transition-all flex items-center justify-between text-left"
                    >
                      <span className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#0e1e38]" />
                        <span>Driver C: Licence Suspended (Mercedes - RAD 902K)</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Col: Instant Verification Outcome Display (7 cols) */}
            <div className="lg:col-span-7">
              {currentResult ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-0">
                  
                  {/* Status Banner */}
                  <div className="bg-[#0e1e38] p-6 sm:p-8 text-white text-center flex flex-col items-center justify-center relative">
                    <div className="w-16 h-16 rounded-2xl bg-white text-[#0e1e38] flex items-center justify-center mb-3 shadow-xl">
                      {currentResult.isValid ? (
                        <ShieldCheck className="w-10 h-10 text-[#0e1e38]" />
                      ) : (
                        <ShieldAlert className="w-10 h-10 text-[#0e1e38]" />
                      )}
                    </div>

                    <span className="text-[10px] uppercase font-black tracking-widest bg-white/10 text-white px-3 py-1 rounded-full border border-white/20 mb-2">
                      RNP Roadside Verification Outcome
                    </span>

                    <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-white">
                      {currentResult.status === 'VALID' ? 'ALL CREDENTIALS COMPLIANT' : `COMPLIANCE ALERT: ${currentResult.status}`}
                    </h2>

                    <p className="text-xs text-slate-300 mt-1 max-w-md">
                      {currentResult.isValid 
                        ? 'Driver Licence, Carte Jaune, Insurance, and Contrôle Technique confirmed authentic.' 
                        : 'Infraction detected during roadside credential validation.'}
                    </p>
                  </div>

                  {/* Verification Matrix */}
                  <div className="p-6 sm:p-8 space-y-6">
                    
                    {/* Driver Profile Record */}
                    <div className="flex gap-4 items-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentResult.driverPhoto}
                        alt={currentResult.driverName}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-300 shadow-sm shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Authoritative NIDA Record
                        </div>
                        <h3 className="text-base font-extrabold text-[#0e1e38] truncate">
                          {currentResult.driverName}
                        </h3>
                        <div className="text-xs text-slate-600">
                          National ID: <span className="font-mono font-bold text-[#0e1e38]">{currentResult.nationalIdMasked}</span>
                        </div>
                        <div className="text-xs text-slate-600">
                          Licence No: <span className="font-mono font-bold text-[#0e1e38]">{currentResult.licenceNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Matrix Checklist */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        4-Point Road Compliance Matrix
                      </div>

                      {/* 1. Licence */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs">
                        <div>
                          <div className="font-bold text-[#0e1e38]">1. Driving Licence (Cat: {currentResult.licenceCategories.join(', ')})</div>
                          <div className="text-[11px] text-slate-500">Exp: {currentResult.licenceExpiry}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-[#0e1e38] text-white">
                          {currentResult.licenceStatus}
                        </span>
                      </div>

                      {/* 2. Vehicle Logbook */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs">
                        <div>
                          <div className="font-bold text-[#0e1e38]">2. Carte Jaune / Registration ({currentResult.vehiclePlate || 'RAB 123A'})</div>
                          <div className="text-[11px] text-slate-500">{currentResult.vehicleModel || 'Registered Vehicle'}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-[#0e1e38] text-white">
                          MATCHED / VALID
                        </span>
                      </div>

                      {/* 3. Insurance */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs">
                        <div>
                          <div className="font-bold text-[#0e1e38]">3. Motor Insurance (Radiant/Sanlam)</div>
                          <div className="text-[11px] text-slate-500">{currentResult.insuranceProvider}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-[#0e1e38] text-white">
                          {currentResult.insuranceValid ? 'VALID' : 'EXPIRED'}
                        </span>
                      </div>

                      {/* 4. Inspection */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs">
                        <div>
                          <div className="font-bold text-[#0e1e38]">4. RNP Contrôle Technique</div>
                          <div className="text-[11px] text-slate-500">{currentResult.inspectionExpiry || 'Remera Testing Station'}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-[#0e1e38] text-white">
                          {currentResult.inspectionValid ? 'PASSED' : 'EXPIRED'}
                        </span>
                      </div>
                    </div>

                    {/* Enforcement Action Buttons */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      {currentResult.isValid ? (
                        <button
                          onClick={() => { setCurrentResult(null); }}
                          className="w-full py-3.5 rounded-2xl bg-[#0e1e38] hover:bg-[#182e52] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Clear Driver & Scan Next</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setShowCitationModal(true)}
                            className="flex-1 py-3.5 rounded-2xl bg-[#0e1e38] hover:bg-[#182e52] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                          >
                            <BadgeAlert className="w-4 h-4" />
                            <span>Issue Electronic Citation</span>
                          </button>

                          <button
                            onClick={() => { setCurrentResult(null); }}
                            className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#0e1e38] font-bold text-xs transition-all"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>

                  </div>

                </div>
              ) : (
                <div className="h-full min-h-[440px] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-white text-[#0e1e38] border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0e1e38]">
                    Awaiting Roadside QR Presentation
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Use the viewfinder on the left or select an approaching driver scenario to test instant roadside validation against Rwanda National Police records.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* 4. TAB: ACTIVE KIGALI CHECKPOINTS */}
      {policeTab === 'checkpoints' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-[#0e1e38]">Kigali Perimeter Checkpoints</h2>
              <p className="text-xs text-slate-500">Live operational deployment & digital compliance radar</p>
            </div>
            <button
              onClick={() => { handleTabChange('scanner'); }}
              className="px-4 py-2.5 bg-[#0e1e38] text-white rounded-xl text-xs font-bold hover:bg-[#182e52] transition-all flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>Launch Scan at Selected Hub</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {checkpoints.map((cp) => {
              const isSelected = selectedCheckpoint === cp.id;
              return (
                <div
                  key={cp.id}
                  onClick={() => setSelectedCheckpoint(cp.id)}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-[#0e1e38] ring-2 ring-[#0e1e38]/10 shadow-lg'
                      : 'border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#0e1e38] text-white flex items-center justify-center shadow-md">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-[#0e1e38]">
                          {cp.code} &bull; {cp.district}
                        </span>
                        <h3 className="text-base font-extrabold text-[#0e1e38] mt-1">
                          {cp.name}
                        </h3>
                        <p className="text-xs text-slate-500">{cp.corridor}</p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0e1e38] text-white">
                      {cp.status}
                    </span>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-400">Deployed Officers</div>
                      <div className="text-sm font-black text-[#0e1e38] font-mono">{cp.activeOfficers}</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-400">Approaching</div>
                      <div className="text-sm font-black text-[#0e1e38] font-mono">{cp.queueCount} Cars</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-400">Compliance</div>
                      <div className="text-sm font-black text-[#0e1e38] font-mono">{cp.complianceRate}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#0e1e38]">
                    <span>{isSelected ? 'Currently Assigned Checkpoint' : 'Click to Set as Active Checkpoint'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB: PLATE & NATIONAL ID RADAR */}
      {policeTab === 'radar' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-[#0e1e38]">Authoritative Vehicle & Driver Database</h2>
              <p className="text-xs text-slate-500">Query central RNP, RRA, and Association of Insurers records</p>
            </div>

            <form onSubmit={handlePlateSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-[#0e1e38] focus-within:ring-2 focus-within:ring-[#0e1e38]/10">
                <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Enter Plate (e.g. RAB 123A) or 16-Digit National ID..."
                  value={plateQuery}
                  onChange={(e) => setPlateQuery(e.target.value)}
                  className="w-full text-xs font-bold uppercase tracking-wider text-[#0e1e38] focus:outline-none bg-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 bg-[#0e1e38] hover:bg-[#182e52] text-white rounded-2xl text-xs font-bold shadow-md transition-all"
              >
                Perform Lookup
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => { setPlateQuery('RAB 123A'); executeScan('valid'); handleTabChange('scanner'); }}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left text-xs font-semibold"
              >
                <div className="font-mono font-bold text-[#0e1e38]">RAB 123A (Valid)</div>
                <div className="text-[11px] text-slate-500">Toyota RAV4 &bull; Jean Paul N.</div>
              </button>

              <button
                type="button"
                onClick={() => { setPlateQuery('RAC 459P'); executeScan('expiredInsurance'); handleTabChange('scanner'); }}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left text-xs font-semibold"
              >
                <div className="font-mono font-bold text-[#0e1e38]">RAC 459P (Expired Ins)</div>
                <div className="text-[11px] text-slate-500">Hyundai Tucson &bull; Eric M.</div>
              </button>

              <button
                type="button"
                onClick={() => { setPlateQuery('RAD 902K'); executeScan('suspended'); handleTabChange('scanner'); }}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left text-xs font-semibold"
              >
                <div className="font-mono font-bold text-[#0e1e38]">RAD 902K (Suspended)</div>
                <div className="text-[11px] text-slate-500">Mercedes C200 &bull; Gervais H.</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB: E-CITATIONS & FINES */}
      {policeTab === 'citations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#0e1e38]">Electronic Road Citations</h2>
              <p className="text-xs text-slate-500">Official RNP electronic notices linked to driver Irembo accounts</p>
            </div>
            <button
              onClick={() => { setShowCitationModal(true); }}
              className="px-4 py-2.5 bg-[#0e1e38] text-white rounded-xl text-xs font-bold hover:bg-[#182e52] transition-all flex items-center gap-1.5"
            >
              <BadgeAlert className="w-4 h-4" />
              <span>Create New Notice</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/80 text-slate-500 font-extrabold uppercase tracking-wider text-xs border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6">Notice Ref</th>
                  <th className="py-4 px-6">Driver &amp; Plate</th>
                  <th className="py-4 px-6">Violation</th>
                  <th className="py-4 px-6">Fine Amount</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-5 px-6 font-mono font-black text-[#0e1e38]">RNP-CIT-2025-0812</td>
                  <td className="py-5 px-6">
                    <div className="font-extrabold text-[#0e1e38] text-base">Eric Mugisha</div>
                    <div className="font-mono text-slate-500 text-xs mt-0.5">RAC 459P</div>
                  </td>
                  <td className="py-5 px-6 font-semibold">Expired Motor Insurance Policy</td>
                  <td className="py-5 px-6 font-mono font-black text-[#0e1e38] text-base">RWF 25,000</td>
                  <td className="py-5 px-6">
                    <span className="px-3 py-1.5 rounded-full text-xs font-black bg-slate-100 text-[#0e1e38] border border-slate-200">
                      SMS SENT / UNPAID
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-5 px-6 font-mono font-black text-[#0e1e38]">RNP-CIT-2025-0799</td>
                  <td className="py-5 px-6">
                    <div className="font-extrabold text-[#0e1e38] text-base">Gervais Hakizimana</div>
                    <div className="font-mono text-slate-500 text-xs mt-0.5">RAD 902K</div>
                  </td>
                  <td className="py-5 px-6 font-semibold">Driving with Suspended Licence</td>
                  <td className="py-5 px-6 font-mono font-black text-[#0e1e38] text-base">RWF 50,000</td>
                  <td className="py-5 px-6">
                    <span className="px-3 py-1.5 rounded-full text-xs font-black bg-[#0e1e38] text-white shadow-sm">
                      ESCALATED / IMPOUND
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. TAB: SHIFT AUDIT TRAIL */}
      {policeTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#0e1e38]">Shift Verification Audit Logs</h2>
              <p className="text-xs text-slate-500">Cryptographically signed logs of all roadside inspections</p>
            </div>
            <span className="font-mono text-xs font-black px-3.5 py-1.5 bg-slate-100 text-[#0e1e38] rounded-full border border-slate-200">
              {shiftLogs.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/80 text-slate-500 font-extrabold uppercase tracking-wider text-xs border-y border-slate-200">
                <tr>
                  <th className="py-4 px-6">Time</th>
                  <th className="py-4 px-6">Vehicle Plate</th>
                  <th className="py-4 px-6">Driver Name</th>
                  <th className="py-4 px-6">Checkpoint</th>
                  <th className="py-4 px-6">Result</th>
                  <th className="py-4 px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {shiftLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4.5 px-6 font-mono font-bold text-[#0e1e38] text-xs">{log.time}</td>
                    <td className="py-4.5 px-6 font-mono font-black text-[#0e1e38] text-sm">{log.plate}</td>
                    <td className="py-4.5 px-6 font-extrabold text-[#0e1e38]">{log.driver}</td>
                    <td className="py-4.5 px-6 text-slate-600 font-medium text-xs">{log.checkpoint}</td>
                    <td className="py-4.5 px-6">
                      <span className="px-3 py-1.5 rounded-full font-black text-xs bg-[#0e1e38] text-white shadow-xs">
                        {log.status}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 font-bold text-[#0e1e38] text-xs">{log.actionTaken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CITATION MODAL */}
      {showCitationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0e1e38]/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0e1e38] text-white flex items-center justify-center">
                  <BadgeAlert className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-[#0e1e38]">Issue E-Citation</h3>
              </div>
              <button
                onClick={() => setShowCitationModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-[#0e1e38]"
              >
                ✕
              </button>
            </div>

            {citationSuccessMsg ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <Check className="w-8 h-8 text-[#0e1e38] mx-auto" />
                <p className="text-xs font-bold text-[#0e1e38]">{citationSuccessMsg}</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#0e1e38] mb-1 uppercase tracking-wider">
                    Infraction Reason
                  </label>
                  <select
                    value={citationReason}
                    onChange={(e) => setCitationReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-[#0e1e38] focus:outline-none"
                  >
                    <option value="Expired Insurance Policy">Expired Motor Insurance (RWF 25,000)</option>
                    <option value="Overdue Contrôle Technique">Overdue Inspection Certificate (RWF 25,000)</option>
                    <option value="Driving with Suspended Licence">Driving with Suspended Licence (RWF 50,000)</option>
                    <option value="Unregistered Transport Service">Unregistered Commercial Passenger (RWF 30,000)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#0e1e38] mb-1 uppercase tracking-wider">
                    Fine Amount (RWF)
                  </label>
                  <input
                    type="text"
                    value={citationAmount}
                    onChange={(e) => setCitationAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-[#0e1e38] focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-[11px] leading-relaxed">
                  Notice will immediately transmit to Rwanda National Police central gateway and trigger an SMS payment link via Irembo.
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleIssueCitation}
                    className="flex-1 py-3 bg-[#0e1e38] hover:bg-[#182e52] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Citation via SMS</span>
                  </button>
                  <button
                    onClick={() => setShowCitationModal(false)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-[#0e1e38] rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
