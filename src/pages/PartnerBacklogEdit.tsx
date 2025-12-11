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

interface BacklogDetail {
  status: any;
  backlog_id: string;
  case_summary: string;
  case_description: string;
  case_type_id: number;
  backlog_referring_partner_id: number;
  backlog_referral_date: string;
  created_time: string;
  created_by: number;
  updated_by: number;
  updated_time: string;
  deleted_flag: boolean;
  comment_text: string | null;
  feedback?: string;
  expert_description?: string;
  backlog_comments?: {
    department: string;
    backlog_commentid: number;
    backlog_id: string;
    comment_text: string;
    created_by: number;
    created_time: string;
    createdby_name: string;
    updated_by: number;
    updated_time: string;
    updatedby_name: string;
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

const PartnerBacklogEdit = () => {
  const navigate = useNavigate();
  const { backlogId } = useParams<{ backlogId: string }>();
  const [backlogDetail, setBacklogDetail] = useState<BacklogDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [partnerName, setPartnerName] = useState<string>('');
  const [userDepartment, setUserDepartment] = useState<string>('');
  
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
  const [dragActive, setDragActive] = useState(false);

  // Document deletion state
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);

  // Edit form states
  const [selectedCaseType, setSelectedCaseType] = useState<string>("");
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("");
  const [editableCaseSummary, setEditableCaseSummary] = useState<string>("");
  const [editableCaseDescription, setEditableCaseDescription] = useState<string>("");
  const [caseTypes, setCaseTypes] = useState<Array<{case_type_id: number, case_type_name: string}>>([]);
  const [isLoadingCaseTypes, setIsLoadingCaseTypes] = useState(false);
  const [isUpdatingBacklog, setIsUpdatingBacklog] = useState(false);

  // Comment states
  const [newComment, setNewComment] = useState<string>("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);

  // Expert summary and report generation
  const [expertSummary, setExpertSummary] = useState<string>("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Feedback state
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showAddFeedback, setShowAddFeedback] = useState(false);

  // Document types for partners
  const documentTypes = [
    { id: "1", name: "Insurance Policy", isMandatory: false },
  ];

  useEffect(() => {
    if (backlogId) {
      // Pass backlogId as string since it comes as string from partner dashboard
      fetchBacklogDetail(backlogId);
    }
    getPartnerName();
    fetchCaseTypes();
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

  const getPartnerName = () => {
    try {
      // Try to get partner name from localStorage
      const partnerDetailsStr = localStorage.getItem("partner_details");
      if (partnerDetailsStr) {
        const partnerDetails = JSON.parse(partnerDetailsStr);
        const name = partnerDetails?.name || partnerDetails?.partner_name || partnerDetails?.first_name || 'Partner';
        setPartnerName(name);
        console.log('Partner name found:', name);
        return;
      }

      // Fallback to user details
      const userDetailsStr = localStorage.getItem("expertclaims_user_details");
      if (userDetailsStr) {
        const userDetails = JSON.parse(userDetailsStr);
        const userData = Array.isArray(userDetails) ? userDetails[0] : userDetails;
        const name = userData?.name || userData?.first_name || 'Partner';
        const department = userData?.department || '';
        setPartnerName(name);
        setUserDepartment(department);
        console.log('Partner name from user details:', name);
        console.log('User department:', department);
        return;
      }

      setPartnerName('Partner');
      setUserDepartment('');
    } catch (error) {
      console.error('Error getting partner name:', error);
      setPartnerName('Partner');
      setUserDepartment('');
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

  const fetchBacklogDetail = async (id: string) => {
    setIsLoading(true);
    try {
      // Get session data for authentication
      const sessionStr = localStorage.getItem('expertclaims_session');
      let authToken = '';
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          authToken = session.jwtToken || '';
        } catch (e) {
          console.error('Error parsing session:', e);
        }
      }

      const response = await fetch(
        `http://localhost:3000/public/backlog_id?backlog_id=${id}`,
        {
          method: "GET",
          headers: {
            "Accept": "*/*",
            "Content-Type": "application/json",
            ...(authToken && { "Authorization": `Bearer ${authToken}` })
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("API Response data:", data);
        if (data && data.length > 0) {
          console.log("Backlog detail data[0]:", data[0]);
          console.log("Comment text value:", data[0].comment_text);
          setBacklogDetail(data[0]);
          // Set initial values for dropdowns
          setSelectedCaseType(data[0].case_type_id?.toString() || "");
          setSelectedDocumentType("Insurance Policy"); // Default to Insurance Policy name
          setEditableCaseSummary(data[0].case_summary || "");
          setEditableCaseDescription(data[0].case_description || "");
          // Set expert summary from API if available
          if (data[0].expert_description) {
            setExpertSummary(data[0].expert_description);
          }
        } else {
          toast({
            title: "Error",
            description: "No data found for this Policy",
            variant: "destructive",
          });
        }
      } else {
        console.error("Failed to fetch backlog detail:", response.status);
        toast({
          title: "Error",
          description: "Failed to fetch Policy details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching backlog detail:", error);
      toast({
        title: "Error",
        description: "Error loading Policy details",
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

      // Call the new API to get document view
      console.log('Calling document view API...');
      console.log('Document ID:', documentId);
      
      const requestBody = {
        document_id: documentId
      };
      console.log('Request body:', requestBody);
      
      // Supabase service role key
      const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws';
      
      const response = await fetch('http://localhost:3000/support/partnerdocumentview', {
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
        console.error('Failed to call view webhook:', response.status, response.statusText);
        
        // Try to get error details for logging
        let userFriendlyMessage = "Unable to view document. Please try again.";
        try {
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          
          // Try to parse JSON error response
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error) {
              // Show user-friendly message based on error type
              if (errorData.error.includes("File not found") || errorData.error.includes("not found")) {
                userFriendlyMessage = "Document not found.";
              } else if (errorData.error.includes("Invalid session")) {
                userFriendlyMessage = "Session expired. Please log in again.";
              } else {
                userFriendlyMessage = "Unable to view document. Please try again.";
              }
            }
          } catch (parseError) {
            // If not JSON, use default message
            console.error('Error is not JSON format');
          }
        } catch (e) {
          console.error('Could not parse error response');
        }
        
        toast({
          title: "Error",
          description: userFriendlyMessage,
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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      
      // Validate file types
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      const invalidFiles = files.filter(file => !validTypes.includes(file.type));
      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid File Type",
          description: "Please upload PDF, JPG, PNG, DOC, DOCX, or TXT files only",
          variant: "destructive",
        });
        return;
      }

      setUploadedFiles(prev => [...prev, ...files]);
      toast({
        title: "Files Added",
        description: `${files.length} file(s) have been added`,
      });
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
        `http://localhost:3000/public/removedocument?document_id=${documentId}`,
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
    let partnerId = 0;
    const userDetailsStr = localStorage.getItem("expertclaims_user_details");
    if (userDetailsStr) {
      const userDetails = JSON.parse(userDetailsStr);
      const userData = Array.isArray(userDetails) ? userDetails[0] : userDetails;
      partnerId = userData.userid || userData.id || 0;
    } else {
      partnerId = 3; // Default fallback
    }

    setIsAddingComment(true);
    try {
      const response = await fetch(
        "http://localhost:3000/public/comments_insert",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            backlog_id: backlogDetail.backlog_id,
            comment_text: newComment.trim(),
            created_by: partnerId,
            createdby_name: "n/a",
            updated_by: partnerId,
            updatedby_name: "n/a",
            department: "partner"
          }), 
        }
      );

      if (response.ok) {
        // Refresh comments by fetching backlog detail again
        fetchBacklogDetail(backlogId!);
        
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

        const response = await fetch('http://localhost:3000/public/partnerbacklogentrydoc', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
          throw new Error(errorData.message || `Upload failed for ${file.name}`);
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

  const updateBacklog = async () => {
    if (!backlogDetail) return;

    if (!editableCaseSummary.trim()) {
      toast({
        title: "Error",
        description: "Case summary is required",
        variant: "destructive",
      });
      return;
    }

    if (!editableCaseDescription.trim()) {
      toast({
        title: "Error",
        description: "Case description is required",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCaseType) {
      toast({
        title: "Error",
        description: "Please select a case type",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingBacklog(true);
    try {
      const requestBody = {
        backlog_id: backlogDetail.backlog_id,
        case_summary: editableCaseSummary.trim(),
        case_description: editableCaseDescription.trim(),
        case_type_id: parseInt(selectedCaseType)
      };

      const response = await fetch('http://localhost:3000/public/update_backlog', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Case information updated successfully",
        });
        fetchBacklogDetail(backlogId!);
      } else {
        const errorText = await response.text();
        console.error('Failed to update backlog:', response.status, errorText);
        toast({
          title: "Error",
          description: "Failed to update case information. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating backlog:', error);
      toast({
        title: "Error",
        description: "Failed to update case information",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingBacklog(false);
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

    if (!backlogDetail) return;

    try {
      const userDetailsStr = localStorage.getItem("expertclaims_user_details");
      let currentUser = { name: 'Partner', employee_id: 1 };
      
      if (userDetailsStr) {
        const userDetails = JSON.parse(userDetailsStr);
        const userData = Array.isArray(userDetails) ? userDetails[0] : userDetails;
        currentUser = {
          name: userData?.name || userData?.full_name || 'Partner',
          employee_id: userData?.employee_id || userData?.id || 1
        };
      }

      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '17e7ab32-86ad-411e-8ee3-c4a09e6780f7';
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          sessionId = session.sessionId || '17e7ab32-86ad-411e-8ee3-c4a09e6780f7';
        } catch (e) {
          console.error('Error parsing session:', e);
        }
      }

      const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3ODYsImV4cCI6MjA3MDQ4Mjc4Nn0.Ssi2327jY_9cu5lQorYBdNjJJBWejz91j_kCgtfaj0o';

      const requestBody = {
        backlog_id: backlogDetail.backlog_id,
        expert_description: expertSummary,
        updated_by: currentUser.name,
        user_id: currentUser.employee_id
      };

      const response = await fetch('https://n8n.srv952553.hstgr.cloud/webhook/updatestatustechnicalconsultant', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'session_id': sessionId,
          'apikey': API_KEY,
          'authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Expert summary added successfully",
        });
        setExpertSummary("");
        fetchBacklogDetail(backlogId!);
      } else {
        toast({
          title: "Error",
          description: "Failed to add expert summary. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding expert summary:', error);
      toast({
        title: "Error",
        description: "Failed to add expert summary",
        variant: "destructive",
      });
    }
  };

  const generateExportReport = async () => {
    if (!expertSummary.trim() || !backlogDetail) {
      toast({
        title: "Error",
        description: "Please enter an expert summary before generating report",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingReport(true);
    try {
      const escapeHtml = (text: string) => {
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

      try {
        const userDetailsStr = localStorage.getItem("expertclaims_user_details");
        let currentUser = { name: 'Partner', employee_id: 1 };
        
        if (userDetailsStr) {
          const userDetails = JSON.parse(userDetailsStr);
          const userData = Array.isArray(userDetails) ? userDetails[0] : userDetails;
          currentUser = {
            name: userData?.name || userData?.full_name || 'Partner',
            employee_id: userData?.employee_id || userData?.id || 1
          };
        }

        const sessionStr = localStorage.getItem('expertclaims_session');
        let sessionId = '17e7ab32-86ad-411e-8ee3-c4a09e6780f7';
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            sessionId = session.sessionId || '17e7ab32-86ad-411e-8ee3-c4a09e6780f7';
          } catch (e) {
            console.error('Error parsing session:', e);
          }
        }

        const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3ODYsImV4cCI6MjA3MDQ4Mjc4Nn0.Ssi2327jY_9cu5lQorYBdNjJJBWejz91j_kCgtfaj0o';

        const requestBody = {
          backlog_id: backlogDetail.backlog_id,
          expert_description: expertSummary,
          updated_by: currentUser.name,
          user_id: currentUser.employee_id
        };

        const response = await fetch('https://n8n.srv952553.hstgr.cloud/webhook/updatestatustechnicalconsultant', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'session_id': sessionId,
            'apikey': API_KEY,
            'authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          console.log('Status automatically updated to completed via API');
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

  const submitFeedback = async () => {
    if (!feedback.trim() || !backlogDetail) {
      toast({
        title: "Error",
        description: "Please enter feedback before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '5fbe26f1-b3ec-468e-bd4e-1858d5535909';
      let jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiAiLCJwYXNzd29yZCI6IiIsImlhdCI6MTc2MzQ0MTU3MX0.7xlNPwb5F4qaRwJ42HxBWaR1aom2XdnFPY8onV9NqP8';

      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          sessionId = session.sessionId || '5fbe26f1-b3ec-468e-bd4e-1858d5535909';
          jwtToken = session.jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiAiLCJwYXNzd29yZCI6IiIsImlhdCI6MTc2MzQ0MTU3MX0.7xlNPwb5F4qaRwJ42HxBWaR1aom2XdnFPY8onV9NqP8';
        } catch (e) {
          console.error('Error parsing session:', e);
        }
      }

      const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws';

      const requestBody = {
        backlog_id: backlogDetail.backlog_id,
        feedback: feedback.trim()
      };

      const response = await fetch('https://n8n.srv952553.hstgr.cloud/webhook/feedback', {
        method: 'PATCH',
        headers: {
          'accept': '*/*',
          'apikey': API_KEY,
          'authorization': `Bearer ${API_KEY}`,
          'session_id': sessionId,
          'jwt_token': jwtToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Feedback submitted successfully. Support team and admin will be notified.",
        });
        const newFeedback = feedback.trim();
        setFeedback("");
        setShowAddFeedback(false);
        // Immediately update the backlog detail with new feedback (optimistic update)
        setBacklogDetail(prev => prev ? { ...prev, feedback: newFeedback } : prev);
        // Refresh backlog detail to get the latest from server
        fetchBacklogDetail(backlogId!);
      } else {
        const errorText = await response.text();
        console.error('Failed to submit feedback:', response.status, errorText);
        toast({
          title: "Error",
          description: "Failed to submit feedback. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingFeedback(false);
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
                <span className="ml-2 text-gray-600">Loading Policy details...</span>
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
              <CardTitle className="text-2xl font-bold">Edit Assignment - Upload Documents</CardTitle>
              <Button
                variant="outline"
                onClick={() => navigate("/partner-dashboard")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Policy not found</h3>
                <p className="text-gray-500">The requested Policy could not be found.</p>
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
              <CardTitle className="text-2xl font-bold">Edit Assignment - Upload Documents</CardTitle>
              <Button
                variant="outline"
                onClick={() => navigate("/partner-dashboard")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Task ID and Status */}
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
                    {backlogDetail.status ? backlogDetail.status : "N/A"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Task Summary */}
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
              <Label htmlFor="caseSummary" className="text-lg font-medium text-gray-900 mb-2 block">
                Assignment Summary
              </Label>
              <Textarea
                id="caseSummary"
                value={editableCaseSummary}
                onChange={(e) => setEditableCaseSummary(e.target.value)}
                placeholder="Enter case summary..."
                rows={3}
                className="w-full"
              />
            </div>

            {/* Task Description */}
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">
              <Label htmlFor="caseDescription" className="text-lg font-medium text-gray-900 mb-2 block">
                Policy Description
              </Label>
              <Textarea
                id="caseDescription"
                value={editableCaseDescription}
                onChange={(e) => setEditableCaseDescription(e.target.value)}
                placeholder="Enter case description..."
                rows={4}
                className="w-full"
              />
            </div>

            {/* Update Summary & Description Button */}
            <div className="flex justify-end">
              <Button
                onClick={updateBacklog}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
                disabled={isUpdatingBacklog || !editableCaseSummary.trim() || !editableCaseDescription.trim() || !selectedCaseType}
              >
                {isUpdatingBacklog ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update Assignment Summary & Policy Description
                  </>
                )}
              </Button>
            </div>

            {/* Expert Summary and Generate Report */}
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              {/* <h3 className="text-lg font-semibold mb-4 text-gray-900">Expert Summary & Report Generation</h3> */}
              
              <div className="space-y-4">
                {/* Expert Summary Field */}
                <div>
                  <Label htmlFor="expertSummary" className="text-lg font-medium text-gray-700 mb-2 block">
                  Expert's Report *
                  </Label>
                  {userDepartment.toLowerCase() === 'technical_consultant' ? (
                    <Textarea
                      id="expertSummary"
                      value={expertSummary}
                      onChange={(e) => setExpertSummary(e.target.value)}
                      placeholder="Enter your expert analysis and summary here..."
                      rows={6}
                      className="w-full"
                    />
                  ) : (
                    <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                      {expertSummary || (
                        <span className="text-gray-400 italic">Expert summary will appear here once an expert adds it...</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Generate Report and Add Task Buttons */}
                <div className="flex justify-between">
                  {userDepartment.toLowerCase() === 'technical_consultant' && (
                    <Button
                      onClick={handleAddTask}
                      disabled={!expertSummary.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Add Summary
                    </Button>
                  )}
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

            {/* Feedback Section - Only show when status is completed */}
            {(backlogDetail.status?.toLowerCase() === "complete" || backlogDetail.status?.toLowerCase() === "completed") && (
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Feedback</h3>
                  <Button
                    onClick={() => setShowAddFeedback(!showAddFeedback)}
                    variant="outline"
                    size="sm"
                    className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                  >
                    Add Feedback
                  </Button>
                </div>

                {/* Add Feedback Form */}
                {showAddFeedback && (
                  <div className="mb-4 p-4 bg-white rounded-lg border">
                    <Label htmlFor="feedback" className="text-sm font-medium text-gray-700">
                      Add feedback
                    </Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Enter your feedback here..."
                      className="mt-2 mb-3"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={submitFeedback}
                        disabled={!feedback.trim() || isSubmittingFeedback}
                        size="sm"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowAddFeedback(false);
                          setFeedback("");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Display existing feedback if it exists */}
                {backlogDetail.feedback && backlogDetail.feedback.trim() !== '' ? (
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-gray-700 mb-2">{backlogDetail.feedback}</p>
                      <div className="text-xs text-gray-500">
                        <span>By: Partner</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 bg-white p-4 rounded-lg border">
                    No feedback available
                  </p>
                )}
              </div>
            )}

            {/* Task Details Grid */}
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-orange-500">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Policy Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Service Type Name</h4>
                  {/* <p className="text-gray-700">{backlogDetail.case_types?.case_type_name || `Type ${backlogDetail.case_type_id}`}</p> */}

                  <p className="text-gray-700">
                    {selectedCaseType 
                      ? caseTypes.find(ct => ct.case_type_id.toString() === selectedCaseType)?.case_type_name 
                      : backlogDetail.case_types?.case_type_name || `Type ${backlogDetail.case_type_id}`}
                  </p>
                </div>
              </div>
            </div>


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
                          if (comment.createdby_name && comment.createdby_name.toLowerCase().includes('admin')) return "Admin";
                          if (comment.createdby_name) return comment.createdby_name;
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

            {/* Edit Policy Section */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Edit Policy Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Case Type Dropdown */}
                <div>
                  <Label htmlFor="caseType" className="text-sm font-medium text-gray-700 mb-2 block">
                    Type of Policy
                  </Label>
                  <Select
                    value={selectedCaseType}
                    onValueChange={setSelectedCaseType}
                    disabled={isLoadingCaseTypes}
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
              </div>
            </div>

                        {/* Documents Section - Only show if Policy is not deleted and there are documents */}
            {backlogDetail.backlog_documents && backlogDetail.backlog_documents.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary-500" />
                  <span>Documents ({backlogDetail.backlog_documents.length})</span>
                </h3>
                <div className="space-y-3">
                  {backlogDetail.backlog_documents.map((doc, index) => {
                    // Show version number for all documents starting from v1
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
                            {/* <p className="text-xs text-gray-400">
                            Service types: {backlogDetail.case_types?.case_type_name}
                            </p> */}
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
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-2 border-red-500 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          onClick={() => {
                            if (doc.document_id) {
                              deleteDocument(doc.document_id);
                            } else {
                              console.log('Document ID not available for removal');
                            }
                          }}
                          disabled={deletingDocumentId === doc.document_id}
                        >
                          {deletingDocumentId === doc.document_id ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              <span>Removing...</span>
                            </div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Document Upload Section */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Upload New Documents</h3>
              
              {/* File Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Documents to Upload
                </label>
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                    dragActive
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="flex flex-col items-center space-y-2">
                      <Upload
                        className={`h-8 w-8 ${
                          dragActive
                            ? "text-primary-500"
                            : "text-gray-400"
                        }`}
                      />
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                          {dragActive
                            ? "Drop files here"
                            : "Drag and drop your files here"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          or click to browse
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        id="file-upload-partner"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="file-upload-partner"
                        className="cursor-pointer py-2 px-4 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors duration-200"
                      >
                        <span>Choose Files</span>
                      </label>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT
                </p>
              </div>

              {/* Selected Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex items-center space-x-3">
                <Button
                  onClick={uploadDocuments}
                  disabled={uploadedFiles.length === 0 || isUploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Documents
                    </>
                  )}
                </Button>
                
                {uploadedFiles.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setUploadedFiles([])}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
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

export default PartnerBacklogEdit;
