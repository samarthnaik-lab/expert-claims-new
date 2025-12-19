import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { UserService, NewUserData } from '@/services/userService';

// Simple hash function for password (same as Login.tsx)
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

const EditRegister = () => {
  const navigate = useNavigate();
  const { userId } = useParams();

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
    status: 'active', // User status: active, inactive, suspended
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
    gstin: '',
    state: '',
    pincode: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userData, setUserData] = useState<NewUserData | null>(null);
  const [aadharError, setAadharError] = useState('');
  const [panError, setPanError] = useState('');
  const [partners, setPartners] = useState<Array<{ 
    partner_id: number, 
    user_id: number, 
    first_name: string, 
    last_name: string,
    age?: number,
    gender?: string,
    address?: string,
    mobile_number?: string,
    emergency_contact?: string,
    created_at?: string,
    updated_at?: string
  }>>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  
  // Designation options
  const [designationOptions] = useState(['Support Team', 'HR']);
  
  // Department options
  const departmentOptions = ['HR', 'Support Team', 'Technical Consultant', 'Gap Analysis'];
  
  const [designationOpen, setDesignationOpen] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserData(parseInt(userId));
      
      // Send edit action with parameters
      sendEditAction(parseInt(userId));
    }
  }, [userId]);

  // Function to send edit action with id and type parameters
  const sendEditAction = async (userId: number) => {
    try {
      console.log('Sending edit action for user ID:', userId);
      
      // Get session details for headers
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
      
      // Use fallback values if session not available
      sessionId = sessionId || 'c6c38c28-12e6-4b1b-bab6-40ae19b875f3';
      jwtToken = jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiAiLCJwYXNzd29yZCI6IiIsImlhdCI6MTc2MjQwODE3Nn0.vig73fEH3VtORKHtBPy0yLVp6dZdf9TglaXWhfpWnIU';
      
      const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws';
      
      // Build URL with query parameters
      const params = new URLSearchParams({
        id: userId.toString(),
        type: 'edit'
      });
      
      const url = `http://localhost:3000/admin/getusers?${params.toString()}`;
      
      console.log('Calling getusers API with URL:', url);
      console.log('Query parameters:', { id: userId, type: 'edit' });
      
      // Send GET request with query parameters
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'accept-profile': 'srtms',
          'apikey': API_KEY,
          'authorization': `Bearer ${API_KEY}`,
          'content-type': 'application/json',
          'jwt_token': jwtToken,
          'prefer': 'count=exact',
          'range': '0-100',
          'session_id': sessionId
        }
      });
      
      if (response.ok) {
        console.log('Edit action sent successfully');
        const result = await response.json();
        console.log('API response:', result);
      } else {
        const errorText = await response.text();
        console.error('Failed to send edit action:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error sending edit action:', error);
    }
  };

  // Fetch partners when source changes to "Referral"
  useEffect(() => {
    if (formData.source === 'Referral') {
      fetchPartners();
    }
  }, [formData.source]);

  const fetchPartners = async () => {
    setIsLoadingPartners(true);
    try {
      const response = await fetch('http://localhost:3000/support/getpartner', {
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

  const fetchUserData = async (id: number) => {
    setIsLoadingUser(true);
    try {
      // Get session details for headers
      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '';
      let jwtToken = '';

      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        sessionId = session.sessionId || '';
        jwtToken = session.jwtToken || '';
      }

      // Use fallback values if session not available
      sessionId = sessionId || 'efd005c8-d9a1-4cfa-adeb-1ca2a7f13775';
      jwtToken = jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k';

      console.log('Fetching user data for ID:', id);
      const fetchedUserData = await UserService.getUserById(id.toString(), sessionId, jwtToken);

      if (fetchedUserData) {
        setUserData(fetchedUserData);

        // Extract role-specific data and populate form
        let firstName = '';
        let lastName = '';
        let age = '';
        let gender = '';
        let address = '';
        let mobileNumber = '';
        let emergencyContact = '';
        let customerType = '';
        let companyName = '';
        let source = '';
        let notes = '';
        let languagePreference = '';
        let communicationPreferences = '';
        let gstin = '';
        let panNumber = '';
        let state = '';
        let pincode = '';

        if (fetchedUserData.role === 'employee' && fetchedUserData.employees) {
          firstName = fetchedUserData.employees.first_name || '';
          lastName = fetchedUserData.employees.last_name || '';
          age = fetchedUserData.employees.age?.toString() || '';
          gender = fetchedUserData.employees.gender || '';
          address = fetchedUserData.employees.address || '';
          mobileNumber = fetchedUserData.employees.mobile_number || '';
          emergencyContact = fetchedUserData.employees.emergency_contact || '';
        } else if (fetchedUserData.role === 'partner' && fetchedUserData.partners) {
          firstName = fetchedUserData.partners.first_name || '';
          lastName = fetchedUserData.partners.last_name || '';
          age = fetchedUserData.partners.age?.toString() || '';
          gender = fetchedUserData.partners.gender || '';
          address = fetchedUserData.partners.address || '';
          mobileNumber = fetchedUserData.partners.mobile_number || '';
          emergencyContact = fetchedUserData.partners.emergency_contact || '';
        }
        
        // Extract GSTIN, PAN, State, Pincode for partner role
        if (fetchedUserData.role === 'partner' && fetchedUserData.partners) {
          gstin = (fetchedUserData.partners as any).gstin || '';
          panNumber = (fetchedUserData.partners as any).pan_number || '';
          state = (fetchedUserData.partners as any).state || '';
          pincode = (fetchedUserData.partners as any).pincode || '';
        } else if (fetchedUserData.role === 'customer' && fetchedUserData.customers) {
          firstName = fetchedUserData.customers.first_name || '';
          lastName = fetchedUserData.customers.last_name || '';
          age = fetchedUserData.customers.age?.toString() || '';
          gender = fetchedUserData.customers.gender || '';
          address = fetchedUserData.customers.address || '';
          mobileNumber = fetchedUserData.customers.mobile_number || '';
          emergencyContact = fetchedUserData.customers.emergency_contact || '';
          customerType = fetchedUserData.customers.customer_type || '';
          companyName = fetchedUserData.customers.company_name || '';
          source = fetchedUserData.customers.source || '';
          notes = fetchedUserData.customers.notes || '';
          languagePreference = fetchedUserData.customers.language_preference || '';
          communicationPreferences = fetchedUserData.customers.communication_preferences || '';
          // Extract GSTIN, PAN, State, Pincode for customer role
          gstin = (fetchedUserData.customers as any).gstin || '';
          panNumber = (fetchedUserData.customers as any).pan_number || '';
          state = (fetchedUserData.customers as any).state || '';
          pincode = (fetchedUserData.customers as any).pincode || '';
        } else if (fetchedUserData.role === 'admin' && fetchedUserData.admin) {
          firstName = fetchedUserData.admin.first_name || '';
          lastName = fetchedUserData.admin.last_name || '';
          age = fetchedUserData.admin.age?.toString() || '';
          gender = fetchedUserData.admin.gender || '';
          address = fetchedUserData.admin.address || '';
          mobileNumber = fetchedUserData.admin.mobile_number || '';
          emergencyContact = fetchedUserData.admin.emergency_contact || '';
        }

        // Debug: Log employee data to check designation and department
        if (fetchedUserData.role === 'employee' && fetchedUserData.employees) {
          console.log('Employee data:', fetchedUserData.employees);
          console.log('Designation from API:', fetchedUserData.employees.designation);
          console.log('Department from API:', fetchedUserData.employees.department);
        }

        setFormData({
          email: fetchedUserData.email || '',
          password: '', // Don't populate password for security
          mobile: mobileNumber,
          first_name: firstName,
          last_name: lastName,
          gender: gender,
          age: age,
          username: fetchedUserData.username || '',
          role: fetchedUserData.role || '',
          status: (fetchedUserData as any).status || 'active', // Get status from API, default to 'active'
          address: address,
          emergency_contact: emergencyContact,
          employment_status: fetchedUserData.role === 'employee' ? fetchedUserData.employees?.employment_status || '' : '',
          joining_date: fetchedUserData.role === 'employee' ? fetchedUserData.employees?.joining_date || '' : '',
          designation: fetchedUserData.role === 'employee' ? (fetchedUserData.employees?.designation || '') : (fetchedUserData.role === 'admin' ? (fetchedUserData.admin?.designation || '') : ''),
          department: fetchedUserData.role === 'employee' ? (fetchedUserData.employees?.department || '') : (fetchedUserData.role === 'admin' ? (fetchedUserData.admin?.department || '') : ''),
          manager_name: fetchedUserData.role === 'employee' ? fetchedUserData.employees?.manager || '' : '',
          work_phonenumber: fetchedUserData.role === 'employee' ? fetchedUserData.employees?.work_phone || '' : '',
          pan_number: fetchedUserData.role === 'employee' ? fetchedUserData.employees?.pan_number || '' : 
                     (fetchedUserData.role === 'admin' ? fetchedUserData.admin?.pan_number || '' : 
                     (fetchedUserData.role === 'customer' || fetchedUserData.role === 'partner' ? panNumber : '')),
          aadhar_number: fetchedUserData.role === 'employee' ? fetchedUserData.employees?.aadhar_number || '' : (fetchedUserData.role === 'admin' ? fetchedUserData.admin?.aadhar_number || '' : ''),
          customer_type: customerType,
          company_name: companyName,
          source: source,
          partner_id: fetchedUserData.role === 'partner' ? (fetchedUserData.partners?.partner_id?.toString() || '') : 
                     (fetchedUserData.role === 'customer' ? (fetchedUserData.customers?.partner_id?.toString() || '') : ''),
          communication_preferences: communicationPreferences,
          language_preference: languagePreference,
          notes: notes,
          gstin: gstin,
          state: state,
          pincode: pincode
        });
      } else {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive",
        });
        navigate('/admin-dashboard');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
      navigate('/admin-dashboard');
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Function to get selected partner details for display
  const getSelectedPartnerInfo = (): { 
    partner_id: number, 
    user_id: number, 
    first_name: string, 
    last_name: string,
    age?: number,
    gender?: string,
    address?: string,
    mobile_number?: string,
    emergency_contact?: string,
    created_at?: string,
    updated_at?: string
  } | null => {
    if (!formData.partner_id) return null;
    
    // First try to get from userData.customers.partner (for customers with referral source)
    if (userData?.role === 'customer' && userData.customers?.partner) {
      const partnerId = parseInt(formData.partner_id);
      if (userData.customers.partner.partner_id === partnerId) {
        return userData.customers.partner;
      }
    }
    
    // Fallback to partners list from getpartner API
    const partnerId = parseInt(formData.partner_id);
    return partners.find(partner => partner.partner_id === partnerId) || null;
  };

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

    // PAN number validation
    if (field === 'pan_number') {
      // Convert to uppercase and remove any spaces
      const cleanValue = value.toUpperCase().replace(/\s/g, '');
      
      if (cleanValue.length > 0 && cleanValue.length !== 10) {
        setPanError('PAN number must be exactly 10 characters');
      } else if (cleanValue.length === 10) {
        setPanError('');
      } else {
        setPanError('');
      }
      
      // Update form data with cleaned value
      setFormData(prev => ({ ...prev, [field]: cleanValue }));
      return; // Prevent double update
    }

    setFormData(prev => ({ ...prev, [field]: value }));

    // If source is changed to "Referral", fetch partners
    if (field === 'source' && value === 'Referral') {
      fetchPartners();
    }
  };

  const handleUpdateUser = async () => {
    if (!formData.email || !formData.first_name || !formData.last_name || !formData.username || !formData.role) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Updating user with data:', formData);

      // Get session details for headers
      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '';
      let jwtToken = '';

      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        sessionId = session.sessionId || '';
        jwtToken = session.jwtToken || '';
      }

      // Use fallback values if session not available
      sessionId = sessionId || 'fddc661a-dfb4-4896-b7b1-448e1adf7bc2';
      jwtToken = jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k';

      let response;

      if (formData.role === 'partner') {
        // Hash password if provided
        const hashedPassword = formData.password ? hashPassword(formData.password) : '';
        
        // Call updateempuser API for partner role
        const partnerPayload = {
          user_id: parseInt(userId || '0'),
          first_name: formData.first_name,
          last_name: formData.last_name,
          email_address: formData.email,
          password: hashedPassword, // Send hashed password or empty string if no password change
          username: formData.username,
          role: formData.role,
          status: formData.status || 'active', // Include user status
          mobile_number: formData.mobile,
          emergency_contact: formData.emergency_contact,
          gender: formData.gender,
          age: (parseInt(formData.age) || 0).toString(),
          address: formData.address,
          partner: {
            partner_id: formData.partner_id,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email_address: formData.email,
            mobile_number: formData.mobile,
            emergency_contact: formData.emergency_contact,
            gender: formData.gender,
            age: (parseInt(formData.age) || 0).toString(),
            address: formData.address,
            gstin: formData.gstin || "",
            pan: formData.pan_number || "",
            state: formData.state || "",
            pincode: formData.pincode || ""
          }
        };

        console.log('=== PARTNER UPDATE ===');
        console.log('Original password:', formData.password);
        console.log('Hashed password:', hashedPassword);
        console.log('Sending partner update payload:', partnerPayload);
        console.log('=====================');

        response = await fetch('http://localhost:3000/admin/updateuser', {
          method: 'PATCH',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws`,
            'session_id': sessionId,
            'jwt_token': jwtToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(partnerPayload)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Update response:', result);

          toast({
            title: "Update Successful",
            description: "Partner user updated successfully",
          });

          navigate('/admin-dashboard');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Update failed:', errorData);

          toast({
            title: "Update Failed",
            description: errorData.message || "Failed to update partner user",
            variant: "destructive",
          });
        }
      } else if (formData.role === 'admin') {
        // Hash password if provided
        const hashedPassword = formData.password ? hashPassword(formData.password) : '';
        
        // Call updateempuser API for admin role
        const adminPayload = {
          user_id: parseInt(userId || '0'),
          first_name: formData.first_name,
          last_name: formData.last_name,
          email_address: formData.email,
          password: hashedPassword, // Send hashed password or empty string if no password change
          username: formData.username,
          role: formData.role,
          status: formData.status || 'active', // Include user status
          mobile_number: formData.mobile,
          emergency_contact: formData.emergency_contact,
          gender: formData.gender,
          age: (parseInt(formData.age) || 0).toString(),
          address: formData.address
        };

        console.log('=== ADMIN UPDATE ===');
        console.log('Original password:', formData.password);
        console.log('Hashed password:', hashedPassword);
        console.log('Sending admin update payload:', adminPayload);
        console.log('==================');

        response = await fetch('http://localhost:3000/admin/updateuser', {
          method: 'PATCH',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws`,
            'session_id': sessionId,
            'jwt_token': jwtToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(adminPayload)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Update response:', result);

          toast({
            title: "Update Successful",
            description: "Admin user updated successfully",
          });

          navigate('/admin-dashboard');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Update failed:', errorData);

          toast({
            title: "Update Failed",
            description: errorData.message || "Failed to update admin user",
            variant: "destructive",
          });
        }
      } else if (formData.role === 'employee') {
        // Hash password if provided
        const hashedPassword = formData.password ? hashPassword(formData.password) : '';
        
        // Call updateempuser API for employee role
        const employeePayload = {
          user_id: parseInt(userId || '0'),
          first_name: formData.first_name,
          last_name: formData.last_name,
          email_address: formData.email,
          password: hashedPassword, // Send hashed password or empty string if no password change
          username: formData.username,
          role: formData.role,
          status: formData.status || 'active', // Include user status
          designation: formData.designation,
          department: formData.department,
          mobile_number: formData.mobile,
          work_phone_number: formData.work_phonenumber,
          emergency_contact: formData.emergency_contact,
          gender: formData.gender,
          age: (parseInt(formData.age) || 0).toString(),
          aadhar_number: formData.aadhar_number,
          manager_name: formData.manager_name,
          joining_date: formData.joining_date,
          employment_status: formData.employment_status,
          pan: formData.pan_number,
          address: formData.address
        };

        console.log('=== EMPLOYEE UPDATE ===');
        console.log('Original password:', formData.password);
        console.log('Hashed password:', hashedPassword);
        console.log('Sending employee update payload:', employeePayload);
        console.log('====================');

        response = await fetch('http://localhost:3000/admin/updateuser', {
          method: 'PATCH',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws`,
            'session_id': sessionId,
            'jwt_token': jwtToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(employeePayload)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Update response:', result);

          toast({
            title: "Update Successful",
            description: "Employee user updated successfully",
          });

          navigate('/admin-dashboard');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Update failed:', errorData);

          toast({
            title: "Update Failed",
            description: errorData.message || "Failed to update employee user",
            variant: "destructive",
          });
        }
      } else if (formData.role === 'customer') {
        // Hash password if provided
        const hashedPassword = formData.password ? hashPassword(formData.password) : '';
        
        // Call updateempuser API for customer role
        const customerPayload = {
          user_id: parseInt(userId || '0'),
          first_name: formData.first_name,
          last_name: formData.last_name,
          email_address: formData.email,
          password: hashedPassword, // Send hashed password or empty string if no password change
          username: formData.username,
          role: formData.role,
          status: formData.status || 'active', // Include user status
          mobile_number: formData.mobile,
          emergency_contact: formData.emergency_contact,
          gender: formData.gender,
          age: (parseInt(formData.age) || 0).toString(),
          address: formData.address,
           customer_details: {
             customer_type: formData.customer_type,
             company_name: formData.company_name,
             source: formData.source,
             communication_preference: formData.communication_preferences,
             language_preference: formData.language_preference,
             partner_id: formData.partner_id,
             notes: formData.notes,
             gstin: formData.gstin || "",
             pan: formData.pan_number || "",
             state: formData.state || "",
             pincode: formData.pincode || "",
             created_by: '3',
             updated_by: '3'
           }
        };

        console.log('=== CUSTOMER UPDATE ===');
        console.log('Original password:', formData.password);
        console.log('Hashed password:', hashedPassword);
        console.log('Sending customer update payload:', customerPayload);
        console.log('====================');

        response = await fetch('http://localhost:3000/admin/updateuser', {
          method: 'PATCH',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws`,
            'session_id': sessionId,
            'jwt_token': jwtToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(customerPayload)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Update response:', result);

          toast({
            title: "Update Successful",
            description: "Customer user updated successfully",
          });

          navigate('/admin-dashboard');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Update failed:', errorData);

          toast({
            title: "Update Failed",
            description: errorData.message || "Failed to update customer user",
            variant: "destructive",
          });
        }
      } else {
        // All user types now have API implementations
        toast({
          title: "Update Successful",
          description: "User updated successfully",
        });

        navigate('/admin-dashboard');
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

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">User not found</p>
          <Button
            variant="outline"
            onClick={() => navigate('/admin-dashboard')}
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg rounded-lg">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-2 pt-6 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-bold">Edit User Profile</CardTitle>
            <Button
              variant="outline"
              onClick={() => navigate('/admin-dashboard')}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardHeader>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Update the user profile information below.
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
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Leave blank to keep current password"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Support Team</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">User Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    maxLength={10}
                    minLength={10}
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    placeholder="Enter mobile number"
                  />
                </div>

                <div>
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    maxLength={10}
                    minLength={10}
                    value={formData.emergency_contact}
                    onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                    placeholder="Enter emergency contact"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="text"
                    value={formData.age}
                    onChange={(e) => {
                      const onlyNums = e.target.value.replace(/\D/g, "");
                      handleInputChange("age", onlyNums);
                    }}
                    placeholder="Enter age"
                  />
                </div>

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

            {/* Information Section - Only show for employee role */}
            {formData.role === 'employee' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Employee Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="designation">Designation</Label>
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
                    <Label htmlFor="department">Department</Label>
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

                  <div>
                    <Label htmlFor="work_phonenumber">Work Phone Number</Label>
                    <Input
                      id="work_phonenumber"
                      value={formData.work_phonenumber}
                      onChange={(e) => handleInputChange('work_phonenumber', e.target.value)}
                      placeholder="Enter work phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="joining_date">Joining Date</Label>
                    <Input
                      id="joining_date"
                      type="date"
                      value={formData.joining_date}
                      onChange={(e) => handleInputChange('joining_date', e.target.value)}
                    />
                  </div>

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
                </div>
              </div>
            )}

            {/* Customer Information Section - Only show for customer role */}
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
                        <SelectItem value="sme">SME</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Advertisement">Advertisement</SelectItem>
                        <SelectItem value="Direct">Direct Contact</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="whatsApp">WhatsApp</SelectItem>
                        <SelectItem value="postal">Postal Mail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
                          <SelectValue placeholder={isLoadingPartners ? "Loading partners..." : "Select partner"}>
                            {formData.partner_id && getSelectedPartnerInfo() ? (
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {getSelectedPartnerInfo()?.first_name} {getSelectedPartnerInfo()?.last_name}
                                </span>
                              </div>
                            ) : (
                              isLoadingPartners ? "Loading partners..." : "Select partner"
                            )}
                          </SelectValue>
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
                    <Select value={formData.language_preference} onValueChange={(value) => handleInputChange('language_preference', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="hindi">Hindi</SelectItem>
                        <SelectItem value="spanish">Spanish</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                        <SelectItem value="german">German</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/\s/g, '');
                        handleInputChange('gstin', value);
                      }}
                      placeholder="Enter 15-character GSTIN"
                      maxLength={15}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="pan_customer">PAN</Label>
                    <Input
                      id="pan_customer"
                      value={formData.pan_number}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/\s/g, '');
                        handleInputChange('pan_number', value);
                      }}
                      placeholder="Enter 10-character PAN"
                      maxLength={10}
                      style={{ textTransform: 'uppercase' }}
                    />
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

            {/* Document Information Section - Only show for employee role */}
            {formData.role == 'employee'  && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Document Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Partner Information Section - Only show for partner role */}
            {formData.role === 'partner' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Partner Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="partner_id">Partner ID</Label>
                    <Input
                      id="partner_id"
                      value={formData.partner_id}
                      onChange={(e) => handleInputChange('partner_id', e.target.value)}
                      placeholder="Enter partner ID"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gstin_partner">GSTIN</Label>
                    <Input
                      id="gstin_partner"
                      value={formData.gstin}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/\s/g, '');
                        handleInputChange('gstin', value);
                      }}
                      placeholder="Enter 15-character GSTIN"
                      maxLength={15}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="pan_partner">PAN</Label>
                    <Input
                      id="pan_partner"
                      value={formData.pan_number}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/\s/g, '');
                        handleInputChange('pan_number', value);
                      }}
                      placeholder="Enter 10-character PAN"
                      maxLength={10}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state_partner">State</Label>
                    <Input
                      id="state_partner"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Enter state"
                    />
                  </div>

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

            {/* Admin Information Section - Only show for admin role */}
            {/* {formData.role === 'admin' && (
               <div className="space-y-4">
                 <h3 className="text-lg font-semibold border-b pb-2">Admin Information</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="admin_level">Admin Level</Label>
                     <Select value={formData.designation} onValueChange={(value) => handleInputChange('designation', value)}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select admin level" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="super_admin">Super Admin</SelectItem>
                         <SelectItem value="admin">Admin</SelectItem>
                         <SelectItem value="moderator">Moderator</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
               </div>
             )} */}

            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => navigate('/admin-dashboard')}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleUpdateUser}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? 'Updating User...' : 'Update User'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditRegister;
