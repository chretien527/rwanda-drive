'use client';

import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Car, 
  ArrowRight, 
  CheckCircle2, 
  Smartphone, 
  Mail, 
  Lock, 
  Camera, 
  Upload, 
  UserCheck, 
  Check, 
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: 'driver' | 'officer') => void;
  initialRole?: 'driver' | 'officer';
}

type AuthStep = 
  | 'ROLE_SELECTION' 
  | 'LOGIN_FORM' 
  | 'OTP_VERIFICATION' 
  | 'EMAIL_VERIFIED' 
  | 'NATIONAL_ID_INPUT' 
  | 'ID_UPLOAD' 
  | 'SELFIE_LIVENESS' 
  | 'ONBOARDING_COMPLETE';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'driver'
}) => {
  const [selectedRole, setSelectedRole] = useState<'driver' | 'officer'>(initialRole);
  const [step, setStep] = useState<AuthStep>('ROLE_SELECTION');
  const [phone, setPhone] = useState<string>('+250 788 123 456');
  const [email, setEmail] = useState<string>('jeanpaul.n@gmail.com');
  const [otp, setOtp] = useState<string[]>(['2', '3', '4', '5', '6', '7']);
  const [nationalId, setNationalId] = useState<string>('1 1994 8 0023456 1 45');
  const [isCapturingSelfie, setIsCapturingSelfie] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRoleContinue = () => {
    setStep('LOGIN_FORM');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('OTP_VERIFICATION');
  };

  const handleOtpSubmit = () => {
    setStep('EMAIL_VERIFIED');
  };

  const handleVerifiedContinue = () => {
    if (selectedRole === 'officer') {
      triggerConfetti();
      setStep('ONBOARDING_COMPLETE');
    } else {
      setStep('NATIONAL_ID_INPUT');
    }
  };

  const handleNationalIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('ID_UPLOAD');
  };

  const handleIdUploadSubmit = () => {
    setStep('SELFIE_LIVENESS');
  };

  const handleSelfieCapture = () => {
    setIsCapturingSelfie(true);
    setTimeout(() => {
      setIsCapturingSelfie(false);
      triggerConfetti();
      setStep('ONBOARDING_COMPLETE');
    }, 1200);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  const handleFinish = () => {
    onSuccess(selectedRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-[#0e1e38]">
        
        {/* Top Wave Banner Header (matching Dzignex visual mockup) */}
        <div className="bg-gradient-to-tr from-[#0b2447] via-[#0052a3] to-[#0070e0] p-6 text-white text-center relative">
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo icon */}
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner border border-white/20">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-xl font-black tracking-tight">
            Rwanda Drive Portal
          </h2>
          <p className="text-xs text-blue-100 mt-0.5">
            Secure Digital Driver &amp; Vehicle Verification
          </p>

          {/* Wave curve divider */}
          <div className="absolute -bottom-1 inset-x-0 h-4 bg-white [clip-path:polygon(0_100%,100%_100%,100%_0,0_100%)]" />
        </div>

        {/* Step Content Container */}
        <div className="p-6 sm:p-8">
          
          {/* STEP 1: ROLE SELECTION */}
          {step === 'ROLE_SELECTION' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-extrabold text-[#0e1e38]">
                  I am a...
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Choose your account type to proceed
                </p>
              </div>

              <div className="space-y-3">
                {/* Role 1: Police Officer */}
                <div
                  onClick={() => setSelectedRole('officer')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                    selectedRole === 'officer'
                      ? 'border-[#0066cc] bg-blue-50/50 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedRole === 'officer' ? 'bg-[#0066cc] text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-[#0e1e38]">Police Officer / Inspector</div>
                    <div className="text-xs text-slate-500">Verify driving licences and vehicle compliance</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedRole === 'officer' ? 'border-[#0066cc] bg-[#0066cc] text-white' : 'border-slate-300'
                  }`}>
                    {selectedRole === 'officer' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                {/* Role 2: Driver */}
                <div
                  onClick={() => setSelectedRole('driver')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                    selectedRole === 'driver'
                      ? 'border-[#0066cc] bg-blue-50/50 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedRole === 'driver' ? 'bg-[#0066cc] text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Car className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-[#0e1e38]">Driver / Vehicle Owner</div>
                    <div className="text-xs text-slate-500">Access my licence, Carte Jaune, and QR wallet</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedRole === 'driver' ? 'border-[#0066cc] bg-[#0066cc] text-white' : 'border-slate-300'
                  }`}>
                    {selectedRole === 'driver' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>

              <button
                onClick={handleRoleContinue}
                className="w-full py-3.5 rounded-xl bg-[#0066cc] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: LOGIN / SIGN UP */}
          {step === 'LOGIN_FORM' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <button
                  type="button"
                  onClick={() => setStep('ROLE_SELECTION')}
                  className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-2"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back to roles</span>
                </button>
                <h3 className="text-xl font-extrabold text-[#0e1e38]">
                  Welcome back
                </h3>
                <p className="text-xs text-slate-500">
                  Enter your phone or email to sign in
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Phone Number
                  </label>
                  <div className="flex items-center px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-[#0066cc]">
                    <Smartphone className="w-4 h-4 text-slate-400 mr-2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-[#0066cc]">
                    <Mail className="w-4 h-4 text-slate-400 mr-2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Passcode / PIN
                  </label>
                  <div className="flex items-center px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-[#0066cc]">
                    <Lock className="w-4 h-4 text-slate-400 mr-2" />
                    <input
                      type="password"
                      defaultValue="••••••••"
                      className="w-full text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3.5 rounded-xl bg-[#0066cc] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Sign In with OTP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 3: OTP VERIFICATION */}
          {step === 'OTP_VERIFICATION' && (
            <div className="space-y-6 text-center">
              <div>
                <h3 className="text-xl font-extrabold text-[#0e1e38]">
                  Verify your phone
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the 6-digit code sent to <strong className="text-slate-800">{phone}</strong>
                </p>
              </div>

              {/* 6 OTP Input Boxes */}
              <div className="flex justify-center gap-2">
                {otp.map((digit, idx) => (
                  <div
                    key={idx}
                    className="w-11 h-12 rounded-xl border-2 border-blue-500 bg-blue-50/40 text-lg font-mono font-bold flex items-center justify-center text-[#0e1e38]"
                  >
                    {digit}
                  </div>
                ))}
              </div>

              <div className="text-xs text-slate-500">
                Code expires in <span className="font-bold text-[#0066cc]">02:45</span>
                <div className="mt-1">
                  <button type="button" className="text-blue-600 font-bold hover:underline">
                    Resend code
                  </button>
                </div>
              </div>

              <button
                onClick={handleOtpSubmit}
                className="w-full py-3.5 rounded-xl bg-[#0066cc] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Verify OTP Code</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 4: VERIFIED CONFIRMATION */}
          {step === 'EMAIL_VERIFIED' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#0e1e38]">
                  Authentication Verified
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your phone number and account credentials have been successfully authenticated.
                </p>
              </div>

              <button
                onClick={handleVerifiedContinue}
                className="w-full py-3.5 rounded-xl bg-[#0066cc] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all"
              >
                {selectedRole === 'driver' ? 'Proceed to Identity Verification' : 'Enter Verifier Portal'}
              </button>
            </div>
          )}

          {/* STEP 5: NATIONAL ID INPUT */}
          {step === 'NATIONAL_ID_INPUT' && (
            <form onSubmit={handleNationalIdSubmit} className="space-y-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#0e1e38]">
                  Verify your identity
                </h3>
                <p className="text-xs text-slate-500">
                  We need to match your National ID before your driving documents can become verified.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rwanda National ID (16 Digits)
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="1 1994 8 0023456 1 45"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Legal Name (as in NID)
                  </label>
                  <input
                    type="text"
                    defaultValue="Jean Paul Nshimiyimana"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#0066cc] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all"
              >
                Continue to ID Photo Upload
              </button>
            </form>
          )}

          {/* STEP 6: ID CARD UPLOAD */}
          {step === 'ID_UPLOAD' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-extrabold text-[#0e1e38]">
                  Upload your ID Card
                </h3>
                <p className="text-xs text-slate-500">
                  Take a clear photo of the front and back of your physical ID.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border-2 border-dashed border-blue-400 bg-blue-50/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0066cc] flex items-center justify-center mb-1">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800">Front of ID</span>
                  <span className="text-[9px] text-emerald-600 font-bold mt-0.5">Attached ✓</span>
                </div>

                <div className="border-2 border-dashed border-blue-400 bg-blue-50/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0066cc] flex items-center justify-center mb-1">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800">Back of ID</span>
                  <span className="text-[9px] text-emerald-600 font-bold mt-0.5">Attached ✓</span>
                </div>
              </div>

              <button
                onClick={handleIdUploadSubmit}
                className="w-full py-3.5 rounded-xl bg-[#0066cc] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all"
              >
                Proceed to Facial Verification
              </button>
            </div>
          )}

          {/* STEP 7: SELFIE LIVENESS */}
          {step === 'SELFIE_LIVENESS' && (
            <div className="space-y-6 text-center">
              <div>
                <h3 className="text-xl font-extrabold text-[#0e1e38]">
                  Let&apos;s verify you
                </h3>
                <p className="text-xs text-slate-500">
                  Take a quick selfie so we can confirm your identity against NID records.
                </p>
              </div>

              {/* Selfie Oval Frame */}
              <div className="relative w-44 h-56 mx-auto rounded-full overflow-hidden border-4 border-[#0066cc] shadow-xl bg-slate-100 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
                  alt="Live Selfie preview"
                  className="w-full h-full object-cover"
                />
                
                {isCapturingSelfie && (
                  <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
                    <Sparkles className="w-8 h-8 text-cyan-300 animate-spin" />
                    <span>Matching biometric vector...</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>NID Biometrics Match &bull; Irembo Certified</span>
              </div>

              <button
                onClick={handleSelfieCapture}
                disabled={isCapturingSelfie}
                className="w-full py-3.5 rounded-xl bg-[#0066cc] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>{isCapturingSelfie ? 'Verifying...' : 'Capture & Complete Verification'}</span>
              </button>
            </div>
          )}

          {/* STEP 8: COMPLETE */}
          {step === 'ONBOARDING_COMPLETE' && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-[#0e1e38]">
                  Verification Complete!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                  Your identity has been verified against Rwanda National Police and RRA databases.
                </p>
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-4 rounded-xl bg-[#0066cc] hover:bg-blue-600 text-white font-bold text-sm shadow-lg transition-all"
              >
                {selectedRole === 'driver' ? 'Open My Document Wallet' : 'Open Officer Verifier'}
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
