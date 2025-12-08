export interface Document {
  document_name: string;
  category_id?: number;
}

export interface DocumentApiResponse {
  body: Document[];
  headers: any;
  statusCode: number;
  statusMessage: string;
}

export class DocumentService {
  private static readonly API_URL = 'https://n8n.srv952553.hstgr.cloud/webhook/04a463a8-cb59-4aca-aa7f-2b6d9091dfb4';
  private static readonly API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws';

  static async getDocumentsByCaseType(caseTypeId: number, sessionId: string, jwtToken: string): Promise<Document[]> {
    try {
      const url = `${this.API_URL}?case_type_id=${caseTypeId}`;
      
      const response = await fetch(url, {
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

      const data: DocumentApiResponse[] = await response.json();
      
      // Extract documents from the response body
      if (data && Array.isArray(data) && data.length > 0 && data[0].body) {
        return data[0].body;
      }
      
      throw new Error('Invalid response format from document API');
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }
}
