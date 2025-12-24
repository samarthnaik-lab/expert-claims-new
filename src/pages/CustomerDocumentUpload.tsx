import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Upload, FileText, X, CheckCircle, AlertCircle, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl, getApiKey } from '@/config/api';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  file: File; // Store the actual file for upload
}

const CustomerDocumentUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState('');
  const [selectedCaseType, setSelectedCaseType] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState([]);


  // Mock claims with case types (fallback if no API data)
  const mockClaims = [
    { id: 'CLM-001', type: 'Health Insurance', caseType: 'health-insurance', status: 'In Progress' },
    { id: 'CLM-002', type: 'Car Insurance', caseType: 'motor-insurance', status: 'Under Review' },
    { id: 'CLM-003', type: 'Life Insurance', caseType: 'life-insurance', status: 'Approved' },
    { id: 'CLM-004', type: 'Commercial Insurance', caseType: 'commercial-insurance', status: 'Pending' }
  ];

  // Case type and document mapping (same as in NewTask.tsx)
  const caseTypeDocumentMap: {[key: string]: string[]} = {
    'health-insurance': ['Medical Certificates', 'Hospital Bills', 'Prescription Documents', 'Diagnostic Reports', 'Claim Forms'],
    'life-insurance': ['Death Certificate', 'Policy Documents', 'Medical Reports', 'Nominee Documents', 'Claim Forms'],
    'motor-insurance': ['Vehicle Registration', 'Insurance Certificate', 'Driving License', 'Accident Report', 'Repair Estimates'],
    'commercial-insurance': ['Business Documents', 'Insurance Policy', 'Claim Forms', 'Damage Assessment', 'Financial Records']
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    // Only allow upload if both claim and document type are selected
    if (!selectedClaim || !selectedDocumentType) {
      alert('Please select both a claim and document type before uploading files.');
      return;
    }

    const newFiles: UploadedFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending', // Changed from 'uploading' to 'pending'
      progress: 0,
      file: file
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Don't upload files immediately - just store them locally
    // Files will be uploaded when "Submit All Documents" is clicked
  };

  // Reset uploaded files when claim or document type changes
  useEffect(() => {
    setUploadedFiles([]);
  }, [selectedClaim, selectedDocumentType]);

  // Helper function to get userId with proper fallback chain
  const getUserId = async (): Promise<string | null> => {
    // 1. First, try to get from expertclaims_session (stored during login)
    const sessionStr = localStorage.getItem('expertclaims_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session.userId) {
          console.log('Got userId from expertclaims_session:', session.userId);
          return session.userId.toString();
        }
      } catch (error) {
        console.error('Error parsing expertclaims_session:', error);
      }
    }
    
    // 2. Try individual userId key (backward compatibility)
    const userIdFromKey = localStorage.getItem('userId');
    if (userIdFromKey) {
      console.log('Got userId from localStorage userId key:', userIdFromKey);
      return userIdFromKey;
    }
    
    // 3. Try from customer session details
    const customerSessionRaw = localStorage.getItem('expertclaims_customer_session_details');
    if (customerSessionRaw) {
      try {
        const customerSessionData = JSON.parse(customerSessionRaw);
        const customerSession = Array.isArray(customerSessionData) ? customerSessionData[0] : customerSessionData;
        if (customerSession?.userid) {
          console.log('Got userId from customer_session_details:', customerSession.userid);
          return customerSession.userid.toString();
        }
      } catch (e) {
        console.error('Error parsing customer session data:', e);
      }
    }
    
    // 4. Try /customer/getuserid API (extracts from JWT token or session_id)
    try {
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
      
      if (jwtToken || sessionId) {
        const userIdResponse = await fetch(`${buildApiUrl('customer/getuserid')}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(jwtToken && { 'jwt_token': jwtToken }),
            ...(sessionId && { 'session_id': sessionId })
          }
        });
        
        if (userIdResponse.ok) {
          const userIdData = await userIdResponse.json();
          const userId = userIdData?.user_id || userIdData?.userId || null;
          if (userId) {
            console.log('Got userId from getuserid API:', userId);
            // Store it for future use
            if (sessionStr) {
              try {
                const session = JSON.parse(sessionStr);
                session.userId = userId.toString();
                localStorage.setItem('expertclaims_session', JSON.stringify(session));
                localStorage.setItem('userId', userId.toString());
              } catch (e) {
                console.error('Error updating session:', e);
              }
            }
            return userId.toString();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching userId from getuserid API:', error);
    }
    
    return null;
  };

  useEffect(() => {
    const fetchCustomerCase = async () => {
      console.log('🔄 fetchCustomerCase called');
      try {
        setLoading(true);
  
        const userId = await getUserId();
        console.log('📦 UserId from getUserId:', userId);
  
        if (!userId) {
          console.error('❌ No userid found - API call will not be made');
          console.log('Available localStorage keys:', Object.keys(localStorage).filter(key => key.includes('expert') || key.includes('user')));
          toast({
            title: "Error",
            description: "User ID not found. Please ensure you are logged in.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
  
        // Get session_id and jwt_token from localStorage
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
  
        // Fetch all cases by fetching multiple pages
        let allCases: any[] = [];
        let page = 1;
        const pageSize = 50; // Fetch larger pages
        let hasMore = true;

        // Get API key dynamically
        const apiKey = getApiKey();
        const apiUrl = buildApiUrl('customer/customer-case');
        console.log('Calling Customer Case API:', apiUrl);
        console.log('Session data:', { sessionId: sessionId ? 'present' : 'missing', jwtToken: jwtToken ? 'present' : 'missing' });

        while (hasMore) {
          // Build FormData payload with pagination
          const formData = new FormData();
          formData.append('user_id', userId.toString());
          formData.append('page', page.toString());
          formData.append('size', pageSize.toString());
  
          console.log(`Fetching page ${page} with user_id: ${userId}`);
  
        const response = await fetch(
          apiUrl,
          {
            method: 'POST',
            headers: {
              'accept': '*/*',
              'accept-language': 'en-US,en;q=0.9',
              'accept-profile': 'expc',
<<<<<<< HEAD
              'apikey': apiKey,
              'authorization': `Bearer ${apiKey}`,
=======
>>>>>>> 06778fa6b749cc9b7af4a63b09122d69a4b370da
              'content-profile': 'expc',
              'jwt_token': jwtToken,
              'session_id': sessionId,
              ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` })
            },
            body: formData,
          }
        );
  
          console.log(`Page ${page} - API Response Status:`, response.status, response.statusText);
  
          if (response.ok) {
            const data = await response.json();
            const caseArray = Array.isArray(data) ? data : (data?.data || data?.cases || []);
            
            if (caseArray.length > 0) {
              allCases = [...allCases, ...caseArray];
              // Check if there are more pages
              hasMore = caseArray.length === pageSize;
              page++;
              
              // Limit to 10 pages to prevent infinite loops
              if (page > 10) {
                console.warn('Reached maximum page limit (10) while fetching cases');
                hasMore = false;
              }
            } else {
              hasMore = false;
            }
          } else {
            const errorText = await response.text();
            console.error('Failed to fetch customer case from page', page, {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            });
            hasMore = false;
          }
        }
  
        if (allCases.length > 0) {
          setCaseData(allCases); 
          console.log('Customer case data loaded:', allCases.length, 'cases');
          toast({
            title: "Success",
            description: `Loaded ${allCases.length} cases.`,
          });
        } else {
          console.log('No cases found');
          setCaseData([]);
          toast({
            title: "No Cases Found",
            description: "No claims found. Please contact support if you believe this is an error.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching customer case:', error);
        toast({
          title: "Error",
          description: "Failed to fetch cases. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
  
    fetchCustomerCase();
  }, []);

  // Handle claim selection and set case type
  const handleClaimSelection = (claimId: string) => {
    setSelectedClaim(claimId);
    setSelectedDocumentType(''); // Reset document type when claim changes
    
    const selectedClaimData = caseData.find((claim: any) => claim.case_id === claimId);
    console.log('Selected claim data:', selectedClaimData);
    
    if (selectedClaimData) {
      // Extract case type from the nested case_types object
      const caseTypeName = selectedClaimData.case_types?.case_type_name;
      console.log('Case type name from claim:', caseTypeName);
      console.log('Available categories:', categories);
      
      if (caseTypeName) {
        // Find the corresponding case type ID from categories
        const matchingCategory = categories.find((cat: any) => 
          cat.case_types?.case_type_name === caseTypeName
        );
        console.log('Matching category:', matchingCategory);
        
        if (matchingCategory) {
          setSelectedCaseType(matchingCategory.case_types.case_type_id.toString());
          console.log('Set case type to:', matchingCategory.case_types.case_type_id.toString());
        } else {
          // If no matching category found, try to use the case type name directly
          setSelectedCaseType(caseTypeName.toLowerCase().replace(/\s+/g, '-'));
          console.log('Set case type to fallback:', caseTypeName.toLowerCase().replace(/\s+/g, '-'));
        }
      }
    }
  };

  // Get available document types based on selected case type from API
  const getAvailableDocumentTypes = () => {
    if (!selectedCaseType || !categories.length) {
      return [];
    }
    
    // Filter categories based on selected case type
    const filteredCategories = categories.filter((category: any) => 
      category.case_types?.case_type_name?.toLowerCase().replace(/\s+/g, '-') === selectedCaseType ||
      category.case_types?.case_type_id?.toString() === selectedCaseType
    );
    
    return filteredCategories.map((category: any) => ({
      id: category.category_id,
      name: category.document_name,
      isMandatory: category.is_mandatory
    }));
  };

  const uploadFileToAPI = async (uploadedFile: UploadedFile) => {
    try {
      // Get userid from localStorage for created_by and updated_by
      const userDetailsStr = localStorage.getItem("expertclaims_user_details");
      let userId = "";
      
      if (userDetailsStr) {
        try {
          const userDetails = JSON.parse(userDetailsStr);
          const details = Array.isArray(userDetails) ? userDetails[0] : userDetails;
          userId = (details?.userid || details?.id || details?.customer_id || "").toString();
        } catch (error) {
          console.error("Error parsing user details from localStorage:", error);
        }
      }
      
      // Get category_id from selected document type
      const selectedCategory = getAvailableDocumentTypes().find(cat => cat.id.toString() === selectedDocumentType);
      const categoryId = selectedCategory?.id || '';
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('data', uploadedFile.file);
      formData.append('case_id', selectedClaim);
      formData.append('category_id', categoryId.toString());
      formData.append('is_customer_visible', 'true'); // Customer uploads are visible to customers
      if (userId) {
        formData.append('created_by', userId);
        formData.append('updated_by', userId);
      }
      
      // Update progress to show upload starting
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id 
          ? { ...file, progress: 10 }
          : file
      ));
      
      const response = await fetch(
        buildApiUrl('api/upload'),
        {
          method: 'POST',
          headers: {
            // Don't set Content-Type for FormData - browser will set it automatically with boundary
          },
          body: formData,
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        
        // Update file status to success
        setUploadedFiles(prev => prev.map(file => 
          file.id === uploadedFile.id 
            ? { ...file, status: 'success', progress: 100 }
            : file
        ));
        
        // Show success toast for individual file upload
        toast({
          title: "File Uploaded!",
          description: `${uploadedFile.name} has been uploaded successfully.`,
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      } else {
        throw new Error(`Upload failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // Update file status to error
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id 
          ? { ...file, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
          : file
      ));
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      case 'xls':
      case 'xlsx': return '📊';
      default: return '📎';
    }
  };

  const handleSubmitDocuments = async () => {
    try {
      // Get pending files that need to be uploaded
      const pendingFiles = uploadedFiles.filter(f => f.status === 'pending');
      
      if (pendingFiles.length > 0) {
        // Upload all pending files first
        console.log(`Uploading ${pendingFiles.length} pending files...`);
        
        // Show toast that upload is starting
        toast({
          title: "Upload Started",
          description: `Starting upload of ${pendingFiles.length} file(s)...`,
          variant: "default",
          className: "bg-blue-50 border-blue-200 text-blue-800",
        });
        
        // Update status to uploading for all pending files
        setUploadedFiles(prev => prev.map(file => 
          file.status === 'pending' 
            ? { ...file, status: 'uploading', progress: 0 }
            : file
        ));

        // Upload all pending files
        const uploadPromises = pendingFiles.map(file => uploadFileToAPI(file));
        
        try {
          await Promise.all(uploadPromises);
          console.log('All files uploaded successfully');
          
          // Show toast that all files are uploaded
          toast({
            title: "Upload Complete",
            description: `All ${pendingFiles.length} file(s) have been uploaded successfully!`,
            variant: "default",
            className: "bg-green-50 border-green-200 text-green-800",
          });
        } catch (error) {
          console.error('Some files failed to upload:', error);
          toast({
            title: "Upload Failed",
            description: "Some files failed to upload. Please check the errors and try again.",
            variant: "destructive",
            className: "bg-red-50 border-red-200 text-red-800",
          });
          return;
        }
      }

      // Check if there are any files to submit
      if (uploadedFiles.length === 0) {
        alert('No files to submit. Please upload some documents first.');
        return;
      }

      // Now all files should be uploaded, proceed with submission
      const allFilesUploaded = uploadedFiles.every(f => f.status === 'success');
      if (!allFilesUploaded) {
        alert('Please wait for all files to finish uploading before submitting.');
        return;
      }

      // Get case data for the API call
      const selectedClaimData = caseData.find((claim: any) => claim.case_id === selectedClaim);
      const employeeId = selectedClaimData?.employee_id || '';

      // Create payload for submission API
      const submissionData = {
        case_id: selectedClaim,
        emp_id: employeeId.toString(),
        is_customer: 'yes',
        total_files: uploadedFiles.length,
        document_types: uploadedFiles.map(file => {
          const selectedCategory = getAvailableDocumentTypes().find(cat => cat.id.toString() === selectedDocumentType);
          return {
            file_name: file.name,
            category_id: selectedCategory?.id || '',
            category_name: selectedCategory?.name || '',
            file_size: file.size,
            file_type: file.type
          };
        })
      };

      console.log('Submitting documents with data:', submissionData);

      // Show toast that submission is starting
      toast({
        title: "Submitting Documents",
        description: "Submitting all documents to the system...",
        variant: "default",
        className: "bg-blue-50 border-blue-200 text-blue-800",
      });

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
        toast({
          title: "Error",
          description: "Please log in to submit documents",
          variant: "destructive",
        });
        return;
      }

      // TODO: Backend endpoint for submit-documents does not exist yet
      // This n8n webhook needs to be replaced with a backend endpoint when available
      // Call the submission API
      const response = await fetch(
        'https://n8n.srv952553.hstgr.cloud/webhook/submit-documents',
        {
          method: 'POST',
          headers: {
            'Accept-Profile': 'expc',
            'Content-Profile': 'expc',
            'Content-Type': 'application/json',
            'session_id': sessionId,
            'jwt_token': jwtToken,
            ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` })
          },
          body: JSON.stringify(submissionData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('Document submission successful:', result);
        
        // Show success toast
        toast({
          title: "Success!",
          description: "All documents have been successfully submitted!",
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
        });
        
        // Optionally redirect or clear the form
        // navigate('/customer-portal');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Submission failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert(`Failed to submit documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const [categories, setCategories] = useState([]); // store API response

  useEffect(() => {
    const fetchDocumentCategories = async () => {
      try {
        setLoading(true);

        // Get session_id and jwt_token from localStorage
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

     const response = await fetch(
          buildApiUrl("customer/getdocumentcatagories"),
          {
            method: "GET",
            headers: {
              'accept': '*/*',
              'accept-language': 'en-US,en;q=0.9',
              'content-type': 'application/json',
              'jwt_token': jwtToken,
              'session_id': sessionId,
              'origin': 'http://localhost:8080',
              'referer': 'http://localhost:8080/',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setCategories(data);
          console.log("Document categories:", data);
        } else {
          console.error("Failed to fetch document categories");
        }
      } catch (error) {
        console.error("Error fetching document categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentCategories();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-primary-500 backdrop-blur-md shadow-sm border-b border-primary-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate('/customer-portal')}
                className="bg-white text-blue-600 border-2 border-gray-300 hover:bg-gray-50 hover:text-black rounded-xl transition-all duration-200 flex items-center space-x-2 px-4 py-2"
              >
                <ArrowLeft className="h-4 w-4 text-blue-600 group-hover:text-black" />
                <span className="text-blue-600 hover:text-black font-medium">Back</span>
              </Button>
              {/* <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div> */}
              <div>
                <img src="/leaders/logo.jpeg" alt="ExpertClaims" className="w-48" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Upload Documents
                </h1>
                <p className="text-xs text-white/80 font-medium">Submit additional documents for your claims</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            {/* Claim Selection */}
            <Card className="border-none shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Select Claim</CardTitle>
                <CardDescription>Choose the claim you want to upload documents for</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading claims...
                  </div>
                ) : caseData.length > 0 ? (
                  <Select value={selectedClaim} onValueChange={handleClaimSelection}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a claim" />
                    </SelectTrigger>
                    <SelectContent>
                      {caseData.map((claim: any) => (
                        <SelectItem key={claim.case_id} value={claim.case_id}>
                          {claim.case_id} - {claim.case_summary || 'No summary available'} 
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No claims found. Please contact support if you believe this is an error.
                  </div>
                )}
                
               {selectedClaim && selectedCaseType && (
  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
    <p className="text-sm text-blue-800">
      <strong>Case Type:</strong> {
        (() => {
          // First try to get case type name from the selected claim data
          const selectedClaimData = caseData.find((claim: any) => claim.case_id === selectedClaim);
          if (selectedClaimData?.case_types?.case_type_name) {
            return selectedClaimData.case_types.case_type_name;
          }
          
          // Fallback to finding from categories
          const caseTypeData = categories.find((cat: any) =>
            cat.case_types?.case_type_id?.toString() === selectedCaseType
          );
          return caseTypeData?.case_types?.case_type_name || selectedCaseType;
        })()
      }
    </p>
    <p className="text-sm text-blue-700 mt-1">
      Required documents will be shown below based on your case type.
    </p>
  </div>
)}
              </CardContent>
            </Card>

            {/* Document Type Selection */}
            {selectedClaim && selectedCaseType && (
              <Card className="border-none shadow-xl bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Select Document Type</CardTitle>
                  <CardDescription>Choose the type of document you want to upload for your {
                  (() => {
                    // First try to get case type name from the selected claim data
                    const selectedClaimData = caseData.find((claim: any) => claim.case_id === selectedClaim);
                    if (selectedClaimData?.case_types?.case_type_name) {
                      return selectedClaimData.case_types.case_type_name;
                    }
                    
                    // Fallback to finding from categories
                    const caseTypeData = categories.find((cat: any) => 
                      cat.case_types?.case_type_id?.toString() === selectedCaseType
                    );
                    return caseTypeData?.case_types?.case_type_name || selectedCaseType;
                  })()
                } case</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableDocumentTypes().map((type, index) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name} {type.isMandatory && <span className="text-red-500">*</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Upload Area */}
            {selectedDocumentType && (
              <Card className="border-none shadow-xl bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Upload Documents</CardTitle>
                  <CardDescription>
                    Drag and drop files here or click to browse. Supported formats: PDF, DOC, DOCX, JPG, PNG, XLS, XLSX
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                      isDragOver 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-300 hover:border-primary-400'
                    }`}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      Drop files here or click to upload
                    </p>
                    <p className="text-gray-600 mb-4">
                      Maximum file size: 10MB per file
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label 
                      htmlFor="file-upload"
                      className="cursor-pointer inline-block"
                    >
                      <Button 
                        type="button"
                        className="bg-white text-gray-700 border-2 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-500 transition-all duration-300"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        Choose Files
                      </Button>
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Required Documents Guide */}
            {selectedClaim && selectedCaseType && (
              <Card className="border-none shadow-xl bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Required Documents</CardTitle>
                  <CardDescription>Documents required for your {
                    (() => {
                      // First try to get case type name from the selected claim data
                      const selectedClaimData = caseData.find((claim: any) => claim.case_id === selectedClaim);
                      if (selectedClaimData?.case_types?.case_type_name) {
                        return selectedClaimData.case_types.case_type_name;
                      }
                      
                      // Fallback to finding from categories
                      const caseTypeData = categories.find((cat: any) => 
                        cat.case_types?.case_type_id?.toString() === selectedCaseType
                      );
                      return caseTypeData?.case_types?.case_type_name || selectedCaseType;
                    })()
                  } case</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    {getAvailableDocumentTypes().map((type, index) => (
                      <div key={type.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <FileText className="h-4 w-4 text-primary-500" />
                        <span className="text-sm text-gray-700 font-medium">
                          {type.name} {type.isMandatory && <span className="text-red-500">*</span>}
                        </span>
                        {selectedDocumentType === type.id.toString() && (
                          <Badge className="ml-auto bg-green-100 text-green-800 text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Uploaded Files */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Uploaded Files</CardTitle>
                <CardDescription>
                  {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
                  {selectedClaim && selectedDocumentType && (
                    <span className="block mt-1 text-sm">
                      Claim: {selectedClaim} | Type: {selectedDocumentType}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadedFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No files uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {uploadedFiles.map(file => (
                      <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <span className="text-2xl">{getFileIcon(file.name)}</span>
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <div className="flex items-center space-x-2">
                              {file.status === 'pending' && (
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  <span className="text-xs text-gray-500">Pending</span>
                                </div>
                              )}
                              {file.status === 'uploading' && (
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs text-gray-500">{Math.round(file.progress)}%</span>
                                </div>
                              )}
                              {file.status === 'success' && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {file.status === 'error' && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Create a URL for the file and open it
                                  const fileUrl = URL.createObjectURL(file.file);
                                  window.open(fileUrl, '_blank');
                                }}
                                className="h-6 w-6 p-0 bg-white text-gray-400 border border-gray-300 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-500 transition-all duration-300"
                                title="View Document"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => removeFile(file.id)}
                                className="h-6 w-6 p-0 bg-white text-gray-400 border border-gray-300 hover:bg-red-50 hover:text-red-500 hover:border-red-500 transition-all duration-300"
                                title="Delete File"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            {file.status === 'pending' && (
                              <div className="w-24 bg-gray-200 rounded-full h-1">
                                <div 
                                  className="bg-yellow-500 h-1 rounded-full transition-all duration-300"
                                  style={{ width: '0%' }}
                                ></div>
                              </div>
                            )}
                            {file.status === 'uploading' && (
                              <div className="w-24 bg-gray-200 rounded-full h-1">
                                <div 
                                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${file.progress}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload Summary */}
            {uploadedFiles.length > 0 && (
              <Card className="border-none shadow-xl bg-gradient-to-br from-white to-green-50/30">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900">Upload Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedClaim && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Selected Claim:</span>
                        <span className="font-semibold">{selectedClaim}</span>
                      </div>
                    )}
                    {selectedDocumentType && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Document Type:</span>
                        <span className="font-semibold">{selectedDocumentType}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Files:</span>
                      <span className="font-semibold">{uploadedFiles.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Successfully Uploaded:</span>
                      <span className="font-semibold text-green-600">
                        {uploadedFiles.filter(f => f.status === 'success').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending Upload:</span>
                      <span className="font-semibold text-yellow-600">
                        {uploadedFiles.filter(f => f.status === 'pending').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Currently Uploading:</span>
                      <span className="font-semibold text-blue-600">
                        {uploadedFiles.filter(f => f.status === 'uploading').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Size:</span>
                      <span className="font-semibold">
                        {formatFileSize(uploadedFiles.reduce((acc, file) => acc + file.size, 0))}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <Button 
                      className="w-full bg-white text-gray-700 border-2 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-500 transition-all duration-300"
                      onClick={handleSubmitDocuments}
                    >
                      Submit All Documents
                    </Button>
                    {/* <Button className="w-full bg-white text-gray-700 border-2 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-500 transition-all duration-300">
                      Save as Draft
                    </Button> */}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDocumentUpload;
