export interface CaseType {
  case_type_id: number;
  case_type_name: string;
}

export interface CaseTypeApiResponse {
  body: CaseType[];
  headers: any;
  statusCode: number;
  statusMessage: string;
}

import { buildApiUrl } from '@/config/api';

export class CaseTypeService {
  private static readonly API_URL = buildApiUrl('support/case_type');

  static async getCaseTypes(sessionId: string, jwtToken: string): Promise<CaseType[]> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CaseTypeApiResponse = await response.json();
      
      // Extract case types from the response body
      if (data.body && Array.isArray(data.body)) {
        return data.body;
      }
      
      throw new Error('Invalid response format from case type API');
    } catch (error) {
      console.error('Error fetching case types:', error);
      throw error;
    }
  }
}
