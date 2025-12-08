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

export class CaseStageService {
  private static readonly API_URL = 'https://n8n.srv952553.hstgr.cloud/webhook/case_stage';
  private static readonly API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws';

  static async getCaseStages(sessionId: string, jwtToken: string): Promise<CaseStage[]> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'apikey': this.API_KEY,
          'Authorization': `Bearer ${this.API_KEY}`,
          'session_id': sessionId,
          'jwt_token': jwtToken,
          'Content-Type': 'application/json'
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
