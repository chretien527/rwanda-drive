'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { DigitalDocument } from '@/lib/types';
import { mockDriver } from '@/lib/mockData';
import { X, ShieldCheck, RefreshCw, Sun, Moon, Copy, Check, Lock } from 'lucide-react';

interface QrModalProps {
  document: DigitalDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onSimulateOfficerScan: (tokenPayload: string) => void;
}

export const QrModal: React.FC<QrModalProps> = ({
  document,
  isOpen,
  onClose,
  onSimulateOfficerScan
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [tokenHash, setTokenHash] = useState<string>('');

  const generateNewToken = React.useCallback(() => {
    const timestamp = Date.now();
    const randomNonce = Math.random().toString(36).substring(2, 10);
    const mockHash = `RW-TOKEN-${document?.id || 'DRV'}-${timestamp.toString().slice(-6)}-${randomNonce.toUpperCase()}`;
    setTokenHash(mockHash);
    setTimeLeft(60);

    const payload = JSON.stringify({
      token: mockHash,
      driverId: mockDriver.id,
      driverName: mockDriver.fullName,
      docId: document?.id || 'doc_dl_01',
      docType: document?.type || 'DRIVING_LICENCE',
      issuedAt: new Date(timestamp).toISOString(),
      expiresInSec: 60,
      signature: 'RNP_ECDSA_SHA256_' + randomNonce
    });

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: {
        dark: highContrast ? '#000000' : '#0e1e38',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error(err));
  }, [document, highContrast]);

  useEffect(() => {
    if (!isOpen) return;
    generateNewToken();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          generateNewToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, generateNewToken]);

  if (!isOpen) return null;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(tokenHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateScan = () => {
    onSimulateOfficerScan(tokenHash);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 text-[#0e1e38]">
      
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header in Deep Slate Navy Blue */}
        <div className="bg-[#0e1e38] p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider mb-2 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Roadside Presentation</span>
          </div>

          <h3 className="text-xl font-black tracking-tight text-white">
            {document ? document.title : 'All Driving Credentials'}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Present this code to the traffic officer for instantaneous verification
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
          
          {/* QR Container */}
          <div className="relative p-4 rounded-3xl border-2 border-slate-200 bg-slate-50 shadow-inner flex flex-col items-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="Dynamic Anti-Fraud QR Code"
                className="w-56 h-56 rounded-2xl shadow-sm"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
            )}

            {/* Rotating Timer Badge */}
            <div className="absolute -bottom-3.5 bg-[#0e1e38] text-white px-4 py-1.5 rounded-full text-xs font-mono font-bold shadow-md flex items-center gap-1.5 border border-white/20">
              <RefreshCw className="w-3 h-3 animate-spin text-white" />
              <span>Token rotates in {timeLeft}s</span>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="text-xs text-slate-500 max-w-xs space-y-1">
            <div className="flex items-center justify-center gap-1 font-bold text-[#0e1e38]">
              <Lock className="w-3.5 h-3.5" />
              <span>Anti-Fraud Dynamic Rotation</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Screenshot tamper-proof. Token expires in 60s to prevent illegal forgery or reuse.
            </p>
          </div>

          {/* Token String Display & Copy */}
          <div className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
            <span className="font-mono text-[11px] text-[#0e1e38] font-bold truncate">
              {tokenHash}
            </span>
            <button
              onClick={handleCopyToken}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#0e1e38] border border-slate-200 transition-colors shrink-0"
              title="Copy Token String"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2">
            <button
              onClick={handleSimulateScan}
              className="w-full py-3.5 rounded-2xl bg-[#0e1e38] hover:bg-[#182e52] text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Simulate Police Officer Scan</span>
            </button>

            <button
              onClick={() => setHighContrast(!highContrast)}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-[#0e1e38] flex items-center justify-center gap-1.5"
            >
              {highContrast ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{highContrast ? 'Standard Contrast' : 'Max Contrast for Sunlight'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
