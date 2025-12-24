/**
 * API Configuration
 * Centralized API base URL configuration
 * 
 * Usage:
 * import { API_BASE_URL } from '@/config/api';
 * const response = await fetch(`${API_BASE_URL}/api/endpoint`);
 */

// Get API base URL from environment variable, fallback to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

/**
 * Get API key from environment variables or use fallback
 * Priority: VITE_SUPABASE_SERVICE_ROLE_KEY > VITE_API_KEY > fallback
 */
export const getApiKey = (): string => {
  // Try to get from environment variables first
  const envApiKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_API_KEY;
  
  if (envApiKey) {
    return envApiKey;
  }
  
  // Fallback to default service role key (should be moved to environment variables in production)
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws';
};

