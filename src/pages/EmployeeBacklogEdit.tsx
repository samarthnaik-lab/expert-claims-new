import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, FileText, Clock, ZoomIn, ZoomOut, RotateCcw, XCircle, Upload, RefreshCw, Trash2, Users, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { buildApiUrl } from "@/config/api";

interface BacklogDetail {
  status: any;
  backlog_id: string;
  case_summary: string;
  case_description: string;
  case_type_id: number;
  backlog_referring_partner_id: number;
  backlog_referral_date: string;
  created_time: string;
  created_by: number | string;
  updated_by: number | string;
  updated_time: string;
  deleted_flag: boolean;
  comment_text: string | null;
  feedback?: string;
  assigned_consultant_name?: string;
  assigned_to?: number;
  expert_report_generated?: boolean;
  partner_name?: string;
  backlog_comments?: {
    backlog_commentid: number;
    backlog_id: string;
    comment_text: string;
    created_by: number;
    created_time: string;
    createdby_name: string;
    updated_by: number;
    updated_time: string;
    updatedby_name: string;
    department?: string;
  }[];
  case_types?: {
    case_type_name: string;
  };
  backlog_documents?: {
    document_id: number;
    category_id: number;
    original_filename: string;
    stored_filename: string;
    access_count: number;
    checksum: string | null;
  }[];
}

interface Employee {
  employee_id: number;
  name: string;
  department: string;
  role: string;
}

