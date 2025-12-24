import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Simple hash function for password
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

// Static roles interface
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

// Static roles data
const staticRoles: Role[] = [
  { id: 'role_001', name: 'employee', display_name: 'Support Team', description: 'Regular employee', permissions: [], is_active: true, created_at: '', updated_at: '' },
  { id: 'role_002', name: 'admin', display_name: 'Admin', description: 'Administrator', permissions: [], is_active: true, created_at: '', updated_at: '' },
  { id: 'role_003', name: 'partner', display_name: 'Partner', description: 'External partner', permissions: [], is_active: true, created_at: '', updated_at: '' },
  { id: 'role_004', name: 'customer', display_name: 'Customer', description: 'Customer', permissions: [], is_active: true, created_at: '', updated_at: '' },
];

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mobile: '',
    first_name: '',
    last_name: '',
    gender: '',
    age: '',
    username: '',
    role: '',
    address: '',
    emergency_contact: '',
    employment_status: '',
    joining_date: '',
    designation: '',
    department: '',
    manager_name: '',
    work_phonenumber: '',
    pan_number: '',
    aadhar_number: '',
    customer_type: '',
    company_name: '',
    source: '',
    partner_id: '',
    communication_preferences: '',
    language_preference: '',
    notes: '',
    partner_type: '',
    license_id: '',
    license_expiring_date: '',
    gstin: '',
    state: '',
    pincode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [aadharError, setAadharError] = useState('');
  const [panError, setPanError] = useState('');
  const [gstinError, setGstinError] = useState('');
  const [roles] = useState<Role[]>(staticRoles);
  const [isLoadingRoles] = useState(false);
  const [partners, setPartners] = useState<Array<{ partner_id: number, user_id: number, first_name: string, last_name: string }>>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  
  // Designation options - only Employee and HR
  const [designationOptions, setDesignationOptions] = useState(['Support Team', 'HR']);
  
  // Department options
  const departmentOptions = ['HR', 'Support Team', 'Technical Consultant', 'Gap Analysis'];
  
  const [designationOpen, setDesignationOpen] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [languageComboboxOpen, setLanguageComboboxOpen] = useState(false);
  
  const navigate = useNavigate();

  // Helper function to format date from YYYY-MM-DD to dd/mm/yyyy
  const formatDateToDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to format date from dd/mm/yyyy to YYYY-MM-DD
  const formatDateToInput = (dateString: string): string => {
    if (!dateString) return '';
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    // If in dd/mm/yyyy format, convert to YYYY-MM-DD
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateString;
  };

  // Fetch partners if source is already set to "Referral" on component mount
  useEffect(() => {
    if (formData.source === 'Referral') {
      fetchPartners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleInputChange = (field: string, value: string) => {
    // Aadhar number validation
    if (field === 'aadhar_number') {
      // Remove any non-digit characters
      const cleanValue = value.replace(/\D/g, '');
      
      if (cleanValue.length > 0 && cleanValue.length !== 12) {
        setAadharError('Aadhar number must be exactly 12 digits');
      } else if (cleanValue.length === 12) {
        setAadharError('');
      } else {
        setAadharError('');
      }
      
      // Update form data with cleaned value
      setFormData(prev => ({ ...prev, [field]: cleanValue }));
      return; // Prevent double update
    }

    // PAN number validation (optional field - only validate if user enters something)
    if (field === 'pan_number') {
      // Convert to uppercase and remove any spaces
      const cleanValue = value.toUpperCase().replace(/\s/g, '');
      
      // Only show error if user has entered something but it's not 10 characters
      if (cleanValue.length > 0 && cleanValue.length !== 10) {
        setPanError('PAN number must be exactly 10 characters');
      } else {
        // Clear error if empty or valid (optional field)
        setPanError('');
      }
      
      // Update form data with cleaned value
      setFormData(prev => ({ ...prev, [field]: cleanValue }));
      return; // Prevent double update
    }

    // GSTIN validation (optional field - only validate if user enters something)
    if (field === 'gstin') {
      // Convert to uppercase and remove any spaces
      const cleanValue = value.toUpperCase().replace(/\s/g, '');
      
      // Only show error if user has entered something but it's not 15 characters
      if (cleanValue.length > 0 && cleanValue.length !== 15) {
        setGstinError('GSTIN must be exactly 15 characters');
      } else {
        // Clear error if empty or valid (optional field)
        setGstinError('');
      }
      
      // Update form data with cleaned value
      setFormData(prev => ({ ...prev, [field]: cleanValue }));
      return; // Prevent double update
    }

    setFormData(prev => ({ ...prev, [field]: value }));

    // Password validation
    if (field === 'password' && formData.role !== 'customer' ) {
      if (value.length > 0 && value.length < 6) {
        setPasswordError('Password must be at least 6 characters long');
      } else {
        setPasswordError('');
      }
    }

    // If source is changed to "Referral", fetch partners
    if (field === 'source' && value === 'Referral') {
      fetchPartners();
    }
    
    // If it's designation field and value is not empty, add to options if not already present
    if (field === 'designation' && value.trim() && !designationOptions.includes(value.trim())) {
      setDesignationOptions(prev => [...prev, value.trim()]);
    }
  };
  
  // Show all options - no filtering

  const fetchPartners = async () => {
    setIsLoadingPartners(true);
    try {
      const response = await fetch(buildApiUrl('support/getpartner'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result)) {
          setPartners(result);
        } else {
          console.error('Partners API returned unexpected format:', result);
          setPartners([]);
        }
      } else {
        console.error('Failed to fetch partners:', response.status);
        setPartners([]);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      setPartners([]);
    } finally {
      setIsLoadingPartners(false);
    }
  };

  const handleRegister = async () => {
    // Check required fields - password is only required for non-customer roles
    const isPasswordRequired = formData.role !== 'customer';
    // Mobile number is required for admin and customer roles
    const isMobileRequired = formData.role === 'admin' || formData.role === 'customer';
    // Username is auto-generated from email, so removed from required fields
    const requiredFields = [!formData.email, !formData.first_name, !formData.last_name, !formData.role];
    
    if (isPasswordRequired) {
      requiredFields.push(!formData.password);
    }
    
    // Add mobile number as required for admin and customer roles
    if (isMobileRequired) {
      requiredFields.push(!formData.mobile || formData.mobile.length !== 10);
    }
    
    // Add partner-specific required fields
    if (formData.role === 'partner') {
      requiredFields.push(!formData.partner_type, !formData.license_id, !formData.license_expiring_date);
    }
    
    // Add employee (Support Team) specific required fields
    if (formData.role === 'employee') {
      requiredFields.push(!formData.department, !formData.designation);
    }
    
    if (requiredFields.some(field => field)) {
      let errorMessage = "Please fill in all required fields";
      if (isMobileRequired && (!formData.mobile || formData.mobile.length !== 10)) {
        const roleText = formData.role === 'admin' ? 'admin' : 'customer';
        errorMessage = `Mobile number is required and must be 10 digits for ${roleText} role`;
      }
      if (formData.role === 'employee') {
        if (!formData.department || !formData.designation) {
          errorMessage = "Department and Designation are required fields for Support Team role";
        }
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    // Check password length validation only if password is required and provided
    if (isPasswordRequired && formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const hashedPassword = hashPassword(formData.password);
      console.log('Creating user with data:', formData);
      console.log('=== REGISTRATION ===');
      console.log('Original password:', formData.password);
      console.log('Hashed password:', hashedPassword);
      console.log('==================');

      // Get session details for headers
      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '';
      let jwtToken = '';

      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        sessionId = session.sessionId || '';
        jwtToken = session.jwtToken || '';
      }

      // Get user details for created_by and updated_by
      const userDetailsStr = localStorage.getItem('expertclaims_user_details');
      let currentUserId = 1; // Default fallback

      if (userDetailsStr) {
        const userDetails = JSON.parse(userDetailsStr);
        currentUserId = userDetails.userid || userDetails.id || 1;
      }

      // Auto-generate username from email (use email as username)
      const autoGeneratedUsername = formData.email || '';

      // Prepare API payload based on role
      let apiPayload: any = {
        username: autoGeneratedUsername,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        mobile_number: formData.mobile,
        password_hash: hashedPassword, // Use the hashed password
        role: formData.role,
        status: "active",
        two_factor_enabled: true,
        mobile_verified: true,
        email_verified: true,
        last_login: new Date().toISOString(),
        created_by: currentUserId,
        created_time: new Date().toISOString(),
        updated_by: currentUserId,
        updated_time: new Date().toISOString(),
        deleted_flag: false
      };

      // Add role-specific information
      if (formData.role === 'employee') {
        apiPayload.employee_information = {
          employment_status: formData.employment_status || "Active",
          joining_date: formData.joining_date || new Date().toISOString().split('T')[0],
          designation: formData.designation || "",
          department: formData.department || "",
          manager_name: formData.manager_name || "",
          work_phone_number: formData.work_phonenumber || "",
          pan_number: formData.pan_number || "",
          aadhar_number: formData.aadhar_number || ""
        };
      } else if (formData.role === 'customer') {
        apiPayload.customer_information = {
          customer_type: formData.customer_type || "Individual",
          source: formData.source || "Direct",
          communication_preferences: formData.communication_preferences || "Email",
          language_preference: formData.language_preference || "English",
          contact_number: formData.mobile || "",
          partner_id: formData.partner_id ,
          company_name: formData.company_name || "",
          notes: formData.notes || ""
        };
      }

      // Use the createuser API for all roles
      const apiUrl = buildApiUrl('admin/createuser');

      // Base request body structure matching the curl command
      let requestBody: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email_address: formData.email,
        password: hashedPassword,
        username: autoGeneratedUsername,
        role: formData.role,
        mobile_number: formData.mobile || "",
        emergency_contact: formData.emergency_contact || "",
        gender: formData.gender || "",
        age: formData.age ? parseInt(formData.age) : undefined,
        address: formData.address || ""
      };

      // Helper function to convert to lowercase with underscores
      const toSnakeCase = (value: string | undefined | null): string => {
        if (!value) return "";
        return value
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .replace(/[^a-z0-9_]/g, ''); // Remove special characters except underscores
      };

      // Add role-specific fields
      if (formData.role === 'employee') {
        requestBody = {
          ...requestBody,
          designation: toSnakeCase(formData.designation),
          department: toSnakeCase(formData.department),
          work_phone_number: formData.work_phonenumber || "",
          aadhar_number: formData.aadhar_number || "",
          manager_name: formData.manager_name || "",
          joining_date: formData.joining_date || new Date().toISOString().split('T')[0],
          employment_status: formData.employment_status || "permanent",
          pan_number: formData.pan_number || ""
        };
      } else if (formData.role === 'partner') {
        requestBody = {
          ...requestBody,
          partner_type: formData.partner_type,
          license_id: formData.license_id,
          license_expiring_date: formData.license_expiring_date,
          gstin: formData.gstin || "",
          pan: formData.pan_number || "",
          state: formData.state || "",
          pincode: formData.pincode || ""
        };
      } else if (formData.role === 'customer') {
        requestBody = {
          ...requestBody,
          customer_type: formData.customer_type || "Individual",
          source: formData.source || "Website",
          communication_preference: formData.communication_preferences || "Email",
          language_preference: formData.language_preference || "English",
          partner_id: formData.partner_id || null,
          notes: formData.notes || "",
          gstin: formData.gstin || "",
          pan: formData.pan_number || "",
          state: formData.state || "",
          pincode: formData.pincode || ""
        };
      }

      console.log('Calling create user API with payload:', requestBody);
      console.log('Using API endpoint:', apiUrl);
      console.log('=== REGISTRATION PAYLOAD ===');
      console.log('Password in payload:', hashedPassword);
      console.log('Full payload:', JSON.stringify(requestBody, null, 2));
      console.log('===========================');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
          'content-type': 'application/json',
          'jwt_token': jwtToken || '',
          'session_id': sessionId || ''
        },
        body: JSON.stringify(requestBody)
      });

      console.log('API Response status:', response.status);
      let responseBody: any = null;
      try { 
        responseBody = await response.json(); 
      } catch (e) { 
        responseBody = await response.text().catch(() => null); 
      }
      console.log('API Response body:', responseBody);

      if (response.ok) {
        toast({ 
          title: "Registration Successful", 
          description: "User created successfully" 
        });
        navigate('/admin-dashboard');
      } else {
        // Extract message from backend response
        let errorMessage = 'Failed to create user';
        
        if (responseBody) {
          // Handle array response (backend might return array with error object)
          if (Array.isArray(responseBody) && responseBody.length > 0) {
            errorMessage = responseBody[0].message || responseBody[0].error || errorMessage;
          } 
          // Handle object response
          else if (typeof responseBody === 'object' && responseBody.message) {
            errorMessage = responseBody.message;
          }
          // Handle string response
          else if (typeof responseBody === 'string') {
            errorMessage = responseBody;
          }
        }
        
        toast({ 
          title: "Error", 
          description: errorMessage, 
          variant: "destructive" 
        });
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
            <CardTitle className="text-2xl font-bold">Create New User</CardTitle>
            <Button
              variant="outline"
              onClick={() => navigate('/admin-dashboard?tab=users')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardHeader>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Fill in the details below to create a new user account.
          </CardDescription>
          <CardContent className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>

    

              <div>
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
                disabled={isLoadingRoles}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingRoles ? "Loading roles..." : "Select role"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingRoles ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">Loading roles...</div>
                  ) : (
                    staticRoles.map(role => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.display_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              </div>

              </div>

              {/* Username field hidden - auto-generated from email */}

              {formData.role !== 'customer' && (
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter password"
                    required
                    className={passwordError ? 'border-red-500' : ''}
                  />
                  {passwordError && (
                    <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mobile">Mobile Number{(formData.role === 'admin' || formData.role === 'customer') ? ' *' : ''}</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    placeholder="Enter mobile number"
                    maxLength={10}
                    minLength={10}
                    required={formData.role === 'admin' || formData.role === 'customer'}
                  />
                </div>

                <div>
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                    placeholder="Enter emergency contact"
                    maxLength={10}
                    minLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.age}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        handleInputChange('age', value);
                      }
                    }}
                    placeholder="Enter age"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter address"
                />
              </div>
            </div>

            {/* Employee Information Section - Only show when role is employee */}
            {formData.role === 'employee' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Support Team Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employment_status">Support Team Status</Label>
                    <Select value={formData.employment_status} onValueChange={(value) => handleInputChange('employment_status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Support Team status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="joining_date">Joining Date</Label>
                    <Input
                      id="joining_date"
                      type="date"
                      value={formData.joining_date}
                      onChange={(e) => handleInputChange('joining_date', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: dd/mm/yyyy</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="designation">Designation *</Label>
                    <div className="relative">
                      <Input
                        id="designation"
                        value={formData.designation}
                        onChange={(e) => {
                          handleInputChange('designation', e.target.value);
                        }}
                        onFocus={() => setDesignationOpen(true)}
                        onBlur={(e) => {
                          // Delay closing to allow click on dropdown item
                          setTimeout(() => setDesignationOpen(false), 200);
                        }}
                        placeholder="Select or type designation"
                        className="w-full pr-10"
                        required
                      />
                      <ChevronDown 
                        className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600"
                        onClick={() => setDesignationOpen(!designationOpen)}
                      />
                      {designationOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {designationOptions.map((option) => (
                            <div
                              key={option}
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleInputChange('designation', option);
                                setDesignationOpen(false);
                              }}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <div className="relative">
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => {
                          handleInputChange('department', e.target.value);
                        }}
                        onFocus={() => setDepartmentOpen(true)}
                        onBlur={(e) => {
                          // Delay closing to allow click on dropdown item
                          setTimeout(() => setDepartmentOpen(false), 200);
                        }}
                        placeholder="Select or type department"
                        className="w-full pr-10"
                        required
                      />
                      <ChevronDown 
                        className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600"
                        onClick={() => setDepartmentOpen(!departmentOpen)}
                      />
                      {departmentOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {departmentOptions.map((option) => (
                            <div
                              key={option}
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleInputChange('department', option);
                                setDepartmentOpen(false);
                              }}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manager_name">Manager Name</Label>
                    <Input
                      id="manager_name"
                      value={formData.manager_name}
                      onChange={(e) => handleInputChange('manager_name', e.target.value)}
                      placeholder="Enter manager name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="work_phonenumber">Work Phone Number</Label>
                    <Input
                      id="work_phonenumber"
                      value={formData.work_phonenumber}
                      maxLength={10}
                      minLength={10}
                      onChange={(e) => handleInputChange('work_phonenumber', e.target.value)}
                      placeholder="Enter work phone number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pan_number">PAN </Label>
                    <Input
                      id="pan_number"
                      value={formData.pan_number}
                      onChange={(e) => handleInputChange('pan_number', e.target.value)}
                      placeholder="Enter 10-character PAN number"
                      maxLength={10}
                      type="text"
                      style={{ textTransform: 'uppercase' }}
                    />
                    {panError && (
                      <p className="text-red-500 text-sm mt-1">{panError}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="aadhar_number">Aadhar Number</Label>
                    <Input
                      id="aadhar_number"
                      value={formData.aadhar_number}
                      onChange={(e) => handleInputChange('aadhar_number', e.target.value)}
                      placeholder="Enter 12-digit Aadhar number"
                      maxLength={12}
                      type="text"
                      inputMode="numeric"
                    />
                    {aadharError && (
                      <p className="text-red-500 text-sm mt-1">{aadharError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Customer Information Section - Only show when role is customer */}
            {formData.role === 'customer' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_type">Customer Type</Label>
                    <Select value={formData.customer_type} onValueChange={(value) => handleInputChange('customer_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="social-media">Social Media</SelectItem>
                        <SelectItem value="advertisement">Advertisement</SelectItem>
                        <SelectItem value="direct">Direct Contact</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.customer_type === 'corporate' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        placeholder="Enter company name"
                      />
                    </div>
                  </div>
                )}

                {/* Partner dropdown - only show when source is "Referral" */}
                {formData.source === 'Referral' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="partner_id">Partner</Label>
                      <Select
                        value={formData.partner_id}
                        onValueChange={(value) => handleInputChange('partner_id', value)}
                        disabled={isLoadingPartners}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingPartners ? "Loading partners..." : "Select partner"} />
                        </SelectTrigger>
                        <SelectContent>
                          {partners.map((partner) => (
                            <SelectItem key={partner.partner_id} value={partner.partner_id.toString()}>
                              {partner.first_name} {partner.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language_preference">Language Preference</Label>
                    <Popover open={languageComboboxOpen} onOpenChange={setLanguageComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={languageComboboxOpen}
                          className="w-full justify-between mt-1"
                        >
                          {formData.language_preference || "Select language or type to add new..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Search language or type new language name..." 
                            value={formData.language_preference}
                            onValueChange={(value) => handleInputChange('language_preference', value)}
                          />
                          <CommandList>
                            <CommandGroup>
                              {formData.language_preference && 
                               formData.language_preference.trim() !== '' && 
                               formData.language_preference.trim().toLowerCase() !== "telugu" &&
                               formData.language_preference.trim().toLowerCase() !== "english" &&
                               formData.language_preference.trim().toLowerCase() !== "hindi" &&
                               formData.language_preference.trim().toLowerCase() !== "kannada" &&
                               formData.language_preference.trim().toLowerCase() !== "tamil" && (
                                <CommandItem
                                  value={formData.language_preference}
                                  onSelect={() => {
                                    handleInputChange('language_preference', formData.language_preference);
                                    setLanguageComboboxOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      "opacity-100"
                                    )}
                                  />
                                  {formData.language_preference} 
                                </CommandItem>
                              )}
                              <CommandItem
                                value="Telugu"
                                onSelect={() => {
                                  handleInputChange('language_preference', "Telugu");
                                  setLanguageComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.language_preference?.trim().toLowerCase() === "telugu" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                Telugu
                              </CommandItem>
                              <CommandItem
                                value="English"
                                onSelect={() => {
                                  handleInputChange('language_preference', "English");
                                  setLanguageComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.language_preference?.trim().toLowerCase() === "english" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                English
                              </CommandItem>
                              <CommandItem
                                value="Hindi"
                                onSelect={() => {
                                  handleInputChange('language_preference', "Hindi");
                                  setLanguageComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.language_preference?.trim().toLowerCase() === "hindi" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                Hindi
                              </CommandItem>
                              <CommandItem
                                value="Kannada"
                                onSelect={() => {
                                  handleInputChange('language_preference', "Kannada");
                                  setLanguageComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.language_preference?.trim().toLowerCase() === "kannada" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                Kannada
                              </CommandItem>
                              <CommandItem
                                value="Tamil"
                                onSelect={() => {
                                  handleInputChange('language_preference', "Tamil");
                                  setLanguageComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.language_preference?.trim().toLowerCase() === "tamil" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                Tamil
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="communication_preferences">Communication Preferences</Label>
                    <Select value={formData.communication_preferences} onValueChange={(value) => handleInputChange('communication_preferences', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select communication preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="postal">Postal Mail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Enter any additional notes"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input
                      id="gstin"
                      value={formData.gstin}
                      onChange={(e) => handleInputChange('gstin', e.target.value)}
                      placeholder="Enter 15-character GSTIN"
                      maxLength={15}
                      style={{ textTransform: 'uppercase' }}
                    />
                    {gstinError && (
                      <p className="text-red-500 text-sm mt-1">{gstinError}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="pan_customer">PAN</Label>
                    <Input
                      id="pan_customer"
                      value={formData.pan_number}
                      onChange={(e) => handleInputChange('pan_number', e.target.value)}
                      placeholder="Enter 10-character PAN number"
                      maxLength={10}
                      style={{ textTransform: 'uppercase' }}
                    />
                    {panError && (
                      <p className="text-red-500 text-sm mt-1">{panError}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Enter state"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value) && value.length <= 6) {
                          handleInputChange('pincode', value);
                        }
                      }}
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Partner Information Section - Only show when role is partner */}
            {formData.role === 'partner' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Partner Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="partner_type">Partner Type *</Label>
                    <Select value={formData.partner_type} onValueChange={(value) => handleInputChange('partner_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select partner type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="broker">Broker</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="license_id">License ID *</Label>
                    <Input
                      id="license_id"
                      value={formData.license_id}
                      onChange={(e) => handleInputChange('license_id', e.target.value)}
                      placeholder="Enter license ID"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="license_expiring_date">License Expiring Date *</Label>
                    <Input
                      id="license_expiring_date"
                      type="date"
                      value={formData.license_expiring_date}
                      onChange={(e) => handleInputChange('license_expiring_date', e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: dd/mm/yyyy</p>
                  </div>

                  <div>
                    <Label htmlFor="gstin_partner">GSTIN</Label>
                    <Input
                      id="gstin_partner"
                      value={formData.gstin}
                      onChange={(e) => handleInputChange('gstin', e.target.value)}
                      placeholder="Enter 15-character GSTIN"
                      maxLength={15}
                      style={{ textTransform: 'uppercase' }}
                    />
                    {gstinError && (
                      <p className="text-red-500 text-sm mt-1">{gstinError}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pan_partner">PAN </Label>
                    <Input
                      id="pan_partner"
                      value={formData.pan_number}
                      onChange={(e) => handleInputChange('pan_number', e.target.value)}
                      placeholder="Enter 10-character PAN number"
                      maxLength={10}
                      style={{ textTransform: 'uppercase' }}
                    />
                    {panError && (
                      <p className="text-red-500 text-sm mt-1">{panError}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="state_partner">State</Label>
                    <Input
                      id="state_partner"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Enter state"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pincode_partner">Pincode</Label>
                    <Input
                      id="pincode_partner"
                      value={formData.pincode}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value) && value.length <= 6) {
                          handleInputChange('pincode', value);
                        }
                      }}
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                variant="outline"
                onClick={() => navigate('/admin-dashboard?tab=users')}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create User'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
