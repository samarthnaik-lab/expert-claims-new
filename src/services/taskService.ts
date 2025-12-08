export interface TaskStakeholder {
  name: string;
  contactEmail: string;
  role: string;
  notes: string;
}

export interface TaskCustomer {
  customer_id?: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  emergencyContact: string;
  gender: string;
  age: number;
  address: string;
  customerType: string;
  communicationPreference: string;
  source: string;
  partner: string;
  languagePreference: string;
  notes: string;
  userName: string;
  password_hash: string;
  role: string;
  gstin?: string;
  pan?: string;
  state?: string;
  pincode?: string;
}

export interface TaskPayment {
  phase_name: string;
  due_date: string;
  phase_amount: number;
  created_by: number;
}

export interface TaskCreateRequest {
  case_Summary: string;
  case_description: string;
  caseType: string;
  assignedTo: string;
  priority: string;
  ticket_Stage: string;
  dueDate: string;
  stakeholders: TaskStakeholder[];
  customer: TaskCustomer;
  comments: string;
  internal: string;
  payments?: TaskPayment[];
}

export interface TaskCreateResponse {
  success: boolean;
  message: string;
  case_id?: string;
}

export class TaskService {
  private static readonly API_URL = 'http://localhost:3000/api/createTask';

  static async createTask(taskData: TaskCreateRequest, sessionId: string, jwtToken: string): Promise<TaskCreateResponse> {
    try {
      console.log('Sending task data to API:', taskData);
      console.log('Exact payload being sent to API:', JSON.stringify(taskData, null, 2));
      console.log('API URL:', this.API_URL);
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(taskData)
      });

      const data = await response.json();
      console.log('Task creation API response:', data);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      // Check if the response indicates an error
      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (data?.message) {
          errorMessage = data.message;
        } else if (data?.error) {
          errorMessage = data.error;
        } else if (data?.details) {
          errorMessage = data.details;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
        
        throw new Error(errorMessage);
      }

      // Check if the API response indicates failure
      if (data?.success === false) {
        const errorMessage = data?.message || data?.error || 'Task creation failed';
        throw new Error(errorMessage);
      }

      // Check for common error patterns in the response
      if (data?.message && (
        data.message.toLowerCase().includes('invalid') ||
        data.message.toLowerCase().includes('error') ||
        data.message.toLowerCase().includes('failed') ||
        data.message.toLowerCase().includes('validation')
      )) {
        throw new Error(data.message);
      }
      
      return {
        success: true,
        message: data?.message || 'Task created successfully',
        case_id: data?.case_id || data?.id || `TASK-${Date.now()}`
      };
    } catch (error: any) {
      console.error('Error creating task:', error);
      
      // Re-throw with more context if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      }
      
      // Re-throw the error as-is to preserve the original message
      throw error;
    }
  }
}
