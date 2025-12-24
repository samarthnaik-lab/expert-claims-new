export interface BonusCalculation {
  calculation_id: number;
  case_id: number;
  stage_bonus_amount: number;
  case_value: number;
  customer_first_name: string | null;
  customer_last_name: string | null;
  case_info: {
    case_id: number;
  };
  payment_date?: string;
}

export interface PartnerStatusData {
  total_calculations: number;
  calculations: BonusCalculation[];
  total_bonus_amount: number;
}

export interface PartnerStatusResponse {
  status: string;
  partner_id: number;
  message: string;
  data: PartnerStatusData;
  timestamp: string;
}

import { buildApiUrl } from '@/config/api';

export class PartnerStatusService {
  private static readonly API_URL = buildApiUrl('api/partner-status-check');

  static async getPartnerStatus(partnerId: number, jwtToken?: string): Promise<PartnerStatusResponse[]> {
    try {
      console.log('Fetching partner status for partner ID:', partnerId);
      
      // Get token from localStorage if not provided
      if (!jwtToken) {
        try {
          const sessionStr = localStorage.getItem('expertclaims_session');
          if (sessionStr) {
            const session = JSON.parse(sessionStr);
            jwtToken = session.jwtToken || '';
          }
        } catch (error) {
          console.error('Error getting token from session:', error);
        }
      }
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          partner_id: partnerId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Partner status API response:', data);

      // Handle array response directly
      if (Array.isArray(data)) {
        return data;
      }

      // Handle single object response
      if (data && typeof data === 'object' && 'status' in data) {
        return [data];
      }

      throw new Error('Unexpected response format from partner status API');
    } catch (error) {
      console.error('Error fetching partner status:', error);
      throw error;
    }
  }
}
