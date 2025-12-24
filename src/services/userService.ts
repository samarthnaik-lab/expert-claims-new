import { UserDetails, UserDetailsResponse } from '@/types/auth';

// New API response interfaces based on the actual response structure
export interface NewUserApiResponse {
  status: string;
  message: string;
  session_id: string;
  session_endtime: string;
  jwt_token: string;
  data: NewUserData[];
}

export interface NewUserData {
  user_id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  created_time: string;
  employees: EmployeeData | null;
  partners: PartnerData | null;
  customers: CustomerData | null;
  admin: AdminData | null;
}

export interface EmployeeData {
  user_id: number;
  last_name: string;
  first_name: string;
  age?: number;
  gender?: string;
  address?: string;
  mobile_number?: string;
  emergency_contact?: string;
  employment_status?: string;
  joining_date?: string;
  designation?: string;
  department?: string;
  manager?: string;
  work_phone?: string;
  pan_number?: string;
  aadhar_number?: string;
  employee_id?: number;
  created_time?: string;
  updated_time?: string;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_flag?: boolean;
  work_extension?: string | null;
  office_location?: string | null;
  team_name?: string | null;
  reports_to?: string | null;
  management_level?: string | null;
  bank_details?: string | null;
  profile_picture_url?: string | null;
  can_approve_bonuses?: boolean;
  max_bonus_approval_limit?: number | null;
  emergency_contact_name?: string | null;
  emergency_contact_relation?: string | null;
  communication_preference?: string | null;
  additional_notes?: string | null;
}

export interface PartnerData {
  age: number;
  gender: string;
  address: string;
  user_id: number;
  last_name: string;
  created_at: string;
  created_by: string | null;
  first_name: string;
  partner_id: number;
  updated_at: string;
  updated_by: string | null;
  mobile_number: string;
  emergency_contact: string;
}

export interface CustomerData {
  age?: number;
  gender?: string;
  notes: string;
  source: string;
  address: string;
  partner: PartnerData | null;
  partner_id?: number;
  user_id: number;
  last_name: string;
  created_by: string | null;
  first_name: string;
  updated_by: string | null;
  customer_id: number;
  company_name: string | null;
  created_time: string;
  deleted_flag: boolean;
  updated_time: string;
  customer_type: string;
  email_address: string | null;
  mobile_number: string;
  emergency_contact: string | null;
  language_preference: string;
  communication_preferences: string | null;
}

export interface AdminData {
  age: number;
  gender: string;
  address: string;
  user_id: number;
  admin_id: number;
  last_name: string;
  created_at: string;
  first_name: string;
  updated_at: string;
  mobile_number: string;
  emergency_contact: string;
  designation?: string;
  department?: string;
  pan_number?: string;
  aadhar_number?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  role: string;
  status: string;
  email: string;
  mobile_number: string;
  department: string | null;
  designation: string | null;
  joining_date: string;
  employment_status: string;
  work_phone: string;
  office_location: string;
  address: string;
  emergency_contact: string;
  age: number;
  gender: string | null;
  manager: string | null;
  team_name: string | null;
  bank_details: {
    bank_name: string;
    ifsc_code: string;
    account_number: string;
    account_holder_name: string;
  };
  pan_number: string;
  aadhar_number: string;
  communication_preference: string;
  additional_notes: string;
  emergency_contact_name: string;
  emergency_contact_relation: string | null;
  can_approve_bonuses: boolean;
  max_bonus_approval_limit: number | null;
  management_level: string | null;
  reports_to: string | null;
  profile_picture_url: string | null;
  work_extension: string;
  created_time: string;
  updated_time: string;
  username: string;
  created_by: string | null;
  last_login: string | null;
  updated_by: string | null;
  deleted_flag: boolean;
  two_factor_enabled: boolean;
  account_locked_until: string | null;
  failed_login_attempts: number;
  role_permission_id: string;
  password_hash: string;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
  error?: string;
}

export class UserService {
  private static readonly API_URL = 'http://localhost:3000/admin/getusers';
  private static readonly DELETE_API_URL = 'http://localhost:3000/admin/deleteuser';

