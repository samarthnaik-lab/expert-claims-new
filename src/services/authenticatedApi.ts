import { useAuth } from '@/contexts/AuthContext';
import { MockApiService } from './mockApi';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class AuthenticatedApiService {
  private static getAuthHeaders(): { [key: string]: string } {
    // This will be called from within a React component
    // For now, we'll return empty headers and handle auth in the component
    return {};
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    authHeaders: { [key: string]: string } = {}
  ): Promise<ApiResponse<T>> {
    const url = `${import.meta.env.VITE_API_BASE_URL || '/api'}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...authHeaders,
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return {
        data,
        success: true,
      };
    } catch (error) {
      return {
        data: null as T,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Role-related API methods
  static async getRoles(authHeaders: { [key: string]: string }): Promise<ApiResponse<Role[]>> {
    // Use n8n webhook for fetching roles
    const n8nWebhookUrl = 'https://n8n.srv952553.hstgr.cloud/webhook/58e6269b-6e6d-4236-a441-ff41824771be';
    
    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats from n8n
      let roles: Role[] = [];
      
      if (data.success && data.data) {
        // If response has success and data structure
        roles = data.data;
      } else if (Array.isArray(data)) {
        // If response is directly an array
        roles = data;
      } else if (data.roles && Array.isArray(data.roles)) {
        // If response has roles property
        roles = data.roles;
      } else {
        // Fallback to mock data if response format is unexpected
        console.warn('Unexpected response format from n8n webhook, using mock data');
        const mockResponse = await MockApiService.getRoles();
        return {
          data: mockResponse.data,
          success: mockResponse.success,
          message: 'Using fallback data due to unexpected response format'
        };
      }

      // Transform the data to match our Role interface if needed
      const transformedRoles: Role[] = roles.map((role: any, index: number) => ({
        id: role.id || `role_${index + 1}`,
        name: role.name || role.role_name || role.value,
        display_name: role.display_name || role.displayName || role.label || role.name || role.role_name || role.value,
        description: role.description || role.desc || '',
        permissions: role.permissions || role.permission || [],
        is_active: role.is_active !== false, // Default to true unless explicitly false
        created_at: role.created_at || role.createdAt || new Date().toISOString(),
        updated_at: role.updated_at || role.updatedAt || new Date().toISOString(),
      }));

      return {
        data: transformedRoles,
        success: true,
        message: 'Roles retrieved successfully from n8n webhook'
      };

    } catch (error) {
      console.error('Error fetching roles from n8n webhook:', error);
      
      // Fallback to mock API if webhook fails
      try {
        const mockResponse = await MockApiService.getRoles();
        return {
          data: mockResponse.data,
          success: mockResponse.success,
          message: 'Using fallback data due to webhook error'
        };
      } catch (mockError) {
        return {
          data: [],
          success: false,
          message: 'Failed to fetch roles from both webhook and fallback'
        };
      }
    }
  }

  // Task-related API methods
  static async getTasks(authHeaders: { [key: string]: string }): Promise<ApiResponse<any[]>> {
    return this.request('/tasks', {
      method: 'GET',
    }, authHeaders);
  }

  static async getTask(id: string, authHeaders: { [key: string]: string }): Promise<ApiResponse<any>> {
    return this.request(`/tasks/${id}`, {
      method: 'GET',
    }, authHeaders);
  }

  static async createTask(taskData: any, authHeaders: { [key: string]: string }): Promise<ApiResponse<any>> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }, authHeaders);
  }

  static async updateTask(id: string, taskData: any, authHeaders: { [key: string]: string }): Promise<ApiResponse<any>> {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    }, authHeaders);
  }

  static async deleteTask(id: string, authHeaders: { [key: string]: string }): Promise<ApiResponse<void>> {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    }, authHeaders);
  }

  // Comment-related API methods
  static async getTaskComments(taskId: string, authHeaders: { [key: string]: string }): Promise<ApiResponse<any[]>> {
    return this.request(`/tasks/${taskId}/comments`, {
      method: 'GET',
    }, authHeaders);
  }

  static async addTaskComment(taskId: string, commentData: any, authHeaders: { [key: string]: string }): Promise<ApiResponse<any>> {
    return this.request(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    }, authHeaders);
  }

  // Stakeholder-related API methods
  static async getTaskStakeholders(taskId: string, authHeaders: { [key: string]: string }): Promise<ApiResponse<any[]>> {
    return this.request(`/tasks/${taskId}/stakeholders`, {
      method: 'GET',
    }, authHeaders);
  }

  static async addTaskStakeholder(taskId: string, stakeholderData: any, authHeaders: { [key: string]: string }): Promise<ApiResponse<any>> {
    return this.request(`/tasks/${taskId}/stakeholders`, {
      method: 'POST',
      body: JSON.stringify(stakeholderData),
    }, authHeaders);
  }

  static async deleteTaskStakeholder(taskId: string, stakeholderId: string, authHeaders: { [key: string]: string }): Promise<ApiResponse<void>> {
    return this.request(`/tasks/${taskId}/stakeholders/${stakeholderId}`, {
      method: 'DELETE',
    }, authHeaders);
  }

  // User-related API methods
  static async getUsers(authHeaders: { [key: string]: string }): Promise<ApiResponse<any[]>> {
    return this.request('/users', {
      method: 'GET',
    }, authHeaders);
  }

  static async createUser(userData: any, authHeaders: { [key: string]: string }): Promise<ApiResponse<any>> {
    // For development, use mock API if real API is not available
    if (import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL) {
      try {
        const mockResponse = await MockApiService.createUser(userData);
        return {
          data: mockResponse.data,
          success: mockResponse.success,
          message: mockResponse.message
        };
      } catch (error) {
        return {
          data: null,
          success: false,
          message: 'Failed to create user'
        };
      }
    }

    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, authHeaders);
  }

  // Category-related API methods
  static async getCategories(authHeaders: { [key: string]: string }): Promise<ApiResponse<any[]>> {
    return this.request('/categories', {
      method: 'GET',
    }, authHeaders);
  }
}

// Custom hook for authenticated API calls
export const useAuthenticatedApi = () => {
  const { getAuthHeaders, isAuthenticated } = useAuth();

  const apiCall = async <T>(
    apiMethod: (authHeaders: { [key: string]: string }) => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> => {
    if (!isAuthenticated) {
      return {
        data: null as T,
        success: false,
        message: 'User not authenticated',
      };
    }

    const authHeaders = getAuthHeaders();
    return await apiMethod(authHeaders);
  };

  return {
    getRoles: () => apiCall(AuthenticatedApiService.getRoles),
    getTasks: () => apiCall(AuthenticatedApiService.getTasks),
    getTask: (id: string) => apiCall((headers) => AuthenticatedApiService.getTask(id, headers)),
    createTask: (taskData: any) => apiCall((headers) => AuthenticatedApiService.createTask(taskData, headers)),
    updateTask: (id: string, taskData: any) => apiCall((headers) => AuthenticatedApiService.updateTask(id, taskData, headers)),
    deleteTask: (id: string) => apiCall((headers) => AuthenticatedApiService.deleteTask(id, headers)),
    getTaskComments: (taskId: string) => apiCall((headers) => AuthenticatedApiService.getTaskComments(taskId, headers)),
    addTaskComment: (taskId: string, commentData: any) => apiCall((headers) => AuthenticatedApiService.addTaskComment(taskId, commentData, headers)),
    getTaskStakeholders: (taskId: string) => apiCall((headers) => AuthenticatedApiService.getTaskStakeholders(taskId, headers)),
    addTaskStakeholder: (taskId: string, stakeholderData: any) => apiCall((headers) => AuthenticatedApiService.addTaskStakeholder(taskId, stakeholderData, headers)),
    deleteTaskStakeholder: (taskId: string, stakeholderId: string) => apiCall((headers) => AuthenticatedApiService.deleteTaskStakeholder(taskId, stakeholderId, headers)),
    getUsers: () => apiCall(AuthenticatedApiService.getUsers),
    createUser: (userData: any) => apiCall((headers) => AuthenticatedApiService.createUser(userData, headers)),
    getCategories: () => apiCall(AuthenticatedApiService.getCategories),
  };
};
