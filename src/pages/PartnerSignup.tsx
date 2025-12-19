import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, User, Mail, Lock, Phone, Eye, EyeOff, Phone as PhoneIcon, Building, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Simple hash function for password (same as admin registration)
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

const PartnerSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobileNumber: "",
    partnerType: "",
    entityName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle mobile number input - only allow digits and limit to 10 digits
    if (name === 'mobileNumber') {
      const digitsOnly = value.replace(/\D/g, ''); // Remove non-digits
      const limitedValue = digitsOnly.slice(0, 10); // Limit to 10 digits
      setFormData(prev => ({
        ...prev,
        [name]: limitedValue
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      partnerType: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your first name",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your last name",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return false;
    }

    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const trimmedEmail = formData.email.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address (e.g., example@domain.com)",
        variant: "destructive",
      });
      return false;
    }
    
    // Additional email format checks
    if (trimmedEmail.startsWith('.') || trimmedEmail.startsWith('@') || trimmedEmail.endsWith('@') || trimmedEmail.endsWith('.')) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }
    
    if (trimmedEmail.includes('..') || trimmedEmail.includes('@@')) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.password) {
      toast({
        title: "Validation Error",
        description: "Please enter a password",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.mobileNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your mobile number",
        variant: "destructive",
      });
      return false;
    }

    // Enhanced mobile number validation (exactly 10 digits)
    const mobileDigits = formData.mobileNumber.replace(/\D/g, '');
    const mobileRegex = /^\d{10}$/;
    
    if (!mobileRegex.test(mobileDigits)) {
      toast({
        title: "Validation Error",
        description: "Mobile number must be exactly 10 digits",
        variant: "destructive",
      });
      return false;
    }
    
    // Validate mobile number range (should not start with 0 or 1)
    const firstDigit = mobileDigits.charAt(0);
    if (firstDigit === '0' || firstDigit === '1') {
      toast({
        title: "Validation Error",
        description: "Mobile number should not start with 0 or 1",
        variant: "destructive",
      });
      return false;
    }
    
    // Validate all digits are not the same
    if (/^(\d)\1{9}$/.test(mobileDigits)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid mobile number",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.partnerType) {
      toast({
        title: "Validation Error",
        description: "Please select your partner type",
        variant: "destructive",
      });
      return false;
    }

    // Validate entity name for non-individual agent types
    if (formData.partnerType && formData.partnerType !== "individual_agent" && !formData.entityName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the name of entity",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Hash the password using the same function as admin registration
      const hashedPassword = hashPassword(formData.password);
      
      console.log('=== PARTNER SIGNUP ===');
      console.log('Original password:', formData.password);
      console.log('Hashed password:', hashedPassword);
      console.log('=====================');
      
      // Prepare signup data for API call
      const signupData = {
        user: {
          username: `${formData.firstName.toLowerCase()}_${formData.lastName.toLowerCase()}`,
          email: formData.email,
          mobile_number: formData.mobileNumber,
          password_hash: hashedPassword, // Use hashed password
          role: "partner"
        },
        partner: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          mobile_number: formData.mobileNumber,
          emergency_contact: formData.mobileNumber, // Using same number as emergency contact
          gender: "male", // Default value
          age: 30, // Default value
          address: "Address not provided", // Default value
          partner_type: formData.partnerType,
          entity_name: formData.entityName || null, // Add entity name for non-individual agents
          created_by: 1,
          updated_by: 1
        }
      };

      console.log("Partner signup data:", signupData);
      
      // Call partner creation API
      const response = await fetch('http://localhost:3000/support/partner_creation', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
          'content-type': 'application/json',
          'jwt_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k',
          'origin': 'http://localhost:8080',
          'priority': 'u=1, i',
          'referer': 'http://localhost:8080/',
          'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'session_id': 'fddc661a-dfb4-4896-b7b1-448e1adf7bc2',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(signupData)
      });

      const result = await response.json();
      console.log("Partner creation API response:", result);
      
      // Check if the response contains an error status
      if (response.ok) {
        // Check if the response has an error status in the data
        if (Array.isArray(result) && result.length > 0) {
          const responseData = result[0];
          if (responseData.status === 'error') {
            // Show error popup if API returns error status
            toast({
              title: "Registration Failed",
              description: responseData.message || "Failed to create partner account",
              variant: "destructive",
            });
            return; // Don't navigate to login page
          }
        }
        
        // Show success dialog
        setShowSuccessDialog(true);
      } else {
        // Handle HTTP error responses
        const errorMessage = result.message || result.error || `HTTP error! status: ${response.status}`;
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("Error creating partner account:", error);
      toast({
        title: "Registration Failed",
        description: "Failed to create partner account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Top Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Left Side - Logo and Company Name */}
            <div className="flex items-center space-x-6">
              <img src="../leaders/logo.jpeg" alt="ExpertClais" className="w-48" />
            </div>
            
            {/* Right Side - Phone Number */}
            <div className="bg-blue-600 px-6 py-3 rounded-lg flex items-center space-x-3 shadow-lg">
              <PhoneIcon className="h-5 w-5 text-white" />
              <span className="text-white font-bold text-md">7396253535</span>
            </div>
          </div>
        </div>
      </div>
        {/* Main Service Section */}
        <div className="bg-gradient-to-br from-gray-50 to-white py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-blue-900 mb-3 tracking-wide">POLICY STRUCTURE SUPPORT</h1>
            <p className="text-lg text-blue-800 mb-4 font-medium">(Insurance Gap Analysis)</p>
            <p className="text-2xl font-bold text-red-600 mb-6">Optimise Your Insurance Coverage</p>
            <div className="text-gray-700 space-y-1 text-base">
              <p className="font-medium">With the Expert Guidance from</p>
              <p className="font-medium">The Trusted Industry Legends</p>
              <p className="font-bold text-lg">&</p>
              <p className="font-medium">The Members of our Technical Advisory Board</p>
            </div>
          </div>
        </div>

        {/* Partner Signup Form Section */}
        <div className="py-12 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
          <div className="max-w-md mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Partner Signup</h1>
              <p className="text-gray-600">Create your partner account to get started</p>
            </div>

            {/* Signup Form */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">Create Account</CardTitle>
                <CardDescription className="text-gray-600">
                  Join as a partner and start referring cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Partner Type Field - Moved to First Position */}
                  <div className="space-y-2">
                    <Label htmlFor="partnerType" className="text-sm font-medium text-gray-700">
                      Partner Type
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                      <Select value={formData.partnerType} onValueChange={handleSelectChange}>
                        <SelectTrigger className="pl-10 border-2 border-gray-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg transition-all duration-300">
                          <SelectValue placeholder="Select your partner type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual_agent">Individual Agent</SelectItem>
                          <SelectItem value="corporate_agent">Corporate Agent</SelectItem>
                          <SelectItem value="broker">Broker</SelectItem>
                          <SelectItem value="other_intermediary">Other Intermediary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Name of Entity Field - Conditional */}
                  {formData.partnerType && formData.partnerType !== "individual_agent" && (
                    <div className="space-y-2">
                      <Label htmlFor="entityName" className="text-sm font-medium text-gray-700">
                        Name of Entity
                      </Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="entityName"
                          name="entityName"
                          type="text"
                          placeholder="Enter entity name"
                          value={formData.entityName}
                          onChange={handleInputChange}
                          className="pl-10 border-2 border-gray-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg transition-all duration-300"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* First Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="pl-10 border-2 border-gray-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg transition-all duration-300"
                        required
                      />
                    </div>
                  </div>

                  {/* Last Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Last Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="pl-10 border-2 border-gray-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg transition-all duration-300"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10 border-2 border-gray-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg transition-all duration-300"
                        required
                      />
                    </div>
                  </div>

                  {/* Mobile Number Field */}
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700">
                      Mobile Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="mobileNumber"
                        name="mobileNumber"
                        type="tel"
                        placeholder="Enter 10-digit mobile number"
                        value={formData.mobileNumber}
                        onChange={handleInputChange}
                        className="pl-10 border-2 border-gray-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg transition-all duration-300"
                        required
                        minLength={10}
                        maxLength={10}
                        pattern="[6-9]\d{9}"
                        title="Mobile number must be 10 digits and start with 6-9"
                      />
                      {formData.mobileNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.mobileNumber.replace(/\D/g, '').length}/10 digits
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10 pr-10 border-2 border-gray-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg transition-all duration-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-10 pr-10 border-2 border-gray-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg transition-all duration-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      "Create Partner Account"
                    )}
                  </Button>
                </form>

                {/* Login Link */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <button
                      onClick={() => navigate("/login")}
                      className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>

       {/* Main Service Section */}
     

      {/* Expert Profiles Section */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Our Expert Team
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-blue-700 mx-auto rounded-full mb-4"></div>
            <p className="text-gray-600 text-lg">The Members of Our Technical Advisory Board</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Expert 1 */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="relative">
                <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <img 
                    src="/leaders/atul_deshpande.png"             
      alt="Atul Deshpande"
                    className="w-48 h-48 object-cover rounded-full border-4 border-white shadow-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Atul Deshpande
                </h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    A veteran expert in fire, Engineering & LOP insurance. He brings protection where there are gaps in cover.
                  </p>
                </div>
              </div>
            </div>

            {/* Expert 2 */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="relative">
                <div className="w-full h-64 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                  <img 
                    src="/leaders/rbala.png" 
                    alt="R.Bala Sundaram"
                    className="w-48 h-48 object-cover rounded-full border-4 border-white shadow-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  R.Bala Sundaram
                </h3>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Ensures protection in every Transit— Marine cargo coverage made perfect.
                  </p>
                </div>
              </div>
            </div>

            {/* Expert 3 */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="relative">
                <div className="w-full h-64 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                  <img 
                    src="/leaders/umesh_paratapa.png" 
                    alt="Umesh Pratapa"
                    className="w-48 h-48 object-cover rounded-full border-4 border-white shadow-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Umesh Pratapa
                </h3>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Offers guidance in insurance gap analysis and facilitates clear understanding of coverage positions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              
              <p className="text-gray-600 text-base font-medium">
                Advisory only: No Marketing of insurance products: Privacy assured
              </p>
              
              <h3 className="text-2xl font-bold text-gray-800">
                Expert Claim Solutions India Pvt Ltd., Hyderabad
              </h3>
              
              <p className="text-gray-600 text-base">
                Register on our website 
                <a 
                  href="https://www.expertinsuranceclaims.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline cursor-pointer hover:text-blue-700 transition-colors duration-300 font-semibold ml-2"
                >
                  www.expertinsuranceclaims.com
                </a>
              </p>
              
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <p className="text-lg font-bold text-blue-800">
                  Contact Us Today for a Complimentary Review
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Registration Successful!
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 mt-2">
              Partner account created successfully! You can now login to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                navigate("/login");
              }}
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Go to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    
    </div>
  );
};

export default PartnerSignup;
