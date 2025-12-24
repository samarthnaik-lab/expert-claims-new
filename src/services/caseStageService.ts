export interface CaseStage {
  config_id: number;
  stage_name: string;
}

export interface CaseStageApiResponse {
  body: CaseStage[];
  headers: any;
  statusCode: number;
  statusMessage: string;
}

import { buildApiUrl } from '@/config/api';

export class CaseStageService {
  // TODO: Backend endpoint for case_stage does not exist yet
  // This n8n webhook needs to be replaced with a backend endpoint when available
  private static readonly API_URL = 'https://n8n.srv952553.hstgr.cloud/webhook/case_stage';

  static async getCaseStages(sessionId: string, jwtToken: string): Promise<CaseStage[]> {
    try {
      if (!sessionId || !jwtToken) {
        throw new Error('Session not available. Please log in.');
      }

      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'session_id': sessionId,
          'jwt_token': jwtToken,
          'Content-Type': 'application/json',
          ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CaseStageApiResponse[] = await response.json();
      
      // Extract case stages from the response body
      if (data && Array.isArray(data) && data.length > 0 && data[0].body) {
        return data[0].body;
      }
      
      throw new Error('Invalid response format from case stage API');
    } catch (error) {
      console.error('Error fetching case stages:', error);
      throw error;
    }
  }
}
