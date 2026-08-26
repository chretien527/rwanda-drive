import { DriverProfile, Vehicle, DigitalDocument, NotificationItem, VerificationResult } from './types';

export const mockDriver: DriverProfile = {
  id: 'drv_rw_098234',
  nationalId: '1 1994 8 0023456 1 45',
  fullName: 'Jean Paul Nshimiyimana',
  email: 'jeanpaul.n@gmail.com',
  phoneNumber: '+250 788 123 456',
  dateOfBirth: '14/08/1994',
  gender: 'Male',
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  address: 'KG 672 St, Kimihurura',
  district: 'Gasabo, Kigali City',
  isVerified: true,
  memberSince: 'March 2022'
};

export const mockVehicles: Vehicle[] = [
  {
    id: 'veh_01',
    plateNumber: 'RAB 123A',
    make: 'Toyota',
    model: 'RAV4 2.0 Dynamic',
    year: 2021,
    color: 'Silver Metallic',
    chassisNumber: 'JTEHG21V402948172',
    engineCapacity: '1987 cc',
    category: 'CAR',
    registrationStatus: 'ACTIVE',
    insuranceStatus: 'EXPIRING_SOON',
    inspectionStatus: 'VALID',
    documentsCount: 3,
    image: 'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'veh_02',
    plateNumber: 'RAB 567B',
    make: 'Yamaha',
    model: 'FZ 150 Street',
    year: 2023,
    color: 'Racing Blue',
    chassisNumber: 'ME4RG432400192841',
    engineCapacity: '149 cc',
    category: 'MOTORCYCLE',
    registrationStatus: 'ACTIVE',
    insuranceStatus: 'VALID',
    inspectionStatus: 'VALID',
    documentsCount: 2,
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=80'
  }
];

export const mockDocuments: DigitalDocument[] = [
  {
    id: 'doc_dl_01',
    type: 'DRIVING_LICENCE',
    title: 'Republic of Rwanda Driving Licence',
    titleKinyarwanda: 'Uruhushya rwo gutwara ibinyabiziga',
    documentNumber: 'DL-RWA-2021-98745',
    issuingAuthority: 'Rwanda National Police (RNP)',
    issueDate: '12 Jan 2021',
    expiryDate: '12 Jan 2026',
    status: 'VALID',
    daysUntilExpiry: 320,
    categories: ['A', 'B', 'D'],
    metadata: {
      bloodGroup: 'O+',
      restrictions: '01 - Corrective lenses',
      firstIssue: '2016',
      placeOfIssue: 'Kigali - Remera'
    }
  },
  {
    id: 'doc_cj_01',
    type: 'CARTE_JAUNE',
    title: 'Vehicle Registration Certificate (Carte Jaune)',
    titleKinyarwanda: 'Ikarita y’Ibinyabiziga',
    documentNumber: 'VR-RWA-2021-44021',
    issuingAuthority: 'Rwanda Revenue Authority (RRA) / RNP',
    issueDate: '04 Mar 2021',
    expiryDate: 'Permanent (Updated 2024)',
    status: 'VALID',
    vehiclePlate: 'RAB 123A',
    vehicleModel: 'Toyota RAV4 (2021)',
    metadata: {
      owner: 'Jean Paul Nshimiyimana',
      chassis: 'JTEHG21V402948172',
      taxClass: 'Private Passenger',
      fuelType: 'Petrol',
      seatingCapacity: '5'
    }
  },
  {
    id: 'doc_ins_01',
    type: 'INSURANCE_CERTIFICATE',
    title: 'Motor Third Party & Comprehensive Insurance',
    titleKinyarwanda: 'Ubwishingizi bw’Ikinyabiziga',
    documentNumber: 'RAD-AUT-2025-88391',
    issuingAuthority: 'Radiant Insurance Company Ltd',
    issueDate: '10 Sep 2024',
    expiryDate: '09 Sep 2025',
    status: 'EXPIRING_SOON',
    daysUntilExpiry: 14,
    vehiclePlate: 'RAB 123A',
    vehicleModel: 'Toyota RAV4',
    insuranceProvider: 'Radiant Insurance',
    policyType: 'Comprehensive Gold Plus',
    metadata: {
      policyHolder: 'Jean Paul Nshimiyimana',
      coverageLimit: 'RWF 150,000,000',
      emergencyContact: '+250 788 000 111'
    }
  },
  {
    id: 'doc_ct_01',
    type: 'CONTROLE_TECHNIQUE',
    title: 'Motor Vehicle Inspection Certificate (Roadworthiness)',
    titleKinyarwanda: 'Icyemezo cy’Ubugenzuzi bw’Ibinyabiziga',
    documentNumber: 'VIC-RNP-2025-10294',
    issuingAuthority: 'RNP Motor Vehicle Inspection Centre',
    issueDate: '15 Jan 2025',
    expiryDate: '15 Jan 2026',
    status: 'VALID',
    daysUntilExpiry: 143,
    vehiclePlate: 'RAB 123A',
    vehicleModel: 'Toyota RAV4',
    inspectionCenter: 'MIC Remera, Kigali',
    inspectionResult: 'PASS',
    metadata: {
      brakingEfficiency: '78% (Pass)',
      emissionsStandard: 'Euro 4 Compliant (Pass)',
      lightingSystem: 'Pass',
      steeringAlignment: 'Pass'
    }
  },
  {
    id: 'doc_ins_02',
    type: 'INSURANCE_CERTIFICATE',
    title: 'Motorcycle Insurance Certificate',
    titleKinyarwanda: 'Ubwishingizi bwa Moto',
    documentNumber: 'SAN-MTO-2025-11928',
    issuingAuthority: 'Sanlam General Insurance Rwanda',
    issueDate: '02 Feb 2025',
    expiryDate: '01 Feb 2026',
    status: 'VALID',
    daysUntilExpiry: 160,
    vehiclePlate: 'RAB 567B',
    vehicleModel: 'Yamaha FZ 150',
    insuranceProvider: 'Sanlam Rwanda',
    policyType: 'Third Party Liability',
    metadata: {
      policyHolder: 'Jean Paul Nshimiyimana',
      riderCover: 'Included'
    }
  }
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif_01',
    title: 'Insurance Renewal Reminder',
    message: 'Insurance for Toyota RAV4 (RAB 123A) expires in 14 days. Renew early to avoid penalties on public roads.',
    type: 'URGENT',
    date: '2 hours ago',
    isRead: false,
    actionUrl: '#renew'
  },
  {
    id: 'notif_02',
    title: 'Inspection Passed Successfully',
    message: 'Vehicle inspection for RAB 123A at Remera Inspection Centre was marked PASSED. Next check: Jan 2026.',
    type: 'SUCCESS',
    date: '3 days ago',
    isRead: false
  },
  {
    id: 'notif_03',
    title: 'Secure QR Token Refreshed',
    message: 'Your dynamic driver verification credentials were encrypted and synced with authoritative records.',
    type: 'INFO',
    date: '1 week ago',
    isRead: true
  }
];

