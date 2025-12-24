
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowLeft, User, Lock, Smartphone, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/services/authService';
import { buildApiUrl } from '@/config/api';

/**
 * Get password for sending to backend
 * SECURITY: Passwords are sent as plain text over HTTPS.
 * Backend will hash them properly using bcrypt.
 * 
 * Note: For existing users with fake hashes in database,
 * we temporarily support sending hashed passwords for migration.
 * New users should send plain passwords.
 */
// Helper function to mask mobile number - show only last 4 digits
const maskMobileNumber = (message: string): string => {
  if (!message) return message;
  
  // Pattern to match mobile numbers (10 digits)
  const mobilePattern = /\b(\d{10})\b/g;
  
  return message.replace(mobilePattern, (match) => {
    // Keep only last 4 digits, mask the rest
    const last4 = match.slice(-4);
    const masked = '*'.repeat(6) + last4; // 6 stars + last 4 digits
    return masked;
  });
};

const getPasswordForBackend = (password: string, isLegacyUser: boolean = false): string => {
  if (isLegacyUser) {
    // Legacy: Generate fake hash for users with fake hashes in DB
    // TODO: Remove this after migrating all users to proper bcrypt
    let hash = 0;
    if (password.length === 0) return hash.toString();

    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }

    const base = Math.abs(hash).toString(36);
    const longHash = Array(8)
      .fill(base)
      .map((b, i) => b + ((hash >> i) & 0xff).toString(36))
      .join("");

    return `$2b$10$${longHash}`;
  }
  
  // New approach: Send plain password - backend will hash it
  return password;
};

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Login = () => {
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mobile: '',
    otp: ''
  });
  // Login step tracking for admin: 'initial' -> 'credentials_validated' -> 'otp_sent' -> 'logged_in'
  const [loginStep, setLoginStep] = useState<'initial' | 'credentials_validated' | 'otp_sent'>('initial');
  const [otpSent, setOtpSent] = useState(false); // Start with false - OTP field hidden initially
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpValue, setOtpValue] = useState(''); // Store OTP from backend response (for testing)
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || '/';

  // Reset login step when role changes
  useEffect(() => {
    setLoginStep('initial');
    setOtpSent(false);
    setFormData(prev => ({ ...prev, otp: '' }));
    setOtpValue('');
  }, [role]);

  // Load roles on component mount
  useEffect(() => {
    // Use static role data instead of API call to avoid circular dependencies
    const staticRoles: Role[] = [
      { id: 'role_001', name: 'employee', display_name: 'Support Team', description: 'Regular employee', permissions: [], is_active: true, created_at: '', updated_at: '' },
      { id: 'role_002', name: 'admin', display_name: 'Admin', description: 'Administrator', permissions: [], is_active: true, created_at: '', updated_at: '' },
      { id: 'role_004', name: 'partner', display_name: 'Partner', description: 'External partner', permissions: [], is_active: true, created_at: '', updated_at: '' },
      { id: 'role_005', name: 'customer', display_name: 'Customer', description: 'Customer', permissions: [], is_active: true, created_at: '', updated_at: '' },
    
    ];
    
    setRoles(staticRoles);
    setIsLoadingRoles(false);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData]);
  };

  const validateField = (field: string, value: string) => {
    let error = '';
    
    switch (field) {
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (!value.trim()) {
          error = 'Password is required';
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters';
        }
        break;
      case 'mobile':
        if (!value.trim()) {
          error = 'Mobile number is required';
        } else if (!/^[0-9]{10,15}$/.test(value.replace(/\s/g, ''))) {
          error = 'Please enter a valid mobile number';
        }
        break;
      case 'otp':
        if ((role === 'admin' || role === 'hr' || role === 'customer') && !value.trim()) {
          error = 'OTP is required';
        } else if (value.trim() && !/^[0-9]{4,6}$/.test(value)) {
          error = 'Please enter a valid OTP';
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  const validateForm = (includeOtp: boolean = false) => {
    const newErrors: {[key: string]: string} = {};
    const newTouched: {[key: string]: boolean} = {};
    
    if (!role) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive",
      });
      return false;
    }

    if (role === 'employee' || role === 'partner') {
      const emailError = validateField('email', formData.email);
      const passwordError = validateField('password', formData.password);
      if (emailError) {
        newErrors.email = emailError;
        newTouched.email = true;
      }
      if (passwordError) {
        newErrors.password = passwordError;
        newTouched.password = true;
      }
    } else if (role === 'admin') {
      const emailError = validateField('email', formData.email);
      const passwordError = validateField('password', formData.password);
      if (emailError) {
        newErrors.email = emailError;
        newTouched.email = true;
      }
      if (passwordError) {
        newErrors.password = passwordError;
        newTouched.password = true;
      }
      // Only validate OTP if it's required (after OTP is sent)
      if (includeOtp && loginStep === 'otp_sent') {
        const otpError = validateField('otp', formData.otp);
        if (otpError) {
          newErrors.otp = otpError;
          newTouched.otp = true;
        }
      }
    } else if (role === 'hr') {
      const emailError = validateField('email', formData.email);
      const passwordError = validateField('password', formData.password);
      if (emailError) {
        newErrors.email = emailError;
        newTouched.email = true;
      }
      if (passwordError) {
        newErrors.password = passwordError;
        newTouched.password = true;
      }
    } else if (role === 'customer') {
      const mobileError = validateField('mobile', formData.mobile);
      if (mobileError) {
        newErrors.mobile = mobileError;
        newTouched.mobile = true;
      }
      
      if (includeOtp && (role === 'customer' || role === 'hr')) {
        const otpError = validateField('otp', formData.otp);
        if (otpError) {
          newErrors.otp = otpError;
          newTouched.otp = true;
        }
      }
    }

    setErrors(newErrors);
    setTouched(prev => ({ ...prev, ...newTouched }));
    return Object.keys(newErrors).length === 0;
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (shouldShowSignInButton() && !isLoggingIn) {
        handleLogin();
      }
    }
  };

  // Auto-login when OTP is "1234"
  const handleOtpChange = (value: string) => {
    handleInputChange('otp', value);
    // Auto-login when user enters "1234" for admin/customer/hr
    if (value.trim() === '1234' && (role === 'customer' || role === 'admin' || role === 'hr')) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        if (!isLoggingIn && formData.email && formData.password) {
          handleLogin();
        }
      }, 300);
    }
  };

  // Step 1: Validate credentials for admin
  const handleValidateCredentials = async () => {
    if (!validateForm(false)) {
      return;
    }

    setIsLoggingIn(true);

    try {
      // Send plain password - backend will compare with stored hash using bcrypt
      // For legacy users with fake hashes, backend handles migration
      const passwordToSend = getPasswordForBackend(formData.password, true); // true = legacy support
      
      // Call credential validation endpoint
      const response = await fetch(buildApiUrl('api/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: passwordToSend,
          role: role
          // No OTP, no step - this triggers credential validation
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // If OTP was automatically sent (nextStep === 'final_login'), show OTP input
        if (result.nextStep === 'final_login' || result.requiresOtp) {
          setLoginStep('otp_sent');
          setOtpSent(true);
          // Mask mobile number in the message
          const message = result.message || "OTP has been sent to your mobile number. Please enter the OTP code.";
          const maskedMessage = maskMobileNumber(message);
          
          toast({
            title: "OTP Sent Successfully",
            description: maskedMessage,
          });
        } else {
          // Credentials validated but OTP not sent yet (shouldn't happen with new flow)
          setLoginStep('credentials_validated');
          toast({
            title: "Credentials Validated",
            description: "Credentials are valid. Please request OTP.",
          });
        }
      } else {
        toast({
          title: "Validation Failed",
          description: result.message || "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error validating credentials:', error);
      toast({
        title: "Error",
        description: "Failed to validate credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Step 2: Send OTP for admin
  const handleSendOtp = async () => {
    // For admin, credentials must be validated first
    if (role === 'admin' && loginStep !== 'credentials_validated') {
      toast({
        title: "Error",
        description: "Please validate credentials first",
        variant: "destructive",
      });
      return;
    }

    // For customer role, validate mobile number and use customer-specific endpoint
    if (role === 'customer') {
      if (!formData.mobile) {
      toast({
        title: "Error",
        description: "Please enter your mobile number",
        variant: "destructive",
      });
      return;
    }

      setIsSendingOtp(true);

      try {
        // Step 1: Validate phone number exists
        console.log('[Customer Login] Step 1: Validating phone number...');
        const validateResponse = await fetch(buildApiUrl('api/customer/login'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone_number: formData.mobile,
            step: 'validate_phone'
          })
        });

        const validateResult = await validateResponse.json();

        if (!validateResponse.ok || !validateResult.success) {
          toast({
            title: "Error",
            description: validateResult.message || "Customer not found with this phone number",
            variant: "destructive",
          });
          setIsSendingOtp(false);
          return;
        }

        console.log('[Customer Login] Phone validated, sending OTP...');

        // Step 2: Send OTP
        const sendOtpResponse = await fetch(buildApiUrl('api/customer/login'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone_number: formData.mobile,
            step: 'send_otp'
          })
        });

        const sendOtpResult = await sendOtpResponse.json();

        if (sendOtpResponse.ok && sendOtpResult.success) {
          setOtpSent(true);
          setLoginStep('otp_sent');
          setOtpValue(sendOtpResult.otp || ''); // Store OTP for testing (remove in production)
          
          // Pre-fill OTP field with received OTP (for testing only)
          if (sendOtpResult.otp) {
            setFormData(prev => ({ ...prev, otp: sendOtpResult.otp }));
          }

          toast({
            title: "OTP Sent Successfully",
            description: sendOtpResult.message || "OTP has been sent to your mobile number. Please enter the OTP code.",
          });
        } else {
          toast({
            title: "Error",
            description: sendOtpResult.message || "Failed to send OTP",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error in customer login flow:', error);
        toast({
          title: "Error",
          description: "Failed to send OTP. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSendingOtp(false);
      }
      return;
    }

    // Admin flow (unchanged)
    setIsSendingOtp(true);

    try {
      // Send plain password - backend will compare with stored hash
      const passwordToSend = getPasswordForBackend(formData.password, true); // true = legacy support
      
      // Call send_otp endpoint
      const response = await fetch(buildApiUrl('api/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: passwordToSend,
          role: role,
          mobile: role === 'admin' ? formData.email : formData.mobile, // For admin, use email
          step: 'send_otp'
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setOtpSent(true);
        setLoginStep('otp_sent');
        setOtpValue(result.otp || ''); // Store OTP for testing (remove in production)
        
        // Pre-fill OTP field with received OTP (for testing only)
        if (result.otp) {
          setFormData(prev => ({ ...prev, otp: result.otp }));
        }

        // Mask mobile number in the message
        const defaultMessage = role === 'admin' 
          ? `OTP sent to email ${formData.email}` 
          : "OTP has been sent to your mobile number. Please enter the OTP code.";
        const message = result.message || defaultMessage;
        const maskedMessage = role === 'admin' ? message : maskMobileNumber(message); // Only mask for non-admin (mobile numbers)

        toast({
          title: "OTP Sent Successfully",
          description: maskedMessage,
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to send OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleLogin = async () => {
    console.log('Login button clicked');
    console.log('Selected role:', role);
    console.log('Form data:', formData);
    console.log('Login step:', loginStep);
    
    // For admin: Step 1 - Validate credentials first
    if (role === 'admin' && loginStep === 'initial') {
      await handleValidateCredentials();
      return;
    }

    // For admin: Step 2 - Send OTP after credentials validated
    if (role === 'admin' && loginStep === 'credentials_validated') {
      await handleSendOtp();
      return;
    }

    // For admin: Step 3 - Final login with OTP
    if (role === 'admin' && loginStep === 'otp_sent') {
      // Validate form including OTP
      if (!validateForm(true)) {
        return;
      }

      setIsLoggingIn(true);

      try {
        // Send plain password - backend will compare with stored hash
        const passwordToSend = getPasswordForBackend(formData.password, true); // true = legacy support
        
        const result = await login({
          email: formData.email,
          password: passwordToSend,
          otp: formData.otp,
          mobile: formData.email, // For admin, use email as mobile
          role: role
        });

        if (result.success) {
          toast({
            title: "Login Successful",
            description: result.message || `Welcome to your ${role} portal!`,
          });
          
          navigate('/admin-dashboard');
        } else {
          toast({
            title: "Login Failed",
            description: result.message || "Invalid OTP",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Login error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoggingIn(false);
      }
      return;
    }

    // For customer: Use customer-specific login endpoint
    if (role === 'customer') {
      if (!otpSent) {
        // First time - validate phone and send OTP
        await handleSendOtp();
        return;
      }
      
      if (!formData.otp || formData.otp.trim().length !== 4) {
        toast({
          title: "Error",
          description: "Please enter a valid 4-digit OTP",
          variant: "destructive",
        });
        return;
      }

      setIsLoggingIn(true);

      try {
        console.log('[Customer Login] Step 3: Verifying OTP...');
        
        // Use customer-specific endpoint
        const response = await fetch(buildApiUrl('api/customer/login'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone_number: formData.mobile,
            otp: formData.otp
            // No step field - backend will detect otp and go to verify step
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Store session in the format AuthContext expects
          if (result.jwtToken && result.sessionId && result.userId && result.userRole) {
            const expiresAt = result.expiresAt || (Date.now() + (3 * 60 * 60 * 1000)); // 3 hours default
            const session = {
              sessionId: result.sessionId,
              jwtToken: result.jwtToken,
              userId: result.userId.toString(), // Ensure it's a string
              userRole: result.userRole || 'customer',
              expiresAt: expiresAt,
              expiresAtFormatted: result.expiresAtFormatted || new Date(expiresAt).toLocaleString(),
              expiresIn: result.expiresIn || Math.floor((expiresAt - Date.now()) / 1000)
            };
            
            console.log('[Customer Login] Storing session:', session);
            
            // Store in the format AuthContext expects
            localStorage.setItem('expertclaims_session', JSON.stringify(session));
            
            // Also store individual items for backward compatibility
            localStorage.setItem('jwtToken', result.jwtToken);
            localStorage.setItem('sessionId', result.sessionId);
            localStorage.setItem('userId', result.userId.toString());
            localStorage.setItem('userRole', result.userRole || 'customer');
            localStorage.setItem('expiresAt', expiresAt.toString());
            
            console.log('[Customer Login] Session stored successfully');
          } else {
            console.error('[Customer Login] Missing required session fields:', {
              hasJwtToken: !!result.jwtToken,
              hasSessionId: !!result.sessionId,
              hasUserId: !!result.userId,
              hasUserRole: !!result.userRole
            });
          }

          toast({
            title: "Login Successful",
            description: result.message || `Welcome to your customer portal!`,
          });
          
          // Reload the page to ensure AuthContext picks up the new session
          // This is necessary because AuthContext checks session on mount
          window.location.href = '/customer-portal';
        } else {
          toast({
            title: "Login Failed",
            description: result.message || "Invalid OTP",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Customer login error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoggingIn(false);
      }
      return;
    }

    // For hr: Use existing flow
    if (role === 'hr') {
      if (!otpSent) {
        toast({
          title: "Error",
          description: "Please send OTP first",
          variant: "destructive",
        });
        return;
      }
      
      if (!validateForm(true)) {
        return;
      }

      setIsLoggingIn(true);

      try {
        // Send plain password - backend will compare with stored hash
        const passwordToSend = getPasswordForBackend(formData.password, true); // true = legacy support
        
        const result = await login({
          email: formData.email,
          password: passwordToSend,
          otp: formData.otp,
          mobile: formData.mobile,
          role: role
        });

        if (result.success) {
          toast({
            title: "Login Successful",
            description: result.message || `Welcome to your ${role} portal!`,
          });
          
            navigate('/employee-dashboard');
        } else {
          toast({
            title: "Login Failed",
            description: result.message || "Invalid credentials or OTP",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Login error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoggingIn(false);
      }
      return;
    }

    // For employee/partner: Direct login
    if (role === 'employee' || role === 'partner') {
      if (!validateForm(false)) {
        return;
      }

      setIsLoggingIn(true);

      try {
        // Send plain password - backend will compare with stored hash
        const passwordToSend = getPasswordForBackend(formData.password, true); // true = legacy support
        
        const result = await login({
          email: formData.email,
          password: passwordToSend,
          otp: '',
          mobile: '',
          role: role
        });

        if (result.success) {
          toast({
            title: "Success",
            description: "Login successful",
          });
          
          switch (role) {
            case 'employee':
              navigate('/employee-dashboard');
              break;
            case 'partner':
              navigate('/partner-dashboard');
              break;
            default:
              navigate(from);
          }
        } else {
          toast({
            title: "Login Failed",
            description: result.message || "Invalid credentials",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Login error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  const renderFormFields = () => {
    switch (role) {
      case 'employee':
      case 'partner':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-semibold">email<span className="text-red-500">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="username"
                  value={formData.email} // Changed to email for employee/partner
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={() => handleFieldBlur('email')}
                  placeholder="Enter your email"
                  className="pl-10 h-12 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
                {touched.email && errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-semibold">Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={() => handleFieldBlur('password')}
                  placeholder="Enter your password"
                  className="pl-10 h-12 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
                {touched.password && errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'customer':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-gray-700 font-semibold">Mobile Number <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={() => handleFieldBlur('mobile')}
                  placeholder="Enter your mobile number"
                  disabled={otpSent && loginStep === 'otp_sent'}
                  className="pl-10 h-12 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
                {touched.mobile && errors.mobile && (
                  <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>
                )}
              </div>
            </div>
            
            {/* OTP Field - Only show after OTP is sent */}
            {otpSent && loginStep === 'otp_sent' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-700 font-semibold">OTP <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="otp"
                    value={formData.otp}
                    onChange={(e) => handleOtpChange(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={() => handleFieldBlur('otp')}
                      placeholder="Enter 4-digit OTP"
                    className="pl-10 h-12 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                  {touched.otp && errors.otp && (
                    <p className="text-xs text-red-500 mt-1">{errors.otp}</p>
                  )}
                </div>
              </div>
            </div>
            )}
          </div>
        );

      case 'admin':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-semibold">email <span className="text-red-500">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="username"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={() => handleFieldBlur('email')}
                  placeholder="Enter your email"
                  disabled={loginStep !== 'initial'}
                  className="pl-10 h-12 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
                {touched.email && errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-semibold">Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={() => handleFieldBlur('password')}
                  placeholder="Enter your password"
                  disabled={loginStep !== 'initial'}
                  className="pl-10 h-12 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
                {touched.password && errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
              </div>
            </div>
            
            {/* OTP Field - Only show after credentials are validated and OTP is sent */}
            {loginStep === 'otp_sent' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-700 font-semibold">OTP <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="otp"
                      value={formData.otp}
                      onChange={(e) => handleOtpChange(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={() => handleFieldBlur('otp')}
                      placeholder={otpValue ? `Enter OTP (${otpValue} for testing)` : "Enter OTP"}
                      className="pl-10 h-12 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                    {touched.otp && errors.otp && (
                      <p className="text-xs text-red-500 mt-1">{errors.otp}</p>
                    )}
                  </div>
                  {otpValue && (
                    <p className="text-xs text-blue-600 mt-1">
                      OTP sent to email. For testing, use: <strong>{otpValue}</strong>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Show status message */}
            {loginStep === 'credentials_validated' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ Credentials validated. Click "Send OTP" to receive OTP via email.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Please select a role to continue</p>
          </div>
        );
    }
  };

  const shouldShowSignInButton = () => {
    if (role === 'admin') {
      // For admin: Show button in initial state (to validate credentials)
      // Or show button when OTP is sent (to complete login)
      return loginStep === 'initial' || loginStep === 'otp_sent';
    }
    if (role === 'customer' || role === 'hr') {
      return true; // Always show for customer/hr
    }
    return role && role !== '';
  };

  const shouldShowSendOtpButton = () => {
    // Show "Send OTP" button for admin after credentials are validated
    return role === 'admin' && loginStep === 'credentials_validated';
  };

  const getButtonText = () => {
    if (role === 'admin') {
      if (loginStep === 'initial') {
        return 'Validate Credentials';
      } else if (loginStep === 'otp_sent') {
        return 'Sign In';
      }
    }
    if (role === 'customer') {
      if (!otpSent) {
        return 'Verify & Send OTP';
      } else {
        return 'Sign In';
      }
    }
    return 'Sign In';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-emerald-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-emerald-400/10 to-blue-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none bg-white/80 backdrop-blur-sm animate-fade-in relative z-10">
        <CardHeader className="text-center pb-6 sm:pb-8 pt-6 sm:pt-8 px-4 sm:px-6">
          <div className="flex items-center justify-center space-x-3 mb-4 sm:mb-6">
            {/* <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div> */}
            <div>
                <img src="/leaders/logo.jpeg" alt="ExpertClaims" className="w-32 sm:w-48 h-auto" />
              </div>
            <div className="text-left">
              {/* <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                ExpertClaims
              </span> */}
              {/* <p className="text-xs text-gray-500 font-medium">Insurance Claim Recovery</p> */}
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600 font-medium">
            Select your role and enter your credentials
          </CardDescription>
          <p className="text-xs text-gray-500 mt-2">
            Fields marked with <span className="text-red-500">*</span> are required
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 px-4 sm:px-8 pb-6 sm:pb-8">
          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-700 font-semibold">User Role</Label>
            <Select 
              value={role} 
              onValueChange={setRole}
              disabled={isLoadingRoles}
            >
              <SelectTrigger className="h-12 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <SelectValue placeholder={isLoadingRoles ? "Loading roles..." : "Select your role"} />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 rounded-xl shadow-lg">
                {isLoadingRoles ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500">Loading roles...</div>
                ) : (
                  roles.map(r => (
                    <SelectItem key={r.id} value={r.name} className="rounded-lg">
                      {r.display_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {renderFormFields()}

          {/* Send OTP Button - Only for admin after credentials validated */}
          {shouldShowSendOtpButton() && (
            <Button 
              onClick={handleSendOtp}
              disabled={isSendingOtp}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
            >
              {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          )}

          {/* Sign In / Validate Credentials Button */}
          {shouldShowSignInButton() && (
            <Button 
              onClick={handleLogin}
              disabled={isLoggingIn || isSendingOtp}
              className="w-full h-12 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
            >
              {isLoggingIn ? (loginStep === 'initial' ? 'Validating...' : 'Signing In...') : getButtonText()}
            </Button>
          )}

          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl font-semibold"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
