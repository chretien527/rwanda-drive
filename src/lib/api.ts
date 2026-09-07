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
    full_name?: string;
    email: string;
    phone?: string;
    role: string;
    email_verified: boolean;
    mfa_enabled: boolean;
    document_verified: boolean;
    biometric_verified: boolean;
  };
  tokens?: {
    access_token: string;
    refresh_token: string;
  };
  mfa_required: boolean;
  mfa_token?: string;
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

export class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
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

  /**
   * Wraps fetch and throws ApiError with the backend error code when the
   * response is not ok, so callers can distinguish error types (e.g.
   * AUTH_EMAIL_NOT_VERIFIED).
   */
  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        body.error || `Request failed with status ${res.status}`,
        body.code || 'UNKNOWN',
      );
    }
    return res.json();
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    // Store tokens if available (backend uses snake_case keys)
    if (data.tokens) {
      this.setTokens(data.tokens.access_token, data.tokens.refresh_token);
    }

    return data;
  }

  async register(email: string, password: string, fullName: string, phone?: string): Promise<RegisterResponse> {
    return this.request<RegisterResponse>(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, phone }),
    });
  }

  // ── Password reset ───────────────────────────────────────────────

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`${API_BASE_URL}/auth/password/forgot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`${API_BASE_URL}/auth/password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }

  // ── Email verification ──────────────────────────────────────────────

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  }

  async resendVerification(): Promise<{ message: string }> {
    const accessToken = this.getToken();
    if (!accessToken) {
      throw new ApiError('Not authenticated', 'AUTH_NOT_AUTHENTICATED');
    }
    return this.request<{ message: string }>(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`${API_BASE_URL}/auth/resend-verification-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  }

  async refreshToken(): Promise<RefreshTokenResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new ApiError('No refresh token available', 'NO_REFRESH_TOKEN');
    }

    const data = await this.request<RefreshTokenResponse>(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    // Update access token (refresh token might be rotated)
    if (data.accessToken) {
      localStorage.setItem('access_token', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('refresh_token', data.refreshToken);
    }

    return data;
  }

  async getCurrentUser(): Promise<{ id: string; full_name?: string; email: string; role: string }> {
    const token = this.getToken();
    if (!token) {
      throw new ApiError('Not authenticated', 'AUTH_NOT_AUTHENTICATED');
    }

    const data = await this.request<{ id: string; full_name?: string; email: string; role: string }>(
      `${API_BASE_URL}/auth/me`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      },
    );

    return data;
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
      throw new ApiError('Not authenticated', 'AUTH_NOT_AUTHENTICATED');
    }

    return this.request<QRTokenResponse>(`${API_BASE_URL}/qr/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credentialId }),
    });
  }

  async verifyQRToken(tokenString: string, purpose: string): Promise<QRVerificationResponse> {
    const token = this.getToken();
    if (!token) {
      throw new ApiError('Not authenticated', 'AUTH_NOT_AUTHENTICATED');
    }

    return this.request<QRVerificationResponse>(`${API_BASE_URL}/verification/scan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: tokenString, purpose }),
    });
  }

  // Vehicle endpoints
  async addVehicle(vehicleData: Omit<Vehicle, 'id' | 'registrationStatus' | 'insuranceStatus' | 'inspectionStatus' | 'documentsCount'>): Promise<Vehicle> {
    const token = this.getToken();
    if (!token) {
      throw new ApiError('Not authenticated', 'AUTH_NOT_AUTHENTICATED');
    }

    return this.request<Vehicle>(`${API_BASE_URL}/vehicles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData),
    });
  }

  async getVehicles(): Promise<Vehicle[]> {
    const token = this.getToken();
    if (!token) {
      throw new ApiError('Not authenticated', 'AUTH_NOT_AUTHENTICATED');
    }

    return this.request<Vehicle[]>(`${API_BASE_URL}/vehicles`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  }
}

export const apiService = new ApiService();