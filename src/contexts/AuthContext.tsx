import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, LoginCredentials } from '@/services/authService';
import { getUserDetailsFromStorage, clearUserDetailsFromStorage } from '@/services/userService';
import { UserDetails } from '@/types/auth';

interface Session {
  sessionId: string;
  jwtToken: string;
  userId: string;
  userRole: string;
  expiresAt: number;
  expiresAtFormatted?: string; // Human-readable format
  expiresIn?: number; // Seconds until expiry
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  userDetails: UserDetails | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  getAuthHeaders: () => { [key: string]: string };
  refreshUserDetails: () => Promise<void>;
  updateSessionRole: (newRole: string) => void;
  getSessionExpiry: () => { formatted: string; expiresIn: number; expiresAt: number } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      console.log('🔍 Checking existing session...');
      const storedSession = localStorage.getItem('expertclaims_session');
      console.log('📦 Stored session exists:', !!storedSession);
      
      if (storedSession) {
        try {
          const parsedSession: Session = JSON.parse(storedSession);
          const now = Date.now();
          const timeUntilExpiry = parsedSession.expiresAt - now;
          const isAdmin = parsedSession.userRole === 'admin';
          console.log('⏰ Session expires at:', new Date(parsedSession.expiresAt).toLocaleString());
          console.log('⏰ Current time:', new Date(now).toLocaleString());
          console.log('⏰ Time until expiry:', Math.round(timeUntilExpiry / (1000 * 60 * 60)), 'hours');
          console.log('👤 User role:', parsedSession.userRole, 'isAdmin:', isAdmin);
          
          // Load user details from storage first to get the correct role
          const storedUserDetails = getUserDetailsFromStorage();
          let correctRole = parsedSession.userRole;
          if (storedUserDetails) {
            setUserDetails(storedUserDetails);
            // Use role from userDetails if available, otherwise use designation, otherwise keep session role
            correctRole = storedUserDetails.role || storedUserDetails.designation || parsedSession.userRole;
          }
          
          if (parsedSession.expiresAt > now) {
            // Session is still valid
            const sessionToUse = correctRole !== parsedSession.userRole ? {
              ...parsedSession,
              userRole: correctRole
            } : parsedSession;
            
            setSession(sessionToUse);
            setIsAuthenticated(true);
            
            if (correctRole !== parsedSession.userRole) {
              localStorage.setItem('expertclaims_session', JSON.stringify(sessionToUse));
              console.log('Updated session role from stored user details:', sessionToUse.userRole);
            }
            
            // Use setTimeout to ensure state updates complete before setting loading to false
            setTimeout(() => {
              setIsLoading(false);
              console.log('✅ Session check complete. Session valid.');
            }, 0);
          } else {
            const timeSinceExpiry = now - parsedSession.expiresAt;
            
            // For admin users, always restore session even if expired (same as other roles)
            const gracePeriod = 24 * 60 * 60 * 1000;
            
            if (timeSinceExpiry < gracePeriod || isAdmin || correctRole === 'admin') {
              // For admin, always restore even if expired beyond grace period
              if ((isAdmin || correctRole === 'admin') && timeSinceExpiry >= gracePeriod) {
                console.log('Admin session expired but restoring anyway...');
              } else {
                console.log('Session expired but within grace period, refreshing...');
              }
              
              const refreshedSession: Session = {
                ...parsedSession,
                userRole: correctRole,
                expiresAt: now + (365 * 24 * 60 * 60 * 1000) 
              };
              
              setSession(refreshedSession);
              setIsAuthenticated(true);
              localStorage.setItem('expertclaims_session', JSON.stringify(refreshedSession));
              
              console.log('Session refreshed successfully with role:', refreshedSession.userRole);
              
              // Use setTimeout to ensure state updates complete before setting loading to false
              setTimeout(() => {
                setIsLoading(false);
                console.log('✅ Session check complete. Session refreshed.');
              }, 0);
            } else {
              // Session expired beyond grace period, clear it (only for non-admin)
              console.log('Session expired beyond grace period, clearing...');
              localStorage.removeItem('expertclaims_session');
              clearUserDetailsFromStorage();
              setIsLoading(false);
            }
          }
        } catch (error) {
          console.error('Error parsing stored session:', error);
          localStorage.removeItem('expertclaims_session');
          clearUserDetailsFromStorage();
          setIsLoading(false);
        }
      } else {
        console.log('❌ No stored session found');
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log('Login attempt:', { email: credentials.email, password: credentials.password, otp: credentials.otp });
      
      // Use the AuthService for authentication
      const result = await AuthService.login(credentials);

      // Check if the response has a status code and it's not 200
      if (result.statusCode && result.statusCode !== 200) {
        console.log('Login failed with status code:', result.statusCode);
        return { 
          success: false, 
          message: result.message || 'Login failed. Please try again.' 
        };
      }

      if (result.success && result.sessionId && result.jwtToken && result.userId && result.userRole) {
        console.log('Login successful');
        const session: Session = {
          sessionId: result.sessionId,
          jwtToken: result.jwtToken,
          userId: result.userId,
          userRole: result.userRole,
          expiresAt: result.expiresAt || (Date.now() + (365 * 24 * 60 * 60 * 1000)), // 365 days
          expiresAtFormatted: result.expiresAtFormatted || new Date(result.expiresAt || Date.now() + (365 * 24 * 60 * 60 * 1000)).toLocaleString(),
          expiresIn: result.expiresIn || Math.floor(((result.expiresAt || Date.now() + (365 * 24 * 60 * 60 * 1000)) - Date.now()) / 1000)
        };
        
        setSession(session);
        setIsAuthenticated(true);
        localStorage.setItem('expertclaims_session', JSON.stringify(session));
        
        // Fetch user details after successful login (only if email is available)
        try {
          // Skip fetching user details if email is empty or not available
          if (!credentials.email || credentials.email.trim() === '') {
            console.log('Skipping user details fetch - email not available');
          } else {
            const userDetailsResult = await AuthService.getUserProfile(credentials.email, credentials.role);
            
            // Check status code for user details fetch as well
            if (userDetailsResult.statusCode && userDetailsResult.statusCode !== 200) {
              console.log('User details fetch failed with status code:', userDetailsResult.statusCode);
              // Don't fail the login, just log the error
              console.error('Failed to fetch user details:', userDetailsResult.message);
            } else if (userDetailsResult.success && userDetailsResult.data) {
              setUserDetails(userDetailsResult.data);
              
              // Update session with the correct role from API response
              const updatedSession: Session = {
                ...session,
                userRole: userDetailsResult.data.designation || session.userRole
              };
              
              setSession(updatedSession);
              localStorage.setItem('expertclaims_session', JSON.stringify(updatedSession));
              
              console.log('Updated session with correct role:', updatedSession.userRole);
              console.log('Previous role was:', session.userRole);
              console.log('New role from API:', userDetailsResult.data.role);
            }
          }
        } catch (error) {
          console.error('Error fetching user details after login:', error);
        }
        
        return { success: true, message: 'Login successful' };
      } else {
        console.log('Login failed:', result.message);
        return { success: false, message: result.message || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Server-side error occurred. Please try again later.' };
    }
  };

  const logout = () => {
    setSession(null);
    setIsAuthenticated(false);
    setUserDetails(null);
    
    // Clear ALL localStorage data
    try {
      // Clear all localStorage items completely
      localStorage.clear();
      console.log('All localStorage data cleared');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  const refreshUserDetails = async (): Promise<void> => {
    if (!session) return;
    
    try {
      // Get user details from the session or user details
      const userEmail = userDetails?.email || session.userId;
      if (!userEmail || userEmail.trim() === '') {
        console.log('No user email available for refreshing details - skipping');
        return;
      }
      
      // Check if it's a valid email format (not a generated userId like "user_...")
      if (userEmail.startsWith('user_') || !userEmail.includes('@')) {
        console.log('Invalid email format or generated userId - skipping user details fetch');
        return;
      }
      
      const result = await AuthService.getUserProfile(userEmail);
      
      // Check status code
      if (result.statusCode && result.statusCode !== 200) {
        console.log('User details refresh failed with status code:', result.statusCode);
        console.error('Failed to refresh user details:', result.message);
        return;
      }
      
      if (result.success && result.data) {
        setUserDetails(result.data);
        
        // Update session with the correct role from API response
        if (session && result.data.role && result.data.role !== session.userRole) {
          const updatedSession: Session = {
            ...session,
            userRole: result.data.role
          };
          
          setSession(updatedSession);
          localStorage.setItem('expertclaims_session', JSON.stringify(updatedSession));
          
          console.log('Updated session role during refresh:', updatedSession.userRole);
        }
      }
    } catch (error) {
      console.error('Error refreshing user details:', error);
    }
  };

  const getAuthHeaders = (): { [key: string]: string } => {
    if (!session) {
      return {};
    }
    
    return {
      'Authorization': `Bearer ${session.jwtToken}`,
      'X-Session-ID': session.sessionId,
      'Content-Type': 'application/json'
    };
  };

  const updateSessionRole = (newRole: string): void => {
    if (!session) {
      console.warn('Cannot update session role: no active session');
      return;
    }
    
    const updatedSession: Session = {
      ...session,
      userRole: newRole
    };
    
    setSession(updatedSession);
    localStorage.setItem('expertclaims_session', JSON.stringify(updatedSession));
    
    console.log('Session role updated to:', newRole);
  };

  const getSessionExpiry = (): { formatted: string; expiresIn: number; expiresAt: number } | null => {
    if (!session) {
      return null;
    }

    const now = Date.now();
    const expiresAt = session.expiresAt;
    const expiresIn = Math.max(0, Math.floor((expiresAt - now) / 1000)); // Seconds until expiry
    
    return {
      formatted: session.expiresAtFormatted || new Date(expiresAt).toLocaleString(),
      expiresIn,
      expiresAt
    };
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    session,
    userDetails,
    login,
    logout,
    getAuthHeaders,
    refreshUserDetails,
    updateSessionRole,
    getSessionExpiry
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
