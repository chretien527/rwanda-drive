'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { mockDriver, mockVehicles } from '@/lib/mockData';
import { Vehicle } from '@/lib/types';
import { 
  Car, 
  ArrowLeft, 
  ShieldCheck, 
  Plus, 
  Check, 
  AlertCircle, 
  FileText, 
  Building2, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function AddVehiclePage() {
  const router = useRouter();

  const [plateNumber, setPlateNumber] = useState<string>('RAD 482B');
  const [make, setMake] = useState<string>('Toyota');
  const [model, setModel] = useState<string>('Corolla Cross');
  const [year, setYear] = useState<number>(2023);
  const [color, setColor] = useState<string>('Pearl White');
  const [chassisNumber, setChassisNumber] = useState<string>('JTNKH82B099231842');
  const [engineCapacity, setEngineCapacity] = useState<string>('1798 cc');
  const [category, setCategory] = useState<'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'BUS'>('CAR');
  const [insuranceProvider, setInsuranceProvider] = useState<string>('Radiant Insurance Rwanda');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newVehicle: Vehicle = {
      id: 'veh_' + Date.now(),
      plateNumber: plateNumber.toUpperCase(),
      make,
      model,
      year: Number(year),
      color,
      chassisNumber: chassisNumber.toUpperCase(),
      engineCapacity,
      category,
      registrationStatus: 'ACTIVE',
      insuranceStatus: 'VALID',
      inspectionStatus: 'VALID',
      documentsCount: 3
    };

    setTimeout(() => {
      // Save to localStorage
      try {
        const existing = localStorage.getItem('rwanda_drive_vehicles');
        const list: Vehicle[] = existing ? JSON.parse(existing) : mockVehicles;
        const updated = [newVehicle, ...list];
        localStorage.setItem('rwanda_drive_vehicles', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving vehicle:', err);
      }

      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        router.push('/dashboard?role=driver&tab=vehicles');
      }, 1200);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-speckle-pattern bg-white text-[#0e1e38] font-sans selection:bg-[#0e1e38] selection:text-white">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0e1e38] transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
            <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0e1e38] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                RW
              </div>
              <div>
                <span className="font-extrabold text-sm text-[#0e1e38] leading-none block">Rwanda Drive</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vehicle Registration Portal</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-[#0e1e38]/10 text-[#0e1e38] px-3 py-1 rounded-full border border-[#0e1e38]/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0e1e38]" />
              <span>RRA &amp; Police Synced</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        
        {/* Page Header Title */}
        <div className="mb-8 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[#0e1e38] text-xs font-bold uppercase tracking-wider mb-2 border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-[#0e1e38]" />
            <span>Independent Registration Form</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0e1e38]">
            Register &amp; Link New Vehicle
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl font-medium">
            Enter your vehicle details to verify ownership with the Rwanda Revenue Authority (RRA) and generate cryptographic digital credentials in your wallet.
          </p>
        </div>

        {/* Form and Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Card (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg space-y-6">
            
            {isSuccess ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-[#0e1e38]">Vehicle Successfully Linked!</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {make} {model} ({plateNumber.toUpperCase()}) has been verified with RRA and added to your digital driver wallet. Redirecting...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-extrabold text-[#0e1e38] mb-2 uppercase tracking-wider">
                    Select Vehicle Classification
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['CAR', 'MOTORCYCLE', 'TRUCK', 'BUS'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
                          category === cat
                            ? 'bg-[#0e1e38] text-white border-[#0e1e38] shadow-md'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Plate & Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Rwanda Plate Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      placeholder="e.g. RAB 123A"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 font-mono font-bold text-sm uppercase focus:outline-none focus:border-[#0e1e38] focus:ring-2 focus:ring-[#0e1e38]/10 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Manufacture Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1990}
                      max={2027}
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-[#0e1e38] focus:ring-2 focus:ring-[#0e1e38]/10 bg-slate-50"
                    />
                  </div>
                </div>

                {/* Make & Model */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Vehicle Manufacturer / Make <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      placeholder="e.g. Toyota"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#0e1e38] focus:ring-2 focus:ring-[#0e1e38]/10 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Model Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. RAV4"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#0e1e38] focus:ring-2 focus:ring-[#0e1e38]/10 bg-slate-50"
                    />
                  </div>
                </div>

                {/* Color & Engine Capacity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Primary Color
                    </label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g. Pearl White"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#0e1e38] focus:ring-2 focus:ring-[#0e1e38]/10 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Engine Displacement
                    </label>
                    <input
                      type="text"
                      value={engineCapacity}
                      onChange={(e) => setEngineCapacity(e.target.value)}
                      placeholder="e.g. 1798 cc"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#0e1e38] focus:ring-2 focus:ring-[#0e1e38]/10 bg-slate-50"
                    />
                  </div>
                </div>

                {/* Chassis / VIN */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Chassis / Vehicle Identification Number (VIN) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={chassisNumber}
                    onChange={(e) => setChassisNumber(e.target.value)}
                    placeholder="e.g. JTNKH82B099231842"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 font-mono text-sm font-bold uppercase focus:outline-none focus:border-[#0e1e38] focus:ring-2 focus:ring-[#0e1e38]/10 bg-slate-50"
                  />
                </div>

                {/* Insurance Provider */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Insurance Provider
                  </label>
                  <select
                    value={insuranceProvider}
                    onChange={(e) => setInsuranceProvider(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-[#0e1e38] focus:ring-2 focus:ring-[#0e1e38]/10 bg-slate-50 cursor-pointer"
                  >
                    <option value="Radiant Insurance Rwanda">Radiant Insurance Rwanda</option>
                    <option value="Sanlam Insurance Rwanda">Sanlam Insurance Rwanda</option>
                    <option value="SONARWA General Insurance">SONARWA General Insurance</option>
                    <option value="Prime Insurance Rwanda">Prime Insurance Rwanda</option>
                    <option value="BK General Insurance">BK General Insurance</option>
                  </select>
                </div>

                {/* RRA Synchronization Notice */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
                  <ShieldCheck className="w-5 h-5 text-[#0e1e38] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#0e1e38] block mb-0.5">Authoritative Verification Notice</span>
                    Your submission automatically queries the RRA Motor Vehicle Registry and Rwanda National Police traffic database to issue verified digital Carte Jaune credentials.
                  </div>
                </div>

                {/* Submit Controls */}
                <div className="pt-2 flex gap-3">
                  <Link
                    href="/dashboard"
                    className="w-1/3 py-3.5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors text-center flex items-center justify-center"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-2/3 py-3.5 rounded-2xl bg-[#0e1e38] hover:bg-[#182e52] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="animate-pulse">Validating with RRA...</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Register &amp; Link to Digital Wallet</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>

          {/* Right Column: Live Card Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Live Credential Preview</span>
                <span className="text-[10px] font-bold bg-[#0e1e38]/10 text-[#0e1e38] px-2.5 py-0.5 rounded-full border border-[#0e1e38]/20">
                  Carte Jaune Spec
                </span>
              </div>

              {/* Digital Certificate Preview Card */}
              <div className="bg-white text-[#0e1e38] rounded-2xl p-6 border border-slate-200 shadow-md space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#0e1e38] text-white flex items-center justify-center font-black text-xs">
                      RW
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase">RRA / RNP Registration</div>
                      <div className="text-xs font-black text-[#0e1e38]">Vehicle Certificate</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    VERIFIED
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200/60">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Plate Number:</span>
                    <span className="font-mono font-bold text-[#0e1e38] bg-slate-200/70 px-2 py-0.5 rounded">
                      {plateNumber ? plateNumber.toUpperCase() : 'RAD 123A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Vehicle:</span>
                    <span className="font-bold text-[#0e1e38]">{make} {model} ({year})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Color / Engine:</span>
                    <span className="font-medium text-slate-700">{color} &bull; {engineCapacity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">VIN:</span>
                    <span className="font-mono text-xs text-[#0e1e38] font-bold">{chassisNumber ? chassisNumber.toUpperCase() : 'JTNKH...'}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-[10px] text-slate-500 font-medium">
                  <span>Registered Owner: <strong className="text-[#0e1e38] font-bold">{mockDriver.fullName}</strong></span>
                  <span className="font-mono">NID: {mockDriver.nationalId}</span>
                </div>
              </div>

              {/* Additional Specs List */}
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automatic RRA Tax Clearance Verification</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automated Technical Inspection Status Check</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant Offline Encryption Token Generation</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
