import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Save, Eye, EyeOff, Camera, Building2, CreditCard, Shield, Mail, Phone, MapPin, Calendar, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/config/api';

interface EmployeeData {
  // Non-editable fields
  username: string;
  email: string;
  role: string;
  employment_status: string;
  joining_date: string;
  designation: string;
  department: string;
  manager_name: string;

  // Editable fields
  first_name: string;
  last_name: string;
  mobile: string;
  gender: string;
  age: string;
  address: string;
  emergency_contact: string;
  work_phonenumber: string;
  work_extension: string;
  office_location: string;
  pan_number: string;
  aadhar_number: string;
  communication_preferences: string;
  language_preference: string;
  notes: string;

  // Emergency contact details
  emergency_contact_name: string;
  emergency_contact_relation: string;

  // Bank details
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;

  // Profile image
  profile_image: string;

  // Additional fields from API
  employee_id?: number;
  user_id?: number;
  manager_id?: number | null;
  profile_picture_url?: string;
  work_mobile?: string;
  created_by?: number;
  updated_by?: number;
}

const EmployeePersonalInfo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [dataLoading, setDataLoading] = useState(true);

  // Mock employee data - in real app, this would come from API
  const [formData, setFormData] = useState<EmployeeData>({
    // Non-editable fields
    username: 'john.smith',
    email: 'john.smith@company.com',
    role: 'Employee',
    employment_status: 'Full-time',
    joining_date: '2023-01-15',
    designation: 'Claims Processor',
    department: 'Claims Department',
    manager_name: 'Sarah Johnson',

    // Editable fields
    first_name: 'John',
    last_name: 'Smith',
    mobile: '+91 9876543210',
    gender: 'Male',
    age: '28',
    address: '123 Main Street, Bangalore, Karnataka 560001',
    emergency_contact: '+91 9876543211',
    work_phonenumber: '+91 9876543212',
    work_extension: '101',
    office_location: 'Bangalore Office',
    pan_number: 'ABCDE1234F',
    aadhar_number: '123456789012',
    communication_preferences: 'Email',
    language_preference: 'English',
    notes: 'Prefer email communication for work updates',

    // Emergency contact details
    emergency_contact_name: 'Emergency Contact',
    emergency_contact_relation: 'Emergency',

    // Bank details
    bank_name: 'HDFC Bank',
    account_number: '1234567890',
    ifsc_code: 'HDFC0001234',
    account_holder_name: 'John Smith',

    // Profile image
    profile_image: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    // Load employee data from API
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    setDataLoading(true);
    try {
      // Get user details from localStorage
      const userDetailsStr = localStorage.getItem('expertclaims_user_details');
      if (!userDetailsStr) {
        toast({
          title: "Error",
          description: "User details not found. Please login again.",
          variant: "destructive",
        });
        return;
      }

      const userDetails = JSON.parse(userDetailsStr);
      const userId = userDetails.userid || userDetails.id;

      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not found. Please login again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetching employee data for user:', userId);

      // Get session details for headers
      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '';
      let jwtToken = '';

      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          sessionId = session.sessionId || '';
          jwtToken = session.jwtToken || '';
        } catch (e) {
          console.error('Error parsing session:', e);
        }
      }

      if (!sessionId || !jwtToken) {
        toast({
          title: "Error",
          description: "Please log in to view employee data",
          variant: "destructive",
        });
        setDataLoading(false);
        return;
      }

      const response = await fetch(`${buildApiUrl('admin/getuserbyid')}?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken,
          ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` })
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch employee data: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle response format from getuserbyid endpoint
      // Response structure: { user_id, username, email, role, employees: {...}, ... }
      const userData = result || {};
      const employeeData = userData.employees || {};

      if (employeeData || userData.user_id) {
        // Format address if it's an object
        let addressString = '';
        if (employeeData.address) {
          if (typeof employeeData.address === 'object') {
            addressString = `${employeeData.address.street || ''}, ${employeeData.address.city || ''}, ${employeeData.address.state || ''} ${employeeData.address.pincode || ''}`.trim();
          } else {
            addressString = employeeData.address;
          }
        }

        setFormData({
          username: userData.username || '',
          email: userData.email || '',
          role: userData.role || 'Employee',
          employment_status: employeeData.employment_status || 'probation',
          joining_date: employeeData.joining_date || '',
          designation: employeeData.designation || '',
          department: employeeData.department || '',
          manager_name: employeeData.manager || '',

          // Editable fields from API
          first_name: employeeData.first_name || '',
          last_name: employeeData.last_name || '',
          mobile: employeeData.mobile_number || employeeData.work_mobile || '',
          gender: employeeData.gender || '',
          age: employeeData.age ? String(employeeData.age) : '',
          address: addressString || '',
          emergency_contact: employeeData.emergency_contact?.phone || (typeof employeeData.emergency_contact === 'string' ? employeeData.emergency_contact : ''),
          work_phonenumber: employeeData.work_phone || '',
          work_extension: employeeData.work_extension || '',
          office_location: employeeData.office_location || '',
          pan_number: employeeData.pan_number || '',
          aadhar_number: employeeData.aadhar_number ? String(employeeData.aadhar_number) : '',
          communication_preferences: employeeData.communication_preference || 'Email',
          language_preference: 'English',
          notes: employeeData.additional_notes || '',

          // Emergency contact details from API
          emergency_contact_name: employeeData.emergency_contact?.name || employeeData.emergency_contact_name || '',
          emergency_contact_relation: employeeData.emergency_contact?.relation || employeeData.emergency_contact_relation || '',

          // Bank details from API
          bank_name: employeeData.bank_details?.bank_name || (typeof employeeData.bank_details === 'string' ? '' : ''),
          account_number: employeeData.bank_details?.account_number || '',
          ifsc_code: employeeData.bank_details?.ifsc || employeeData.bank_details?.ifsc_code || '',
          account_holder_name: `${employeeData.first_name || ''} ${employeeData.last_name || ''}`.trim() || '',

          // Profile image from API
          profile_image: employeeData.profile_picture_url || '',

          // Additional fields from API
          employee_id: employeeData.employee_id,
          user_id: userData.user_id || employeeData.user_id,
          manager_id: employeeData.manager_id || employeeData.reports_to,
          profile_picture_url: employeeData.profile_picture_url,
          work_mobile: employeeData.mobile_number || employeeData.work_mobile,
          created_by: employeeData.created_by,
          updated_by: employeeData.updated_by
        });

        // Set profile image if available
        if (employeeData.profile_picture_url) {
          setPreviewImage(employeeData.profile_picture_url);
        }
      }
      else {
        console.error('Failed to fetch employee data:', response.status);
        toast({
          title: "Error",
          description: "Failed to fetch employee data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employee data",
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      // Get user details from localStorage
      const userDetailsStr = localStorage.getItem('expertclaims_user_details');
      if (!userDetailsStr) {
        toast({
          title: "Error",
          description: "User details not found. Please login again.",
          variant: "destructive",
        });
        return;
      }

      const userDetails = JSON.parse(userDetailsStr);
      const userId = userDetails.userid || userDetails.id;

      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not found. Please login again.",
          variant: "destructive",
        });
        return;
      }

      // Get session details for headers
      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '';
      let jwtToken = '';

      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        sessionId = session.sessionId || '';
        jwtToken = session.jwtToken || '';
      }

             const apiPayload = {
         employee_id: formData.employee_id || parseInt(userId.toString()),
         user_id: parseInt(userId.toString()),
         first_name: formData.first_name,
         last_name: formData.last_name,
         department: formData.department,
         designation: formData.designation,
         manager_id: formData.manager_id || null,
         joining_date: formData.joining_date,
         employment_status: formData.employment_status.toLowerCase(),
         profile_picture_url: formData.profile_image || formData.profile_picture_url || "",
         work_phone: formData.work_phonenumber,
         work_extension: formData.work_extension,
         work_mobile: formData.mobile,
         office_location: formData.office_location,
         address: {
           street: formData.address.split(',')[0] || formData.address,
           city: formData.address.split(',')[1]?.trim() || "",
           state: formData.address.split(',')[2]?.trim() || "",
           pincode: formData.address.split(',')[3]?.trim() || ""
         },
         emergency_contact: {
           name: formData.emergency_contact_name,
           relation: formData.emergency_contact_relation,
           phone: formData.emergency_contact
         },
         bank_details: {
           bank_name: formData.bank_name,
           account_number: formData.account_number,
           ifsc: formData.ifsc_code
         },
         pan_number: formData.pan_number,
         aadhar_number: formData.aadhar_number,
         created_by: formData.created_by || parseInt(userId.toString()),
         updated_by: parseInt(userId.toString()),
         approved_by: parseInt(userId.toString()),
         approved_date: new Date().toISOString()
       };

      if (!sessionId || !jwtToken) {
        toast({
          title: "Error",
          description: "Please log in to update employee data",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Transform payload to match backend endpoint format
      const updatePayload = {
        user_id: parseInt(userId.toString()),
        first_name: formData.first_name,
        last_name: formData.last_name,
        mobile_number: formData.mobile,
        designation: formData.designation,
        department: formData.department,
        work_phone_number: formData.work_phonenumber,
        address: formData.address,
        pan: formData.pan_number,
        aadhar_number: formData.aadhar_number,
        joining_date: formData.joining_date,
        employment_status: formData.employment_status.toLowerCase(),
        emergency_contact: formData.emergency_contact,
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age) : null
      };

      console.log('Calling updateuser API with payload:', updatePayload);

      const response = await fetch(buildApiUrl('admin/updateuser'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken,
          ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` })
        },
        body: JSON.stringify(updatePayload)
      });

      if (response.status === 200) {
        const result = await response.json();

        toast({
          title: "Success",
          description: "Personal information updated successfully",
        });

        setIsEditing(false);
      } else {
        const errorResult = await response.json().catch(() => ({}));
        console.error('Employee update failed:', errorResult);

        toast({
          title: "Error",
          description: errorResult.message || "Failed to update personal information",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Error",
        description: "Failed to update personal information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get user details from localStorage
      const userDetailsStr = localStorage.getItem('expertclaims_user_details');
      if (!userDetailsStr) {
        toast({
          title: "Error",
          description: "User details not found. Please login again.",
          variant: "destructive",
        });
        return;
      }

      const userDetails = JSON.parse(userDetailsStr);
      const userId = userDetails.userid || userDetails.id;

      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not found. Please login again.",
          variant: "destructive",
        });
        return;
      }

      // Get session details for headers
      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '';
      let jwtToken = '';

      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        sessionId = session.sessionId || '';
        jwtToken = session.jwtToken || '';
      }

      if (!sessionId || !jwtToken) {
        toast({
          title: "Error",
          description: "Please log in to update password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Call password update API
      console.log('Updating password for user:', userId);

      // Note: Using updateuser endpoint with password fields
      // If there's a dedicated password endpoint, it should be used instead
      const response = await fetch(buildApiUrl('admin/updateuser'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken,
          ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` })
        },
        body: JSON.stringify({
          user_id: parseInt(userId.toString()),
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });

      if (response.status === 200) {
        const result = await response.json();
        console.log('Password update result:', result);

        toast({
          title: "Success",
          description: "Password updated successfully",
        });

        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        const errorResult = await response.json().catch(() => ({}));
        console.error('Password update failed:', errorResult);

        toast({
          title: "Error",
          description: errorResult.message || "Failed to update password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Professional Header */}
      <header className="bg-primary-500 backdrop-blur-md shadow-sm border-b border-primary-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={() => navigate('/employee-dashboard')} className="bg-white text-blue-700 hover:bg-white/90 rounded-lg">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-md">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Personal Information
                  </h1>
                  <p className="text-sm text-white/80 font-medium">Manage your profile and account settings</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {dataLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 font-medium">Loading employee data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Professional Profile Section */}
            <div className="xl:col-span-1">
              <Card className="border border-gray-200 shadow-lg bg-white">
                <CardHeader className="text-center pb-6 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-t-lg">
                  <CardTitle className="flex items-center justify-center space-x-2 text-lg text-gray-900">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>Employee Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Professional Profile Image */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-white">
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover ring-4 ring-white"
                          />
                        ) : (
                          formData.first_name.charAt(0) + formData.last_name.charAt(0)
                        )}
                      </div>
                      {isEditing && (
                        <label className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-50 transition-all duration-200 border border-gray-200">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                          <Camera className="h-4 w-4 text-blue-600" />
                        </label>
                      )}
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {formData.first_name} {formData.last_name}
                      </h3>
                      <p className="text-sm font-medium text-blue-600">{formData.designation}</p>
                      <p className="text-xs text-gray-500">{formData.department}</p>
                      <Badge variant="outline" className="mt-2 border-blue-200 text-blue-700 bg-blue-50">
                        {formData.employment_status}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Professional Quick Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-blue-100 rounded-md">
                          <User className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Employee ID</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formData.username}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-green-100 rounded-md">
                          <Calendar className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Joined</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formData.joining_date}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-purple-100 rounded-md">
                          <Briefcase className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Manager</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formData.manager_name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Form */}
            <div className="xl:col-span-3 space-y-6">
              {/* Professional Personal Information */}
              <Card className="border border-gray-200 shadow-lg bg-white">
                <CardHeader className="pb-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-gray-900">Personal Information</CardTitle>
                        <CardDescription className="text-gray-600">
                          Update your personal details and contact information
                        </CardDescription>
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          disabled={isLoading}
                          className="px-4 py-2 rounded-lg transition-all duration-200"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={isLoading}
                          className="px-4 py-2 rounded-lg transition-all duration-200"
                        >
                          Save Changes
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setIsEditing(true)}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg transition-all duration-200"
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Non-editable fields */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-gray-600" />
                      <span>System Information (Read-only)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Username</span>
                        </Label>
                        <Input
                          value={formData.username}
                          disabled
                          className="bg-gray-50 border-gray-200 text-gray-700 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>Email Address</span>
                        </Label>
                        <Input
                          value={formData.email}
                          disabled
                          className="bg-gray-50 border-gray-200 text-gray-700 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>Role</span>
                        </Label>
                        <Input
                          value={formData.role}
                          disabled
                          className="bg-gray-50 border-gray-200 text-gray-700 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <Briefcase className="h-4 w-4" />
                          <span>Employment Status</span>
                        </Label>
                        <Input
                          value={formData.employment_status}
                          disabled
                          className="bg-gray-50 border-gray-200 text-gray-700 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Joining Date</span>
                        </Label>
                        <Input
                          value={formData.joining_date}
                          disabled
                          className="bg-gray-50 border-gray-200 text-gray-700 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <Briefcase className="h-4 w-4" />
                          <span>Designation</span>
                        </Label>
                        <Input
                          value={formData.designation}
                          disabled
                          className="bg-gray-50 border-gray-200 text-gray-700 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <Building2 className="h-4 w-4" />
                          <span>Department</span>
                        </Label>
                        <Input
                          value={formData.department}
                          disabled
                          className="bg-gray-50 border-gray-200 text-gray-700 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Manager Name</span>
                        </Label>
                        <Input
                          value={formData.manager_name}
                          disabled
                          className="bg-gray-50 border-gray-200 text-gray-700 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Editable fields */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <span>Personal Details</span>
                    </h3>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>First Name *</span>
                        </Label>
                        <Input
                          value={formData.first_name}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          disabled={!isEditing}
                          className="transition-all duration-300"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Last Name *</span>
                        </Label>
                        <Input
                          value={formData.last_name}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          disabled={!isEditing}
                          className="transition-all duration-300"
                          placeholder="Enter last name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Gender</span>
                        </Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => handleInputChange('gender', value)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger className="transition-all duration-300">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Age</span>
                        </Label>
                        <Input
                          value={formData.age}
                          onChange={(e) => handleInputChange('age', e.target.value)}
                          disabled={!isEditing}
                          type="number"
                          className="transition-all duration-300"
                          placeholder="Enter age"
                        />
                      </div>
                    </div>

                    {/* Contact Information */}
                    <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span>Contact Information</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>Mobile Number *</span>
                        </Label>
                        <Input
                          value={formData.mobile}
                          onChange={(e) => handleInputChange('mobile', e.target.value)}
                          disabled={!isEditing}
                          className="transition-all duration-300"
                          placeholder="+91 9876543210"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>Work Phone</span>
                        </Label>
                        <Input
                          value={formData.work_phonenumber}
                          onChange={(e) => handleInputChange('work_phonenumber', e.target.value)}
                          disabled={!isEditing}
                          className="transition-all duration-300"
                          placeholder="+91 9876543212"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>Work Extension</span>
                        </Label>
                        <Input
                          value={formData.work_extension}
                          onChange={(e) => handleInputChange('work_extension', e.target.value)}
                          disabled={!isEditing}
                          className="transition-all duration-300"
                          placeholder="101"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <Building2 className="h-4 w-4" />
                          <span>Office Location</span>
                        </Label>
                        <Input
                          value={formData.office_location}
                          onChange={(e) => handleInputChange('office_location', e.target.value)}
                          disabled={!isEditing}
                          className="transition-all duration-300"
                          placeholder="Bangalore Office"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>Emergency Contact</span>
                        </Label>
                        <Input
                          value={formData.emergency_contact}
                          onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                          disabled={!isEditing}
                          className="transition-all duration-300"
                          placeholder="+91 9876543211"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Emergency Contact Name</span>
                        </Label>
                        <Input
                          value={formData.emergency_contact_name}
                          onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                          disabled={!isEditing}
                          className="transition-all duration-300"
                          placeholder="Emergency Contact"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Emergency Contact Relation</span>
                        </Label>
                        <Input
                          value={formData.emergency_contact_relation}
                          onChange={(e) => handleInputChange('emergency_contact_relation', e.target.value)}
                          disabled={!isEditing}
                          className="transition-all duration-300"
                          placeholder="Emergency"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="mb-6">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2 mb-2">
                        <MapPin className="h-4 w-4" />
                        <span>Address</span>
                      </Label>
                      <Textarea
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={!isEditing}
                        rows={3}
                        className="transition-all duration-300"
                        placeholder="Enter your complete address..."
                      />
                    </div>

                    {/* Document Information */}
                    <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span>Document Information</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">PAN </Label>
                        <Input
                          value={formData.pan_number}
                          onChange={(e) => handleInputChange('pan_number', e.target.value)}
                          disabled={!isEditing}
                          className="transition-all duration-300"
                          placeholder="ABCDE1234F"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Aadhar Number</Label>
                        <Input
                          value={formData.aadhar_number}
                          onChange={(e) => handleInputChange('aadhar_number', e.target.value)}
                          disabled={!isEditing}
                          className="transition-all duration-300"
                          placeholder="123456789012"
                        />
                      </div>
                    </div>

                    {/* Preferences */}
                    <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span>Communication Preferences</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Communication Preference</Label>
                        <Select
                          value={formData.communication_preferences}
                          onValueChange={(value) => handleInputChange('communication_preferences', value)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger className="transition-all duration-300">
                            <SelectValue placeholder="Select preference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="SMS">SMS</SelectItem>
                            <SelectItem value="Phone">Phone</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                      <Label className="text-sm font-semibold text-gray-700 mb-2">Additional Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        disabled={!isEditing}
                        rows={3}
                        className="transition-all duration-300"
                        placeholder="Any additional notes or preferences..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Bank Details */}
              <Card className="border border-gray-200 shadow-lg bg-white">
                <CardHeader className="pb-6 bg-gradient-to-br from-gray-50 to-green-50/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-green-600 to-green-700 rounded-lg">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">Bank Details</CardTitle>
                      <CardDescription className="text-gray-600">
                        Update your bank account information for salary deposits
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <span>Bank Name</span>
                      </Label>
                      <Input
                        value={formData.bank_name}
                        onChange={(e) => handleInputChange('bank_name', e.target.value)}
                        disabled={!isEditing}
                        className="transition-all duration-300"
                        placeholder="e.g., HDFC Bank"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Account Number</span>
                      </Label>
                      <Input
                        value={formData.account_number}
                        onChange={(e) => handleInputChange('account_number', e.target.value)}
                        disabled={!isEditing}
                        className="transition-all duration-300"
                        placeholder="e.g., 1234567890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>IFSC Code</span>
                      </Label>
                      <Input
                        value={formData.ifsc_code}
                        onChange={(e) => handleInputChange('ifsc_code', e.target.value)}
                        disabled={!isEditing}
                        className="transition-all duration-300"
                        placeholder="e.g., HDFC0001234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Account Holder Name</span>
                      </Label>
                      <Input
                        value={formData.account_holder_name}
                        onChange={(e) => handleInputChange('account_holder_name', e.target.value)}
                        disabled={!isEditing}
                        className="transition-all duration-300"
                        placeholder="e.g., John Smith"
                      />
                    </div>
                  </div>
                  
                  
                </CardContent>
              </Card>

              {/* Professional Password Update */}
              <Card className="border border-gray-200 shadow-lg bg-white">
                <CardHeader className="pb-6 bg-gradient-to-br from-gray-50 to-red-50/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg">
                      <Lock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">Update Password</CardTitle>
                      <CardDescription className="text-gray-600">
                        Change your account password securely
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <Lock className="h-4 w-4" />
                        <span>Current Password</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={passwordData.current_password}
                          onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                          placeholder="Enter current password"
                          className="transition-all duration-300 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <Lock className="h-4 w-4" />
                        <span>New Password</span>
                      </Label>
                      <Input
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                        placeholder="Enter new password"
                        className="transition-all duration-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span>Confirm New Password</span>
                    </Label>
                    <Input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                      placeholder="Confirm new password"
                      className="transition-all duration-300"
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handlePasswordUpdate}
                      disabled={isLoading || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200"
                    >
                      <Lock className="h-4 w-4" />
                      <span>Update Password</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePersonalInfo;
