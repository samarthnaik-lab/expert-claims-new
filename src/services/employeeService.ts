export interface Employee {
  employee_id: number;
  employee_name: string;
}

export interface EmployeeApiResponse {
  employee_id: number;
  employee_name: string;
}

import { buildApiUrl } from '@/config/api';

export class EmployeeService {
  private static readonly API_URL = buildApiUrl('support/getemployees');

  static async getEmployees(sessionId: string, jwtToken: string): Promise<Employee[]> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'session_id': sessionId,
          'jwt_token': jwtToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: EmployeeApiResponse[] = await response.json();
      
      // Handle both single employee and array responses
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        // If it's a single employee object, wrap it in an array
        return [data];
      }
      
      throw new Error('Invalid response format from employee API');
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }
}
