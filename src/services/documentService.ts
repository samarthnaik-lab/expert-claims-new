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
  private static readonly API_URL = 'http://localhost:3000/support/getdocumentcategories';

  static async getDocumentsByCaseType(caseTypeId: number, sessionId: string, jwtToken: string): Promise<Document[]> {
    try {
      const url = `${this.API_URL}?case_type_id=${caseTypeId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
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
