import { supabase } from '@/integrations/supabase/client';
import { UserDetails } from '@/types/auth';

export interface LoginCredentials {
  email: string;
  password: string;
  otp?: string;
  mobile?: string;
  role?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  sessionId?: string;
  jwtToken?: string;
  userId?: string;
  userRole?: string;
  expiresAt?: number;
  statusCode?: number;
}

export interface CustomerLoginData {
  role: string;
  email: string;
  password: string;
  mobile: string;
  step: string;
  otp: string;
  timestamp: string;
}

export class AuthService {
  /**
   * Authenticate user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { email, password, otp, mobile, role } = credentials;
      
      // For customer and admin roles, use the two-step n8n webhook process
      if (role === 'customer' || role === 'admin') {
        return this.customerLogin(credentials);
      }

      // For other roles (employee, partner), use n8n webhook
      return this.otherRoleLogin(credentials);

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login service unavailable. Please try again later.',
        statusCode: 500
      };
    }
  }

  /**
   * Login for employee, admin, and partner roles using n8n webhook
   */
  static async otherRoleLogin(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { email, password, otp, role } = credentials;
      
      // Prepare login data for n8n webhook
      const loginData = {
        role: role || 'employee',
        email: email,
        password: password,
        mobile: '',
        step: 'login',
        otp: otp || '',
        timestamp: new Date().toISOString()
      };

      console.log('Calling n8n webhook for role:', role, 'with data:', loginData);
      
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'content-type': 'application/json',
          'origin': 'http://localhost:8080',
          'priority': 'u=1, i',
          'referer': 'http://localhost:8080/',
          'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(loginData)
      });

      if (response.status !== 200) {
        return {
          success: false,
          message: 'Login failed. Please check your credentials and try again.',
          statusCode: response.status
        };
      }

      const result = await response.json();
      console.log('n8n webhook login result:', result);
      
      // Handle different response formats
      let isLoginSuccess = false;
      let loginMessage = '';
      let sessionData = null;
      
      // Check if response is an array with session data (like the employee response)
      if (Array.isArray(result) && result.length > 0) {
        const firstItem = result[0];
        // Check if it contains session data (has session_id, user_id, jwt_token)
        if (firstItem && (firstItem.session_id || firstItem.user_id || firstItem.jwt_token)) {
          isLoginSuccess = true;
          loginMessage = 'Login successful';
          sessionData = firstItem;
          console.log('Login successful (array format with session data):', firstItem);
        }
        // Check if it has status property
        else if (firstItem && firstItem.status === 200) {
          isLoginSuccess = true;
          loginMessage = firstItem.message || 'Login successful';
          sessionData = firstItem;
          console.log('Login successful (array format with status):', firstItem);
        }
      }
      // Check if response has success property
      else if (result.success === true) {
        isLoginSuccess = true;
        loginMessage = result.message || 'Login successful';
        sessionData = result;
      }
      // Check if response has status property
      else if (result.status === 'success') {
        isLoginSuccess = true;
        loginMessage = result.message || 'Login successful';
        sessionData = result;
      }
      
      if (!isLoginSuccess) {
        const errorMessage = Array.isArray(result) 
          ? result[0]?.message || 'Login failed'
          : result.message || 'Login failed';
        
        return {
          success: false,
          message: errorMessage,
          statusCode: 401
        };
      }

      // Login successful, create session with data from response
      return {
        success: true,
        message: loginMessage || 'Login successful',
        sessionId: sessionData?.session_id || sessionData?.sessionId || `sess_${Date.now()}`,
        jwtToken: sessionData?.token || sessionData?.jwt || sessionData?.jwtToken || `token_${Date.now()}`,
        userId: sessionData?.user_id?.toString() || sessionData?.userId || '',
        userRole: role || 'employee',
        expiresAt: sessionData?.expiry ? new Date(sessionData.expiry).getTime() : Date.now() + (24 * 60 * 60 * 1000),
        statusCode: 200
      };

    } catch (error) {
      console.error('Other role login error:', error);
      return {
        success: false,
        message: 'Unable to complete login. Please check your connection and try again.',
        statusCode: 500
      };
    }
  }

  /**
   * Customer and Admin login with two-step process
   */
  static async customerLogin(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { email, password, mobile, otp, role } = credentials;
      
      // If OTP is provided, proceed directly with final login (skip credential validation)
      if (otp) {
        const finalLoginData: CustomerLoginData = {
          role: role || 'customer',
          email: email,
          password: password,
          mobile: role === 'admin' ? email : (mobile || ''), // Use email for admin, mobile for customer
          step: 'final_login',
          otp: otp,
          timestamp: new Date().toISOString()
        };

        console.log('Calling final_login with OTP (skipping credential_validation)...');
        const finalLoginResponse = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'content-type': 'application/json',
            'origin': 'http://localhost:8080',
            'priority': 'u=1, i',
            'referer': 'http://localhost:8080/',
            'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
          },
          body: JSON.stringify(finalLoginData)
        });

        if (finalLoginResponse.status !== 200) {
          return {
            success: false,
            message: 'OTP verification failed. Please try again.',
            statusCode: finalLoginResponse.status
          };
        }

        const finalLoginResult = await finalLoginResponse.json();
        console.log('Final login result:', finalLoginResult);
        localStorage.setItem('clientDetails', JSON.stringify(finalLoginResult)); 

        
        // Handle different response formats for final login
        let isLoginSuccess = false;
        let loginMessage = '';
        let sessionData = null;
        
        // Check if response is an array
        if (Array.isArray(finalLoginResult) && finalLoginResult.length > 0) {
          const firstItem = finalLoginResult[0];
          if (firstItem && firstItem.status === 200) {
            isLoginSuccess = true;
            loginMessage = firstItem.message || 'Login successful';
            sessionData = firstItem;
            console.log('Login successful (array format):', firstItem);
            localStorage.setItem('clientDetailsSession', JSON.stringify(firstItem)); 
          }
        }
        // Check if response has success property
        else if (finalLoginResult.success === true) {
          isLoginSuccess = true;
          loginMessage = finalLoginResult.message || 'Login successful';
          sessionData = finalLoginResult;
        }
        // Check if response has status property
        else if (finalLoginResult.status === 'success') {
          isLoginSuccess = true;
          loginMessage = finalLoginResult.message || 'Login successful';
          sessionData = finalLoginResult;
        }
        
        if (!isLoginSuccess) {
          const errorMessage = Array.isArray(finalLoginResult) 
            ? finalLoginResult[0]?.message || 'Login failed'
            : finalLoginResult.message || 'Login failed';
          
          return {
            success: false,
            message: errorMessage,
            statusCode: 401
          };
        }

        // Final login successful, now fetch customer session details (only for customer role)
        const sessionId = sessionData?.session_id || sessionData?.sessionId || `sess_${Date.now()}`;
        const jwtToken = sessionData?.token || sessionData?.jwt || sessionData?.jwtToken || `token_${Date.now()}`;
        
        // Call customer session details API only for customer role
        if (role === 'customer') {
          console.log('Fetching customer session details...');
          const customerSessionResponse = await fetch(`https://n8n.srv952553.hstgr.cloud/webhook/getcustomersessiondetails?mobile_number=${encodeURIComponent(mobile || '')}`, {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
              'content-type': 'application/json',
              'origin': 'http://localhost:8080',
              'priority': 'u=1, i',
              'referer': 'http://localhost:8080/',
              'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
              'sec-ch-ua-mobile': '?0',
              'sec-ch-ua-platform': '"Windows"',
              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'cross-site',
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
              'session_id': sessionId,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3ODYsImV4cCI6MjA3MDQ4Mjc4Nn0.Ssi2327jY_9cu5lQorYBdNjJJBWejz91j_kCgtfaj0o',
              'authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3ODYsImV4cCI6MjA3MDQ4Mjc4Nn0.Ssi2327jY_9cu5lQorYBdNjJJBWejz91j_kCgtfaj0o`
            }
          });

          if (customerSessionResponse.status === 200) {
            try {
              const customerSessionData = await customerSessionResponse.json();
              console.log('Customer session details:', customerSessionData);
              
              // Store customer session details in localStorage
              localStorage.setItem('expertclaims_customer_session_details', JSON.stringify(customerSessionData));
              console.log('Customer session details stored in localStorage');
            } catch (error) {
              console.error('Error parsing customer session details:', error);
            }
          } else {
            console.error('Failed to fetch customer session details:', customerSessionResponse.status);
          }
        }

        // Return login response with session data
        return {
          success: true,
          message: loginMessage || 'Login successful',
          sessionId: sessionId,
          jwtToken: jwtToken,
          userId: sessionData?.user_id?.toString() || sessionData?.userId || '',
          userRole: role || 'customer',
          expiresAt: sessionData?.expiry ? new Date(sessionData.expiry).getTime() : Date.now() + (24 * 60 * 60 * 1000),
          statusCode: 200
        };
      }

      // If no OTP provided, validate credentials first (for Send OTP process)
      const validationData: CustomerLoginData = {
        role: role || 'customer',
        email: email,
        password: password,
        mobile: role === 'admin' ? email : (mobile || ''), // Use email for admin, mobile for customer
        step: 'credential_validation',
        otp: '',
        timestamp: new Date().toISOString()
      };

      console.log('Step 1: Calling credential_validation...');
      const validationResponse = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'content-type': 'application/json',
          'origin': 'http://localhost:8080',
          'priority': 'u=1, i',
          'referer': 'http://localhost:8080/',
          'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(validationData)
      });

      if (validationResponse.status !== 200) {
        return {
          success: false,
          message: 'Credential validation failed. Please check your email and password.',
          statusCode: validationResponse.status
        };
      }

      const validationResult = await validationResponse.json();
      console.log('Step 1 result:', validationResult);
      
      // Handle different response formats for credential validation
      let isValidationSuccess = false;
      
      // Check if response is an array (like [{"message":"valid details.otp is 1234"}])
      if (Array.isArray(validationResult)) {
        const firstItem = validationResult[0];
        if (firstItem && firstItem.message && firstItem.message.includes('valid details')) {
          isValidationSuccess = true;
          console.log('Credential validation successful (array format):', firstItem.message);
        }
      }
      // Check if response has success property
      else if (validationResult.success === true) {
        isValidationSuccess = true;
        console.log('Credential validation successful (success property):', validationResult.message);
      }
      // Check if response has status property
      else if (validationResult.status === 'success') {
        isValidationSuccess = true;
        console.log('Credential validation successful (status property):', validationResult.message);
      }
      
      if (!isValidationSuccess) {
        const errorMessage = Array.isArray(validationResult) 
          ? validationResult[0]?.message || 'Credential validation failed'
          : validationResult.message || 'Credential validation failed';
        
        return {
          success: false,
          message: errorMessage,
          statusCode: 401
        };
      }

      // Credential validation successful, but OTP not provided yet
      return {
        success: true,
        message: 'Credentials validated. Please send OTP.',
        statusCode: 200
      };

    } catch (error) {
      console.error('Customer login error:', error);
      return {
        success: false,
        message: 'Login process failed. Please try again later.',
        statusCode: 500
      };
    }
  }

  /**
   * Send OTP for customer and admin login
   */
  static async sendCustomerOTP(credentials: LoginCredentials): Promise<{ success: boolean; message?: string; statusCode?: number; showOtpInput?: boolean; otpDetails?: any }> {
    try {
      const { email, password, mobile, role } = credentials;
      
      // Step 1: ALWAYS call credential_validation first
      const validationData: CustomerLoginData = {
        role: role || 'customer',
        email: email,
        password: password,
        mobile: role === 'admin' ? email : (mobile || ''), // Use email for admin, mobile for customer
        step: 'credential_validation',
        otp: '',
        timestamp: new Date().toISOString()
      };

      console.log('Step 1: Calling credential_validation...');
      const validationResponse = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'content-type': 'application/json',
          'origin': 'http://localhost:8080',
          'priority': 'u=1, i',
          'referer': 'http://localhost:8080/',
          'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(validationData)
      });

      if (validationResponse.status !== 200) {
        console.error('Step 1 failed with status:', validationResponse.status);
        return {
          success: false,
          message: 'Unable to validate credentials. Please check your email and password.',
          statusCode: validationResponse.status
        };
      }

      const validationResult = await validationResponse.json();
      console.log('Step 1 result:', validationResult);
      
      // Handle different response formats for credential validation
      let isValidationSuccess = false;
      
      // Check if response is an array (like [{"message":"valid details.otp is 1234"}])
      if (Array.isArray(validationResult)) {
        const firstItem = validationResult[0];
        if (firstItem && firstItem.message && firstItem.message.includes('valid details')) {
          isValidationSuccess = true;
          console.log('Credential validation successful (array format):', firstItem.message);
        }
      }
      // Check if response has success property
      else if (validationResult.success === true) {
        isValidationSuccess = true;
        console.log('Credential validation successful (success property):', validationResult.message);
      }
      // Check if response has status property
      else if (validationResult.status === 'success') {
        isValidationSuccess = true;
        console.log('Credential validation successful (status property):', validationResult.message);
      }
      
      if (!isValidationSuccess) {
        const errorMessage = Array.isArray(validationResult) 
          ? validationResult[0]?.message || 'Credential validation failed'
          : validationResult.message || 'Credential validation failed';
        
        return {
          success: false,
          message: errorMessage,
          statusCode: 401
        };
      }

      // Step 2: ALWAYS call send_otp after credential validation succeeds
      const otpData: CustomerLoginData = {
        role: role || 'customer',
        email: email,
        password: password,
        mobile: role === 'admin' ? email : (mobile || ''), // Use email for admin, mobile for customer
        step: 'send_otp',
        otp: '',
        timestamp: new Date().toISOString()
      };

      console.log('Step 2: Calling send_otp...');
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'content-type': 'application/json',
          'origin': 'http://localhost:8080',
          'priority': 'u=1, i',
          'referer': 'http://localhost:8080/',
          'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(otpData)
      });

      if (response.status !== 200) {
        console.error('Step 2 failed with status:', response.status);
        return {
          success: false,
          message: 'Failed to send OTP. Please try again.',
          statusCode: response.status
        };
      }

      const result = await response.json();
      console.log('Step 2 result:', result);
      
      // Handle different response formats for send_otp
      let isOtpSent = false;
      let otpMessage = '';
      let otpDetails = null;
      
      // Check if response is an array with OTP details
      if (Array.isArray(result) && result.length > 0) {
        const firstItem = result[0];
        // Check if it contains OTP details (has otp_id, otp_code, etc.)
        if (firstItem && (firstItem.otp_id || firstItem.otp_code)) {
          isOtpSent = true;
          otpMessage = 'OTP sent successfully. Please enter the OTP code.';
          otpDetails = firstItem;
          console.log('OTP details received:', firstItem);
        }
        // Check if it's a simple message response
        else if (firstItem && firstItem.message) {
          isOtpSent = true;
          otpMessage = firstItem.message;
        }
      }
      // Check if response has success property
      else if (result.success === true) {
        isOtpSent = true;
        otpMessage = result.message || 'OTP sent successfully';
        if (result.otp_details) {
          otpDetails = result.otp_details;
        }
      }
      // Check if response has status property
      else if (result.status === 'success') {
        isOtpSent = true;
        otpMessage = result.message || 'OTP sent successfully';
        if (result.otp_details) {
          otpDetails = result.otp_details;
        }
      }
      
      return {
        success: isOtpSent,
        message: otpMessage || 'OTP sent successfully',
        statusCode: 200,
        showOtpInput: isOtpSent, // This will trigger the UI to show OTP input
        otpDetails: otpDetails // Pass OTP details if needed
      };

    } catch (error) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        message: 'OTP service unavailable. Please try again later.',
        statusCode: 500
      };
    }
  }

  /**
   * Get user profile by email
   */
  static async getUserProfile(email: string, role?: string): Promise<{ success: boolean; data?: UserDetails; message?: string; statusCode?: number }> {
    try {
      // Call different n8n webhook based on role
      // Get JWT token from session for partner role
      let authToken = '';
      if (role === 'partner') {
        try {
          const sessionStr = localStorage.getItem('expertclaims_session');
          if (sessionStr) {
            const session = JSON.parse(sessionStr);
            authToken = session.jwtToken || '';
          }
        } catch (error) {
          console.error('Error getting token from session:', error);
        }
      }

      const webhookUrl = role === 'partner' 
        ? `http://localhost:3000/api/getpartnerdetails?email=${encodeURIComponent(email)}`
        : `https://n8n.srv952553.hstgr.cloud/webhook/getuserdetails?email=${encodeURIComponent(email)}`;
      
      console.log('Calling webhook for role:', role, 'URL:', webhookUrl);
      
      const headers: Record<string, string> = {
        'accept': '*/*',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'content-type': 'application/json',
      };

      // Add Authorization Bearer token for partner role
      if (role === 'partner' && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: headers
      });

      // Check HTTP status code
      if (response.status !== 200) {
        console.error('n8n webhook failed with status:', response.status);
        return {
          success: false,
          message: 'Unable to fetch user profile. Please try again.',
          statusCode: response.status
        };
      }

      const webhookData = await response.json();
      console.log('Webhook user profile data:', webhookData);
      // Store the webhook response in localStorage
      localStorage.setItem('expertclaims_user_details', JSON.stringify(webhookData));

      if (!webhookData || webhookData.status !== 'success') {
        return {
          success: false,
          message: webhookData?.message || 'User profile not found',
          statusCode: 404
        };
      }

      // Update the existing session in localStorage with the designation as userRole
      const existingSession = localStorage.getItem('expertclaims_session');
      console.log('Existing session before update:', existingSession);
      
      if (existingSession) {
        try {
          const sessionData = JSON.parse(existingSession);
          console.log('Parsed session data:', sessionData);
          console.log('Webhook designation:', webhookData.designation);
          
          const updatedSession = {
            ...sessionData,
            userRole: webhookData.designation, // Use designation as userRole
            expiresAt: webhookData.expiry ? new Date(webhookData.expiry).getTime() : sessionData.expiresAt,
            jwtToken: webhookData.jwt || sessionData.jwtToken,
            sessionId: webhookData.sessionid || sessionData.sessionId,
            userId: webhookData.userid?.toString() || sessionData.userId
          };
          
          console.log('Updated session object:', updatedSession);
          localStorage.setItem('expertclaims_session', JSON.stringify(updatedSession));
          console.log('Session saved to localStorage');
          
          // Verify the update
          const verifySession = localStorage.getItem('expertclaims_session');
          console.log('Verified session in localStorage:', verifySession);
        } catch (error) {
          console.error('Error updating session with designation:', error);
        }
      } else {
        console.log('No existing session found in localStorage');
      }

      // Transform the webhook data to match UserDetails interface
      const userDetails: UserDetails = {
        id: webhookData.userid?.toString() || '',
        email: webhookData.email || email,
        full_name: webhookData.full_name || '',
        role: webhookData.role || 'employee', // Default to employee if not provided
        department: webhookData.department || '',
        position: webhookData.department || '', // Use department as position for now
        phone: webhookData.phone || '',
        address: webhookData.address || '', 
        profile_image: webhookData.profile_image || '',
        is_active: true, // Default to true
        created_at: webhookData.created_at || new Date().toISOString(),
        updated_at: webhookData.updated_at || new Date().toISOString(),
        // Add the webhook specific fields
        jwt: webhookData.jwt,
        sessionid: webhookData.sessionid,
        expiry: webhookData.expiry,
        // Add any additional fields from the response
        ...webhookData
      };

      return {
        success: true,
        data: userDetails,
        statusCode: 200
      };

    } catch (error) {
      console.error('Error fetching user profile from n8n webhook:', error);
      return {
        success: false,
        message: 'User profile service unavailable. Please try again later.',
        statusCode: 500
      };
    }
  }

  /**
   * Validate session
   */
  static async validateSession(sessionId: string, jwtToken: string): Promise<boolean> {
    try {
      // In a real application, you would validate the JWT token
      // For now, we'll just check if the session exists and is not expired
      const session = localStorage.getItem('expertclaims_session');
      if (!session) return false;

      const parsedSession = JSON.parse(session);
      return parsedSession.sessionId === sessionId && 
             parsedSession.jwtToken === jwtToken && 
             parsedSession.expiresAt > Date.now();

    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Get customer session details from localStorage
   */
  static getCustomerSessionDetails(): any {
    try {
      const customerSessionDetails = localStorage.getItem('expertclaims_customer_session_details');
      if (customerSessionDetails) {
        return JSON.parse(customerSessionDetails);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving customer session details:', error);
      return null;
    }
  }

  /**
   * Clear customer session details from localStorage
   */
  static clearCustomerSessionDetails(): void {
    try {
      localStorage.removeItem('expertclaims_customer_session_details');
      console.log('Customer session details cleared from localStorage');
    } catch (error) {
      console.error('Error clearing customer session details:', error);
    }
  }

  /**
   * Get expected password for demo purposes
   * In production, this should be replaced with proper authentication
   */
  private static getExpectedPassword(role: string, email: string): string {
    const emailLower = email.toLowerCase().trim();
    
    // Demo passwords - in production, these would be hashed in the database
    const demoPasswords: { [key: string]: string } = {
      'admin@company.com': 'admin123',
      'john.smith@company.com': 'employee123',
      'emily.chen@company.com': 'employee123',
      'sarah.johnson@company.com': 'employee123',
      'michael.davis@company.com': 'employee123',
      'lisa.wilson@company.com': 'employee123',
      'robert.brown@company.com': 'employee123',
      'emma.anderson@company.com': 'partner123',
      'david.miller@company.com': 'partner123',
      'jennifer.garcia@company.com': 'customer123',
      'thomas.rodriguez@company.com': 'customer123',
      'maria.martinez@company.com': 'customer123',
      'james.lee@company.com': 'customer123',
      'patricia.white@company.com': 'customer123'
    };

    return demoPasswords[emailLower] || 'password123';
  }
}
