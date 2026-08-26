'use client';

import React, { useState } from 'react';
import { mockVerificationScenarios } from '@/lib/mockData';
import { VerificationResult } from '@/lib/types';
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
  Clock, 
  Lock, 
  FileCheck2,
  ArrowRight
} from 'lucide-react';

interface OfficerVerifierProps {
  initialToken?: string | null;
  onClearInitialToken?: () => void;
}

export const OfficerVerifier: React.FC<OfficerVerifierProps> = ({
  initialToken,
  onClearInitialToken
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(!initialToken);
  const [currentResult, setCurrentResult] = useState<VerificationResult | null>(
    initialToken ? mockVerificationScenarios.valid : null
  );
  const [manualTokenInput, setManualTokenInput] = useState<string>(initialToken || '');
  const [verificationLogs, setVerificationLogs] = useState<Array<{
    id: string;
    plate: string;
    driver: string;
    status: string;
    time: string;
    badge: string;
  }>>([
    {
      id: 'log_01',
      plate: 'RAB 123A',
      driver: 'Jean Paul Nshimiyimana',
      status: 'VALID',
      time: '14:22:10',
      badge: 'RNP-TFP-0842'
    },
    {
      id: 'log_02',
      plate: 'RAC 459P',
      driver: 'Eric Mugisha',
      status: 'EXPIRED_INSURANCE',
      time: '13:58:44',
      badge: 'RNP-TFP-0842'
    }
  ]);

  const handleScanScenario = (scenarioKey: 'valid' | 'expiredInsurance' | 'suspended') => {
    setIsScanning(true);
    setCurrentResult(null);

    setTimeout(() => {
      const res = mockVerificationScenarios[scenarioKey];
      setCurrentResult(res);
      setIsScanning(false);

      setVerificationLogs(prev => [
        {
          id: 'log_' + Date.now(),
          plate: res.vehiclePlate || 'UNKNOWN',
          driver: res.driverName,
          status: res.status,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          badge: 'RNP-TFP-0842'
        },
        ...prev
      ]);
    }, 700);
  };

  const handleManualVerify = () => {
    if (!manualTokenInput.trim()) return;
    setIsScanning(true);
    setCurrentResult(null);

    setTimeout(() => {
      const isExpired = manualTokenInput.toLowerCase().includes('expired');
      const isSuspended = manualTokenInput.toLowerCase().includes('suspend');
      
      const res = isSuspended 
        ? mockVerificationScenarios.suspended 
        : isExpired 
        ? mockVerificationScenarios.expiredInsurance 
        : mockVerificationScenarios.valid;

      setCurrentResult(res);
      setIsScanning(false);
    }, 600);
  };

  const resetScanner = () => {
    setCurrentResult(null);
    setIsScanning(true);
    setManualTokenInput('');
    if (onClearInitialToken) onClearInitialToken();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#1e3a5f]">
      
      {/* Officer Header Card (2-color Deep Dark Blue) */}
      <div className="bg-[#1e3a5f] text-white p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white text-[#1e3a5f] flex items-center justify-center shadow-lg shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Rwanda National Police &bull; Traffic Enforcement Mode
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
              Roadside Document Verifier
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Officer Badge: <strong className="text-white font-mono">RNP-TFP-0842</strong> &bull; Station: <strong className="text-white">Kigali Central</strong>
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={resetScanner}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-[#1e3a5f] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* Main Scanner / Verification Result Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Scanner Viewfinder (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-[#1e3a5f] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#1e3a5f]" />
                <span>Live QR Viewfinder</span>
              </h3>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#1e3a5f]">
                <span className="w-2 h-2 rounded-full bg-[#1e3a5f] animate-ping" />
                Active Radar
              </span>
            </div>

            {/* Viewfinder UI */}
            <div className="relative aspect-square w-full bg-[#1e3a5f] rounded-2xl overflow-hidden border border-white/10 flex flex-col items-center justify-center p-6 text-white shadow-inner">
              
              {/* Corner Viewfinder Markers */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg" />

              {/* Scanning Laser Line */}
              {isScanning && (
                <div className="absolute top-8 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-white to-transparent scanner-laser shadow-[0_0_10px_#ffffff]" />
              )}

              {/* Center Target */}
              <div className="w-36 h-36 border border-dashed border-white/30 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                <QrCode className="w-12 h-12 text-white/70 mb-2" />
                <span className="text-[11px] text-slate-300">
                  {isScanning ? 'Align driver QR inside frame...' : 'Verification Completed'}
                </span>
              </div>

              {/* Minimal Disclosure Warning */}
              <div className="absolute bottom-3 inset-x-4 bg-white/10 backdrop-blur-md rounded-xl py-1.5 px-3 text-[10px] text-slate-200 text-center flex items-center justify-center gap-1.5 border border-white/10">
                <Lock className="w-3 h-3 text-white shrink-0" />
                <span>Encrypted Verification Protocol &bull; Zero PII Leak</span>
              </div>
            </div>

            {/* Quick Test Scenario Buttons */}
            <div className="mt-5 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Simulate Roadside Verification Scenarios:
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleScanScenario('valid')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#1e3a5f] border border-slate-200 text-xs font-bold transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1e3a5f]" />
                    <span>Scenario 1: Fully Compliant Driver (Valid)</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleScanScenario('expiredInsurance')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#1e3a5f] border border-slate-200 text-xs font-bold transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#1e3a5f]" />
                    <span>Scenario 2: Expired Motor Insurance</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleScanScenario('suspended')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#1e3a5f] border border-slate-200 text-xs font-bold transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-[#1e3a5f]" />
                    <span>Scenario 3: Suspended Licence Alert</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Manual Token String Search */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste QR Token string..."
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:outline-none focus:border-[#1e3a5f]"
                />
                <button
                  onClick={handleManualVerify}
                  className="px-4 py-2 bg-[#1e3a5f] text-white rounded-xl text-xs font-bold hover:bg-[#182e52] transition-all"
                >
                  Lookup
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Real-Time Verification Result View (7 cols) */}
        <div className="lg:col-span-7">
          {currentResult ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              
              {/* Header Status Shield (Strict 2-Color) */}
              <div className="bg-[#0e1e38] p-6 sm:p-8 text-white text-center flex flex-col items-center justify-center relative">
                <div className="w-16 h-16 rounded-2xl bg-white text-[#0e1e38] flex items-center justify-center mb-3 shadow-lg">
                  {currentResult.isValid ? (
                    <ShieldCheck className="w-10 h-10 text-[#0e1e38]" />
                  ) : (
                    <ShieldAlert className="w-10 h-10 text-[#0e1e38]" />
                  )}
                </div>

                <span className="text-[10px] uppercase font-black tracking-widest bg-white/10 text-white px-3 py-1 rounded-full border border-white/20 mb-2">
                  Official Verification Status
                </span>

                <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-white">
                  {currentResult.status === 'VALID' ? 'DOCUMENT VALID & VERIFIED' : `COMPLIANCE ALERT: ${currentResult.status}`}
                </h2>

                <p className="text-xs text-slate-300 mt-1 max-w-md">
                  {currentResult.isValid 
                    ? 'All driver licences and vehicle credentials match authoritative Rwanda National Police records.' 
                    : 'Discrepancy or expired compliance detected on roadside verification.'}
                </p>
              </div>

              {/* Driver & Vehicle Match Details */}
              <div className="p-6 sm:p-8 space-y-6">
                
                {/* Driver Identity Match Box */}
                <div className="flex gap-4 items-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentResult.driverPhoto}
                    alt={currentResult.driverName}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-300 shadow-xs shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Authoritative Driver Record
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

                {/* Road Compliance Checklist */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Road Compliance Verification Matrix
                  </div>

                  {/* Licence Status */}
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs">
                    <div>
                      <div className="font-bold text-[#0e1e38]">Driving Licence (Cat: {currentResult.licenceCategories.join(', ')})</div>
                      <div className="text-[11px] text-slate-500">Exp: {currentResult.licenceExpiry}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-[#0e1e38] text-white">
                      {currentResult.licenceStatus}
                    </span>
                  </div>

                  {/* Vehicle Plate & Carte Jaune */}
                  {currentResult.vehiclePlate && (
                    <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs">
                      <div>
                        <div className="font-bold text-[#0e1e38]">Vehicle Logbook ({currentResult.vehiclePlate})</div>
                        <div className="text-[11px] text-slate-500">{currentResult.vehicleModel}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-[#0e1e38] text-white">
                        MATCHED / VALID
                      </span>
                    </div>
                  )}

                  {/* Insurance Status */}
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs">
                    <div>
                      <div className="font-bold text-[#0e1e38]">Motor Vehicle Insurance</div>
                      <div className="text-[11px] text-slate-500">{currentResult.insuranceProvider}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-[#0e1e38] text-white">
                      {currentResult.insuranceValid ? 'VALID' : 'EXPIRED'}
                    </span>
                  </div>

                  {/* Contrôle Technique */}
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs">
                    <div>
                      <div className="font-bold text-[#0e1e38]">RNP Contrôle Technique</div>
                      <div className="text-[11px] text-slate-500">{currentResult.inspectionExpiry || 'Remera Testing Center'}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-[#0e1e38] text-white">
                      {currentResult.inspectionValid ? 'PASSED' : 'EXPIRED'}
                    </span>
                  </div>
                </div>

                {/* Audit Timestamp */}
                <div className="p-3.5 bg-slate-100 rounded-2xl flex items-center justify-between text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Verified at: <strong className="text-[#0e1e38]">{currentResult.verifiedAt}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{currentResult.location}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={resetScanner}
                    className="w-full py-3 rounded-xl bg-[#0e1e38] hover:bg-[#182e52] text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Scan Next Driver
                  </button>
                </div>

              </div>

            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-white text-[#0e1e38] border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#0e1e38]">
                Awaiting QR Code Presentation
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Use the viewfinder on the left or select a sample roadside scenario to test live validation against Rwanda National Police mock APIs.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Verification Audit Log Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#0e1e38] flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#0e1e38]" />
              <span>Shift Verification Audit Trail</span>
            </h3>
            <p className="text-xs text-slate-500">Live timestamped record of roadside checks by Officer RNP-TFP-0842</p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-[#0e1e38] px-3 py-1 rounded-full font-bold">
            {verificationLogs.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Vehicle Plate</th>
                <th className="py-3 px-4">Driver Name</th>
                <th className="py-3 px-4">Officer Badge</th>
                <th className="py-3 px-4">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {verificationLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-[#0e1e38]">{log.time}</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#0e1e38]">{log.plate}</td>
                  <td className="py-3 px-4 font-semibold text-[#0e1e38]">{log.driver}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{log.badge}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-[#0e1e38] text-white">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
