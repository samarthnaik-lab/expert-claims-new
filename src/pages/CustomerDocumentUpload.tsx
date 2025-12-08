import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Upload, FileText, X, CheckCircle, AlertCircle, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    const fetchCustomerCase = async () => {
      try {
        setLoading(true);
  
        // Get user_id from local storage
        const sessionData = localStorage.getItem('expertclaims_session');
        let userId = null;
  
        if (sessionData) {
          try {
            const parsedSession = JSON.parse(sessionData);
            userId = parsedSession.userId;
          } catch (e) {
            console.error('Error parsing session data:', e);
          }
        }
  
        if (!userId) {
          console.error('No user_id found in session');
          setLoading(false);
          return;
        }
  
        // Build FormData payload
        const formData = new FormData();
        formData.append('user_id', userId);
  
        const response = await fetch(
          'https://n8n.srv952553.hstgr.cloud/webhook/customer-case',
          {
            method: 'POST',
            headers: {
              'apikey':
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
              Authorization:
                'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
              session_id: '4e4a442a-bcb6-48cf-a573-3740a3d295c3',
              'Accept-Profile': 'expc',
              'Content-Profile': 'expc',
              jwt_token:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiIsInBhc3N3b3JkIjoiIiwiaWF0IjoxNzU2NzkzMjA3fQ.R8N3U28XD4zQ_ixGNgtBtUKK5F8gGaQg8lrPPWr88dY',
              // ❌ Do not set "Content-Type", fetch will set it for FormData
            },
            body: formData,
          }
        );
  
        if (response.ok) {
          const data = await response.json();
          setCaseData(data); 
          console.log('Customer case data:', data);
          console.log('Data structure:', JSON.stringify(data, null, 2));
        } else {
          console.error('Failed to fetch customer case');
        }
      } catch (error) {
        console.error('Error fetching customer case:', error);
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
      // Get user_id and employee_id from case data
      const selectedClaimData = caseData.find((claim: any) => claim.case_id === selectedClaim);
      const employeeId = selectedClaimData?.employee_id || '';
      
      // Get category_id from selected document type
      const selectedCategory = getAvailableDocumentTypes().find(cat => cat.id.toString() === selectedDocumentType);
      const categoryId = selectedCategory?.id || '';
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('data', uploadedFile.file);
      formData.append('case_id', selectedClaim);
      formData.append('category_id', categoryId.toString());
      formData.append('emp_id', employeeId.toString());
      formData.append('is_customer', 'yes');
      
      // Update progress to show upload starting
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id 
          ? { ...file, progress: 10 }
          : file
      ));
      
      const response = await fetch(
        'https://n8n.srv952553.hstgr.cloud/webhook/upload',
        {
          method: 'POST',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5bmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5bmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
            'session_id': 'd012f756-cb15-4ca2-abe2-57305d399f08',
            'jwt_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiIsInBhc3N3b3JkIjoiIiwiaWF0IjoxNzU2NDcyNzQwfQ.i7Vu6E-r1iaEvsnCUcD8DAy4SP6_enoRrGRviGdi1p8',
            'Accept-Profile': 'expc',
            'Content-Profile': 'expc',
            // Don't set Content-Type for FormData
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

      // Call the submission API
      const response = await fetch(
        'https://n8n.srv952553.hstgr.cloud/webhook/submit-documents',
        {
          method: 'POST',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5bmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5bmVxIiwicm9sZSI6InJlZiI6IndyYm5sdmdlY3pueXFlbHJ5bmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
            'session_id': 'd012f756-cb15-4ca2-abe2-57305d399f08',
            'jwt_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiIsInBhc3N3b3JkIjoiIiwiaWF0IjoxNzU2NTQ3MjAzfQ.rW9zIfo1-B_Wu2bfJ8cPai0DGZLfaapRE7kLt2dkCBc',
            'Accept-Profile': 'expc',
            'Content-Profile': 'expc',
            'Content-Type': 'application/json',
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

        const response = await fetch(
          "https://n8n.srv952553.hstgr.cloud/webhook/getdocumentcatagories",
          {
            method: "GET", // default since curl has no --data
            headers: {
              apikey:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws",
              Authorization:
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws",
              "Content-Profile": "expc",
              "Accept-Profile": "expc",
              session_id: "a9bfe0a4-1e6c-4c69-860f-ec50846a7da6",
              jwt_token:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiIsInBhc3N3b3JkIjoiIiwiaWF0IjoxNzU2NTQ3MjAzfQ.rW9zIfo1-B_Wu2bfJ8cPai0DGZLfaapRE7kLt2dkCBc",
              "Content-Type": "application/json",
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
