export interface CaseComment {
  case_id: number;
  user_id: number;
  comment_id: number;
  is_internal: boolean;
  comment_text: string;
  created_time: string;
  updated_time: string;
  parent_comment_id: number;
}

export interface CaseType {
  description: string | null;
  case_type_name: string;
}

export interface CaseDetails {
  case_id: number;
  case_summary: string;
  case_description: string;
  priority: string;
  ticket_stage: string;
  due_date: string;
  case_value: number | null;
  value_currency: string;
  customer_id: number;
  assigned_to: number;
  updated_time: string;
  case_types: CaseType;
  case_stakeholders: any[];
  case_stage_history: any[];
  case_payment_phases: any[];
  case_documents: any[];
  case_comments: CaseComment[];
  customers: {
    customer_id: number;
    first_name: string;
    last_name: string;
    email_address: string;
    mobile_number: string;
    emergency_contact: string;
    address: string;
    customer_type: string;
    source: string;
    notes?: string;
    company_name?: string;
    partner?: any;
    user_id: number;
    created_time: string;
    updated_time: string;
    deleted_flag: boolean;
    created_by?: any;
    updated_by?: any;
    language_preference?: string;
    communication_preferences?: string;
  };
  employees: {
    employee_id: number;
    first_name: string;
    last_name: string;
    age?: number;
    gender?: string;
    address?: string;
    manager?: string;
    user_id?: number;
    team_name?: string;
    created_by?: number;
    department?: string;
    pan_number?: string;
    reports_to?: number;
    updated_by?: number;
    work_phone?: string;
    designation?: string;
    bank_details?: any;
    created_time?: string;
    deleted_flag?: boolean;
    joining_date?: string;
    updated_time?: string;
    aadhar_number?: string;
    mobile_number?: string;
    work_extension?: string;
    office_location?: string;
    additional_notes?: string;
    management_level?: string;
    emergency_contact?: string;
    employment_status?: string;
    can_approve_bonuses?: boolean;
    profile_picture_url?: string;
    emergency_contact_name?: string;
    communication_preference?: string;
    max_bonus_approval_limit?: number;
    emergency_contact_relation?: string;
  };
}

export interface CaseApiResponse {
  status: string;
  message: string;
  data: CaseDetails;
}

import { buildApiUrl } from '@/config/api';

export class CaseService {
  private static readonly API_URL = buildApiUrl('support/everything-cases');

  static async getCaseDetails(caseId: string, sessionId: string, jwtToken: string): Promise<CaseDetails> {
    try {
      if (!sessionId || !jwtToken) {
        throw new Error('Session not available. Please log in.');
      }

      console.log('Fetching case details for case ID:', caseId);
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'accept-profile': 'srtms',
          'content-type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken,
          'origin': 'http://localhost:8080',
          'priority': 'u=1, i',
          'referer': 'http://localhost:8080/',
          'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
          'Range': '0-100',
          'Prefer': 'count=exact',
          ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` })
        },
        body: JSON.stringify({
          case_id: caseId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Case details API response:', responseData);
      
      // Handle array-wrapped response
      let data: CaseDetails;
      if (Array.isArray(responseData) && responseData.length > 0) {
        data = responseData[0]; // Take the first item from the array
        console.log('Extracted case data from array:', data);
      } else if (responseData && typeof responseData === 'object' && 'case_id' in responseData) {
        data = responseData as CaseDetails; // Direct object response
        console.log('Direct case data:', data);
      } else {
        throw new Error('Unexpected response format from case details API');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching case details:', error);
      throw error;
    }
  }
}
