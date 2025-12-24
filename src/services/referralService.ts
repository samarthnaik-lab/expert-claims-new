export interface ReferralCase {
  case_id: number;
  case_summary: string;
  case_description: string;
  case_type_id: number;
  assigned_to: number;
  priority: string;
  ticket_stage: string;
  due_date: string;
  resolution_summary: string | null;
  customer_satisfaction_rating: number | null;
  referring_partner_id: number;
  referral_date: string | null;
  case_value: number;
  value_currency: string;
  referral_notes: string | null;
  bonus_eligible: boolean;
  value_confirmed: boolean;
  value_confirmed_by: number | null;
  value_confirmed_date: string | null;
  created_time: string;
  created_by: number | null;
  updated_by: number | null;
  updated_time: string;
  deleted_flag: boolean;
  customer_id: number;
  case_types?: {
    is_active: boolean;
    created_by: number;
    updated_by: number | null;
    description: string | null;
    case_type_id: number;
    created_time: string;
    deleted_flag: boolean;
    updated_time: string;
    is_commercial: boolean;
    case_type_name: string;
  };
  partners?: {
    last_name: string;
    first_name: string;
    partner_id: number;
  };
  // Fallback fields in case nested objects are missing
  first_name?: string;
  last_name?: string;
  case_type_name?: string;
  status?: string;
}

export interface ReferralApiResponse {
  success: boolean;
  data: ReferralCase[];
  message?: string;
}

import { buildApiUrl } from '@/config/api';

export class ReferralService {
  private static readonly API_URL = buildApiUrl('api/MyReferral');

  static async getMyReferrals(sessionId: string, jwtToken: string): Promise<ReferralCase[]> {
    try {
      console.log('Fetching referrals from API:', this.API_URL);
      
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Referrals API response:', data);

      // Handle array response directly
      if (Array.isArray(data)) {
        return data;
      }

      // Handle wrapped response
      if (data && Array.isArray(data.data)) {
        return data.data;
      }

      // Handle single object response
      if (data && typeof data === 'object' && 'case_id' in data) {
        return [data];
      }

      throw new Error('Unexpected response format from referrals API');
    } catch (error) {
      console.error('Error fetching referrals:', error);
      throw error;
    }
  }
}
