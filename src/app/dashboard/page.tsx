'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DriverDashboard } from '@/components/DriverDashboard';
import { PoliceDashboard } from '@/components/PoliceDashboard';
import { QrModal } from '@/components/QrModal';
import { AddVehicleModal } from '@/components/AddVehicleModal';
import { DigitalDocument, Vehicle } from '@/lib/types';
import { mockVehicles, mockDocuments, mockDriver } from '@/lib/mockData';
import { 
  Shield, Car, QrCode, LogOut, WifiOff, LayoutDashboard,
  FileText, Bell, ShieldCheck, Settings, Home, 
  ChevronLeft, ChevronRight, Check, MapPin, Search,
  History, BadgeAlert, Layers, UserCheck
} from 'lucide-react';
import Link from 'next/link';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRoleParam = searchParams.get('role');

  const [currentRole, setCurrentRole] = useState<'driver' | 'officer'>(
    initialRoleParam === 'officer' ? 'officer' : 'driver'
  );
  const [driverActiveTab, setDriverActiveTab] = useState<string>('overview');
  const [policeActiveSection, setPoliceActiveSection] = useState<string>('overview');
  
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [selectedDocForQr, setSelectedDocForQr] = useState<DigitalDocument | null>(mockDocuments[0]);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (initialRoleParam === 'officer') {
      setCurrentRole('officer');
      setPoliceActiveSection('overview');
    } else if (initialRoleParam === 'driver') {
      setCurrentRole('driver');
      setDriverActiveTab('overview');
    }
  }, [initialRoleParam]);

  const handleOpenQr = (doc?: DigitalDocument) => {
    if (doc) setSelectedDocForQr(doc);
    else setSelectedDocForQr(mockDocuments[0]);
    setIsQrModalOpen(true);
  };

  const handleAddVehicle = (newVehicle: Vehicle) => {
    setVehicles(prev => [newVehicle, ...prev]);
  };

  const handleSimulateOfficerScan = (tokenPayload: string) => {
    setCurrentRole('officer');
    setPoliceActiveSection('scanner');
  };

  const handleLogout = () => {
    router.push('/');
  };

  // DRIVER SIDEBAR ITEMS
  const driverSidebarItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'wallet', label: 'Digital Wallet', icon: FileText, badge: `${mockDocuments.length}` },
    { id: 'vehicles', label: 'My Vehicles', icon: Car, badge: `${vehicles.length}` },
    { id: 'qr', label: 'QR Generator', icon: QrCode },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // POLICE SIDEBAR ITEMS
  const policeSidebarItems = [
    { id: 'overview', label: 'Patrol Command', icon: Layers },
    { id: 'scanner', label: 'Roadside QR Scanner', icon: QrCode },
    { id: 'checkpoints', label: 'Kigali Checkpoints', icon: MapPin, badge: '4 Active' },
    { id: 'radar', label: 'Plate & NID Radar', icon: Search },
    { id: 'citations', label: 'E-Citations & Fines', icon: BadgeAlert, badge: '2 Pending' },
    { id: 'audit', label: 'Shift Audit Trail', icon: History },
  ];

  const handleDriverNavClick = (itemId: string) => {
    setDriverActiveTab(itemId);
  };

  const handlePoliceNavClick = (itemId: string) => {
    setPoliceActiveSection(itemId);
  };

  const switchRole = (newRole: 'driver' | 'officer') => {
    setCurrentRole(newRole);
    router.push(`/dashboard?role=${newRole}`);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-[#0e1e38]">
      
      {/* ===== SIDEBAR ===== */}
      <aside className={`fixed left-0 top-0 h-full bg-[#0e1e38] text-white flex flex-col z-50 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-[72px]' : 'w-[250px]'
      }`}>
        
        {/* Sidebar Header / Brand */}
        <div className={`px-4 py-5 flex items-center border-b border-white/10 shrink-0 ${
          isSidebarCollapsed ? 'justify-center' : 'gap-3'
        }`}>
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#0e1e38] shadow shrink-0">
            <Shield className="w-5 h-5 text-[#0e1e38]" />
          </div>
          {!isSidebarCollapsed && (
            <div>
              <span className="font-extrabold text-base tracking-tight text-white whitespace-nowrap block leading-tight">
                Rwanda Drive
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {currentRole === 'officer' ? 'Police Terminal' : 'Driver Portal'}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {currentRole === 'driver' ? (
            /* DRIVER NAV */
            driverSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = driverActiveTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleDriverNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative ${
                    isActive
                      ? 'bg-white text-[#0e1e38] shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#0e1e38] rounded-r-full -ml-3" />
                  )}
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-[#0e1e38]' : 'text-slate-400 group-hover:text-white'}`} />
                  {!isSidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-[#0e1e38] text-white' : 'bg-white/15 text-slate-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })
          ) : (
            /* POLICE OFFICER NAV */
            policeSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = policeActiveSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handlePoliceNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative ${
                    isActive
                      ? 'bg-white text-[#0e1e38] shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#0e1e38] rounded-r-full -ml-3" />
                  )}
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-[#0e1e38]' : 'text-slate-400 group-hover:text-white'}`} />
                  {!isSidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-[#0e1e38] text-white' : 'bg-white/15 text-slate-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })
          )}
        </nav>

        {/* Sidebar Collapse Toggle */}
        <div className="px-3 py-2 border-t border-white/10">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>

        {/* Sidebar User Profile Footer (Role Specific) */}
        <div className={`px-3 py-4 border-t border-white/10 shrink-0 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3">
              {currentRole === 'driver' ? (
                <>
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mockDriver.photoUrl}
                      alt={mockDriver.fullName}
                      className="w-9 h-9 rounded-xl object-cover border border-white/30"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white text-[#0e1e38] rounded-full border border-[#0e1e38] flex items-center justify-center">
                      <Check className="w-2 h-2 stroke-[3]" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {mockDriver.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {mockDriver.nationalId}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-xl bg-white text-[#0e1e38] flex items-center justify-center shadow shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#0e1e38]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      IP Habimana Eric
                    </div>
                    <div className="text-[10px] text-slate-400 truncate font-mono">
                      RNP-TFP-0842
                    </div>
                  </div>
                </>
              )}
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {!isSidebarCollapsed && (
            <Link
              href="/"
              className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-white font-semibold transition-colors"
            >
              <Home className="w-3 h-3" />
              <span>Back to Landing Page</span>
            </Link>
          )}
        </div>

      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        isSidebarCollapsed ? 'ml-[72px]' : 'ml-[250px]'
      }`}>
        
        {/* Offline Mode Alert */}
        {isOffline && (
          <div className="bg-[#0e1e38] text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2 shadow-md">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>Offline Cached Mode Active: Viewing cryptographically secured local credentials.</span>
          </div>
        )}

        {/* Top Bar / Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#0e1e38]">
              {currentRole === 'officer' ? 'Rwanda National Police Enforcement Terminal' : 'Driver Digital Wallet & Credentials'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {currentRole === 'officer' 
                ? 'Authorized Roadside Checkpoint & Digital QR Scanner Node' 
                : 'Manage verified Rwandan driving licences, carte jaune, and insurance'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Offline toggle */}
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-2 rounded-xl border transition-all ${
                isOffline
                  ? 'bg-[#0e1e38] text-white border-[#0e1e38]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#0e1e38]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-white' : 'bg-[#0e1e38]'}`} />
              <span>{isOffline ? 'Offline' : 'Online Sync'}</span>
            </button>
          </div>
        </header>

        {/* Main Dashboard Body */}
        <main className="flex-1 p-6">
          
          {/* DRIVER DASHBOARD */}
          {currentRole === 'driver' && (
            <DriverDashboard
              onShowQr={handleOpenQr}
              onAddVehicle={() => setIsAddVehicleOpen(true)}
              vehicles={vehicles}
              activeTab={driverActiveTab as 'overview' | 'wallet' | 'vehicles' | 'notifications'}
              onTabChange={setDriverActiveTab}
            />
          )}

          {/* DEDICATED POLICE DASHBOARD */}
          {currentRole === 'officer' && (
            <PoliceDashboard
              activeSection={policeActiveSection}
              onNavigateSection={setPoliceActiveSection}
              onSimulateScan={handleSimulateOfficerScan}
            />
          )}

        </main>

      </div>

      {/* MODALS */}
      <QrModal
        document={selectedDocForQr}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onSimulateOfficerScan={handleSimulateOfficerScan}
      />

      <AddVehicleModal
        isOpen={isAddVehicleOpen}
        onClose={() => setIsAddVehicleOpen(false)}
        onAdd={handleAddVehicle}
      />

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white text-[#0e1e38]">
        <div className="text-sm font-bold animate-pulse">Loading Rwanda Drive Dashboard...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