const EmployeeBacklogEdit = () => {
  const navigate = useNavigate();
  const { backlogId } = useParams<{ backlogId: string }>();
  const { getAuthHeaders } = useAuth();
  const [backlogDetail, setBacklogDetail] = useState<BacklogDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [employeeDepartment, setEmployeeDepartment] = useState<string>('');
  
  // Document viewer modal states
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(null);

  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Document deletion state
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);

  // Edit form states
  const [selectedCaseType, setSelectedCaseType] = useState<string>("");
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [caseTypes, setCaseTypes] = useState<Array<{case_type_id: number, case_type_name: string}>>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingCaseTypes, setIsLoadingCaseTypes] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Comment states
  const [newComment, setNewComment] = useState<string>("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);

  // Expert summary and report generation for technical_consultant
  const [expertSummary, setExpertSummary] = useState<string>("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Document types for employees
  const documentTypes = [
    { id: "1", name: "Insurance Policy", isMandatory: false }
  ];

  // Priority options
  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  // Status options
  const statusOptions = [
    { value: "new", label: "New" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  useEffect(() => {
    if (backlogId) {
      fetchBacklogDetail(backlogId);
    }
    getEmployeeName();
    fetchCaseTypes();
    fetchEmployees();
  }, [backlogId]);

  // Control body scroll when modal is open
  useEffect(() => {
    if (showDocumentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDocumentModal]);

  // Zoom and pan handler functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 300)); // Max zoom 300%
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50)); // Min zoom 50%
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
    setPanX(0);
    setPanY(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 100) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 100) {
      const sensitivity = 0.7; // Reduce sensitivity for slower movement
      const newPanX = (e.clientX - dragStart.x) * sensitivity;
      const newPanY = (e.clientY - dragStart.y) * sensitivity;
      
      // Limit panning to prevent image from going too far out of view
      const maxPan = 200; // Adjust this value to control how far you can pan
      setPanX(Math.max(-maxPan, Math.min(maxPan, newPanX)));
      setPanY(Math.max(-maxPan, Math.min(maxPan, newPanY)));
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel(prev => Math.min(prev + 10, 300));
    } else {
      setZoomLevel(prev => Math.max(prev - 10, 50));
    }
  };

  const getEmployeeName = () => {
    try {
      // Try to get employee name from localStorage
      const userDetailsStr = localStorage.getItem("expertclaims_user_details");
      if (userDetailsStr) {
        const userDetails = JSON.parse(userDetailsStr);
        const userData = Array.isArray(userDetails) ? userDetails[0] : userDetails;
        const name = userData?.name || userData?.first_name || 'Employee';
        const department = userData?.department || '';
        setEmployeeName(name);
        setEmployeeDepartment(department);
        console.log('Employee name found:', name);
        console.log('Employee department:', department);
        return;
      }

      setEmployeeName('Employee');
      setEmployeeDepartment('');
    } catch (error) {
      console.error('Error getting employee name:', error);
      setEmployeeName('Employee');
      setEmployeeDepartment('');
    }
  };

  const fetchCaseTypes = async () => {
    setIsLoadingCaseTypes(true);
    try {
      // Use hardcoded insurance case types
      const insuranceCaseTypes = [
        { case_type_id: 1, case_type_name: "Fire Insurance" },
        { case_type_id: 2, case_type_name: "Industrial All Risks Insurance" },
        { case_type_id: 3, case_type_name: "Marine Insurance" },
        { case_type_id: 4, case_type_name: "Engineering Insurance" },
        { case_type_id: 5, case_type_name: "Liability Insurance" }
      ];
      setCaseTypes(insuranceCaseTypes);
    } catch (error) {
      console.error("Error setting case types:", error);
      toast({
        title: "Error",
        description: "Failed to load case types",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCaseTypes(false);
    }
  };

  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      console.log('Fetching technical consultants from API...');
      
      // Get auth headers from context
      const authHeaders = getAuthHeaders();
      
      // Get session details
      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '';
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        sessionId = session.sessionId || '';
      }
      
      const response = await fetch(buildApiUrl('support/gettechnicalconsultant'), {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'apikey': 'YOUR_API_KEY', // Update with your actual API key if needed
          'authorization': authHeaders['Authorization'] || 'Bearer YOUR_TOKEN',
          'session_id': authHeaders['X-Session-ID'] || sessionId || 'YOUR_SESSION_ID',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Technical consultants API response:', data);
        
        // Transform the API response to match our Employee interface
        const transformedEmployees = data.map((consultant: any) => ({
          employee_id: consultant.employee_id,
          name: `${consultant.first_name} ${consultant.last_name}`,
          department: consultant.department,
          role: consultant.designation
        }));
        
        setEmployees(transformedEmployees);
        toast({
          title: "Success",
          description: `Loaded ${transformedEmployees.length} technical consultants`,
        });
      } else {
        console.error('Failed to fetch technical consultants:', response.status);
        toast({
          title: "Error",
          description: "Failed to load technical consultants",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching technical consultants:", error);
      toast({
        title: "Error",
        description: "Failed to load technical consultants",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const fetchBacklogDetail = async (id: string) => {
    setIsLoading(true);
    try {
      // Get auth headers from context
      const authHeaders = getAuthHeaders();
      
      // Get session details
      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '';
      let jwtToken = '';
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        sessionId = session.sessionId || '';
        jwtToken = session.jwtToken || '';
      }

      // Call the support API endpoint to get single backlog detail by ID
      const response = await fetch(
        `${buildApiUrl('support/backlog_id')}?backlog_id=${id}`,
        {
          method: "GET",
          headers: {
            'accept': 'application/json',
            'apikey': 'YOUR_API_KEY', // Update with your actual API key if needed
            'authorization': authHeaders['Authorization'] || (jwtToken ? `Bearer ${jwtToken}` : 'Bearer YOUR_TOKEN'),
            'session_id': authHeaders['X-Session-ID'] || sessionId || 'YOUR_SESSION_ID',
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("API Response data:", data);
        
        // Handle array response (API returns array with single backlog item)
        let backlogData = null;
        if (Array.isArray(data) && data.length > 0) {
          backlogData = data[0];
        } else if (data && typeof data === 'object' && data.backlog_id) {
          backlogData = data;
        }
        
        if (backlogData) {
          console.log("Backlog detail data:", backlogData);
          setBacklogDetail(backlogData);
          // Set initial values for dropdowns
          setSelectedCaseType(backlogData.case_type_id?.toString() || "");
          setSelectedDocumentType("Insurance Policy"); // Default to Insurance Policy name
          setSelectedPriority("medium"); // Default priority
          setSelectedStatus("new"); // Default status
          
          // Auto-select assigned consultant if available
          if (backlogData.assigned_to) {
            console.log("Auto-selecting assigned consultant:", backlogData.assigned_consultant_name, "ID:", backlogData.assigned_to);
            setSelectedAssignee(backlogData.assigned_to.toString());
          }
          
          // Auto-populate status from API response
          if (backlogData.status) {
            console.log("Auto-selecting status:", backlogData.status);
            setSelectedStatus(backlogData.status.toLowerCase().replace(/\s+/g, '_'));
          }
        } else {
          toast({
            title: "Error",
            description: "No data found for this Case",
            variant: "destructive",
          });
        }
      } else {
        console.error("Failed to fetch backlog detail:", response.status);
        toast({
          title: "Error",
          description: "Failed to fetch Case details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching backlog detail:", error);
      toast({
        title: "Error",
        description: "Error loading Case details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const viewDocument = async (documentId: number) => {
    try {
      setViewingDocumentId(documentId.toString());
      console.log('Viewing document with ID:', documentId);
      
      // Get session data from localStorage
      const sessionData = localStorage.getItem('expertclaims_session');
      if (!sessionData) {
        toast({
          title: "Error",
          description: "Please log in to view documents",
          variant: "destructive",
        });
        return;
      }

      const session = JSON.parse(sessionData);
      const sessionId = session.sessionId;
      const jwtToken = session.jwtToken;

      if (!sessionId || !jwtToken) {
        toast({
          title: "Error",
          description: "Invalid session. Please log in again",
          variant: "destructive",
        });
        return;
      }

      // Call the support API to get document view
      console.log('Calling support API for document view...');
      console.log('Document ID:', documentId);
      
      const requestBody = {
        document_id: documentId
      };
      console.log('Request body:', requestBody);
      
      // Supabase service role key
      const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws';
      
      const response = await fetch(buildApiUrl('support/partnerdocumentview'), {
        method: 'POST',
        headers: {
          'session_id': sessionId,
          'jwt_token': jwtToken,
          'apikey': supabaseServiceRoleKey,
          'authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        console.error('Failed to call document view API:', response.status, response.statusText);
        
        // Try to get error details
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.text();
          console.error('Error response body:', errorData);
          errorMessage += ` - ${errorData}`;
        } catch (e) {
          console.error('Could not parse error response');
        }
        
        toast({
          title: "Error",
          description: `Failed to get document view URL: ${errorMessage}`,
          variant: "destructive",
        });
        return;
      }

      // Since the API returns binary image data (as shown in Postman), handle it directly
      console.log('Response received, processing binary data...');
      
      try {
        // Get the response as a blob (binary data)
        const blob = await response.blob();
        console.log('Blob created, size:', blob.size, 'bytes');
        console.log('Blob type:', blob.type);
        
        // Create a URL for the blob
        const fileUrl = URL.createObjectURL(blob);
        console.log('Created blob URL:', fileUrl);
        
        // Determine file type based on blob type or try to detect from content
        const blobType = blob.type;
        console.log('Detected blob type:', blobType);
        
        // Set document URL and type for modal display
        setDocumentUrl(fileUrl);
        setDocumentType(blobType || 'unknown');
        setShowDocumentModal(true);
        
        toast({
          title: "Success",
          description: "Document opened successfully",
        });
        
        // Clean up the blob URL after some time to free memory
        setTimeout(() => {
          URL.revokeObjectURL(fileUrl);
          console.log('Blob URL cleaned up');
        }, 30000); // 30 seconds
        
      } catch (blobError) {
        console.error('Error creating blob from response:', blobError);
        
        // Fallback: try to get response as text first
        try {
          const textResponse = await response.text();
          console.log('Response as text (first 200 chars):', textResponse.substring(0, 200));
          
          // If it looks like a URL, try to open it
          if (textResponse.startsWith('http')) {
            console.log('Opening URL from response:', textResponse);
            setDocumentUrl(textResponse);
            setDocumentType('url');
            setShowDocumentModal(true);
          } else {
            throw new Error('Response is not a URL');
          }
        } catch (textError) {
          console.error('Error handling response as text:', textError);
          toast({
            title: "Error",
            description: "Failed to process document response",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: "Failed to view document",
        variant: "destructive",
      });
    } finally {
      setViewingDocumentId(null);
    }
  };

  // File upload functionality
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const deleteDocument = async (documentId: number) => {
    setDeletingDocumentId(documentId);
    try {
      // Get session data from localStorage
      const sessionData = localStorage.getItem('expertclaims_session');
      if (!sessionData) {
        toast({
          title: "Error",
          description: "Please log in to delete documents",
          variant: "destructive",
        });
        setDeletingDocumentId(null);
        return;
      }

      const session = JSON.parse(sessionData);
      const sessionId = session.sessionId;
      const jwtToken = session.jwtToken;

      if (!sessionId || !jwtToken) {
        toast({
          title: "Error",
          description: "Invalid session. Please log in again",
          variant: "destructive",
        });
        setDeletingDocumentId(null);
        return;
      }

      // Supabase service role key
      const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws';

      const response = await fetch(
        `${buildApiUrl('support/removedocument')}?document_id=${documentId}`,
        {
          method: 'PATCH',
          headers: {
            'session_id': sessionId,
            'jwt_token': jwtToken,
            'apikey': supabaseServiceRoleKey,
            'authorization': `Bearer ${supabaseServiceRoleKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok || response.status === 204) {
        toast({
          title: "Success",
          description: "Document removed successfully",
        });
        
        // Immediately remove the document from the UI
        if (backlogDetail) {
          setBacklogDetail(prev => ({
            ...prev!,
            backlog_documents: prev!.backlog_documents?.filter(doc => doc.document_id !== documentId) || []
          }));
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to remove document",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing document:', error);
      toast({
        title: "Error",
        description: "Failed to remove document",
        variant: "destructive",
      });
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !backlogDetail) return;
    let email = 'admin@exampleerror.com';
    let role = 'admin';
    let designation = 'admin';
    let department = 'admin';
    let partnerId = 0;
    const userDetailsStr = localStorage.getItem("expertclaims_user_details");
    if (userDetailsStr) {
      const userDetails = JSON.parse(userDetailsStr);
      let userData = Array.isArray(userDetails) ? userDetails[0] : userDetails;
      partnerId = userData.userid;
      email = userData.email;
      role = userData.role;
      designation = userData.designation;
      department = userData.department;
    }
    else {
      partnerId = 436;
      email = 'admin@exampleerror.com';
      role = 'admin';
      designation = 'admin';
      department = 'admin';
    }
  
    setIsAddingComment(true);
    try {
      // Get auth headers from context
      const authHeaders = getAuthHeaders();
      
      // Get session details
      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '';
      let jwtToken = '';
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        sessionId = session.sessionId || '';
        jwtToken = session.jwtToken || '';
      }

      const response = await fetch(
        buildApiUrl("support/comments_insert"),
        {
          method: "POST",
          headers: {
            'accept': 'application/json',
            'apikey': 'YOUR_API_KEY', // Update with your actual API key if needed
            'authorization': authHeaders['Authorization'] || (jwtToken ? `Bearer ${jwtToken}` : 'Bearer YOUR_TOKEN'),
            'session_id': authHeaders['X-Session-ID'] || sessionId || 'YOUR_SESSION_ID',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            backlog_id: backlogDetail.backlog_id,
            comment_text: newComment.trim(),
            created_by: partnerId, // Employee ID - should be dynamic
            createdby_name: employeeName,
            updated_by: partnerId,
            email: email,
            role: role,
            department: department,
            updatedby_name: employeeName
          }),
        }
      );

      if (response.ok) {
        // Add the new comment to the UI immediately
        const newCommentObj = {
          backlog_commentid: Date.now(), // Temporary ID
          backlog_id: backlogDetail.backlog_id,
          comment_text: newComment.trim(),
          created_by: partnerId,
          created_time: new Date().toISOString(),
          createdby_name: employeeName,
          updated_by: partnerId,
          updated_time: new Date().toISOString(),
           email: email,
            role: role,
            department: department,
          updatedby_name: employeeName
        };

        setBacklogDetail(prev => {
          if (!prev) return null;
          return {
            ...prev,
            backlog_comments: [...(prev.backlog_comments || []), newCommentObj]
          };
        });

        setNewComment("");
        setShowAddComment(false);
        toast({
          title: "Success",
          description: "Comment added successfully",
        });
      } else {
        console.error("Failed to add comment:", response.status);
        toast({
          title: "Error",
          description: "Failed to add comment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Error adding comment",
        variant: "destructive",
      });
    } finally {
      setIsAddingComment(false);
    }
  };

  const uploadDocuments = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No Files",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      for (const file of uploadedFiles) {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('backlog_id', backlogDetail!.backlog_id.toString());
        formData.append('document_type', selectedDocumentType || 'Insurance Policy');

        const response = await fetch('https://n8n.srv952553.hstgr.cloud/webhook/partnerbacklogentrydoc', {
          method: 'POST',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3ODYsImV4cCI6MjA3MDQ4Mjc4Nn0.Ssi2327jY_9cu5lQorYBdNjJJBWejz91j_kCgtfaj0o',
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3ODYsImV4cCI6MjA3MDQ4Mjc4Nn0.Ssi2327jY_9cu5lQorYBdNjJJBWejz91j_kCgtfaj0o',
            'session_id': '0276776c-99fa-4b79-a5a2-70f3a428a0c7'
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }
      }

      toast({
        title: "Success",
        description: `Successfully uploaded ${uploadedFiles.length} document(s)`,
      });

      // Clear uploaded files
      setUploadedFiles([]);
      
      // Refresh backlog data
      fetchBacklogDetail(backlogId!);
      
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTask = async () => {
    if (!expertSummary.trim()) {
      toast({
        title: "Expert Summary Required",
        description: "Please enter an expert summary before adding task",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get auth headers from context
      const authHeaders = getAuthHeaders();
      
      // Get session details
      const sessionStr = localStorage.getItem("expertclaims_session");
      let sessionId = '';
      let jwtToken = '';
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        sessionId = session.sessionId || '';
        jwtToken = session.jwtToken || '';
      }

      // Get user details
      let userId = 0;
      let userName = "";
      const userDetailsStr = localStorage.getItem("expertclaims_user_details");
      if (userDetailsStr) {
        const userDetailsData = JSON.parse(userDetailsStr);
        const userDetails = Array.isArray(userDetailsData) ? userDetailsData[0] : userDetailsData;
        userId = userDetails.employee_id || userDetails.id || 0;
        userName = userDetails.employee_name || userDetails.name || "";
      }

      // Call the new API to update status with expert_description
      const response = await fetch(buildApiUrl("support/updatestatustechnicalconsultant"), {
        method: "PATCH",
        headers: {
          'accept': 'application/json',
          'apikey': 'YOUR_API_KEY', // Update with your actual API key if needed
          'authorization': authHeaders['Authorization'] || (jwtToken ? `Bearer ${jwtToken}` : 'Bearer YOUR_TOKEN'),
          'session_id': authHeaders['X-Session-ID'] || sessionId || 'YOUR_SESSION_ID',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          backlog_id: backlogDetail?.backlog_id,
          status: selectedStatus || "completed",
          expert_description: expertSummary,
          updated_by: userName,
          user_id: userId
        }),
      });

      if (response.ok) {
        toast({
          title: "Task Added Successfully",
          description: "Task has been added with expert description",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add task",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const generateExportReport = async () => {
    if (!expertSummary.trim()) {
      toast({
        title: "Expert Summary Required",
        description: "Please enter an expert summary before generating the report",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingReport(true);
    try {
      const escapeHtml = (text: string) => {
        if (!text) return '';
        const map: { [key: string]: string } = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
      };

      // Create the report content with professional styling like invoice
      const reportContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Expert Report</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;color:#333;background:#fff}
  .report-container{width:800px;margin:0 auto;padding:15px;font-size:14px}
  .company-logo{width:100%;max-height:140px;object-fit:contain;display:block;margin-bottom:6px}
  .title-line{border-bottom:1px solid #333;margin-bottom:4px}
  .report-title{text-align:center;font-size:22px;font-weight:700;margin-bottom:15px;color:#333}
  table{width:100%;border-collapse:collapse;table-layout:fixed;font-weight:bold}
  th,td{border:1px solid #333;padding:8px;vertical-align:middle}
  thead th{background:#f0f0f0;font-weight:bold;font-size:12px}
  .bg-gray{background:#f0f0f0}
  .text-right{text-align:right}
  .text-center{text-align:center}
  .footer-bar{background:#dc2626;height:2px;margin:10px 0 5px 0}
  .footer-info{text-align:center;font-size:11px;color:#333;line-height:1.1}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
  <div class="report-container">
    <img src="https://expert-claims-g8p9.vercel.app/leaders/invoice_image.png" class="company-logo" alt="Logo" />
    <div class="title-line"></div>
    <div class="report-title">EXPERT REPORT</div>
    
    <table style="margin-bottom:0; border-bottom:none;">
      <colgroup>
        <col style="width:50%"><col style="width:50%">
      </colgroup>
      <tbody>
        <tr style="height:40px;">
          <td class="bg-gray" style="text-align:left;">
            <div style="display:flex; align-items:center; height:100%; margin-top:-8px">
              Report ID: ${escapeHtml(backlogDetail?.backlog_id || 'N/A')}
            </div>
          </td>
          <td class="bg-gray" style="text-align:right;">
            <div style="display:flex; align-items:center; height:100%; margin-top:-8px">
              Generated on: ${new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <table style="margin-top:0;">
      <colgroup>
        <col style="width:30%"><col style="width:70%">
      </colgroup>
      <thead>
        <tr class="bg-gray">
          <th>Field</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight:bold">Case ID</td>
          <td>${escapeHtml(backlogDetail?.backlog_id || 'N/A')}</td>
        </tr>
        <tr>
          <td style="font-weight:bold">Task Summary</td>
          <td>${escapeHtml(backlogDetail?.case_summary || 'N/A')}</td>
        </tr>
        <tr>
          <td style="font-weight:bold">Service Type</td>
          <td>${escapeHtml(
            selectedCaseType 
              ? caseTypes.find(ct => ct.case_type_id.toString() === selectedCaseType)?.case_type_name 
              : backlogDetail?.case_types?.case_type_name || `Type ${backlogDetail?.case_type_id}` || 'N/A'
          )}</td>
        </tr>
        <tr>
          <td style="font-weight:bold">Created Date</td>
          <td>${backlogDetail?.created_time ? new Date(backlogDetail.created_time).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          }) : 'N/A'}</td>
        </tr>
      </tbody>
    </table>

    <table style="margin-top:15px;">
      <colgroup>
        <col style="width:100%">
      </colgroup>
      <thead>
        <tr class="bg-gray">
          <th>Expert Summary</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:12px; white-space:pre-wrap; line-height:1.6">${escapeHtml(expertSummary)}</td>
        </tr>
      </tbody>
    </table>

    <table style="margin-top:15px;">
      <colgroup>
        <col style="width:100%">
      </colgroup>
      <thead>
        <tr class="bg-gray">
          <th>Disclaimer</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:12px; line-height:1.5; font-size:12px">
            This report contains expert analysis and recommendations based on the provided case information. The analysis is conducted by qualified professionals and is intended for internal use only. Expert Claims Solutions reserves the right to update or modify this report as new information becomes available.
          </td>
        </tr>
      </tbody>
    </table>

    <div class="footer-bar"></div>
    <div class="footer-info">
      <div>Expert Claims Solutions | Professional Insurance Consulting</div>
      <div>Report ID: EXP-${backlogDetail?.backlog_id}-${new Date().toISOString().split('T')[0]}</div>
    </div>
  </div>
</body>
</html>
      `;

      // Use the same approach as invoice generator - create hidden DOM element
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = reportContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      // Import html2canvas and jsPDF dynamically
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidthMm = 210;
      const pageHeightMm = 295;
      const pxToMm = (px: number) => px * 0.264583;
      const imgWidthMm = pxToMm(canvas.width);
      const imgHeightMm = pxToMm(canvas.height);

      let renderWidth = pageWidthMm;
      let renderHeight = (imgHeightMm * renderWidth) / imgWidthMm;
      if (renderHeight > pageHeightMm) {
        const scale = pageHeightMm / renderHeight;
        renderWidth = renderWidth * scale;
        renderHeight = renderHeight * scale;
      }

      const xOffset = (pageWidthMm - renderWidth) / 2;
      const yOffset = 0;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderWidth, renderHeight);
      pdf.save(`Expert_Claims_Report_${backlogDetail?.backlog_id}_${new Date().toISOString().split('T')[0]}.pdf`);

      // Update expert report generated status - Complete status will now be enabled
      setBacklogDetail(prev => ({
        ...prev,
        expert_report_generated: true
      }));
      
      // Automatically change status to completed
      setSelectedStatus("completed");

      // Automatically call the status update API
      try {
        // Get current user details for API call
        const userDetailsStr = localStorage.getItem("expertclaims_user_details");
        let currentUser = { name: employeeName, employee_id: 1 };
        
        if (userDetailsStr) {
          const userDetails = JSON.parse(userDetailsStr);
          const userData = Array.isArray(userDetails) ? userDetails[0] : userDetails;
          currentUser = {
            name: userData?.name || userData?.first_name || employeeName,
            employee_id: userData?.employee_id || userData?.id || 1
          };
        }

        // Get auth headers from context
        const authHeaders = getAuthHeaders();
        
        // Get session details
        const sessionStr = localStorage.getItem('expertclaims_session');
        let sessionId = '';
        let jwtToken = '';
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          sessionId = session.sessionId || '';
          jwtToken = session.jwtToken || '';
        }

        const requestBody = {
          backlog_id: backlogDetail?.backlog_id,
          status: "completed",
          expert_description: expertSummary,
          updated_by: currentUser.name,
          user_id: currentUser.employee_id
        };

        const response = await fetch(buildApiUrl('support/updatestatustechnicalconsultant'), {
          method: 'PATCH',
          headers: {
            'accept': 'application/json',
            'apikey': 'YOUR_API_KEY', // Update with your actual API key if needed
            'authorization': authHeaders['Authorization'] || (jwtToken ? `Bearer ${jwtToken}` : 'Bearer YOUR_TOKEN'),
            'session_id': authHeaders['X-Session-ID'] || sessionId || 'YOUR_SESSION_ID',
            'content-type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          console.log('Status automatically updated to completed via API');
          // Refresh the backlog detail to show updated status
          fetchBacklogDetail(backlogId!);
        } else {
          console.error('Failed to automatically update status:', response.status);
        }
      } catch (apiError) {
        console.error('Error calling status update API:', apiError);
      }

      toast({
        title: "Report Generated",
        description: "Expert report has been downloaded successfully. Status updated to Complete.",
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const saveChanges = async () => {
    if (!backlogDetail) return;

    try {
      // Get current user details for updated_by
      const userDetailsStr = localStorage.getItem("expertclaims_user_details");
      let currentUser = { name: employeeName, employee_id: 1 }; // Default fallback
      
      if (userDetailsStr) {
        const userDetails = JSON.parse(userDetailsStr);
        const userData = Array.isArray(userDetails) ? userDetails[0] : userDetails;
        currentUser = {
          name: userData?.name || userData?.first_name || employeeName,
          employee_id: userData?.employee_id || userData?.id || 1
        };
      }

      // Handle Gap Analysis users - can assign consultants
      if (employeeDepartment.toLowerCase() === 'gap_analysis') {
        // Check if a consultant is selected
        if (!selectedAssignee) {
          toast({
            title: "No Consultant Selected",
            description: "Please select a consultant to assign",
            variant: "destructive",
          });
          return;
        }

        // Get the selected consultant details
        const selectedConsultant = employees.find(emp => emp.employee_id.toString() === selectedAssignee);
        if (!selectedConsultant) {
          toast({
            title: "Error",
            description: "Selected consultant not found",
            variant: "destructive",
          });
          return;
        }

        // Prepare the API request body for consultant assignment
        const requestBody = {
          backlog_id: backlogDetail.backlog_id,
          assigned_consultant_name: selectedConsultant.name,
          assigned_to: parseInt(selectedAssignee),
          updated_by: currentUser.name,
          user_id: currentUser.employee_id
        };

        console.log('Updating consultant assignment:', requestBody);

        // Get auth headers from context
        const authHeaders = getAuthHeaders();
        
        // Get session details
        const sessionStr = localStorage.getItem('expertclaims_session');
        let sessionId = '';
        let jwtToken = '';
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          sessionId = session.sessionId || '';
          jwtToken = session.jwtToken || '';
        }

        // Call the support API to update consultant assignment
        const response = await fetch(buildApiUrl('support/updatecunsultantpolicy'), {
          method: 'PATCH',
          headers: {
            'accept': 'application/json',
            'apikey': 'YOUR_API_KEY', // Update with your actual API key if needed
            'authorization': authHeaders['Authorization'] || (jwtToken ? `Bearer ${jwtToken}` : 'Bearer YOUR_TOKEN'),
            'session_id': authHeaders['X-Session-ID'] || sessionId || 'YOUR_SESSION_ID',
            'content-type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Consultant assignment updated successfully:', result);
          
          toast({
            title: "Success",
            description: `Case assigned to ${selectedConsultant.name} successfully`,
          });
          
          // Optionally refresh the backlog detail to show updated assignment
          fetchBacklogDetail(backlogId!);
        } else {
          console.error('Failed to update consultant assignment:', response.status);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          
          toast({
            title: "Error",
            description: "Failed to assign consultant. Please try again.",
            variant: "destructive",
          });
        }
      }
      // Handle Technical Consultant users - can update status
      else if (employeeDepartment.toLowerCase() === 'technical_consultant') {
        // Check if status is selected
        if (!selectedStatus) {
          toast({
            title: "No Status Selected",
            description: "Please select a status to update",
            variant: "destructive",
          });
          return;
        }

        // Convert status value to display format
        const statusDisplay = selectedStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Get auth headers from context
        const authHeaders = getAuthHeaders();
        
        // Get session details
        const sessionStr = localStorage.getItem('expertclaims_session');
        let sessionId = '';
        let jwtToken = '';
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          sessionId = session.sessionId || '';
          jwtToken = session.jwtToken || '';
        }

        // Prepare the API request body for status update
        const requestBody = {
          backlog_id: backlogDetail.backlog_id,
          updated_by: currentUser.name,
          user_id: currentUser.employee_id,
          status: statusDisplay
        };

        console.log('Updating case status:', requestBody);

        // Call the new API to update status
        const response = await fetch(buildApiUrl('support/updatestatustechnicalconsultant'), {
          method: 'PATCH',
          headers: {
            'accept': 'application/json',
            'apikey': 'YOUR_API_KEY', // Update with your actual API key if needed
            'authorization': authHeaders['Authorization'] || (jwtToken ? `Bearer ${jwtToken}` : 'Bearer YOUR_TOKEN'),
            'session_id': authHeaders['X-Session-ID'] || sessionId || 'YOUR_SESSION_ID',
            'content-type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Status updated successfully:', result);
          
          toast({
            title: "Success",
            description: `Case status updated to ${statusDisplay} successfully`,
          });
          
          // Optionally refresh the backlog detail to show updated status
          fetchBacklogDetail(backlogId!);
        } else {
          console.error('Failed to update status:', response.status);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          
          toast({
            title: "Error",
            description: "Failed to update status. Please try again.",
            variant: "destructive",
          });
        }
      }
      // Handle other users
      else {
        toast({
          title: "Access Denied",
          description: "You don't have permission to make changes to this case",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-500 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg rounded-lg bg-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600">Loading Case details...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!backlogDetail) {
    return (
      <div className="min-h-screen bg-primary-500 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg rounded-lg bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">Edit Case</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => navigate("/employee-dashboard")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Case not found</h3>
                <p className="text-gray-500">The requested Case could not be found.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-500 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg rounded-lg bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Edit Assignment</CardTitle>
              <Button
                variant="outline"
                onClick={() => navigate("/employee-dashboard")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Case ID and Status */}
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-semibold">Policy ID: #{backlogDetail.backlog_id}</h2>
                  <Badge
                    className={`${
                        backlogDetail.status?.toLowerCase() === "new"
                        ? "bg-yellow-100 text-yellow-800"
                        : backlogDetail.status?.toLowerCase() === "in progress"
                        ? "bg-blue-100 text-blue-800"
                        : backlogDetail.status?.toLowerCase() === "complete"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    } px-3 py-1 rounded-full font-medium`}
                    >
                    {backlogDetail.status
                        ? backlogDetail.status.charAt(0).toUpperCase() + backlogDetail.status.slice(1)
                        : "N/A"}
                    </Badge>
                </div>
              </div>
            </div>

            {/* Case Summary */}
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Assignment Summary</h3>
              <p className="text-gray-700">{backlogDetail.case_summary}</p>
            </div>

            {/* Case Description */}
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Policy Description</h3>
              <p className="text-gray-700">{backlogDetail.case_description}</p>
            </div>

            {/* Expert Summary and Generate Report - Only for technical_consultant and gap_analysis */}
            {(employeeDepartment.toLowerCase() === 'technical_consultant' || employeeDepartment.toLowerCase() === 'gap_analysis') && (
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                {/* <h3 className="text-lg font-semibold mb-4 text-gray-900">Expert Summary & Report Generation</h3> */}
                
                <div className="space-y-4">
                  {/* Expert Summary Field */}
                  <div>
                    <Label htmlFor="expertSummary" className="text-lg font-medium text-gray-700 mb-2 block">
                    Expert's Report *
                    </Label>
                    <Textarea
                      id="expertSummary"
                      value={expertSummary}
                      onChange={(e) => setExpertSummary(e.target.value)}
                      placeholder="Enter your expert analysis and summary here..."
                      rows={6}
                      className="w-full"
                    />
                  </div>

                  {/* Generate Report and Add Task Buttons */}
                  <div className="flex justify-between">
                    <Button
                      onClick={handleAddTask}
                      disabled={!expertSummary.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Add Summary
                    </Button>
                    <Button
                      onClick={generateExportReport}
                      disabled={!expertSummary.trim() || isGeneratingReport}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                    >
                      {isGeneratingReport ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating Report...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Print Report
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Case Details Grid */}
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-orange-500">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Policy Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Type of Policy</h4>
                 {/* <p className="text-gray-700">{backlogDetail.case_types?.case_type_name || `Type ${backlogDetail.case_type_id}`} </p> */}

                 <p className="text-gray-700">
                    {selectedCaseType 
                      ? caseTypes.find(ct => ct.case_type_id.toString() === selectedCaseType)?.case_type_name 
                      : backlogDetail.case_types?.case_type_name || `Type ${backlogDetail.case_type_id}`}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Updated by</h4>
                  <p className="text-gray-700">
                    {typeof backlogDetail.updated_by === 'number' ? 'N/A' : (backlogDetail.updated_by || 'N/A')}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Created by</h4>
                  <p className="text-gray-700">
                    {backlogDetail.partner_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Referring Partner</h4>
                  <p className="text-gray-700">
                    {backlogDetail.partner_name || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Partner Feedback Section - Only show if feedback exists and department is gap_analysis */}
            {employeeDepartment.toLowerCase() === 'gap_analysis' && backlogDetail.feedback && backlogDetail.feedback.trim() !== '' && (
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Partner Feedback</h3>
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-gray-700 mb-2">{backlogDetail.feedback}</p>
                    <div className="text-xs text-gray-500">
                      <span>By: Partner</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-pink-500">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Comments</h3>
                <Button
                  onClick={() => setShowAddComment(!showAddComment)}
                  variant="outline"
                  size="sm"
                  className="bg-pink-500 text-white hover:bg-pink-600 border-pink-500"
                >
                  Add Comment
                </Button>
              </div>

              {/* Add Comment Form */}
              {showAddComment && (
                <div className="mb-4 p-4 bg-white rounded-lg border">
                  <Label htmlFor="newComment" className="text-sm font-medium text-gray-700">
                    Add a new comment
                  </Label>
                  <Textarea
                    id="newComment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Enter your comment here..."
                    className="mt-2 mb-3"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={addComment}
                      disabled={!newComment.trim() || isAddingComment}
                      size="sm"
                      className="bg-pink-500 text-white hover:bg-pink-600"
                    >
                      {isAddingComment ? "Adding..." : "Add Comment"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddComment(false);
                        setNewComment("");
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing Comments */}
              {backlogDetail.backlog_comments && backlogDetail.backlog_comments.length > 0 ? (
                <div className="space-y-3">
                  {backlogDetail.backlog_comments.map((comment, index) => (
                    <div key={comment.backlog_commentid || index} className="bg-white p-4 rounded-lg border">
                      <p className="text-gray-700 mb-2">{comment.comment_text}</p>
                      <div className="text-xs text-gray-500 flex justify-between">
                      <span>
                        By: {(() => {
                          const dept = comment.department?.toLowerCase() || '';
                          if (dept === "technical_consultant") return "Expert";
                          if (dept === "gap_analysis") return "ECS";
                          if (dept === "partner") return "Partner";
                          if (dept === "admin") return "Admin";
                          // Check if createdby_name contains admin as fallback
                          if (comment.createdby_name && comment.createdby_name.toLowerCase().includes('admin')) return "Admin";
                          return "User";
                        })()}
                      </span>


                        <span>{new Date(comment.created_time).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                            hour: "2-digit",  
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700 bg-white p-4 rounded-lg border">
                  No comments available
                </p>
              )}
            </div>

            {/* Edit Case Section */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Edit Policy Information & Assignment</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Case Type Dropdown */}
                <div>
                  <Label htmlFor="caseType" className="text-sm font-medium text-gray-700 mb-2 block">
                    Type of Policy
                  </Label>
                  <Select
                    value={selectedCaseType}
                    onValueChange={setSelectedCaseType}
                    disabled={true}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={isLoadingCaseTypes ? "Loading..." : "Select case type"} />
                    </SelectTrigger>
                    <SelectContent>
                      {caseTypes.map((caseType) => (
                        <SelectItem key={caseType.case_type_id} value={caseType.case_type_id.toString()}>
                          {caseType.case_type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Document Type Dropdown */}
                <div>
                  <Label htmlFor="documentType" className="text-sm font-medium text-gray-700 mb-2 block">
                    Document Type
                  </Label>
                  <Select
                    value={selectedDocumentType}
                    onValueChange={setSelectedDocumentType}
                    disabled={true}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((docType) => (
                        <SelectItem key={docType.id} value={docType.name}>
                          {docType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee Dropdown */}
                <div>
                  <Label htmlFor="assignee" className="text-sm font-medium text-gray-700 mb-2 block">
                    Assign to Consultant
                  </Label>
                  <Select
                    value={selectedAssignee}
                    onValueChange={setSelectedAssignee}
                    disabled={isLoadingEmployees || employeeDepartment.toLowerCase() !== 'gap_analysis'}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        isLoadingEmployees 
                          ? "Loading..." 
                          : employeeDepartment.toLowerCase() !== 'gap_analysis'
                          ? "Gap Analysis users only change consultant"
                          : backlogDetail?.assigned_consultant_name
                          ? `Currently: ${backlogDetail.assigned_consultant_name}`
                          : "Select Consultant"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.employee_id} value={employee.employee_id.toString()}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Dropdown */}
                
                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-2 block">
                    Case Status
                  </Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                    disabled={employeeDepartment !== 'technical_consultant'}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem 
                          key={status.value} 
                          value={status.value}
                          disabled={status.value === "completed" && !backlogDetail?.expert_report_generated}
                        >
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>


              {/* Save Changes Button */}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={saveChanges}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {employeeDepartment.toLowerCase() === 'gap_analysis' 
                    ? 'Assign Consultant' 
                    : employeeDepartment.toLowerCase() === 'technical_consultant'
                    ? 'Update Status'
                    : 'Save Changes'
                  }
                </Button>
              </div>
            </div>

            {/* Documents Section - Only show if Case is not deleted and there are documents */}
            {backlogDetail.backlog_documents && backlogDetail.backlog_documents.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary-500" />
                  <span>Documents ({backlogDetail.backlog_documents.length})</span>
                </h3>
                <div className="space-y-3">
                  {backlogDetail.backlog_documents.map((doc, index) => {
                    const versionNumber = ` v${index + 1}`;
                    
                    // Check if filename contains "Insurance Policy" in either stored_filename or original_filename
                    const storedFilename = doc.stored_filename || '';
                    const filename = storedFilename;
                    const containsInsurancePolicy = filename.toLowerCase().includes('insurance policy');
                    
                    // If contains "Insurance Policy", show "Insurance Policy v1", otherwise show actual filename
                    const displayName = containsInsurancePolicy 
                      ? `Insurance Policy${versionNumber}` 
                      : ('Other');
                    
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-primary-500" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {displayName}
                            </p>
                          </div>
                        </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-2 border-primary-500 text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                          onClick={() => {
                            if (doc.document_id) {
                              viewDocument(doc.document_id);
                            } else {
                              console.log('Document ID not available');
                            }
                          }}
                          disabled={viewingDocumentId === doc.document_id?.toString()}
                        >
                          {viewingDocumentId === doc.document_id?.toString() ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                              <span>Loading...</span>
                            </div>
                          ) : (
                            'View'
                          )}
                        </Button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      {/* Document Viewer Modal */}
      {showDocumentModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2"
          style={{ overflow: 'hidden' }}
        >
          <div className="bg-white rounded-lg shadow-2xl w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[65vw] h-[95vh] flex flex-col max-w-7xl">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-gray-200 gap-3 sm:gap-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Document Viewer</h3>
              
              {/* Zoom Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 justify-center sm:justify-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 50}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-200"
                  >
                    <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[2.5rem] sm:min-w-[3rem] text-center">
                    {zoomLevel}%
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 300}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-200"
                  >
                    <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetZoom}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-200"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDocumentModal(false);
                    setDocumentUrl('');
                    setDocumentType('');
                    setZoomLevel(100); // Reset zoom when closing
                    setPanX(0);
                    setPanY(0);
                    setIsDragging(false);
                    // Clean up blob URL
                    if (documentUrl.startsWith('blob:')) {
                      URL.revokeObjectURL(documentUrl);
                    }
                  }}
                  className="text-gray-600 hover:text-gray-800 border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 px-3 py-2 text-sm sm:text-base"
                >
                  <XCircle className="h-4 w-4 sm:h-6 sm:w-6 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Close</span>
                  <span className="sm:hidden">✕</span>
                </Button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 p-2 overflow-hidden">
              {documentType.includes('image/') ? (
                <div 
                  className="flex items-center justify-center h-full min-h-full cursor-grab overflow-hidden"
                  style={{ cursor: zoomLevel > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                >
                  <img
                    src={documentUrl}
                    alt="Document"
                    className="object-contain rounded-lg shadow-lg transition-transform duration-200 select-none"
                    style={{ 
                      transform: `scale(${zoomLevel / 100}) translate(${panX}px, ${panY}px)`,
                      maxWidth: '100%',
                      maxHeight: '100%',
                      userSelect: 'none',
                      transformOrigin: 'center center'
                    }}
                    draggable={false}
                  />
                </div>
              ) : documentType.includes('application/pdf') || documentType === 'url' ? (
                <div 
                  className="h-full w-full overflow-hidden cursor-grab"
                  style={{ cursor: zoomLevel > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                >
                  <iframe
                    src={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=1&statusbar=0&messages=0&scrollbar=1`}
                    className="w-full h-full border-0 rounded-lg transition-transform duration-200 select-none"
                    title="Document Viewer"
                    style={{ 
                      minHeight: '100%',
                      transform: `scale(${zoomLevel / 100}) translate(${panX}px, ${panY}px)`,
                      transformOrigin: 'center center',
                      userSelect: 'none'
                    }}
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">This file type cannot be previewed</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeBacklogEdit;
