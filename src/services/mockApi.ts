import { Role } from './authenticatedApi';

// Mock API service for development/testing
export class MockApiService {
  private static roles: Role[] = [
    {
      id: 'role_001',
      name: 'employee',
      display_name: 'Employee',
      description: 'Regular employee with limited access',
      permissions: ['view_tasks', 'create_tasks', 'edit_own_tasks'],
      is_active: true,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 'role_002',
      name: 'admin',
      display_name: 'Administrator',
      description: 'Full system administrator with all permissions',
      permissions: ['*'],
      is_active: true,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 'role_003',
      name: 'partner',
      display_name: 'Partner',
      description: 'External partner with specific access',
      permissions: ['view_tasks', 'create_tasks'],
      is_active: true,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 'role_004',
      name: 'customer',
      display_name: 'Customer',
      description: 'Customer with limited portal access',
      permissions: ['view_own_claims', 'create_claims'],
      is_active: true,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    }
  ];

  // Simulate API delay
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock getRoles method
  static async getRoles(): Promise<{ success: boolean; data: Role[]; message?: string }> {
    await this.delay(500); // Simulate network delay
    
    // Simulate 10% chance of failure for testing
    if (Math.random() < 0.1) {
      return {
        success: false,
        data: [],
        message: 'Failed to fetch roles from server'
      };
    }

    return {
      success: true,
      data: this.roles,
      message: 'Roles retrieved successfully'
    };
  }

  // Mock createUser method
  static async createUser(userData: any): Promise<{ success: boolean; data?: any; message?: string }> {
    await this.delay(1000); // Simulate network delay
    
    // Simulate validation errors
    if (!userData.email || !userData.password || !userData.first_name || !userData.last_name) {
      return {
        success: false,
        message: 'Required fields are missing',
        data: {
          field_errors: {
            email: !userData.email ? 'Email is required' : undefined,
            password: !userData.password ? 'Password is required' : undefined,
            first_name: !userData.first_name ? 'First name is required' : undefined,
            last_name: !userData.last_name ? 'Last name is required' : undefined
          }
        }
      };
    }

    // Simulate duplicate email error
    if (userData.email === 'existing@example.com') {
      return {
        success: false,
        message: 'Email already exists',
        data: {
          field_errors: {
            email: 'Email address is already registered'
          }
        }
      };
    }

    return {
      success: true,
      data: {
        user_id: `user_${Date.now()}`,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username,
        role: userData.role,
        status: 'active',
        created_at: new Date().toISOString(),
        profile: {
          mobile: userData.mobile,
          gender: userData.gender,
          age: userData.age,
          address: userData.address,
          emergency_contact: userData.emergency_contact
        },
        employee_info: userData.role === 'employee' ? {
          employment_status: userData.employment_status,
          joining_date: userData.joining_date,
          designation: userData.designation,
          department: userData.department,
          manager_name: userData.manager_name,
          work_phonenumber: userData.work_phonenumber,
          pan_number: userData.pan_number,
          aadhar_number: userData.aadhar_number
        } : undefined
      },
      message: 'User created successfully'
    };
  }
}


