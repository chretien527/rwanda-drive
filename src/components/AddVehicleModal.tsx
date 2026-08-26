'use client';

import React, { useState } from 'react';
import { Vehicle } from '@/lib/types';
import { X, Car, Plus, ShieldCheck, Check } from 'lucide-react';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (vehicle: Vehicle) => void;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [plateNumber, setPlateNumber] = useState<string>('RAD 482B');
  const [make, setMake] = useState<string>('Toyota');
  const [model, setModel] = useState<string>('Corolla Cross');
  const [year, setYear] = useState<number>(2023);
  const [color, setColor] = useState<string>('Pearl White');
  const [chassisNumber, setChassisNumber] = useState<string>('JTNKH82B099231842');
  const [engineCapacity, setEngineCapacity] = useState<string>('1798 cc');
  const [category, setCategory] = useState<'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'BUS'>('CAR');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVeh: Vehicle = {
      id: 'veh_' + Date.now(),
      plateNumber: plateNumber.toUpperCase(),
      make,
      model,
      year: Number(year),
      color,
      chassisNumber,
      engineCapacity,
      category,
      registrationStatus: 'ACTIVE',
      insuranceStatus: 'VALID',
      inspectionStatus: 'VALID',
      documentsCount: 3
    };
    onAdd(newVeh);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 text-[#0e1e38]">
      
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0e1e38] text-white flex items-center justify-center shadow">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0e1e38]">Add Registered Vehicle</h3>
              <p className="text-xs text-slate-500">Link a new vehicle to your National ID profile</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          
          {/* Category Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Vehicle Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['CAR', 'MOTORCYCLE', 'TRUCK', 'BUS'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 text-[11px] font-bold rounded-xl border transition-all ${
                    category === cat
                      ? 'bg-[#0e1e38] text-white border-[#0e1e38] shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rwanda Plate Number
              </label>
              <input
                type="text"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="e.g. RAC 123A"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-xs uppercase focus:outline-none focus:border-[#0e1e38] focus:ring-2 focus:ring-[#0e1e38]/10 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Model Year
              </label>
              <input
                type="number"
                required
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#0e1e38] bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle Make
              </label>
              <input
                type="text"
                required
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Toyota"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0e1e38] bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Model Name
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. RAV4"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0e1e38] bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Silver Metallic"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0e1e38] bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Engine Displacement
              </label>
              <input
                type="text"
                value={engineCapacity}
                onChange={(e) => setEngineCapacity(e.target.value)}
                placeholder="e.g. 1987 cc"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0e1e38] bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chassis Number (VIN)
            </label>
            <input
              type="text"
              required
              value={chassisNumber}
              onChange={(e) => setChassisNumber(e.target.value)}
              placeholder="e.g. JTNKH82B099231842"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs font-bold focus:outline-none focus:border-[#0e1e38] bg-slate-50"
            />
          </div>

          {/* RRA Notice */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-2.5 text-slate-600 text-xs">
            <ShieldCheck className="w-4 h-4 text-[#0e1e38] shrink-0" />
            <span>Vehicle details will be synchronized with RRA and Police logs.</span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 py-3 rounded-xl bg-[#0e1e38] hover:bg-[#182e52] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Link Vehicle to Wallet</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
