export interface DriverProfile {
  id: string;
  nationalId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  photoUrl: string;
  address: string;
  district: string;
  isVerified: boolean;
  memberSince: string;
}

export type DocumentType = 
  | 'DRIVING_LICENCE'
  | 'CARTE_JAUNE' // Logbook / Vehicle Registration
  | 'INSURANCE_CERTIFICATE'
  | 'CONTROLE_TECHNIQUE' // Vehicle Inspection
  | 'TRANSPORT_AUTHORIZATION';

export type DocumentStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'SUSPENDED';

export interface DigitalDocument {
  id: string;
  type: DocumentType;
  title: string;
  titleKinyarwanda?: string;
  documentNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  status: DocumentStatus;
  daysUntilExpiry?: number;
  vehiclePlate?: string;
  vehicleModel?: string;
  categories?: string[]; // e.g. ['A', 'B', 'D']
  insuranceProvider?: string;
  policyType?: string;
  inspectionCenter?: string;
  inspectionResult?: 'PASS' | 'FAIL';
  metadata: Record<string, string | number | boolean>;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  chassisNumber: string;
  engineCapacity: string;
  category: 'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'BUS';
  registrationStatus: 'ACTIVE' | 'PENDING' | 'EXPIRED';
  insuranceStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
  inspectionStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
  documentsCount: number;
  image?: string;
}

export interface VerificationToken {
  token: string;
  driverId: string;
  documentId: string;
  generatedAt: string;
  expiresAt: string;
  signature: string;
  nonce: string;
}

export interface VerificationResult {
  isValid: boolean;
  status: 'VALID' | 'EXPIRED' | 'SUSPENDED' | 'INVALID_TOKEN' | 'REVOKED';
  driverName: string;
  driverPhoto: string;
  nationalIdMasked: string;
  licenceNumber: string;
  licenceCategories: string[];
  licenceStatus: string;
  licenceExpiry: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  insuranceValid: boolean;
  insuranceProvider?: string;
  inspectionValid: boolean;
  inspectionExpiry?: string;
  stolenAlert: boolean;
  verifiedAt: string;
  verifierBadgeNumber: string;
  location: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'WARNING' | 'INFO' | 'SUCCESS' | 'URGENT';
  date: string;
  isRead: boolean;
  actionUrl?: string;
}