export const mockVerificationScenarios: Record<string, VerificationResult> = {
  valid: {
    isValid: true,
    status: 'VALID',
    driverName: 'Jean Paul Nshimiyimana',
    driverPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    nationalIdMasked: '1 1994 8 **** 1 45',
    licenceNumber: 'DL-RWA-2021-98745',
    licenceCategories: ['A', 'B', 'D'],
    licenceStatus: 'ACTIVE / AUTHORIZED',
    licenceExpiry: '12 Jan 2026',
    vehiclePlate: 'RAB 123A',
    vehicleModel: 'Toyota RAV4 (2021)',
    insuranceValid: true,
    insuranceProvider: 'Radiant Insurance (Exp: 09 Sep 2025)',
    inspectionValid: true,
    inspectionExpiry: '15 Jan 2026 (Remera Center)',
    stolenAlert: false,
    verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    verifierBadgeNumber: 'RNP-TFP-0842',
    location: 'Kigali - Nyabugogo Checkpoint'
  },
  expiredInsurance: {
    isValid: false,
    status: 'EXPIRED',
    driverName: 'Eric Mugisha',
    driverPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    nationalIdMasked: '1 1989 8 **** 0 88',
    licenceNumber: 'DL-RWA-2018-44910',
    licenceCategories: ['B'],
    licenceStatus: 'ACTIVE / AUTHORIZED',
    licenceExpiry: '30 Nov 2027',
    vehiclePlate: 'RAC 459P',
    vehicleModel: 'Hyundai Tucson',
    insuranceValid: false,
    insuranceProvider: 'EXPIRED (Expired 3 days ago)',
    inspectionValid: true,
    inspectionExpiry: '20 Oct 2025',
    stolenAlert: false,
    verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    verifierBadgeNumber: 'RNP-TFP-0842',
    location: 'Kigali - Kicukiro Sonatubes'
  },
  suspended: {
    isValid: false,
    status: 'SUSPENDED',
    driverName: 'Gervais Hakizimana',
    driverPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    nationalIdMasked: '1 1991 8 **** 2 11',
    licenceNumber: 'DL-RWA-2019-11204',
    licenceCategories: ['B', 'C'],
    licenceStatus: 'SUSPENDED (Excess De-merit Points)',
    licenceExpiry: '15 Aug 2025',
    vehiclePlate: 'RAD 902K',
    vehicleModel: 'Mercedes-Benz C200',
    insuranceValid: true,
    insuranceProvider: 'Prime Insurance',
    inspectionValid: false,
    stolenAlert: true,
    verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    verifierBadgeNumber: 'RNP-TFP-0842',
    location: 'Kigali - Gishushu Junction'
  }
};
