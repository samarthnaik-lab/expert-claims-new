export interface ClaimDetail {
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
  case_types: {
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
  partners: {
    last_name: string;
    first_name: string;
    partner_id: number;
  };
  customers?: {
    customer_id: number;
    first_name: string;
    last_name: string;
    email: string;
    mobile_number: string;
    address: string;
  };
}

export class ClaimService {
  private static readonly API_URL = 'https://n8n.srv952553.hstgr.cloud/webhook/MyReferral';
  private static readonly API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImiaWF0IjoxNzU0OTA2Nzg2LCJleHAiOjIwNzA0ODI3ODZ9.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws';

  static async getClaimDetails(caseId: string, sessionId: string, jwtToken: string, partnerId: number): Promise<ClaimDetail | null> {
    try {
      console.log('Fetching claim details for case ID:', caseId);
      
      const urlWithParams = `${this.API_URL}?partner_id=${encodeURIComponent(partnerId.toString())}`;
      const response = await fetch(urlWithParams, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws`,
          'Content-Profile': 'expc',
          'Accept-Profile': 'expc',
          'session_id': 'a9bfe0a4-1e6c-4c69-860f-ec50846a7da6',
          'jwt_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiIsInBhc3N3b3JkIjoiIiwiaWF0IjoxNzU2NTQ3MjAzfQ.rW9zIfo1-B_Wu2bfJ8cPai0DGZLfaapRE7kLt2dkCBc',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Claim details API response:', data);

      // Handle array response and find the specific case
      let referrals: ClaimDetail[] = [];
      if (Array.isArray(data)) {
        referrals = data;
      } else if (data && Array.isArray(data.data)) {
        referrals = data.data;
      } else if (data && typeof data === 'object' && 'case_id' in data) {
        referrals = [data];
      }

      // Find the specific case by case_id
      const claim = referrals.find(ref => ref.case_id.toString() === caseId);
      
      if (claim) {
        console.log('Found claim details:', claim);
        return claim;
      } else {
        console.log('Claim not found for case ID:', caseId);
        return null;
      }
    } catch (error) {
      console.error('Error fetching claim details:', error);
      throw error;
    }
  }
}