  static async getUsers(sessionId: string, jwtToken: string, page: number = 1, size: number = 10): Promise<AdminUser[]> {
    try {
      const url = `${this.API_URL}?page=${page}&size=${size}`;
      console.log('Fetching users with URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'accept-profile': 'expc',
          'content-type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken,
          ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` }),
          'Range': '0-100', // Get first 100 users
          'Prefer': 'count=exact'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Raw users API response:', responseData);
      
      // Handle array-wrapped response
      let data: NewUserApiResponse;
      if (Array.isArray(responseData) && responseData.length > 0) {
        data = responseData[0]; // Take the first item from the array
        console.log('Extracted response data from array:', data);
      } else if (responseData && typeof responseData === 'object' && 'status' in responseData) {
        data = responseData as NewUserApiResponse; // Direct object response
        console.log('Direct response data:', data);
      } else {
        throw new Error('Unexpected response format from users API');
      }
      
      if (data.status === 'success' && data.data) {
        // Transform the new API response to match the AdminUser interface
        const transformedUsers: AdminUser[] = data.data.map(userData => {
          // Extract role-specific data
          let firstName = '';
          let lastName = '';
          let age = 0;
          let gender = '';
          let address = '';
          let mobileNumber = '';
          let emergencyContact = '';

          if (userData.role === 'employee' && userData.employees) {
            firstName = userData.employees.first_name || '';
            lastName = userData.employees.last_name || '';
          } else if (userData.role === 'partner' && userData.partners) {
            firstName = userData.partners.first_name || '';
            lastName = userData.partners.last_name || '';
            age = userData.partners.age || 0;
            gender = userData.partners.gender || '';
            address = userData.partners.address || '';
            mobileNumber = userData.partners.mobile_number || '';
            emergencyContact = userData.partners.emergency_contact || '';
          } else if (userData.role === 'customer' && userData.customers) {
            firstName = userData.customers.first_name || '';
            lastName = userData.customers.last_name || '';
            address = userData.customers.address || '';
            mobileNumber = userData.customers.mobile_number || '';
            emergencyContact = userData.customers.emergency_contact || '';
          } else if (userData.role === 'admin' && userData.admin) {
            firstName = userData.admin.first_name || '';
            lastName = userData.admin.last_name || '';
            age = userData.admin.age || 0;
            gender = userData.admin.gender || '';
            address = userData.admin.address || '';
            mobileNumber = userData.admin.mobile_number || '';
            emergencyContact = userData.admin.emergency_contact || '';
          }

          return {
            id: userData.user_id.toString(),
            name: `${firstName} ${lastName}`.trim() || userData.username,
            role: userData.role,
            status: userData.status,
            email: userData.email,
            mobile_number: mobileNumber,
            department: null, // Not available in new API
            designation: null, // Not available in new API
            joining_date: '', // Not available in new API
            employment_status: '', // Not available in new API
            work_phone: '', // Not available in new API
            office_location: '', // Not available in new API
            address: address,
            emergency_contact: emergencyContact,
            age: age,
            gender: gender,
            manager: null, // Not available in new API
            team_name: null, // Not available in new API
            bank_details: {
              bank_name: '',
              ifsc_code: '',
              account_number: '',
              account_holder_name: ''
            },
            pan_number: '', // Not available in new API
            aadhar_number: '', // Not available in new API
            communication_preference: '', // Not available in new API
            additional_notes: '', // Not available in new API
            emergency_contact_name: '', // Not available in new API
            emergency_contact_relation: null, // Not available in new API
            can_approve_bonuses: false, // Not available in new API
            max_bonus_approval_limit: null, // Not available in new API
            management_level: null, // Not available in new API
            reports_to: null, // Not available in new API
            profile_picture_url: null, // Not available in new API
            work_extension: '', // Not available in new API
            created_time: userData.created_time,
            updated_time: userData.created_time, // Using created_time as fallback
            username: userData.username,
            created_by: null, // Not available in new API
            last_login: null, // Not available in new API
            updated_by: null, // Not available in new API
            deleted_flag: false, // Not available in new API
            two_factor_enabled: false, // Not available in new API
            account_locked_until: null, // Not available in new API
            failed_login_attempts: 0, // Not available in new API
            role_permission_id: '', // Not available in new API
            password_hash: '' // Not available in new API
          };
        });
        
        console.log('Transformed users:', transformedUsers);
        return transformedUsers;
      }
      
      throw new Error('Invalid response format from users API');
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  static async deleteUser(userId: string, sessionId: string, jwtToken: string): Promise<DeleteUserResponse> {
    try {
      const url = `${this.DELETE_API_URL}?user_id=${userId}`;
      console.log('Deleting user with URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'accept-profile': 'srtms',
          'content-type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken,
          ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` })
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete user API error:', errorData);
        
        return {
          success: false,
          message: errorData.message || `HTTP error! status: ${response.status}`,
          error: errorData.error || 'Unknown error occurred'
        };
      }

