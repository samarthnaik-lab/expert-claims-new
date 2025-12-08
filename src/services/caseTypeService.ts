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

export class CaseTypeService {
  private static readonly API_URL = 'https://n8n.srv952553.hstgr.cloud/webhook/case_type';
  private static readonly API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws';

  static async getCaseTypes(sessionId: string, jwtToken: string): Promise<CaseType[]> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws`,
          'session_id': 'fddc661a-dfb4-4896-b7b1-448e1adf7bc2',
          'jwt_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k',
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
