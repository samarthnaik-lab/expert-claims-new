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

