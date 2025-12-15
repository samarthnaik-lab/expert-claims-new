import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Calendar, User, FileText, LogOut, CheckCircle, Clock, AlertCircle, Shield, Edit, RefreshCw, Filter, ZoomIn, ZoomOut, RotateCcw, XCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SortableTableHeader from '@/components/ui/SortableTableHeader';
import { useTableSort } from '@/hooks/useTableSort';
import { useAuth } from '@/contexts/AuthContext';

// Task interface based on the API response
interface Task {
  case_id: number;
  case_summary: string;
  case_description: string;
  case_type_id: number;
  assigned_to: number;
  priority: string;
  ticket_stage: string;
  due_date: string;
  resolution_summary: string | null;
  customer_satisfaction_rating: number | null;
  case_value: number;
  value_currency: string;
  bonus_eligible: boolean;
  created_time: string;
  updated_time: string;
  customer_id: number;
  cust_id: number;
  first_name: string;
  last_name: string;
  customer_name: string;
  company_name: string | null;
  mobile_number: string;
  emergency_contact: string;
  email_address: string;
  address: string;
  customer_type: string;
  source: string;
  communication_preferences: string;
  language_preference: string;
  notes: string;
  [key: string]: any; // Allow additional fields
}


const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout, getAuthHeaders } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [taskPageLimit, setTaskPageLimit] = useState('10');
  const [taskCurrentPage, setTaskCurrentPage] = useState(1);
  const [dashboardStats, setDashboardStats] = useState({
    totalTasks: 0,
    Newtask: 0,
    reviewCounts: 0,
    awaitingCounts: 0,
    completedCounts: 0,
    cancelledCounts: 0
  });
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState('Employee');
  const [employeeDepartment, setEmployeeDepartment] = useState('');

  // Real task data from API
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Backlog data from API
  const [backlogData, setBacklogData] = useState<any[]>([]);
  const [isLoadingBacklog, setIsLoadingBacklog] = useState(false);
  const [backlogSearchTerm, setBacklogSearchTerm] = useState('');
  const [backlogStartDate, setBacklogStartDate] = useState("");
  const [backlogEndDate, setBacklogEndDate] = useState("");
  const [currentPageBacklog, setCurrentPageBacklog] = useState(1);
  const [pageSizeBacklog, setPageSizeBacklog] = useState(10);

  // Sorting for backlog data
  const { sortedData: sortedBacklogData, sortConfig: backlogSortConfig, handleSort: handleBacklogSort } = useTableSort(backlogData);
  
  // Modal state for backlog details (View only)
  const [selectedBacklogItem, setSelectedBacklogItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Extract employee name and department from localStorage
  const getEmployeeName = () => {
    try {
      const userDetailsRaw = localStorage.getItem('expertclaims_user_details');
      if (userDetailsRaw) {
        const userDetailsData = JSON.parse(userDetailsRaw);
        const userDetails = Array.isArray(userDetailsData) ? userDetailsData[0] : userDetailsData;
        const name = userDetails?.name || 'Employee';
        const department = userDetails?.department || '';
        setEmployeeName(name);
        setEmployeeDepartment(department);
        console.log('Employee department:', department);
      }
    } catch (error) {
      console.error('Error extracting employee details:', error);
      setEmployeeName('Employee');
      setEmployeeDepartment('');
    }
  };

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get user ID from localStorage or use default
      const userDetailsStr = localStorage.getItem('expertclaims_user_details');
      let userId = 1; // Default fallback

      if (userDetailsStr) {
        const userDetailsData = JSON.parse(userDetailsStr);
        // Handle array response - get the first object if it's an array
        const userDetails = Array.isArray(userDetailsData) ? userDetailsData[0] : userDetailsData;
        userId = userDetails.employee_id || userDetails.id || 1;
      }

      console.log('Fetching employee dashboard data for user:', userId);
      
      const response = await fetch(`http://localhost:3000/support/getemployedashboard?employee_id=${userId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Employee dashboard data:', result);
        
        if (Array.isArray(result) && result.length > 0) {
          setDashboardStats(result[0]);
        } else if (result.totalTasks !== undefined) {
          setDashboardStats(result);
        } else {
          console.error('API returned unexpected format:', result);
        }
      } else {
        console.error('Failed to fetch dashboard data:', response.status);
        toast({
          title: "Error",
          description: "Failed to fetch dashboard statistics",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "An error occurred while fetching dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks from API
  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const userDetailsRaw = localStorage.getItem("expertclaims_user_details");
      if (!userDetailsRaw) {
        throw new Error("No user details found in localStorage");
      }
  
      const userDetailsData = JSON.parse(userDetailsRaw);
      
      // Handle array response - get the first object if it's an array
      const userDetails = Array.isArray(userDetailsData) ? userDetailsData[0] : userDetailsData;

      const employeeId = userDetails?.employee_id;
  
      if (!employeeId) {
        throw new Error("employee_id not found in user details");
      }

      console.log('Fetching tasks from API...');
      
      const url = `http://localhost:3000/support/getemployeetasks?employee_id=${employeeId}&page=${taskCurrentPage}&size=${parseInt(taskPageLimit)}`;
      console.log('Fetching tasks with URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          'prefer': 'count=exact'
        }
      });

      if (!response.ok) {
        console.error("Failed to fetch tasks:", response.status);
        setTasks([]);
        toast({
          title: "Error",
          description: "Failed to fetch tasks from API",
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();
    console.log("Tasks API response:", result);

    // Shape guard:
    // Expected: [ { status, message, session_id, ..., data: [ ...tasks ] } ]
    let tasks: any[] = [];
    if (Array.isArray(result)) {
      const first = result[0];
      if (first && Array.isArray(first.data)) {
        tasks = first.data;
      }
    } else if (result && Array.isArray(result.data)) {
      // (Just in case the API ever returns an object directly)
      tasks = result.data;
    }

    if (Array.isArray(tasks)) {
      setTasks(tasks);
      toast({
        title: "Success",
        description: `Successfully loaded ${tasks.length} tasks`,
      });
    } else {
      console.error("Tasks API returned unexpected format:", result);
      setTasks([]);
      toast({
        title: "Warning",
        description: "Tasks API returned unexpected format",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error("Error fetching tasks:", error);
    setTasks([]);
    toast({
      title: "Error",
      description: "An error occurred while fetching tasks",
      variant: "destructive",
    });
  } finally {
    setIsLoadingTasks(false);
  }
};

  // Fetch backlog data from API
  const fetchBacklogData = async () => {
    setIsLoadingBacklog(true);
    try {
      const userDetailsStr = localStorage.getItem('expertclaims_user_details');
      let userId = 0; 
      let department = '';
      if (userDetailsStr) {
        const userDetailsData = JSON.parse(userDetailsStr);
        // Handle array response - get the first object if it's an array
        const userDetails = Array.isArray(userDetailsData) ? userDetailsData[0] : userDetailsData;
        department = userDetails.department || '';
        // gap_analysis sees all cases, technical_consultant sees only assigned cases
        if (userDetails.department === 'gap_analysis') {
          userId = 0; // Show all cases
        } else {
          userId = userDetails.employee_id || userDetails.id || 0; // Show only assigned cases
        }
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

      // Get auth headers from context
      const authHeaders = getAuthHeaders();

      // Determine API endpoint based on department
      let apiUrl = '';
      let headers: { [key: string]: string } = {
          'accept': 'application/json',
        'content-type': 'application/json'
      };

      // Supabase service role key
      const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws';

      if (department.toLowerCase() === 'technical_consultant') {
        // Use new Node.js API for technical consultants
        apiUrl = `http://localhost:3000/support/get_all_backlog_data?employee_id=${userId}`;
        headers['apikey'] = supabaseServiceRoleKey;
        headers['authorization'] = `Bearer ${supabaseServiceRoleKey}`;
        headers['session_id'] = sessionId || '';
        headers['jwt_token'] = jwtToken || '';
        console.log('Calling technical consultant API:', apiUrl, 'with employee_id:', userId);
      } else if (department.toLowerCase() === 'gap_analysis') {
        // Use new Node.js API for gap_analysis - gets all data with employee_id=0
        apiUrl = `http://localhost:3000/support/get_all_backlog_data?employee_id=0`;
        headers['apikey'] = supabaseServiceRoleKey;
        headers['authorization'] = `Bearer ${supabaseServiceRoleKey}`;
        headers['session_id'] = sessionId || '';
        headers['jwt_token'] = jwtToken || '';
        console.log('Calling gap_analysis API:', apiUrl);
      } else {
        // Use Node.js support API for other departments
        apiUrl = `http://localhost:3000/support/get_all_backlog_data?employee_id=${userId}`;
        headers['accept'] = 'application/json';
        headers['accept-language'] = 'en-GB,en-US;q=0.9,en;q=0.8';
        headers['content-type'] = 'application/json';
        console.log('Calling Node.js support API for other departments:', apiUrl, 'with employee_id:', userId);
      }
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: headers
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Backlog data:', result);
        
        // Handle both array response and object with data property
        let backlogItems = [];
        if (Array.isArray(result)) {
          backlogItems = result;
        } else if (result && result.data && Array.isArray(result.data)) {
          backlogItems = result.data;
        } else if (result && result.success && Array.isArray(result.data)) {
          backlogItems = result.data;
        } else {
          console.error('Backlog API returned unexpected format:', result);
          setBacklogData([]);
          return;
        }
        
        setBacklogData(backlogItems);
        toast({
          title: "Success",
          description: `Successfully loaded ${backlogItems.length} backlog items`,
        });
      } else {
        console.error('Failed to fetch backlog data:', response.status);
        setBacklogData([]);
        toast({
          title: "Error",
          description: "Failed to fetch backlog data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching backlog data:', error);
      setBacklogData([]);
      toast({
        title: "Error",
        description: "An error occurred while fetching backlog data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBacklog(false);
    }
  };

  // Fetch dashboard data on component mount
  useEffect(() => {
    getEmployeeName();
    fetchDashboardData();
    fetchTasks();
    fetchBacklogData();
  }, []);

  // Update status filter when URL parameters change
  useEffect(() => {
    const newStatusFilter = searchParams.get('status') || 'all';
    setStatusFilter(newStatusFilter);
  }, [searchParams]);

  // Auto-switch to tasks tab when URL contains ?tab=tasks
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'tasks') {
      // Force the tasks tab to be active by updating the URL
      navigate('/employee-dashboard?tab=tasks', { replace: true });
    }
  }, [searchParams, navigate]);

  // Refetch tasks when pagination parameters change
  useEffect(() => {
    fetchTasks();
  }, [taskCurrentPage, taskPageLimit]);

  // Reset to first page when backlog filters change
  useEffect(() => {
    setCurrentPageBacklog(1);
  }, [backlogSearchTerm, backlogStartDate, backlogEndDate]);

  // Use API data for task stats
  const taskStats = {
    new: dashboardStats.totalTasks,
    pending: dashboardStats.Newtask,
    review: dashboardStats.reviewCounts,
    approval: dashboardStats.cancelledCounts,
    completed: dashboardStats.completedCounts
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-orange-100 text-orange-800';
      case 'approval': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'analysis': return 'bg-purple-100 text-purple-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Status mapping for filter values to actual task statuses
  const statusMapping = {
    'under review': [
      'Under Evaluation',
      'Evaluated', 
      'Agreement',
      'Under Litigation/Consumer Forum',
      'Under Arbitration',
      'Analysis',
      'Review'
    ],
    'approved': [
      '1st Instalment Paid',
      'Completed',
      'Partner Payment Done',
      'Resolved',
      'Closed'
    ],
    'in progress': [
      'Under process',
      'Pending with grievance cell of insurance company',
      'Pending with Ombudsman',
      '1st Installment Pending',
      'Partner Payment Pending'
    ]
  };

  const filteredTasks = tasks.filter(task => {
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = task.case_summary?.toLowerCase().includes(searchLower) ||
                         task.case_id?.toString().includes(searchLower) ||
                         task.customer_name?.toLowerCase().includes(searchLower) ||
                         task.mobile_number?.toLowerCase().includes(searchLower);
    
    // Updated status matching logic (case-insensitive)
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      const statusArray = statusMapping[statusFilter as keyof typeof statusMapping];
      if (statusArray) {
        // Convert both task status and mapping values to lowercase for comparison
        const taskStatusLower = task.ticket_stage?.toString().toLowerCase() || '';
        matchesStatus = statusArray.some(status => status.toLowerCase() === taskStatusLower);
      } else {
        // Fallback to exact match for other status filters
        matchesStatus = task.ticket_stage?.toString().toLowerCase() === statusFilter.toLowerCase();
      }
    }
    
    return matchesSearch && matchesStatus;
  });

  const refreshAllData = () => {
    fetchDashboardData();
    fetchTasks();
    fetchBacklogData();
  };

  // Calculate assignment statistics from backlogData
  const assignmentStats = {
    total: backlogData.length,
    new: backlogData.filter(item => item.status?.toLowerCase() === 'new').length,
    inProgress: backlogData.filter(item => item.status?.toLowerCase() === 'in progress').length,
    completed: backlogData.filter(item => item.status?.toLowerCase() === 'complete' || item.status?.toLowerCase() === 'completed').length,
  };

  // Function to open modal with backlog details
  const openBacklogModal = (item: any) => {
    console.log('Navigating to backlog view page:', item.backlog_id);
    navigate(`/employee-backlog-view/${item.backlog_id}`);
  };

  // Function to handle edit action - navigate to edit page
  const handleEdit = (backlogId: number) => {
    console.log('Navigating to backlog edit page:', backlogId);
    navigate(`/employee-backlog-edit/${backlogId}`);
  };

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

      // Call the n8n webhook API to get document view URL
      console.log('Calling n8n webhook for document view...');
      console.log('Document ID:', documentId);
      
      const requestBody = {
        document_id: documentId
      };
      console.log('Request body:', requestBody);
      
      const response = await fetch('https://n8n.srv952553.hstgr.cloud/webhook/partnerdocumentview', {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
          'Content-Profile': 'expc',
          'Accept-Profile': 'expc',
          'session_id': 'a9bfe0a4-1e6c-4c69-860f-ec50846a7da6',
          'jwt_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiIsInBhc3N3b3JkIjoiIiwiaWF0IjoxNzU2NTQ3MjAzfQ.rW9zIfo1-B_Wu2bfJ8cPai0DGZLfaapRE7kLt2dkCBc',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        console.error('Failed to call view webhook:', response.status, response.statusText);
        
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


  // Mock data
  const hrPolicies = [
    {
      title: "Code of Conduct",
      content: "All employees are expected to maintain the highest standards of professional conduct, including respect for colleagues, clients, and company property."
    },
    {
      title: "Work from Home Policy",
      content: "Employees may work from home up to 3 days per week with prior approval from their manager. All remote work must maintain productivity standards."
    },
    {
      title: "Leave Policy",
      content: "Annual leave: 21 days per year. Sick leave: 10 days per year. Maternity/Paternity leave as per local regulations. All leave requires advance approval."
    },
    {
      title: "Expense Reimbursement Policy",
      content: "Business expenses will be reimbursed upon submission of valid receipts within 30 days. Pre-approval required for expenses over $500."
    },
    {
      title: "Performance Review Process",
      content: "Annual performance reviews conducted in Q4. Mid-year check-ins in Q2. Goals set at beginning of each year with quarterly progress reviews."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Modern Header */}
      <header className="bg-primary-500 backdrop-blur-md shadow-sm border-b border-primary-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Support Team Dashboard
                </h1>
                <p className="text-xs text-white/80 font-medium">Welcome back, {employeeName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Refresh Button */}
              {/* <Button
                variant="outline"
                onClick={refreshAllData}
                disabled={loading || isLoadingTasks}
                className="flex items-center space-x-2 border-2 border-gray-300 hover:border-primary-500 rounded-xl transition-all duration-300"
              >
                <RefreshCw className={`h-4 w-4 ${loading || isLoadingTasks ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button> */}
              {/* Profile Picture */}
              {/* <Button
                variant="ghost"
                onClick={() => navigate('/employee-personal-info')}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-full transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  JS
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">John Smith</p>
                  <p className="text-xs text-white/80">Claims Processor</p>
                </div>
              </Button> */}
              <Button 
                variant="outline" 
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center space-x-2 border-2 border-gray-300 hover:border-primary-500 rounded-xl transition-all duration-300"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h2>
          <p className="text-gray-600 mb-6">{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          
          {/* Quick Stats - Task stats for regular employees */}
          {!['gap_analysis', 'technical_consultant'].includes(employeeDepartment.toLowerCase()) && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card 
              className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm cursor-pointer"
              onClick={() => navigate('/employee-dashboard?tab=tasks&status=new')}
            >
              <CardContent className="p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-blue-600/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl mb-3 shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {loading ? '...' : taskStats.new}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Total Tasks</div>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-yellow-50/50 backdrop-blur-sm cursor-pointer"
              onClick={() => navigate('/employee-dashboard?tab=tasks&status=pending')}
            >
              <CardContent className="p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl mb-3 shadow-lg">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {loading ? '...' : taskStats.pending}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Pending Tasks</div>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-orange-50/50 backdrop-blur-sm cursor-pointer"
              onClick={() => navigate('/employee-dashboard?tab=tasks&status=review')}
            >
              <CardContent className="p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-400/10 to-orange-600/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl mb-3 shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {loading ? '...' : taskStats.review}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Under Review</div>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-purple-50/50 backdrop-blur-sm cursor-pointer"
              onClick={() => navigate('/employee-dashboard?tab=tasks&status=approval')}
            >
              <CardContent className="p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-400/10 to-purple-600/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl mb-3 shadow-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {loading ? '...' : taskStats.approval}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Cancelled Counts</div>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-emerald-50/50 backdrop-blur-sm cursor-pointer"
              onClick={() => navigate('/employee-dashboard?tab=tasks&status=completed')}
            >
              <CardContent className="p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-400/10 to-emerald-600/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl mb-3 shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {loading ? '...' : taskStats.completed}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Completed</div>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Assignment Stats Cards - For technical_consultant and gap_analysis */}
          {['gap_analysis', 'technical_consultant'].includes(employeeDepartment.toLowerCase()) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card 
              className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-purple-50/50 backdrop-blur-sm cursor-pointer"
              onClick={() => navigate('/employee-dashboard?tab=Assignments')}
            >
              <CardContent className="p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-400/10 to-purple-600/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl mb-3 shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {isLoadingBacklog ? '...' : assignmentStats.total}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Total Assignments</div>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-yellow-50/50 backdrop-blur-sm cursor-pointer"
              onClick={() => navigate('/employee-dashboard?tab=Assignments')}
            >
              <CardContent className="p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl mb-3 shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {isLoadingBacklog ? '...' : assignmentStats.new}
                  </div>
                  <div className="text-sm font-medium text-gray-700">New Assignments</div>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm cursor-pointer"
              onClick={() => navigate('/employee-dashboard?tab=Assignments')}
            >
              <CardContent className="p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-blue-600/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl mb-3 shadow-lg">
                    <RefreshCw className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {isLoadingBacklog ? '...' : assignmentStats.inProgress}
                  </div>
                  <div className="text-sm font-medium text-gray-700">In Progress</div>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-emerald-50/50 backdrop-blur-sm cursor-pointer"
              onClick={() => navigate('/employee-dashboard?tab=Assignments')}
            >
              <CardContent className="p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-400/10 to-emerald-600/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl mb-3 shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {isLoadingBacklog ? '...' : assignmentStats.completed}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Completed</div>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={searchParams.get('tab') || (['gap_analysis', 'technical_consultant'].includes(employeeDepartment.toLowerCase()) ? "Assignments" : "overview")} onValueChange={(value) => navigate(`/employee-dashboard?tab=${value}`)} className="space-y-6 animate-slide-up">
        {['gap_analysis', 'technical_consultant'].includes(employeeDepartment.toLowerCase()) ? (
          <TabsList className="grid w-full grid-cols-1 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-1">
            <TabsTrigger value="Assignments" className="rounded-lg font-semibold">
              Assignments
            </TabsTrigger>
          </TabsList>
        ) : (
          <TabsList
            className={`grid w-full ${
              ['gap_analysis', 'technical_consultant'].includes(employeeDepartment.toLowerCase())
                ? 'grid-cols-4'
                : 'grid-cols-3'
            } bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-1`}
          >
            <TabsTrigger value="overview" className="rounded-lg font-semibold">Overview</TabsTrigger>
            {['gap_analysis', 'technical_consultant'].includes(employeeDepartment.toLowerCase()) && (
              <TabsTrigger value="Assignments" className="rounded-lg font-semibold">
                Assignments
              </TabsTrigger>
            )}
            <TabsTrigger value="tasks" className="rounded-lg font-semibold">Task Management</TabsTrigger>
            <TabsTrigger value="hr" className="rounded-lg font-semibold">HR</TabsTrigger>
          </TabsList>
        )}

          {!['gap_analysis', 'technical_consultant'].includes(employeeDepartment.toLowerCase()) && (
            <TabsContent value="overview" className="space-y-6">
            <Card className="border-none shadow-xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle 
                  className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-300"
                  onClick={() => navigate('/employee-dashboard?tab=tasks')}
                >
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-gray-600">Get started with your daily tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button 
                    onClick={() => {
                      // Navigate to the same page but with tasks tab active
                      navigate('/employee-dashboard?tab=tasks');
                    }} 
                    className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                  >
                    View Tasks
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/new-task')}
                    className="border-2 border-gray-300 hover:border-primary-500 px-6 py-3 rounded-xl transition-all duration-300 font-semibold"
                  >
                    Create New Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          <TabsContent value="Assignments" className="space-y-4">
            <Card className="border-none shadow-xl bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Assignments
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Track all the Assignments for evaluation
                    </CardDescription>
                  </div>
                  {/* Page Size Selector */}
                  {!isLoadingBacklog && backlogData.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Show:</span>
                      <Select
                        value={pageSizeBacklog.toString()}
                        onValueChange={(value) => setPageSizeBacklog(parseInt(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-600">entries</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col space-y-4 mt-4">
                  {/* Search and Expert Filter Row */}
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <Input
                        placeholder="Search by case summary, description, case type, or ID..."
                        value={backlogSearchTerm}
                        onChange={(e) => setBacklogSearchTerm(e.target.value)}
                        className="pl-10 max-w-sm border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-purple-500 transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchBacklogData}
                        disabled={isLoadingBacklog}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingBacklog ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                  
                  {/* Date Range Filter Row */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        From Date:
                      </label>
                      <Input
                        type="date"
                        value={backlogStartDate}
                        onChange={(e) => setBacklogStartDate(e.target.value)}
                        className="border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-purple-500 transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        To Date:
                      </label>
                      <Input
                        type="date"
                        value={backlogEndDate}
                        onChange={(e) => setBacklogEndDate(e.target.value)}
                        className="border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-purple-500 transition-all duration-300"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBacklogStartDate("");
                        setBacklogEndDate("");
                      }}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      Clear Dates
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingBacklog ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-purple-600 mr-2" />
                    <span className="text-gray-600">Loading backlog data...</span>
                  </div>
                ) : backlogData.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No backlog cases found</h3>
                    <p className="text-gray-500">No backlog cases have been created yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <SortableTableHeader
                            column="backlog_id"
                            label="Task ID"
                            sortColumn={backlogSortConfig?.column || ''}
                            sortDirection={backlogSortConfig?.direction || 'asc'}
                            onSort={handleBacklogSort}
                          />
                          <SortableTableHeader
                            column="case_summary"
                            label="Task Summary"
                            sortColumn={backlogSortConfig?.column || ''}
                            sortDirection={backlogSortConfig?.direction || 'asc'}
                            onSort={handleBacklogSort}
                            sortable={false}
                          />
                          <SortableTableHeader
                            column="case_description"
                            label="Task Description"
                            sortColumn={backlogSortConfig?.column || ''}
                            sortDirection={backlogSortConfig?.direction || 'asc'}
                            onSort={handleBacklogSort}
                            sortable={false}
                          />
                          <SortableTableHeader
                            column="backlog_referral_date"
                            label="Task Referral Date"
                            sortColumn={backlogSortConfig?.column || ''}
                            sortDirection={backlogSortConfig?.direction || 'asc'}
                            onSort={handleBacklogSort}
                            sortable={false}
                          />
                          <SortableTableHeader
                            column="status"
                            label="Status"
                            sortColumn={backlogSortConfig?.column || ''}
                            sortDirection={backlogSortConfig?.direction || 'asc'}
                            onSort={handleBacklogSort}
                            sortable={false}
                          />
                          <th className="text-left p-4 font-semibold text-gray-700">
                            Assigned Expert
                          </th>
                          <th className="text-left p-4 font-semibold text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(sortedBacklogData || [])
                          .filter((item) => {
                            if (!item) return false;
                            
                            // Search filter
                            const searchMatch = !backlogSearchTerm || (() => {
                              const searchLower = backlogSearchTerm.toLowerCase();
                              return (
                                item.case_summary?.toLowerCase().includes(searchLower) ||
                                item.case_description?.toLowerCase().includes(searchLower) ||
                                item.backlog_id?.toString().includes(searchLower) ||
                                item.case_type_id?.toString().includes(searchLower) ||
                                item.case_types?.case_type_name?.toLowerCase().includes(searchLower)
                              );
                            })();

                            // Date range filter
                            const dateMatch = (() => {
                              if (!backlogStartDate && !backlogEndDate) return true;
                              
                              if (!item.backlog_referral_date) return false;
                              
                              const itemDate = new Date(item.backlog_referral_date);
                              if (isNaN(itemDate.getTime())) return false;

                              const startDate = backlogStartDate ? new Date(backlogStartDate) : null;
                              const endDate = backlogEndDate ? new Date(backlogEndDate) : null;

                              if (startDate && !isNaN(startDate.getTime()) && endDate && !isNaN(endDate.getTime())) {
                                return itemDate >= startDate && itemDate <= endDate;
                              } else if (startDate && !isNaN(startDate.getTime())) {
                                return itemDate >= startDate;
                              } else if (endDate && !isNaN(endDate.getTime())) {
                                return itemDate <= endDate;
                              }
                              return true;
                            })();

                            return searchMatch && dateMatch;
                          })
                          .slice((currentPageBacklog - 1) * pageSizeBacklog, currentPageBacklog * pageSizeBacklog)
                          .map((item, index) => (
                            <tr
                              key={item.backlog_id || index}
                              className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors duration-200"
                            >
                              <td className="p-4">
                                <span className="font-mono text-sm text-purple-600">
                                  {item.backlog_id}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="font-medium text-gray-900">
                                  {item.case_summary || "No Summary"}
                                </div>
                              </td>
                              <td className="p-4 text-gray-700">
                                {item.case_description || "No Description"}
                              </td>
                              <td className="p-4 text-sm text-gray-600">
                                {item.backlog_referral_date
                                  ? new Date(item.backlog_referral_date).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "2-digit",
                                    })
                                : "N/A"}
                              </td>
                              <td className="p-4">
                                <Badge
                                  className={`
                                    ${
                                      item.status?.toLowerCase() === "new"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : item.status?.toLowerCase() === "in progress"
                                        ? "bg-blue-100 text-blue-800"
                                        : item.status?.toLowerCase() === "complete"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800" // fallback for unknown status
                                    }
                                    px-3 py-1 rounded-full font-medium`}
                                >
                                  {item.status ? item.status : 'N/A'}
                                </Badge>
                              </td>
                              <td className="p-4">
                                {item.assigned_consultant_name ? item.assigned_consultant_name : 'Not Assigned'}
                              </td>
                              <td className="p-4">
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                    onClick={() => openBacklogModal(item)}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                    onClick={() => handleEdit(item.backlog_id)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    
                    {/* Pagination */}
                    {(() => {
                      const filteredData = (sortedBacklogData || []).filter((item) => {
                        if (!item) return false;
                        
                        // Search filter
                        const searchMatch = !backlogSearchTerm || (() => {
                          const searchLower = backlogSearchTerm.toLowerCase();
                          return (
                            item.case_summary?.toLowerCase().includes(searchLower) ||
                            item.case_description?.toLowerCase().includes(searchLower) ||
                            item.backlog_id?.toString().includes(searchLower) ||
                            item.case_type_id?.toString().includes(searchLower) ||
                            item.case_types?.case_type_name?.toLowerCase().includes(searchLower)
                          );
                        })();

                        // Date range filter
                        const dateMatch = (() => {
                          if (!backlogStartDate && !backlogEndDate) return true;
                          
                          if (!item.backlog_referral_date) return false;
                          
                          const itemDate = new Date(item.backlog_referral_date);
                          if (isNaN(itemDate.getTime())) return false;

                          const startDate = backlogStartDate ? new Date(backlogStartDate) : null;
                          const endDate = backlogEndDate ? new Date(backlogEndDate) : null;

                          if (startDate && !isNaN(startDate.getTime()) && endDate && !isNaN(endDate.getTime())) {
                            return itemDate >= startDate && itemDate <= endDate;
                          } else if (startDate && !isNaN(startDate.getTime())) {
                            return itemDate >= startDate;
                          } else if (endDate && !isNaN(endDate.getTime())) {
                            return itemDate <= endDate;
                          }
                          return true;
                        })();

                        return searchMatch && dateMatch;
                      });
                      
                      return filteredData.length > pageSizeBacklog && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="text-sm text-gray-500">
                            Showing {((currentPageBacklog - 1) * pageSizeBacklog) + 1} to {Math.min(currentPageBacklog * pageSizeBacklog, filteredData.length)} of {filteredData.length} entries
                          </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPageBacklog(prev => Math.max(1, prev - 1))}
                            disabled={currentPageBacklog === 1}
                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-gray-600">
                            Page {currentPageBacklog} of {Math.ceil(filteredData.length / pageSizeBacklog)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPageBacklog(prev => Math.min(Math.ceil(filteredData.length / pageSizeBacklog), prev + 1))}
                            disabled={currentPageBacklog >= Math.ceil(filteredData.length / pageSizeBacklog)}
                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {!['gap_analysis', 'technical_consultant'].includes(employeeDepartment.toLowerCase()) && (
            <TabsContent value="tasks" className="space-y-4">
            {/* Task Summary Cards */}
            

            <Card className="border-none shadow-xl bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">Your Task List</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage and track your assigned tasks
                </CardDescription>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <Input
                      placeholder="Search by case summary, customer name, or case ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 max-w-sm border-2 border-gray-200 rounded-xl focus:border-primary-500 transition-all duration-300"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select 
                      value={statusFilter} 
                      onValueChange={(value) => {
                        setStatusFilter(value);
                        navigate(`/employee-dashboard?tab=tasks&status=${value}`);
                      }}
                    >
                      <SelectTrigger className="w-40 border-2 border-gray-200 rounded-xl focus:border-primary-500">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="under review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="in progress">In Progress</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={taskPageLimit}
                      onValueChange={(value) => {
                        setTaskPageLimit(value);
                        setTaskCurrentPage(1); // Reset to first page when limit changes
                      }}
                    >
                      <SelectTrigger className="w-32 border-2 border-gray-200 rounded-xl focus:border-primary-500">
                        <SelectValue placeholder="Page limit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchTasks}
                      disabled={isLoadingTasks}
                      className="border-2 border-gray-300 hover:border-primary-500 rounded-lg transition-all duration-300"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTasks ? 'animate-spin' : ''}`} />
                      Refresh Tasks
                    </Button>
                    {statusFilter !== 'all' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setStatusFilter('all');
                          navigate('/employee-dashboard?tab=tasks');
                        }}
                        className="border-2 border-gray-300 hover:border-primary-500 rounded-lg transition-all duration-300"
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTasks ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading tasks...</span>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-2">No tasks found</p>
                    <p className="text-sm text-gray-400">Tasks will appear here once they are assigned to you</p>
                  </div>
                ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-4 font-semibold text-gray-700">ID</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Task Name</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Customer</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Mobile</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Priority</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Assigned Date</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map(task => (
                        <tr key={task.case_id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-200">
                          <td className="p-4">
                            <button
                              onClick={() => navigate(`/task/${task.case_id}`)}
                              className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors duration-200"
                            >
                              {task.case_id || 'N/A'}
                            </button>
                          </td>
                          <td className="p-4 font-medium text-gray-900">{task.case_summary || 'No Summary'}</td>
                          <td className="p-4 text-gray-700">{task.customer_name || 'Unknown Customer'}</td>
                          <td className="p-4 text-gray-600">{task.mobile_number || 'N/A'}</td>
                          <td className="p-4">
                            <Badge className={`${getPriorityColor(task.priority)} px-3 py-1 rounded-full font-medium`}>
                              {task.priority || 'N/A'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={`${getStatusColor(task.ticket_stage)} px-3 py-1 rounded-full font-medium`}>
                              {task.ticket_stage || 'Unknown Status'}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-gray-600">{task.due_date || 'No Due Date'}</td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/task/${task.case_id}`)}
                                className="border-2 border-gray-300 hover:border-primary-500 rounded-lg transition-all duration-300"
                              >
                                View
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/edit-task/${task.case_id}`)}
                                className="border-2 border-gray-300 hover:border-primary-500 rounded-lg transition-all duration-300 flex items-center space-x-1"
                              >
                                <Edit className="h-3 w-3" />
                                <span>Edit</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTasks.length === 0 && tasks.length > 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        {statusFilter !== 'all' 
                          ? `No tasks found with status "${statusFilter}"` 
                          : 'No tasks found matching your search criteria'}
                      </p>
                      {statusFilter !== 'all' && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setStatusFilter('all');
                            navigate('/employee-dashboard?tab=tasks');
                          }}
                          className="mt-2"
                        >
                          Clear Filter
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                )}

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Showing {filteredTasks.length} tasks
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTaskCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={taskCurrentPage === 1}
                      className="border-2 border-gray-300 hover:border-primary-500 rounded-lg transition-all duration-300"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-700">
                      Page {taskCurrentPage}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTaskCurrentPage(prev => prev + 1)}
                      disabled={filteredTasks.length < parseInt(taskPageLimit)}
                      className="border-2 border-gray-300 hover:border-primary-500 rounded-lg transition-all duration-300"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {!['gap_analysis', 'technical_consultant'].includes(employeeDepartment.toLowerCase()) && (
            <TabsContent value="hr" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card 
                className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm cursor-pointer"
                onClick={() => navigate('/payslips-compensation')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    <span>Payslips & Compensation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Download your monthly payslips</p>
                  <Button variant="outline" className="border-2 border-gray-300 hover:border-emerald-500 rounded-xl transition-all duration-300">
                    View Payslips
                  </Button>
                </CardContent>
              </Card>
              <Card 
                className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm cursor-pointer"
                onClick={() => navigate('/leave-management')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>Leave Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Apply for leave and view history</p>
                  <Button variant="outline" className="border-2 border-gray-300 hover:border-blue-500 rounded-xl transition-all duration-300">
                    Manage Leave
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <Card className="border-none shadow-xl bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">HR Policies</CardTitle>
                <CardDescription className="text-gray-600">
                  View company policies and guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {hrPolicies.map((policy, index) => (
                    <AccordionItem key={index} value={`policy-${index}`} className="border border-gray-200 rounded-xl px-4">
                      <AccordionTrigger className="font-semibold text-gray-900 hover:no-underline">{policy.title}</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-gray-700 leading-relaxed">{policy.content}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Backlog Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Backlog Case Details
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete information about the selected backlog case
            </DialogDescription>
          </DialogHeader>
          
          {selectedBacklogItem && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Case ID: #{selectedBacklogItem.backlog_id}
                    </h3>
                    <p className="text-lg text-gray-700 font-medium">
                      {selectedBacklogItem.case_summary || "No Summary Available"}
                    </p>
                  </div>
                  <Badge
                    className={`${selectedBacklogItem.deleted_flag ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"} px-4 py-2 text-sm font-semibold`}
                  >
                    {selectedBacklogItem.deleted_flag ? "Deleted" : "Active"}
                  </Badge>
                </div>
              </div>

              {/* Case Summary */}
              <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Case Summary</h3>
                <p className="text-gray-700">{selectedBacklogItem.case_summary}</p>
              </div>

              {/* Case Description */}
              <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Case Description</h3>
                <p className="text-gray-700">{selectedBacklogItem.case_description}</p>
              </div>

              {/* Case Details Grid */}
              <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-orange-500">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Case Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Case Type Name</h4>
                    <p className="text-gray-700">{selectedBacklogItem.case_types?.case_type_name || `Type ${selectedBacklogItem.case_type_id}`}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Referring Partner ID</h4>
                    <p className="text-gray-700">{selectedBacklogItem.backlog_referring_partner_id || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Referral Date</h4>
                    <p className="text-gray-700">{selectedBacklogItem.backlog_referral_date || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                    <Badge
                      className={`${selectedBacklogItem.deleted_flag ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"} px-3 py-1`}
                    >
                      {selectedBacklogItem.deleted_flag ? "Deleted" : "Active"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              {selectedBacklogItem.comment_text && (
                <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-pink-500">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-gray-700 leading-relaxed">
                      {selectedBacklogItem.comment_text}
                    </p>
                  </div>
                </div>
              )}

              {/* Documents Section */}
              {selectedBacklogItem.backlog_documents && selectedBacklogItem.backlog_documents.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary-500" />
                    <span>Documents ({selectedBacklogItem.backlog_documents.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {selectedBacklogItem.backlog_documents.map((doc: any, index: number) => {
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

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-2 border-gray-300 hover:border-gray-400"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

export default EmployeeDashboard;
