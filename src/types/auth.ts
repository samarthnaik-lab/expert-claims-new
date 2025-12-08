export interface AuthSession {
  sessionId: string;
  jwtToken: string;
  userId: string;
  userRole: string;
  expiresAt: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  session: AuthSession | null;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  session?: AuthSession;
  message?: string;
}

export interface ApiRequestConfig {
  sessionId: string;
  jwtToken: string;
  [key: string]: any;
}

export interface UserDetails {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department?: string;
  position?: string;
  phone?: string;
  address?: string;
  profile_image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Webhook specific fields
  jwt?: string;
  sessionid?: string;
  expiry?: string;
  userid?: number;
  [key: string]: any; // Allow additional fields from API
}

export interface UserDetailsResponse {
  success: boolean;
  data?: UserDetails;
  message?: string;
}

