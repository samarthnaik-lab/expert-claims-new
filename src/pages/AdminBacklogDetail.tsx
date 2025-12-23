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

const AdminBacklogDetail = () => {
  const navigate = useNavigate();
  const { backlogId } = useParams<{ backlogId: string }>();
  const [backlogDetail, setBacklogDetail] = useState<BacklogDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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

  // Edit form states
  const [selectedCaseType, setSelectedCaseType] = useState<string>("");
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [editableCaseSummary, setEditableCaseSummary] = useState<string>("");
  const [editableCaseDescription, setEditableCaseDescription] = useState<string>("");
  const [caseTypes, setCaseTypes] = useState<Array<{case_type_id: number, case_type_name: string}>>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingCaseTypes, setIsLoadingCaseTypes] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isUpdatingBacklog, setIsUpdatingBacklog] = useState(false);

  // Comment states
  const [newComment, setNewComment] = useState<string>("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  
  // Summary submission state
  const [isAddingSummary, setIsAddingSummary] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);

  // Expert summary and report generation
  const [expertSummary, setExpertSummary] = useState<string>("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Document types
  const documentTypes = [
    { id: "1", name: "Insurance Policy", isMandatory: false }
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
    setZoomLevel(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
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
      const sensitivity = 0.7;
      const newPanX = (e.clientX - dragStart.x) * sensitivity;
      const newPanY = (e.clientY - dragStart.y) * sensitivity;
      const maxPan = 200;
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

  const fetchCaseTypes = async () => {
    setIsLoadingCaseTypes(true);
    try {
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
      
      // Get session_id and jwt_token from localStorage
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
      
      const response = await fetch('http://localhost:3000/admin/gettechnicalconsultant', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Technical consultants API response:', data);
        
        const transformedEmployees = data.map((consultant: any) => ({
          employee_id: consultant.employee_id,
          name: `${consultant.first_name} ${consultant.last_name}`,
          department: consultant.department,
          role: consultant.designation
        }));
        
        setEmployees(transformedEmployees);
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
      
      const response = await fetch(
        `http://localhost:3000/admin/backlog_id?backlog_id=${id}`,
        {
          method: "GET",
          headers: {
            'accept': '*/*',
            'content-type': 'application/json',
            'session_id': sessionId,
            'jwt_token': jwtToken
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("API Response data:", data);
        if (data && data.length > 0) {
          console.log("Backlog detail data[0]:", data[0]);
          setBacklogDetail(data[0]);
          setSelectedCaseType(data[0].case_type_id?.toString() || "");
          setSelectedDocumentType("Insurance Policy");
          setEditableCaseSummary(data[0].case_summary || "");
          setEditableCaseDescription(data[0].case_description || "");
          
          if (data[0].assigned_to) {
            console.log("Auto-selecting assigned consultant:", data[0].assigned_consultant_name, "ID:", data[0].assigned_to);
            setSelectedAssignee(data[0].assigned_to.toString());
          }
          
          if (data[0].status) {
            console.log("Auto-selecting status:", data[0].status);
            setSelectedStatus(data[0].status.toLowerCase().replace(/\s+/g, '_'));
          } else {
            setSelectedStatus("new");
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

      const requestBody = {
        document_id: documentId
      };
      
      const response = await fetch('http://localhost:3000/admin/documentview', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        toast({
          title: "Error",
          description: "Failed to get document view URL",
          variant: "destructive",
        });
        return;
      }

      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('JSON response:', data);
        
        if (data.url || data.document_url) {
          const url = data.url || data.document_url;
          setDocumentUrl(url);
          setDocumentType('url');
          setShowDocumentModal(true);
        } else {
          toast({
            title: "Error",
            description: "No document URL in response",
            variant: "destructive",
          });
        }
      } else {
        try {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setDocumentUrl(objectUrl);
          
          if (contentType?.includes('image/')) {
            setDocumentType(contentType);
          } else if (contentType?.includes('application/pdf')) {
            setDocumentType('application/pdf');
          } else {
            setDocumentType('application/octet-stream');
          }
          
          setShowDocumentModal(true);
        } catch (textError) {
          console.error('Error handling response as blob:', textError);
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

  const addComment = async () => {
    if (!newComment.trim() || !backlogDetail) return;
    
    let email = 'admin@example.com';
    let role = 'admin';
    let department = 'admin'; // Always set to 'admin' for admin dashboard
    let userId = 0;
    let userName = 'Admin';
    
    const userDetailsStr = localStorage.getItem("expertclaims_user_details");
    if (userDetailsStr) {
      const userDetails = JSON.parse(userDetailsStr);
      let userData = Array.isArray(userDetails) ? userDetails[0] : userDetails;
      userId = userData.userid || userData.employee_id || userData.id || 0;
      email = userData.email || 'admin@example.com';
      role = userData.role || 'admin';
      // Force department to 'admin' since this is the admin dashboard
      department = 'admin';
      userName = userData.name || userData.full_name || 'Admin';
    }

    setIsAddingComment(true);
    try {
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

      // Get jwt_token from localStorage
      const sessionStrForJwt = localStorage.getItem('expertclaims_session');
      let jwtToken = '';
      if (sessionStrForJwt) {
        try {
          const session = JSON.parse(sessionStrForJwt);
          jwtToken = session.jwtToken || '';
        } catch (e) {
          console.error('Error parsing session:', e);
        }
      }
      
      const response = await fetch(
        "http://localhost:3000/admin/comments_insert",
        {
          method: "POST",
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'session_id': sessionId,
            'jwt_token': jwtToken
          },
          body: JSON.stringify({
            backlog_id: backlogDetail.backlog_id,
            comment_text: newComment.trim(),
            created_by: userId,
            createdby_name: userName,
            updated_by: userId,
            email: email,
            role: role,
            department: department,
            updatedby_name: userName
          }),
        }
      );

      if (response.ok) {
        const newCommentObj = {
          backlog_commentid: Date.now(),
          backlog_id: backlogDetail.backlog_id,
          comment_text: newComment.trim(),
          created_by: userId,
          created_time: new Date().toISOString(),
          createdby_name: userName,
          updated_by: userId,
          updated_time: new Date().toISOString(),
          email: email,
          role: role,
          department: 'admin', // Always 'admin' for admin dashboard
          updatedby_name: userName
        };

        setBacklogDetail(prev => {
          if (!prev) return null;
          return {
            ...prev,
            backlog_comments: [...(prev.backlog_comments || []), newCommentObj]
          };
        });

        toast({
          title: "Success",
          description: "Comment added successfully",
        });

        setNewComment("");
        setShowAddComment(false);
      } else {
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
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsAddingComment(false);
    }
  };

  const assignConsultant = async () => {
    if (!backlogDetail) return;

    if (!selectedAssignee) {
      toast({
        title: "Error",
        description: "Please select a consultant to assign",
        variant: "destructive",
      });
      return;
    }

    try {
      const userDetailsStr = localStorage.getItem("expertclaims_user_details");
      let currentUser = { name: 'Admin', employee_id: 1 };
      
      if (userDetailsStr) {
        const userDetails = JSON.parse(userDetailsStr);
        const userData = Array.isArray(userDetails) ? userDetails[0] : userDetails;
        currentUser = {
          name: userData?.name || userData?.full_name || 'Admin',
          employee_id: userData?.employee_id || userData?.id || 1
        };
      }

      const selectedConsultant = employees.find(emp => emp.employee_id.toString() === selectedAssignee);
      if (!selectedConsultant) {
        toast({
          title: "Error",
          description: "Selected consultant not found",
          variant: "destructive",
        });
        return;
      }

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
      
      const requestBody = {
        backlog_id: backlogDetail.backlog_id,
        assigned_consultant_name: selectedConsultant.name,
        assigned_to: parseInt(selectedAssignee),
        updated_by: currentUser.name,
        user_id: currentUser.employee_id
      };

      const response = await fetch('http://localhost:3000/admin/updatecunsultantpolicy', {
        method: 'PATCH',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Case assigned to ${selectedConsultant.name} successfully`,
        });
        fetchBacklogDetail(backlogId!);
      } else {
        toast({
          title: "Error",
          description: "Failed to assign consultant. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error assigning consultant:', error);
      toast({
        title: "Error",
        description: "Failed to assign consultant",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async () => {
    if (!backlogDetail) return;

    if (!selectedStatus) {
      toast({
        title: "Error",
        description: "Please select a status to update",
        variant: "destructive",
      });
      return;
    }

    try {
      const userDetailsStr = localStorage.getItem("expertclaims_user_details");
      let currentUser = { name: 'Admin', employee_id: 1 };
      
      if (userDetailsStr) {
        const userDetails = JSON.parse(userDetailsStr);
        const userData = Array.isArray(userDetails) ? userDetails[0] : userDetails;
        currentUser = {
          name: userData?.name || userData?.full_name || 'Admin',
          employee_id: userData?.employee_id || userData?.id || 1
        };
      }

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
      
      const statusDisplay = selectedStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const requestBody = {
        backlog_id: backlogDetail.backlog_id,
        status: statusDisplay,
        updated_by: currentUser.name,
        user_id: currentUser.employee_id
      };

      const response = await fetch('http://localhost:3000/admin/updatestatustechnicalconsultant', {
        method: 'PATCH',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Status updated to ${statusDisplay} successfully`,
        });
        fetchBacklogDetail(backlogId!);
      } else {
        toast({
          title: "Error",
          description: "Failed to update status. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
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
        case_summary: editableCaseSummary.trim(),
        case_description: editableCaseDescription.trim(),
        case_type_id: parseInt(selectedCaseType)
      };

      const response = await fetch('http://localhost:3000/admin/update_backlog', {
        method: 'PATCH',
        headers: {
          'accept': '*/*',
          'content-type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Case information updated successfully",
        });
        // Refresh the backlog detail to show updated values
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

  const handleAddSummary = async () => {
    if (!expertSummary.trim()) {
      toast({
        title: "Expert Summary Required",
        description: "Please enter an expert summary before adding it",
        variant: "destructive",
      });
      return;
    }

    setIsAddingSummary(true);
    try {
      // Get session data
      const sessionStr = localStorage.getItem("expertclaims_session");
      const session = sessionStr ? JSON.parse(sessionStr) : {};
      const sessionId = session.sessionId || "";
      const jwtToken = session.jwtToken || "";

      // Get userid from expertclaims_user_details localStorage
      let userId = "";
      let userEmail = "";
      let userName = "";
      
      const userDetailsStr = localStorage.getItem("expertclaims_user_details");
      if (userDetailsStr) {
        try {
          const userDetailsData = JSON.parse(userDetailsStr);
          // Handle both array and object formats
          const userDetails = Array.isArray(userDetailsData) ? userDetailsData[0] : userDetailsData;
          
          // Get userid from the data object
          userId = userDetails.userid || userDetails.user_id || userDetails.employee_id || userDetails.id || "";
          
          // Also get email and name for reference
          userEmail = userDetails.email || "";
          userName = userDetails.employee_name || userDetails.name || userDetails.full_name || userDetails.email || "";
          
          console.log('User details from localStorage:', userDetails);
        } catch (e) {
          console.error('Error parsing user details:', e);
        }
      }
      
      // If userid not found, log warning
      if (!userId) {
        console.warn('userid not found in expertclaims_user_details, using empty string');
      }
      
      // Log for debugging
      console.log('Add Summary - User ID:', userId, 'User Name:', userName, 'Email:', userEmail);

      // Call the API to add summary
      const response = await fetch("http://localhost:3000/admin/addsummary", {
        method: "POST",
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'Connection': 'keep-alive',
          'Origin': 'http://localhost:8080',
          'Referer': 'http://localhost:8080/',
          'accept': 'application/json',
          'content-type': 'application/json',
          'jwt_token': jwtToken,
          'session_id': sessionId
        },
        body: JSON.stringify({
          backlog_id: backlogDetail?.backlog_id,
          expert_description: expertSummary,
          // created_by: userId, // userid from expertclaims_user_details
          updated_by: userName, // userid from expertclaims_user_details
          user_id: userId // userid from expertclaims_user_details
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Handle array response structure
        let responseData = result;
        if (Array.isArray(result) && result.length > 0) {
          responseData = result[0];
        }

        if (responseData.status === 'success') {
          const successMessage = responseData.message || "Summary added successfully";
          toast({
            title: "Success",
            description: successMessage,
          });
          // Refresh the backlog detail to get updated data
          fetchBacklogDetail(backlogId!);
        } else {
          const errorMessage = responseData.message || responseData.error || "Failed to add summary";
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else {
        const errorMessage = result?.message || result?.error || `Failed to add summary (Status: ${response.status})`;
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error adding summary:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add summary",
        variant: "destructive",
      });
    } finally {
      setIsAddingSummary(false);
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
      // Get session data
      const sessionStr = localStorage.getItem("expertclaims_session");
      const session = sessionStr ? JSON.parse(sessionStr) : {};
      const sessionId = session.sessionId || "fddc661a-dfb4-4896-b7b1-448e1adf7bc2";
      const jwtToken = session.jwtToken || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiIsInBhc3N3b3JkIjoiIiwiaWF0IjoxNzU2NTQ3MjAzfQ.rW9zIfo1-B_Wu2bfJ8cPai0DGZLfaapRE7kLt2dkCBc";

      // Get user details
      let userId = 0;
      let userName = "";
      const userDetailsStr = localStorage.getItem("expertclaims_user_details");
      if (userDetailsStr) {
        const userDetailsData = JSON.parse(userDetailsStr);
        const userDetails = Array.isArray(userDetailsData) ? userDetailsData[0] : userDetailsData;
        userId = userDetails.employee_id || userDetails.id || 0;
        userName = userDetails.employee_name || userDetails.name || userDetails.full_name || "Admin";
      }

      // Call the API to update status with expert_description
      const response = await fetch("http://localhost:3000/admin/updatestatustechnicalconsultant", {
        method: "PATCH",
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken
        },
        body: JSON.stringify({
          backlog_id: backlogDetail?.backlog_id,
          status: selectedStatus || "completed",
          expert_description: expertSummary,
          updated_by: userName,
          user_id: userId
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Handle array response structure
        let responseData = result;
        if (Array.isArray(result) && result.length > 0) {
          responseData = result[0];
        }

        if (responseData.status === 'success') {
          const successMessage = responseData.message || "Task added successfully";
          toast({
            title: "Success",
            description: successMessage,
          });
          fetchBacklogDetail(backlogId!);
        } else {
          const errorMessage = responseData.message || responseData.error || "Failed to add task";
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else {
        const errorMessage = result?.message || result?.error || `Failed to add task (Status: ${response.status})`;
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error adding task:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add task",
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

      // Update expert report generated status
      setBacklogDetail(prev => {
        if (!prev) return null;
        return {
          ...prev,
          expert_report_generated: true
        };
      });
      
      // Automatically change status to completed
      setSelectedStatus("completed");

      // Automatically call the status update API
      try {
        // Get current user details for API call
        const userDetailsStr = localStorage.getItem("expertclaims_user_details");
        let currentUser = { name: 'Admin', employee_id: 1 };
        
        if (userDetailsStr) {
          const userDetails = JSON.parse(userDetailsStr);
          const userData = Array.isArray(userDetails) ? userDetails[0] : userDetails;
          currentUser = {
            name: userData?.name || userData?.full_name || 'Admin',
            employee_id: userData?.employee_id || userData?.id || 1
          };
        }

        const requestBody = {
          backlog_id: backlogDetail?.backlog_id,
          status: "completed",
          expert_description: expertSummary,
          updated_by: currentUser.name,
          user_id: currentUser.employee_id
        };

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

        const response = await fetch('http://localhost:3000/admin/updatestatustechnicalconsultant', {
          method: 'PATCH',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'session_id': sessionId,
            'jwt_token': jwtToken
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-500 py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (!backlogDetail) {
    return (
      <div className="min-h-screen bg-primary-500 py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Case details not found</p>
          <Button onClick={() => navigate("/admin-dashboard?tab=cases")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
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
                onClick={() => navigate("/admin-dashboard?tab=cases")}
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
                        : backlogDetail.status?.toLowerCase() === "in progress" || backlogDetail.status?.toLowerCase() === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : backlogDetail.status?.toLowerCase() === "complete" || backlogDetail.status?.toLowerCase() === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    } px-3 py-1 rounded-full font-medium`}
                    >
                    {backlogDetail.status
                        ? backlogDetail.status.charAt(0).toUpperCase() + backlogDetail.status.slice(1).replace(/_/g, ' ')
                        : "N/A"}
                    </Badge>
                </div>
              </div>
            </div>

            {/* Case Summary */}
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

            {/* Case Description */}
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
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
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
                  <Textarea
                    id="expertSummary"
                    value={expertSummary}
                    onChange={(e) => setExpertSummary(e.target.value)}
                    placeholder="Enter your expert analysis and summary here..."
                    rows={6}
                    className="w-full"
                  />
                </div>

                {/* Generate Report, Add Summary, and Add Task Buttons */}
                <div className="flex justify-between gap-3">
                  <Button
                    onClick={handleAddSummary}
                    disabled={!expertSummary.trim() || isAddingSummary}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
                  >
                    {isAddingSummary ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Adding Summary...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Add Summary
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleAddTask}
                    disabled={!expertSummary.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Add Task
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

            {/* Case Details Grid */}
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-orange-500">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Policy Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Type of Policy</h4>
                  <p className="text-gray-700">
                    {selectedCaseType 
                      ? caseTypes.find(ct => ct.case_type_id.toString() === selectedCaseType)?.case_type_name 
                      : backlogDetail.case_types?.case_type_name || `Type ${backlogDetail.case_type_id}`}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Created by</h4>
                  <p className="text-gray-700">
                    {typeof backlogDetail.created_by === 'number' ? 'N/A' : (backlogDetail.partner_name || 'N/A')}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Updated by</h4>
                  <p className="text-gray-700">
                    {(() => {
                      const updatedBy = backlogDetail.updated_by;
                      // If it's a number type, show N/A
                      if (typeof updatedBy === 'number') return 'N/A';
                      // If it's a string that is purely numeric (like "580"), show N/A
                      if (typeof updatedBy === 'string' && updatedBy.trim() !== '' && !isNaN(Number(updatedBy)) && updatedBy.trim() === String(Number(updatedBy))) return 'N/A';
                      // Otherwise, show the name/string value or N/A if empty
                      return updatedBy || 'N/A';
                    })()}
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

            {/* Partner Feedback Section - Only show if feedback exists */}
            {backlogDetail.feedback && backlogDetail.feedback.trim() !== '' && (
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
                            // Check if createdby_name contains admin or if role is admin
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

                {/* Assignee Dropdown - Admin can assign */}
                <div>
                  <Label htmlFor="assignee" className="text-sm font-medium text-gray-700 mb-2 block">
                    Assign to Consultant
                  </Label>
                  <Select
                    value={selectedAssignee}
                    onValueChange={setSelectedAssignee}
                    disabled={isLoadingEmployees}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        isLoadingEmployees 
                          ? "Loading..." 
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

                {/* Status Dropdown - Admin can change */}
                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-2 block">
                    Case Status
                  </Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem 
                          key={status.value} 
                          value={status.value}
                          // disabled={status.value === "completed" && !backlogDetail?.expert_report_generated}
                        >
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-3 flex-wrap">
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
                      Update Policy Type
                    </>
                  )}
                </Button>
                <Button
                  onClick={assignConsultant}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  disabled={!selectedAssignee}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Assign Consultant
                </Button>
                <Button
                  onClick={updateStatus}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                  disabled={!selectedStatus}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Case Status
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
                    setZoomLevel(100);
                    setPanX(0);
                    setPanY(0);
                    setIsDragging(false);
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
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
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
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </div>
              ) : documentType.includes('application/pdf') || documentType === 'url' ? (
                <div 
                  className="h-full w-full"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  style={{ userSelect: 'none' }}
                >
                  <iframe
                    src={`${documentUrl}${documentUrl.includes('#') ? '&' : '#'}toolbar=0&navpanes=0&scrollbar=1&statusbar=0&messages=0`}
                    className="w-full h-full rounded-lg border-0"
                    title="Document Viewer"
                    style={{ pointerEvents: 'auto' }}
                    allow="fullscreen"
                    onLoad={(e) => {
                      // Prevent download via iframe content
                      try {
                        const iframe = e.target as HTMLIFrameElement;
                        if (iframe.contentWindow && iframe.contentDocument) {
                          // Disable right-click context menu
                          iframe.contentWindow.addEventListener('contextmenu', (ev) => ev.preventDefault());
                          iframe.contentDocument.addEventListener('contextmenu', (ev) => ev.preventDefault());
                          // Prevent common download shortcuts (Ctrl+S, Cmd+S)
                          iframe.contentWindow.addEventListener('keydown', (ev) => {
                            if ((ev.ctrlKey || ev.metaKey) && (ev.key === 's' || ev.key === 'S')) {
                              ev.preventDefault();
                              ev.stopPropagation();
                            }
                          });
                          iframe.contentDocument.addEventListener('keydown', (ev) => {
                            if ((ev.ctrlKey || ev.metaKey) && (ev.key === 's' || ev.key === 'S')) {
                              ev.preventDefault();
                              ev.stopPropagation();
                            }
                          });
                        }
                      } catch (error) {
                        // Cross-origin restrictions may prevent access - this is expected for external URLs
                        // The toolbar=0 parameter will still hide the download button
                        console.log('Cannot access iframe content due to CORS restrictions');
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Preview not available for this file type</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBacklogDetail;