      const result = await response.json();
      console.log('Delete user result:', result);

      return {
        success: true,
        message: result.message || 'User deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting user:', error);
      
      return {
        success: false,
        message: 'Failed to delete user',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get a specific user by ID for editing
  static async getUserById(userId: string, sessionId: string, jwtToken: string): Promise<NewUserData | null> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'accept-profile': 'srtms',
          'content-type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken,
          ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` }),
          'Range': '0-100',
          'Prefer': 'count=exact'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      let data: NewUserApiResponse;
      
      if (Array.isArray(responseData) && responseData.length > 0) {
        data = responseData[0];
      } else if (responseData && typeof responseData === 'object' && 'status' in responseData) {
        data = responseData as NewUserApiResponse;
      } else {
        throw new Error('Unexpected response format from users API');
      }
      
      if (data.status === 'success' && data.data) {
        const userData = data.data.find(u => u.user_id.toString() === userId);
        return userData || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }
}

import { buildApiUrl } from '@/config/api';

export const getUserDetails = async (email: string): Promise<UserDetailsResponse> => {
  try {
    console.log('Fetching user details for email:', email);
    
    // Get session from localStorage
    const sessionStr = localStorage.getItem('expertclaims_session');
    let sessionId = '';
    let jwtToken = '';

    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        sessionId = session.sessionId || '';
        jwtToken = session.jwtToken || '';
      } catch (error) {
        console.error('Error parsing session:', error);
      }
    }

    if (!sessionId || !jwtToken) {
      throw new Error('Session not available. Please log in.');
    }
    
    const response = await fetch(`${buildApiUrl('support/getuserdetails')}?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Profile': 'expc',
        'Accept-Profile': 'expc',
        'session_id': sessionId,
        'jwt_token': jwtToken,
        'Content-Type': 'application/json',
        ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` })
      },
    });

    console.log('User details API response status:', response.status);
    console.log('User details API response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('User details API error response:', errorText);
      throw new Error(`Failed to fetch user details: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('User details API response data:', data);

    // Store user details in localStorage
    localStorage.setItem('expertclaims_user_details', JSON.stringify(data));

    return {
      success: true,
      data: data as UserDetails,
      message: 'User details fetched successfully'
    };

  } catch (error) {
    console.error('Error fetching user details:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch user details'
    };
  }
};

export const getUserDetailsFromStorage = (): UserDetails | null => {
  try {
    const stored = localStorage.getItem('expertclaims_user_details');
    if (stored) {
      return JSON.parse(stored) as UserDetails;
    }
    return null;
  } catch (error) {
    console.error('Error parsing stored user details:', error);
    localStorage.removeItem('expertclaims_user_details');
    return null;
  }
};

export const getWebhookResponseFromStorage = (): any => {
  try {
    const stored = localStorage.getItem('expertclaims_user_details');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('Error parsing stored webhook response:', error);
    localStorage.removeItem('expertclaims_user_details');
    return null;
  }
};

export const clearUserDetailsFromStorage = (): void => {
  localStorage.removeItem('expertclaims_user_details');
};
