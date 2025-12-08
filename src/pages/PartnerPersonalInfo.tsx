import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield, Mail, Phone, MapPin, Calendar, Briefcase, Edit, Save, X, Camera, Lock, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface PartnerProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  employmentStatus: string;
  fullName: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  emergencyContact: string;
  emergencyPhone: string;
  bankAccountNumber: string;
  ifscCode: string;
  panNumber: string;
  aadharNumber: string;
  partnerType: string;
  commissionRate: number;
  joiningDate: string;
  totalReferrals: number;
  totalEarnings: number;
  profilePicture?: string;
  bankName: string;
  accountHolderName: string;
  manager: string;
  department: string;
}

const PartnerPersonalInfo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [profile, setProfile] = useState<PartnerProfile>({
    id: 'partner-001',
    username: 'partner.agent',
    email: 'partner.agent@expertclaims.com',
    role: 'Partner Agent',
    employmentStatus: 'active',
    fullName: 'Partner Agent',
    phone: '+91 9876543210',
    address: '123 Partner Street, Mumbai, Maharashtra 400001',
    dateOfBirth: '1990-05-15',
    gender: 'Male',
    emergencyContact: 'Emergency Contact',
    emergencyPhone: '+91 9876543211',
    bankAccountNumber: '1234567890',
    ifscCode: 'SBIN0001234',
    panNumber: 'ABCDE1234F',
    aadharNumber: '123456789012',
    partnerType: 'Individual',
    commissionRate: 15,
    joiningDate: '2023-01-15',
    totalReferrals: 25,
    totalEarnings: 75000,
    bankName: 'ICICI Bank',
    accountHolderName: 'Partner Agent',
    manager: 'Manager Name',
    department: 'Partner Department'
  });

  const [editedProfile, setEditedProfile] = useState<PartnerProfile>(profile);

  useEffect(() => {
    setEditedProfile(profile);
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile(editedProfile);
      setEditMode(false);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setEditMode(false);
  };

  const handleInputChange = (field: keyof PartnerProfile, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
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

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirm password do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setUpdatingPassword(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-primary-500 backdrop-blur-md shadow-sm border-b border-primary-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={() => navigate('/partner-dashboard')}
                className="bg-white text-blue-600 border-2 border-gray-300 hover:bg-gray-50 hover:text-black rounded-xl transition-all duration-200 flex items-center space-x-2 px-4 py-2"
              >
                <ArrowLeft className="h-4 w-4 text-blue-600 group-hover:text-black" />
                <span className="text-blue-600 hover:text-black font-medium">Back</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Personal Information</h1>
                <p className="text-sm text-white/80">Manage your profile and account settings</p>
              </div>
            </div>
            
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                     {/* Sidebar */}
           <div className="lg:col-span-1">
             <Card className="border border-gray-200 shadow-lg bg-white">
               <CardHeader className="text-center pb-6 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-t-lg">
                 <CardTitle className="flex items-center justify-center space-x-2 text-lg text-gray-900">
                   <Shield className="h-5 w-5 text-blue-600" />
                   <span>Partner Profile</span>
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
                          'PA'
                        )}
                      </div>
                      {editMode && (
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
                       {profile.fullName}
                     </h3>
                     <p className="text-sm font-medium text-blue-600">{profile.role}</p>
                     <p className="text-xs text-gray-500">{profile.department}</p>
                     <Badge variant="outline" className="mt-2 border-blue-200 text-blue-700 bg-blue-50">
                       {profile.employmentStatus}
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
                       <span className="text-sm font-medium text-gray-700">Partner ID</span>
                     </div>
                     <span className="text-sm font-semibold text-gray-900">{profile.username}</span>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                     <div className="flex items-center space-x-2">
                       <div className="p-1.5 bg-green-100 rounded-md">
                         <Calendar className="h-3.5 w-3.5 text-green-600" />
                       </div>
                       <span className="text-sm font-medium text-gray-700">Joined</span>
                     </div>
                     <span className="text-sm font-semibold text-gray-900">{profile.joiningDate}</span>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                     <div className="flex items-center space-x-2">
                       <div className="p-1.5 bg-purple-100 rounded-md">
                         <Briefcase className="h-3.5 w-3.5 text-purple-600" />
                       </div>
                       <span className="text-sm font-medium text-gray-700">Manager</span>
                     </div>
                     <span className="text-sm font-semibold text-gray-900">{profile.manager}</span>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Personal Information */}
            <Card className="border-none shadow-xl bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-primary-500" />
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">Personal Information</CardTitle>
                      <CardDescription className="text-gray-600">Update your personal details and contact information</CardDescription>
                    </div>
                  </div>
                                     {!editMode ? (
                     <Button
                       onClick={() => setEditMode(true)}
                       variant="outline"
                       className="border-2 border-gray-300 hover:border-gray-400 bg-white text-black rounded-lg transition-all duration-300"
                     >
                       <Edit className="h-4 w-4 mr-2" />
                       Edit Profile
                     </Button>
                   ) : (
                     <div className="flex space-x-2">
                       <Button
                         onClick={handleSave}
                         disabled={saving}
                         variant="outline"
                         className="border-2 border-gray-300 hover:border-gray-400 bg-white text-black rounded-lg transition-all duration-300"
                       >
                         <Save className="h-4 w-4 mr-2" />
                         {saving ? 'Saving...' : 'Save Changes'}
                       </Button>
                       <Button
                         onClick={handleCancel}
                         variant="outline"
                         className="border-2 border-gray-300 hover:border-gray-400 bg-white text-black rounded-lg transition-all duration-300"
                       >
                         <X className="h-4 w-4 mr-2" />
                         Cancel
                       </Button>
                     </div>
                   )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                                         {editMode ? (
                                              <Input
                          id="fullName"
                          value={editedProfile.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className="border-2 border-gray-300 focus:border-black focus:ring-0 rounded-lg"
                        />
                    ) : (
                      <Input
                        value={profile.fullName}
                        disabled
                        className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                                         {editMode ? (
                                              <Input
                          id="phone"
                          value={editedProfile.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="border-2 border-gray-300 focus:border-black focus:ring-0 rounded-lg"
                        />
                    ) : (
                      <Input
                        value={profile.phone}
                        disabled
                        className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                                         {editMode ? (
                                              <Input
                          id="email"
                          type="email"
                          value={editedProfile.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="border-2 border-gray-300 focus:border-black focus:ring-0 rounded-lg"
                        />
                    ) : (
                      <Input
                        value={profile.email}
                        disabled
                        className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                         {editMode ? (
                                              <Input
                          id="dateOfBirth"
                          type="date"
                          value={editedProfile.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          className="border-2 border-gray-300 focus:border-black focus:ring-0 rounded-lg"
                        />
                    ) : (
                      <Input
                        value={profile.dateOfBirth}
                        disabled
                        className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                                         {editMode ? (
                                              <Select value={editedProfile.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                          <SelectTrigger className="border-2 border-gray-300 focus:border-black focus:ring-0 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={profile.gender}
                        disabled
                        className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                                         {editMode ? (
                                              <Input
                          id="emergencyContact"
                          value={editedProfile.emergencyContact}
                          onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                          className="border-2 border-gray-300 focus:border-black focus:ring-0 rounded-lg"
                        />
                    ) : (
                      <Input
                        value={profile.emergencyContact}
                        disabled
                        className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                      />
                    )}
                  </div>

                                     <div className="space-y-2">
                     <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                     {editMode ? (
                                              <Input
                          id="emergencyPhone"
                          value={editedProfile.emergencyPhone}
                          onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                          className="border-2 border-gray-300 focus:border-black focus:ring-0 rounded-lg"
                        />
                     ) : (
                       <Input
                         value={profile.emergencyPhone}
                         disabled
                         className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                       />
                     )}
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="panNumber">PAN Number</Label>
                                           {editMode ? (
                        <Input
                          id="panNumber"
                          value={editedProfile.panNumber}
                          onChange={(e) => handleInputChange('panNumber', e.target.value)}
                          className="border-2 border-gray-300 focus:border-black focus:ring-0 rounded-lg"
                        />
                     ) : (
                       <Input
                         value={profile.panNumber}
                         disabled
                         className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                       />
                     )}
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="aadharNumber">Aadhar Number</Label>
                                           {editMode ? (
                        <Input
                          id="aadharNumber"
                          value={editedProfile.aadharNumber}
                          onChange={(e) => handleInputChange('aadharNumber', e.target.value)}
                          className="border-2 border-gray-300 focus:border-black focus:ring-0 rounded-lg"
                        />
                     ) : (
                       <Input
                         value={profile.aadharNumber}
                         disabled
                         className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                       />
                     )}
                   </div>
                 </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                                     {editMode ? (
                                          <Textarea
                        id="address"
                        value={editedProfile.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        rows={3}
                        className="border-2 border-gray-300 focus:border-black focus:ring-0 rounded-lg"
                      />
                  ) : (
                    <Textarea
                      value={profile.address}
                      disabled
                      rows={3}
                      className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Partner Information */}
            <Card className="border-none shadow-xl bg-white">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary-500" />
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Partner Information</CardTitle>
                    <CardDescription className="text-gray-600">Your partner-specific details and commission information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="partnerType">Partner Type</Label>
                                         {editMode ? (
                                              <Select value={editedProfile.partnerType} onValueChange={(value) => handleInputChange('partnerType', value)}>
                          <SelectTrigger className="border-2 border-gray-300 focus:border-black focus:ring-0 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Individual">Individual</SelectItem>
                          <SelectItem value="Corporate">Corporate</SelectItem>
                          <SelectItem value="Agency">Agency</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={profile.partnerType}
                        disabled
                        className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                                         {editMode ? (
                                              <Input
                          id="commissionRate"
                          type="number"
                          value={editedProfile.commissionRate}
                          onChange={(e) => handleInputChange('commissionRate', e.target.value)}
                          className="border-2 border-gray-300 focus:border-black focus:ring-0 rounded-lg"
                        />
                    ) : (
                      <Input
                        value={`${profile.commissionRate}%`}
                        disabled
                        className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="joiningDate">Joining Date</Label>
                                         {editMode ? (
                                              <Input
                          id="joiningDate"
                          type="date"
                          value={editedProfile.joiningDate}
                          onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                          className="border-2 border-gray-300 focus:border-black focus:ring-0 rounded-lg"
                        />
                    ) : (
                      <Input
                        value={profile.joiningDate}
                        disabled
                        className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalReferrals">Total Referrals</Label>
                    <Input
                      value={profile.totalReferrals.toString()}
                      disabled
                      className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                    />
                  </div>

                                     <div className="space-y-2">
                     <Label htmlFor="totalEarnings">Total Earnings</Label>
                     <Input
                       value={`₹${profile.totalEarnings.toLocaleString()}`}
                       disabled
                       className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="manager">Manager</Label>
                                           {editMode ? (
                        <Input
                          id="manager"
                          value={editedProfile.manager}
                          onChange={(e) => handleInputChange('manager', e.target.value)}
                          className="border-2 border-gray-300 focus:border-black focus:ring-0 rounded-lg"
                        />
                     ) : (
                       <Input
                         value={profile.manager}
                         disabled
                         className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                       />
                     )}
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="department">Department</Label>
                     {editMode ? (
                       <Input
                         id="department"
                         value={editedProfile.department}
                         onChange={(e) => handleInputChange('department', e.target.value)}
                         className="border-2 border-gray-300 focus:border-black rounded-lg"
                       />
                     ) : (
                       <Input
                         value={profile.department}
                         disabled
                         className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                       />
                     )}
                   </div>
                 </div>
               </CardContent>
             </Card>

                         {/* Banking Information */}
             <Card className="border-none shadow-xl bg-white">
               <CardHeader>
                 <div className="flex items-center space-x-2">
                   <Briefcase className="h-5 w-5 text-primary-500" />
                   <div>
                     <CardTitle className="text-xl font-bold text-gray-900">Banking Information</CardTitle>
                     <CardDescription className="text-gray-600">Your bank account details for commission payments</CardDescription>
                   </div>
                 </div>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <Label htmlFor="bankName">Bank Name</Label>
                     {editMode ? (
                       <Input
                         id="bankName"
                         value={editedProfile.bankName}
                         onChange={(e) => handleInputChange('bankName', e.target.value)}
                         className="border-2 border-gray-300 focus:border-black rounded-lg"
                       />
                     ) : (
                       <Input
                         value={profile.bankName}
                         disabled
                         className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                       />
                     )}
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                     {editMode ? (
                       <Input
                         id="bankAccountNumber"
                         value={editedProfile.bankAccountNumber}
                         onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                         className="border-2 border-gray-300 focus:border-black rounded-lg"
                       />
                     ) : (
                       <Input
                         value={profile.bankAccountNumber}
                         disabled
                         className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                       />
                     )}
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="ifscCode">IFSC Code</Label>
                     {editMode ? (
                       <Input
                         id="ifscCode"
                         value={editedProfile.ifscCode}
                         onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                         className="border-2 border-gray-300 focus:border-black rounded-lg"
                       />
                     ) : (
                       <Input
                         value={profile.ifscCode}
                         disabled
                         className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                       />
                     )}
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="accountHolderName">Account Holder Name</Label>
                     {editMode ? (
                       <Input
                         id="accountHolderName"
                         value={editedProfile.accountHolderName}
                         onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                         className="border-2 border-gray-300 focus:border-black rounded-lg"
                       />
                     ) : (
                       <Input
                         value={profile.accountHolderName}
                         disabled
                         className="bg-gray-50 border-2 border-gray-200 rounded-lg"
                       />
                     )}
                   </div>
                 </div>
               </CardContent>
             </Card>

              {/* Update Password */}
              <Card className="border-none shadow-xl bg-white">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Lock className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">Update Password</CardTitle>
                      <CardDescription className="text-gray-600">Change your account password securely</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-gray-600" />
                        <span>Current Password</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          placeholder="Enter current password"
                          className="border-2 border-gray-300 focus:border-black rounded-lg pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-gray-600" />
                        <span>New Password</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          placeholder="Enter new password"
                          className="border-2 border-gray-300 focus:border-black rounded-lg pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-gray-600" />
                        <span>Confirm New Password</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          placeholder="Confirm new password"
                          className="border-2 border-gray-300 focus:border-black rounded-lg pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                                     <div className="flex justify-end">
                     <Button
                       onClick={handleUpdatePassword}
                       disabled={updatingPassword}
                       variant="outline"
                       className="border-2 border-gray-300 hover:border-gray-400 bg-white text-black rounded-lg transition-all duration-300 flex items-center space-x-2"
                     >
                       <Lock className="h-4 w-4" />
                       <span>{updatingPassword ? 'Updating...' : 'Update Password'}</span>
                     </Button>
                   </div>
                </CardContent>
              </Card>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerPersonalInfo;
