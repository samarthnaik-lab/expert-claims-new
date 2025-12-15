
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

// Simple hash function for password (same as Register.tsx)
const hashPassword = (password: string): string => {
  let hash = 0;
  if (password.length === 0) return hash.toString();

  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // force 32-bit int
  }

  // Expand the hash by repeating/mixing and encoding
  const base = Math.abs(hash).toString(36);
  const longHash = Array(8) // repeat 8x for length
    .fill(base)
    .map((b, i) => b + ((hash >> i) & 0xff).toString(36))
    .join("");

  return `$2b$10$${longHash}`;
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
  const [otpSent, setOtpSent] = useState(true); // Always show OTP field for admin/customer
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || '/';

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

  const validateForm = () => {
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
      const otpError = validateField('otp', formData.otp);
      if (emailError) {
        newErrors.email = emailError;
        newTouched.email = true;
      }
      if (passwordError) {
        newErrors.password = passwordError;
        newTouched.password = true;
      }
      if (otpError) {
        newErrors.otp = otpError;
        newTouched.otp = true;
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
      
      if (role === 'customer' || role === 'admin' || role === 'hr') {
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

  const handleSendOtp = async () => {
    // For customer role, validate mobile number
    if (role === 'customer' && !formData.mobile) {
      toast({
        title: "Error",
        description: "Please enter your mobile number",
        variant: "destructive",
      });
      return;
    }

    // For customer and admin roles, use the new n8n webhook API
    if (role === 'customer' || role === 'admin' || role === 'hr') {
      try {
        const hashedPassword = hashPassword(formData.password);
        console.log('=== OTP SEND ===');
        console.log('Original password:', formData.password);
        console.log('Hashed password:', hashedPassword);
        console.log('================');
        
        const result = await AuthService.sendCustomerOTP({
          email: formData.email,
          password: hashedPassword,
          mobile: formData.mobile,
          role: role
        });

        if (result.success) {
          // Check if we should show OTP input based on the response
          if (result.showOtpInput) {
            setOtpSent(true);
            toast({
              title: "OTP Sent Successfully",
              description: result.message || "OTP has been sent to your mobile number. Please enter the OTP code.",
            });
          } else {
            toast({
              title: "Success",
              description: result.message || "Operation completed successfully",
            });
          }
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
      }
    } else {
      // For other roles, use the existing logic
      console.log('Sending OTP to:', formData.mobile);
      // Here you would typically call an API to send OTP
      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "OTP has been sent to your mobile number",
      });
    }
  };

  const handleLogin = async () => {
    console.log('Login button clicked');
    console.log('Selected role:', role);
    console.log('Form data:', formData);
    
    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }

    setIsLoggingIn(true);

    try {
      if (role === 'customer' || role === 'admin' || role === 'hr') {
        if (!otpSent) {
          toast({
            title: "Error",
            description: "Please send OTP first",
            variant: "destructive",
          });
          return;
        }
        
        // For customer and admin roles, use the auth context login function
        const hashedPassword = hashPassword(formData.password);
        console.log('=== LOGIN ===');
        console.log('Original password:', formData.password);
        console.log('Hashed password:', hashedPassword);
        console.log(`${role} login with OTP:`, { 
          email: formData.email, 
          password: hashedPassword, 
          mobile: formData.mobile, 
          otp: formData.otp 
        });
        console.log('=============');
        
        const result = await login({
          email: formData.email,
          password: hashedPassword,
          otp: formData.otp,
          mobile: formData.mobile,
          role: role
        });

        if (result.success) {
          toast({
            title: "Login Successful",
            description: result.message || `Welcome to your ${role} portal!`,
          });
          
          // Navigate based on role
          if (role === 'customer') {
            navigate('/customer-portal');
          } else if (role === 'admin') {
            navigate('/admin-dashboard');
          } else if (role === 'hr') {
            navigate('/employee-dashboard');
          }
        } else {
          toast({
            title: "Login Failed",
            description: result.message || "Invalid credentials or OTP",
            variant: "destructive",
          });
        }
      } else {
        // For employee/partner, use email/password login
        const hashedPassword = hashPassword(formData.password);
        console.log('=== EMPLOYEE/PARTNER LOGIN ===');
        console.log('Original password:', formData.password);
        console.log('Hashed password:', hashedPassword);
        console.log('Attempting login with:', { email: formData.email, password: hashedPassword });
        console.log('==============================');
        
        const result = await login({
          email: formData.email,
          password: hashedPassword,
          otp: formData.otp,
          mobile: formData.mobile,
          role: role
        });

        console.log('Login result:', result);

        if (result.success) {
          toast({
            title: "Success",
            description: "Login successful",
          });
          
          // Navigate based on role
          switch (role) {
            case 'employee':
            case 'hr':
              navigate('/employee-dashboard');
              break;
            case 'partner':
              navigate('/partner-dashboard');
              break;
            case 'admin':
              navigate('/admin-dashboard');
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
                  className="pl-10 h-12 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
                {touched.mobile && errors.mobile && (
                  <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>
                )}
              </div>
            </div>
            
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
                    placeholder="Enter OTP (use 1234 for testing)"
                    className="pl-10 h-12 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                  {touched.otp && errors.otp && (
                    <p className="text-xs text-red-500 mt-1">{errors.otp}</p>
                  )}
                </div>
              </div>
            </div>
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
                  value={formData.email} // Changed to email for admin
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
                    placeholder="Enter OTP (use 1234 for testing)"
                    className="pl-10 h-12 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                  {touched.otp && errors.otp && (
                    <p className="text-xs text-red-500 mt-1">{errors.otp}</p>
                  )}
                </div>
              </div>
            </div>
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
    if (role === 'customer' || role === 'admin' || role === 'hr') {
      return true; // OTP field is always shown, login button always visible
    }
    return role && role !== '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-emerald-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-emerald-400/10 to-blue-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none bg-white/80 backdrop-blur-sm animate-fade-in relative z-10">
        <CardHeader className="text-center pb-8 pt-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            {/* <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div> */}
            <div>
                <img src="/leaders/logo.jpeg" alt="ExpertClaims" className="w-48" />
              </div>
            <div className="text-left">
              {/* <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                ExpertClaims
              </span> */}
              {/* <p className="text-xs text-gray-500 font-medium">Insurance Claim Recovery</p> */}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
          <CardDescription className="text-gray-600 font-medium">
            Select your role and enter your credentials
          </CardDescription>
          <p className="text-xs text-gray-500 mt-2">
            Fields marked with <span className="text-red-500">*</span> are required
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 px-8 pb-8">
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
                  <SelectItem value="" disabled className="rounded-lg">Loading roles...</SelectItem>
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

          {shouldShowSignInButton() && (
            <Button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full h-12 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
            >
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
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
