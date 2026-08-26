// API service for communicating with the Rwanda Drive backend
import {
  DriverProfile,
  Vehicle,
  DigitalDocument,
  VerificationToken
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    phone?: string;
    role: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
    documentVerified: boolean;
    biometricVerified: boolean;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  mfaRequired: boolean;
  mfaToken?: string;
}

interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    phone?: string;
    role: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
    documentVerified: boolean;
    biometricVerified: boolean;
  };
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface QRTokenResponse {
  token: string;
  issuedAt: string;
  expiresAt: string;
  ttl: number;
  message: string;
}

interface QRVerificationResponse {
  verified: boolean;
  credentialId: string;
  purpose: string;
  verifiedAt: string;
  message: string;
  proof?: string;
  publicWitness?: string;
  proofGenerated?: boolean;
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    const data = await response.json();

    // Store tokens if available
    if (data.tokens) {
      this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    }

    return data;
  }

  async register(email: string, password: string, phone?: string): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, phone }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }

    return response.json();
  }

  async refreshToken(): Promise<RefreshTokenResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      this.clearTokens();
      const errorData = await response.json();
      throw new Error(errorData.error || 'Token refresh failed');
    }

    const data = await response.json();
    // Update access token (refresh token might be rotated)
    if (data.accessToken) {
      localStorage.setItem('access_token', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('refresh_token', data.refreshToken);
    }

    return data;
  }

  async getCurrentUser(): Promise<{ id: string; email: string; role: string }> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      this.clearTokens();
      throw new Error('Session expired');
    }

    return response.json();
  }

  async logout() {
    const token = this.getToken();
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }
    this.clearTokens();
  }

  // QR Code endpoints
  async refreshQRToken(credentialId: string): Promise<QRTokenResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/qr/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credentialId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'QR token refresh failed');
    }

    return response.json();
  }

  async verifyQRToken(tokenString: string, purpose: string): Promise<QRVerificationResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/verification/scan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: tokenString, purpose }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'QR verification failed');
    }

    return response.json();
  }

  // Vehicle endpoints
  async addVehicle(vehicleData: Omit<Vehicle, 'id' | 'registrationStatus' | 'insuranceStatus' | 'inspectionStatus' | 'documentsCount'>): Promise<Vehicle> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/vehicles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add vehicle');
    }

    return response.json();
  }

  async getVehicles(): Promise<Vehicle[]> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/vehicles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch vehicles');
    }

    return response.json();
  }
}

export const apiService = new ApiService();