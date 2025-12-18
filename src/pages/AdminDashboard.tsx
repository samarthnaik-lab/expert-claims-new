import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, FileText, Settings, TrendingUp, LogOut, Plus, Eye, Edit, Trash, UserPlus, ArrowLeft, List, Calendar, CheckCircle, XCircle, Search, Filter, X, AlertTriangle, RefreshCw, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { SessionExpiry } from '@/components/SessionExpiry';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserService, AdminUser } from '@/services/userService';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { userDetails, logout } = useAuth();

  // Helper function to format partner type: replace underscores with spaces and capitalize words
  const formatPartnerType = (type: string | null | undefined): string => {
    if (!type || type === 'N/A') return 'N/A';
    // Replace underscores with spaces and capitalize each word
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userPartnerTypeFilter, setUserPartnerTypeFilter] = useState('all');
  const [userPageLimit, setUserPageLimit] = useState('10');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [leavePageLimit, setLeavePageLimit] = useState('10');
  const [leaveCurrentPage, setLeaveCurrentPage] = useState(1);
  const [taskPageLimit, setTaskPageLimit] = useState('10');
  const [taskCurrentPage, setTaskCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]); // All tasks for cards (no pagination)
  const [loading, setLoading] = useState(false);
  const [loadingAllTasks, setLoadingAllTasks] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [allLeaveRequests, setAllLeaveRequests] = useState([]); // All leave requests for cards (no pagination)
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [loadingAllLeaves, setLoadingAllLeaves] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]); // All users for cards (no pagination)
  const [allUsersForSearch, setAllUsersForSearch] = useState<AdminUser[]>([]); // All users with full details for searching
  const [usersLoading, setUsersLoading] = useState(false);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [allFetchedUsers, setAllFetchedUsers] = useState<AdminUser[]>([]); // Accumulated users when filtering by partner type
  const [hasMoreUsers, setHasMoreUsers] = useState(true); // Track if there are more users to fetch from API

  // Backlog data from API
  const [backlogData, setBacklogData] = useState<any[]>([]);
  const [isLoadingBacklog, setIsLoadingBacklog] = useState(false);
  const [backlogSearchTerm, setBacklogSearchTerm] = useState('');
  const [currentPageBacklog, setCurrentPageBacklog] = useState(1);
  const [pageSizeBacklog, setPageSizeBacklog] = useState(10);
  
  // Cases data from API
  const [casesData, setCasesData] = useState<any[]>([]);
  const [allCasesData, setAllCasesData] = useState<any[]>([]); // All cases for cards (no pagination)
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [loadingAllCases, setLoadingAllCases] = useState(false);
  const [casesSearchTerm, setCasesSearchTerm] = useState('');
  const [currentPageCases, setCurrentPageCases] = useState(1);
  const [pageSizeCases, setPageSizeCases] = useState(10);
  
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

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [adminName, setAdminName] = useState('Admin');

  // Extract admin name from localStorage
  const getAdminName = () => {
    try {
      const userDetailsRaw = localStorage.getItem('expertclaims_user_details');
      if (userDetailsRaw) {
        const userDetailsData = JSON.parse(userDetailsRaw);
        const userDetails = Array.isArray(userDetailsData) ? userDetailsData[0] : userDetailsData;
        const name = userDetails?.name || userDetails?.full_name || 'Admin';
        setAdminName(name);
      }
    } catch (error) {
      console.error('Error extracting admin name:', error);
      setAdminName('Admin');
    }
  };

  // Dashboard stats - will be populated from API
  const [stats, setStats] = useState({
    totalTasks: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    reviewCounts: 0,
    cancelledCounts: 0,
    completedCounts: 0
  });

  // Mock tasks data - removed, now using API data from tasks state
  // const mockTasks = [];

  /* Mock users data removed - now using API
  const users = [
    {
      id: 'user-001',
      name: 'John Smith',
      role: 'Manager',
      status: 'Active',
      email: 'john.smith@company.com',
      phone: '+1 (555) 123-4567',
      department: 'Claims Management',
      joinDate: '2023-01-15',
      lastLogin: '2024-06-19 14:30',
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canViewReports: true,
      canManageUsers: true,
      totalTasks: 45,
      completedTasks: 38,
      pendingTasks: 7,
      avgCompletionTime: '2.3 days',
      notes: 'Senior manager with 5+ years experience in claims processing. Excellent performance record.'
    },
    {
      id: 'user-002',
      name: 'Alice Johnson',
      role: 'Employee',
      status: 'Inactive',
      email: 'alice.johnson@company.com',
      phone: '+1 (555) 234-5678',
      department: 'Customer Service',
      joinDate: '2023-03-20',
      lastLogin: '2024-05-28 09:15',
      canCreateTasks: false,
      canEditTasks: true,
      canDeleteTasks: false,
      canViewReports: false,
      canManageUsers: false,
      totalTasks: 23,
      completedTasks: 20,
      pendingTasks: 3,
      avgCompletionTime: '3.1 days',
      notes: 'On maternity leave until September 2024. Good performance before leave.'
    },
    {
      id: 'user-003',
      name: 'Bob Wilson',
      role: 'Employee',
      status: 'Active',
      email: 'bob.wilson@company.com',
      phone: '+1 (555) 345-6789',
      department: 'Claims Processing',
      joinDate: '2023-06-10',
      lastLogin: '2024-06-19 16:45',
      canCreateTasks: false,
      canEditTasks: true,
      canDeleteTasks: false,
      canViewReports: true,
      canManageUsers: false,
      totalTasks: 32,
      completedTasks: 28,
      pendingTasks: 4,
      avgCompletionTime: '2.8 days',
      notes: 'New employee showing good progress. Completed training program successfully.'
    }
  ];
  */

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [newAssignee, setNewAssignee] = useState<string>('');
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [showDeleteCaseDialog, setShowDeleteCaseDialog] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<any>(null);
  const [isDeletingCase, setIsDeletingCase] = useState(false);

  // Status mapping for filtering
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

  // Calculate tab-specific statistics using useMemo - shows overall totals, not filtered
  const tabStats = useMemo(() => {
    switch (activeTab) {
      case 'tasks':
        // Task Management stats - show overall totals from ALL tasks (not paginated)
        const taskStats = {
          total: allTasks.length,
          pending: allTasks.filter(task => {
            const status = task.current_status?.toLowerCase() || '';
            return statusMapping['in progress']?.some(s => s.toLowerCase() === status) || false;
          }).length,
          inProgress: allTasks.filter(task => {
            const status = task.current_status?.toLowerCase() || '';
            return statusMapping['in progress']?.some(s => s.toLowerCase() === status) || false;
          }).length,
          completed: allTasks.filter(task => {
            const status = task.current_status?.toLowerCase() || '';
            return statusMapping['approved']?.some(s => s.toLowerCase() === status) || false;
          }).length,
        };
        return {
          cards: [
            { label: 'Total Tasks', value: taskStats.total, color: 'blue' },
            { label: 'Pending Tasks', value: taskStats.pending, color: 'orange' },
            { label: 'In Progress', value: taskStats.inProgress, color: 'purple' },
            { label: 'Completed', value: taskStats.completed, color: 'green' },
          ],
          loading: loadingAllTasks
        };

      case 'users':
        // User Management stats - show overall totals from ALL users (not paginated)
        const userStats = {
          total: allUsers.length,
          active: allUsers.filter(u => u.status?.toLowerCase() === 'active').length,
          inactive: allUsers.filter(u => u.status?.toLowerCase() === 'inactive').length,
          employees: allUsers.filter(u => u.role?.toLowerCase() === 'employee' || u.designation?.toLowerCase() === 'employee').length,
        };
        return {
          cards: [
            { label: 'Total Users', value: userStats.total, color: 'blue' },
            { label: 'Active Users', value: userStats.active, color: 'green' },
            { label: 'Inactive Users', value: userStats.inactive, color: 'gray' },
            { label: 'Employees', value: userStats.employees, color: 'purple' },
          ],
          loading: loadingAllUsers
        };

      case 'leave':
        // Leave Management stats - show overall totals from ALL leave requests (not paginated)
        const leaveStats = {
          total: allLeaveRequests.length,
          pending: allLeaveRequests.filter(l => l.status?.toLowerCase() === 'pending').length,
          approved: allLeaveRequests.filter(l => l.status?.toLowerCase() === 'approved').length,
          rejected: allLeaveRequests.filter(l => l.status?.toLowerCase() === 'rejected').length,
        };
        return {
          cards: [
            { label: 'Total Leaves', value: leaveStats.total, color: 'blue' },
            { label: 'Pending', value: leaveStats.pending, color: 'orange' },
            { label: 'Approved', value: leaveStats.approved, color: 'green' },
            { label: 'Rejected', value: leaveStats.rejected, color: 'red' },
          ],
          loading: loadingAllLeaves
        };

      case 'cases':
        // Gap Analysis stats - show overall totals from ALL cases (not paginated)
        const caseStats = {
          total: allCasesData.length,
          new: allCasesData.filter(c => c.status?.toLowerCase() === 'new').length,
          inProgress: allCasesData.filter(c => c.status?.toLowerCase() === 'in progress').length,
          completed: allCasesData.filter(c => c.status?.toLowerCase() === 'complete' || c.status?.toLowerCase() === 'completed').length,
        };
        return {
          cards: [
            { label: 'Total Cases', value: caseStats.total, color: 'blue' },
            { label: 'New Cases', value: caseStats.new, color: 'yellow' },
            { label: 'In Progress', value: caseStats.inProgress, color: 'purple' },
            { label: 'Completed', value: caseStats.completed, color: 'green' },
          ],
          loading: loadingAllCases
        };

      case 'reports':
        // Reports stats - show overall totals from all reports
        const reportStats = {
          total: reports.length,
          generated: reports.length,
          pending: 0,
          completed: reports.length,
        };
        return {
          cards: [
            { label: 'Total Reports', value: reportStats.total, color: 'blue' },
            { label: 'Generated', value: reportStats.generated, color: 'green' },
            { label: 'Pending', value: reportStats.pending, color: 'orange' },
            { label: 'Completed', value: reportStats.completed, color: 'green' },
          ],
          loading: reportsLoading
        };

      default:
        // Overview - use dashboard stats
        return {
          cards: [
            { label: 'Total Tasks', value: stats.totalTasks, color: 'blue' },
            { label: 'Active Users', value: stats.activeUsers, color: 'green' },
            { label: 'Pending Tasks', value: stats.pendingApprovals, color: 'orange' },
            { label: 'Completed Tasks', value: stats.completedCounts, color: 'green' },
          ],
          loading: dashboardLoading
        };
    }
  }, [activeTab, allTasks, loadingAllTasks, allUsers, loadingAllUsers, allLeaveRequests, loadingAllLeaves, allCasesData, loadingAllCases, reports, reportsLoading, stats, dashboardLoading, statusMapping]);

  // Filter tasks based on search term and status (client-side filtering for now)
  // Note: In a real implementation, these filters should also be sent to the backend
  const filteredTasks = tasks.filter(task => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      task.title.toLowerCase().includes(searchLower) ||
      task.task_id.toLowerCase().includes(searchLower) ||
      task.assigned_to_profile?.full_name?.toLowerCase().includes(searchLower) ||
      task.customer_profile?.full_name?.toLowerCase().includes(searchLower) ||
      task.current_status.toLowerCase().includes(searchLower);
    
    // Updated status matching logic (case-insensitive)
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      const statusArray = statusMapping[statusFilter as keyof typeof statusMapping];
      if (statusArray) {
        // Convert both task status and mapping values to lowercase for comparison
        const taskStatusLower = task.current_status.toLowerCase();
        matchesStatus = statusArray.some(status => status.toLowerCase() === taskStatusLower);
      } else {
        matchesStatus = false;
      }
      
      // Debug logging
      if (statusFilter === 'under review' || statusFilter === 'approved' || statusFilter === 'in progress') {
        console.log(`Filter: ${statusFilter}, Task Status: ${task.current_status}, Matches: ${matchesStatus}`);
      }
    }
    
    return matchesSearch && matchesStatus;
  });

  // Get unique partner types from users data
  const partnerTypes = useMemo(() => {
    const types = new Set<string>();
    users.forEach((user: any) => {
      if (user.partner_type && user.partner_type !== 'N/A') {
        types.add(user.partner_type);
      }
    });
    return Array.from(types).sort();
  }, [users]);

  // Filter users based on search term, status, and partner type
  // When searching or filtering, use all users; otherwise use current page users for display
  const isSearchingOrFiltering = userSearchTerm || userStatusFilter !== 'all' || userPartnerTypeFilter !== 'all';
  
  // Determine which user set to filter from
  const usersToFilter = isSearchingOrFiltering
    ? (userPartnerTypeFilter !== 'all' ? allFetchedUsers : allUsersForSearch.length > 0 ? allUsersForSearch : users)
    : (userPartnerTypeFilter !== 'all' ? allFetchedUsers : users);
  
  // Apply filters
  const allFilteredUsers = usersToFilter.filter(user => {
    const searchLower = userSearchTerm.toLowerCase();
    const matchesSearch = !userSearchTerm || (
      (user.id && user.id.toLowerCase().includes(searchLower)) ||
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.role && user.role.toLowerCase().includes(searchLower)) ||
      (user.status && user.status.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower))
    );
    const matchesStatus = userStatusFilter === 'all' || (user.status && user.status === userStatusFilter);
    const matchesPartnerType = userPartnerTypeFilter === 'all' || ((user as any).partner_type && (user as any).partner_type === userPartnerTypeFilter);
    return matchesSearch && matchesStatus && matchesPartnerType;
  });

  // Paginate filtered users
  // When searching/filtering: use client-side pagination on filtered results
  // When NOT searching/filtering: use API pagination (users already paginated from API)
  const pageLimit = parseInt(userPageLimit);
  const startIndex = (userCurrentPage - 1) * pageLimit;
  const endIndex = startIndex + pageLimit;
  
  const filteredUsers = isSearchingOrFiltering
    ? allFilteredUsers.slice(startIndex, endIndex) // Client-side pagination for search/filter results
    : allFilteredUsers; // API pagination - users are already paginated

  // Initialize active tab from URL parameters
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['overview', 'tasks', 'users', 'leave', 'cases'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Handle tab change and update URL
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Fetch dashboard data and tasks from APIs
  useEffect(() => {
    getAdminName();
    fetchDashboardData();
    fetchUsers(); // Fetch users on component mount
    if (activeTab === 'tasks') {
      fetchAllTasks(); // Fetch all tasks for cards
      fetchTasks(); // Fetch paginated tasks for table
    }
    if (activeTab === 'users') {
      fetchAllUsers(); // Fetch all users for cards
      fetchUsers(); // Fetch paginated users for table
    }
    if (activeTab === 'leave') {
      fetchAllLeaveRequests(); // Fetch all leave requests for cards
      fetchLeaveRequests(); // Fetch paginated leave requests for table
    }
    if (activeTab === 'reports') {
      fetchReports();
    }
    if (activeTab === 'cases') {
      fetchAllCasesData(); // Fetch all cases for cards
      fetchCasesData(); // Fetch paginated cases for table
    }
  }, [activeTab]);

  // Reset accumulated users and page when partner type filter changes
  useEffect(() => {
    if (activeTab === 'users' && userPartnerTypeFilter !== 'all') {
      // Reset to page 1 and clear accumulated users when filter changes
      setUserCurrentPage(1);
      setAllFetchedUsers([]);
      setHasMoreUsers(true);
      // Trigger fetch for page 1
      fetchUsers();
    } else if (activeTab === 'users' && userPartnerTypeFilter === 'all') {
      // Clear accumulated users when filter is removed
      setAllFetchedUsers([]);
    }
  }, [userPartnerTypeFilter]);

  // Fetch all users for searching when users tab is active
  useEffect(() => {
    if (activeTab === 'users' && allUsersForSearch.length === 0) {
      fetchAllUsers();
    }
  }, [activeTab]);

  // Reset to page 1 when search term or filters change
  useEffect(() => {
    if (activeTab === 'users' && (userSearchTerm || userStatusFilter !== 'all' || userPartnerTypeFilter !== 'all')) {
      setUserCurrentPage(1);
    }
  }, [userSearchTerm, userStatusFilter, userPartnerTypeFilter, activeTab]);

  // Refetch users when pagination parameters change (only if not searching/filtering)
  useEffect(() => {
    if (activeTab === 'users' && !userSearchTerm && userStatusFilter === 'all' && userPartnerTypeFilter === 'all') {
      fetchUsers();
    }
  }, [userCurrentPage, userPageLimit]);

  // Refetch leave requests when pagination parameters change
  useEffect(() => {
    if (activeTab === 'leave') {
      fetchLeaveRequests();
    }
  }, [leaveCurrentPage, leavePageLimit]);

  // Refetch tasks when pagination parameters change
  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchTasks();
    }
  }, [taskCurrentPage, taskPageLimit]);


  const fetchDashboardData = async () => {
    setDashboardLoading(true);
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

      console.log('Fetching admin dashboard data...');

      const response = await fetch('http://localhost:3000/admin/admindashboard', {
        method: 'GET',
        headers: {
          'Content-Profile': 'expc',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3ODYsImV4cCI6MjA3MDQ4Mjc4Nn0.Ssi2327jY_9cu5lQorYBdNjJJBWejz91j_kCgtfaj0o',
          'Accept-Profile': 'expc',
          'session_id': sessionId || '17e7ab32-86ad-411e-8ee3-c4a09e6780f7',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3ODYsImV4cCI6MjA3MDQ4Mjc4Nn0.Ssi2327jY_9cu5lQorYBdNjJJBWejz91j_kCgtfaj0o`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('Admin dashboard data:', result);

      if (response.ok) {
        if (Array.isArray(result) && result.length > 0) {
          const firstResult = result[0];
          if (firstResult.status === 'success' && firstResult.data) {
            setStats(firstResult.data);
          } else if (firstResult.status === 'error' || firstResult.status === 'failure') {
            toast({
              title: "Error",
              description: firstResult.message || firstResult.error || "Failed to fetch dashboard data",
              variant: "destructive",
            });
          } else {
            setStats(firstResult);
          }
        } else if (result.status === 'success' && result.data) {
          setStats(result.data);
        } else if (result.status === 'error' || result.status === 'failure') {
          toast({
            title: "Error",
            description: result.message || result.error || "Failed to fetch dashboard data",
            variant: "destructive",
          });
        } else {
          setStats(result);
        }
      } else {
        const errorMessage = result?.message || result?.error || `Failed to fetch dashboard data (Status: ${response.status})`;
        console.error('Failed to fetch dashboard data:', response.status, result);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setDashboardLoading(false);
    }
  };

  // Fetch ALL users for cards (no pagination) and for searching
  const fetchAllUsers = async () => {
    setLoadingAllUsers(true);
    try {
      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '';
      let jwtToken = '';

      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        sessionId = session.sessionId || '';
        jwtToken = session.jwtToken || '';
      }

      sessionId = sessionId || 'efd005c8-d9a1-4cfa-adeb-1ca2a7f13775';
      jwtToken = jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjM0IiwiaWF0IjoxNzU2NTUwODUwfQ.Kmh5wQS9CXpRK0TmBXlJJhGlfr9ulMx8ou5nCk7th8g';

      // Fetch all users with a large size limit
      const response = await fetch(`http://localhost:3000/admin/getusers?page=1&size=10000`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'accept-profile': 'expc',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
          'authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws`,
          'content-type': 'application/json',
          'jwt_token': jwtToken,
          'session_id': sessionId,
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        if (Array.isArray(result) && result.length > 0) {
          const firstResult = result[0];
          if (firstResult.status === 'success' && firstResult.data) {
            // Minimal data for cards
            const transformedUsersForCards = firstResult.data.map((user: any) => ({
              id: user.user_id.toString(),
              name: user.employees ? `${user.employees.first_name || ''} ${user.employees.last_name || ''}`.trim() : user.username,
              role: user.role,
              status: user.status,
              designation: user.role,
            }));
            setAllUsers(transformedUsersForCards);

            // Full data for searching
            const transformedUsersForSearch = firstResult.data.map((user: any) => ({
              id: user.user_id.toString(),
              name: user.employees ? `${user.employees.first_name || ''} ${user.employees.last_name || ''}`.trim() : user.username,
              role: user.role,
              status: user.status,
              email: user.email,
              department: user.role === 'employee' && user.employees ? user.employees.department : 
                         user.role === 'partner' && user.partners ? user.partners.department :
                         user.role === 'customer' && user.customers ? user.customers.department : 'N/A',
              mobile_number: user.employees ? user.employees.mobile_number : 
                           user.partners ? user.partners.mobile_number :
                           user.customers ? user.customers.mobile_number : null,
              entity: user.partners ? (user.partners["name of entity"] || user.partners.entity_name || 'N/A') :
                     user.employees ? (user.employees.entity_name || user.employees["name of entity"] || 'N/A') :
                     user.customers ? (user.customers.entity_name || user.customers["name of entity"] || 'N/A') : 'N/A',
              partner_type: user.partners ? (user.partners.partner_type || 'N/A') : 'N/A',
              created_time: user.created_time,
              employees: user.employees,
              partners: user.partners,
              customers: user.customers
            }));
            setAllUsersForSearch(transformedUsersForSearch);
          } else if (firstResult.status === 'error' || firstResult.status === 'failure') {
            toast({
              title: "Error",
              description: firstResult.message || firstResult.error || "Failed to fetch users",
              variant: "destructive",
            });
          }
        } else if (result.status === 'error' || result.status === 'failure') {
          toast({
            title: "Error",
            description: result.message || result.error || "Failed to fetch users",
            variant: "destructive",
          });
        }
      } else {
        const errorMessage = result?.message || result?.error || `Failed to fetch users (Status: ${response.status})`;
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
    } finally {
      setLoadingAllUsers(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
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
      jwtToken = jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjM0IiwiaWF0IjoxNzU2NTUwODUwfQ.Kmh5wQS9CXpRK0TmBXlJJhGlfr9ulMx8ou5nCk7th8g';

      console.log('Fetching users from API...');
      console.log('Using session ID:', sessionId);
      console.log('Using JWT token:', jwtToken);

      const response = await fetch(`http://localhost:3000/admin/getusers?page=${userCurrentPage}&size=${parseInt(userPageLimit)}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'accept-profile': 'expc',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
          'authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws`,
          'content-type': 'application/json',
          'jwt_token': jwtToken,
          'session_id': sessionId,
          'Range': '0-100', // Get first 100 users
          'Prefer': 'count=exact'
        }
      });

      const result = await response.json();
      console.log('Users API response:', result);

      if (response.ok) {
        if (Array.isArray(result) && result.length > 0) {
          const firstResult = result[0];
          if (firstResult.status === 'success' && firstResult.data) {
            // Transform the API data to match the expected format
            const transformedUsers = firstResult.data.map((user: any) => ({
              id: user.user_id.toString(),
              name: user.employees ? `${user.employees.first_name || ''} ${user.employees.last_name || ''}`.trim() : user.username,
              role: user.role,
              status: user.status,
              email: user.email,
              department: user.role === 'employee' && user.employees ? user.employees.department : 
                         user.role === 'partner' && user.partners ? user.partners.department :
                         user.role === 'customer' && user.customers ? user.customers.department : 'N/A',
              mobile_number: user.employees ? user.employees.mobile_number : 
                           user.partners ? user.partners.mobile_number :
                           user.customers ? user.customers.mobile_number : null,
              entity: user.partners ? (user.partners["name of entity"] || user.partners.entity_name || 'N/A') :
                     user.employees ? (user.employees.entity_name || user.employees["name of entity"] || 'N/A') :
                     user.customers ? (user.customers.entity_name || user.customers["name of entity"] || 'N/A') : 'N/A',
              partner_type: user.partners ? (user.partners.partner_type || 'N/A') : 'N/A',
              created_time: user.created_time,
              // Add other fields as needed
              employees: user.employees,
              partners: user.partners,
              customers: user.customers
            }));

            // If filtering by partner type, accumulate users across pages
            if (userPartnerTypeFilter !== 'all') {
              setAllFetchedUsers(prev => {
                // Remove duplicates based on user ID
                const existingIds = new Set(prev.map(u => u.id));
                const newUsers = transformedUsers.filter(u => !existingIds.has(u.id));
                return [...prev, ...newUsers];
              });
              // Check if we got a full page (means there might be more to fetch)
              setHasMoreUsers(transformedUsers.length >= parseInt(userPageLimit));
            } else {
              // Normal pagination - replace users
              setUsers(transformedUsers);
              setAllFetchedUsers([]); // Clear accumulated users
              setHasMoreUsers(transformedUsers.length >= parseInt(userPageLimit));
            }
            console.log('Transformed users:', transformedUsers);
          } else if (firstResult.status === 'error' || firstResult.status === 'failure') {
            console.error('API returned error:', firstResult);
            toast({
              title: "Error",
              description: firstResult.message || firstResult.error || "Failed to fetch users",
              variant: "destructive",
            });
            setUsers([]);
          }
        } else if (result.status === 'success' && result.data) {
          // Handle direct object response
          const transformedUsers = result.data.map((user: any) => ({
            id: user.user_id.toString(),
            name: user.employees ? `${user.employees.first_name || ''} ${user.employees.last_name || ''}`.trim() : user.username,
            role: user.role,
            status: user.status,
            email: user.email,
            department: user.role === 'employee' && user.employees ? user.employees.department : 
                       user.role === 'partner' && user.partners ? user.partners.department :
                       user.role === 'customer' && user.customers ? user.customers.department : 'N/A',
            mobile_number: user.employees ? user.employees.mobile_number : 
                         user.partners ? user.partners.mobile_number :
                         user.customers ? user.customers.mobile_number : null,
            entity: user.partners ? (user.partners["name of entity"] || user.partners.entity_name || 'N/A') :
                   user.employees ? (user.employees.entity_name || user.employees["name of entity"] || 'N/A') :
                   user.customers ? (user.customers.entity_name || user.customers["name of entity"] || 'N/A') : 'N/A',
            partner_type: user.partners ? (user.partners.partner_type || 'N/A') : 'N/A',
            created_time: user.created_time,
            employees: user.employees,
            partners: user.partners,
            customers: user.customers
          }));
          setUsers(transformedUsers);
        } else if (result.status === 'error' || result.status === 'failure') {
          console.error('API returned error:', result);
          toast({
            title: "Error",
            description: result.message || result.error || "Failed to fetch users",
            variant: "destructive",
          });
          setUsers([]);
        } else {
          console.error('API returned unexpected format:', result);
          toast({
            title: "Error",
            description: result.message || result.error || "Unexpected response format from API",
            variant: "destructive",
          });
          setUsers([]);
        }
      } else {
        const errorMessage = result?.message || result?.error || `Failed to fetch users (Status: ${response.status})`;
        console.error('Failed to fetch users:', response.status, result);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
      
      // Set empty array if API fails
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
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

      console.log('Fetching reports data...');

      const response = await fetch('https://n8n.srv952553.hstgr.cloud/webhook/reportgeneration', {
        method: 'GET',
        headers: {
          'Content-Profile': 'expc',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3ODYsImV4cCI6MjA3MDQ4Mjc4Nn0.Ssi2327jY_9cu5lQorYBdNjJJBWejz91j_kCgtfaj0o',
          'Accept-Profile': 'expc',
          'session_id': sessionId || '17e7ab32-86ad-411e-8ee3-c4a09e6780f7',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3ODYsImV4cCI6MjA3MDQ4Mjc4Nn0.Ssi2327jY_9cu5lQorYBdNjJJBWejz91j_kCgtfaj0o`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        const result = await response.json();
        console.log('Reports data:', result);

        if (Array.isArray(result)) {
          setReports(result);
        }
      } else {
        console.error('Failed to fetch reports:', response.status);
        toast({
          title: "Error",
          description: "Failed to fetch reports",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive",
      });
    } finally {
      setReportsLoading(false);
    }
  };

  // Fetch ALL tasks for cards (no pagination)
  const fetchAllTasks = async () => {
    setLoadingAllTasks(true);
    try {
      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '';
      let jwtToken = '';

      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        sessionId = session.sessionId || '';
        jwtToken = session.jwtToken || '';
      }

      // Fetch all tasks with a large size limit from admin backend
      const url = `http://localhost:3000/admin/gettasks?page=1&size=10000`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Connection': 'keep-alive',
          'Origin': 'http://localhost:8080',
          'Prefer': 'count=exact',
          'Range': '0-100',
          'Referer': 'http://localhost:8080/',
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'accept-profile': 'expc',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
          'authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws`,
          'content-type': 'application/json',
          'jwt_token': jwtToken || 'token_1765952455523_ukhols79v',
          'session_id': sessionId || 'sess_1765952455523_cceyku19o',
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        if (Array.isArray(result) && result.length > 0) {
          const firstResult = result[0];
          if (firstResult.status === 'success' && firstResult.data) {
            const transformedTasks = firstResult.data.map((task: any) => ({
              id: task.case_id.toString(),
              task_id: task.case_id.toString(),
              title: task.case_summary || 'No Summary',
              current_status: task.ticket_stage?.toLowerCase() || 'new',
            }));
            setAllTasks(transformedTasks);
          } else if (firstResult.status === 'error' || firstResult.status === 'failure') {
            console.error('API returned error:', firstResult);
            toast({
              title: "Error",
              description: firstResult.message || firstResult.error || "Failed to fetch all tasks",
              variant: "destructive",
            });
          }
        } else if (result.status === 'success' && result.data) {
          const transformedTasks = result.data.map((task: any) => ({
            id: task.case_id.toString(),
            task_id: task.case_id.toString(),
            title: task.case_summary || 'No Summary',
            current_status: task.ticket_stage?.toLowerCase() || 'new',
          }));
          setAllTasks(transformedTasks);
        } else if (result.status === 'error' || result.status === 'failure') {
          console.error('API returned error:', result);
          toast({
            title: "Error",
            description: result.message || result.error || "Failed to fetch all tasks",
            variant: "destructive",
          });
        }
      } else {
        const errorMessage = result?.message || result?.error || `Failed to fetch all tasks (Status: ${response.status})`;
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching all tasks:', error);
    } finally {
      setLoadingAllTasks(false);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
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

      console.log('Fetching task management data...');

      // Use admin backend URL for paginated task list in Task Management tab
      const url = `http://localhost:3000/admin/gettasks?page=${taskCurrentPage}&size=${parseInt(taskPageLimit)}`;
      console.log('Fetching tasks with URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Connection': 'keep-alive',
          'Origin': 'http://localhost:8080',
          'Prefer': 'count=exact',
          'Range': '0-100',
          'Referer': 'http://localhost:8080/',
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'accept-profile': 'expc',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
          'authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws`,
          'content-type': 'application/json',
          'jwt_token': jwtToken || 'token_1765952455523_ukhols79v',
          'session_id': sessionId || 'sess_1765952455523_cceyku19o',
        }
      });

      const result = await response.json();
      console.log('Task management data:', result);

      // Handle non-200 status codes
      if (!response.ok) {
        const errorMessage = result?.message || result?.error || `Failed to fetch tasks (Status: ${response.status})`;
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Handle array response structure
      if (Array.isArray(result) && result.length > 0) {
        const firstResult = result[0];
        if (firstResult.status === 'success' && firstResult.data) {
          // Transform the API data to match the expected format
          const transformedTasks = firstResult.data.map((task: any) => ({
            id: task.case_id.toString(),
            task_id: task.case_id.toString(),
            title: task.case_summary || 'No Summary',
            assigned_to_profile: {
              full_name: `${task.assigned_employee_name}`.trim() || 'Unassigned'
            },
            assigned_employee_name: task.assigned_employee_name || 'Unassigned',
            customer_profile: {
              full_name: task.customer_name || (task.customer_id ? `Customer ${task.customer_id}` : 'N/A')
            },
            current_status: task.ticket_stage?.toLowerCase() || 'new',
            due_date: task.due_date || null,
            case_description: task.case_description,
            priority: task.priority,
            case_value: task.case_value,
            value_currency: task.value_currency,
            created_time: task.created_time,
            customer_email: task.email_address,
            customer_phone: task.mobile_number,
            customer_address: task.address
          }));

          setTasks(transformedTasks);
          console.log('Transformed tasks:', transformedTasks);

          // Update dashboard stats based on task data
          const totalTasks = transformedTasks.length;
          const completedCounts = transformedTasks.filter(task => task.current_status === 'completed').length;
          const reviewCounts = transformedTasks.filter(task => task.current_status === 'review').length;
          const newCounts = transformedTasks.filter(task => task.current_status === 'new').length;
          const analysisCounts = transformedTasks.filter(task => task.current_status === 'analysis').length;

          setStats(prevStats => ({
            ...prevStats,
            totalTasks,
            completedCounts,
            reviewCounts,
            newCounts,
            analysisCounts
          }));
        } else if (firstResult.status === 'error' || firstResult.status === 'failure') {
          console.error('API returned error:', firstResult);
          toast({
            title: "Error",
            description: firstResult.message || firstResult.error || "Failed to fetch tasks",
            variant: "destructive",
          });
        }
      } else if (result.status === 'success' && result.data) {
        // Handle direct object response
        const transformedTasks = result.data.map((task: any) => ({
          id: task.case_id.toString(),
          task_id: `CLM-${task.case_id.toString().padStart(3, '0')}`,
          title: task.case_summary || 'No Summary',
          assigned_to_profile: {
            full_name: `${task.assigned_employee_name}`.trim() || 'Unassigned'
          },
          assigned_employee_name: task.assigned_employee_name || 'Unassigned',
          customer_profile: {
            full_name: task.customer_name || (task.customer_id ? `Customer ${task.customer_id}` : 'N/A')
          },
          current_status: task.ticket_stage?.toLowerCase() || 'new',
          due_date: task.due_date || null,
          case_description: task.case_description,
          priority: task.priority,
          case_value: task.case_value,
          value_currency: task.value_currency,
          created_time: task.created_time,
          customer_email: task.email_address,
          customer_phone: task.mobile_number,
          customer_address: task.address
        }));

        setTasks(transformedTasks);

        // Update dashboard stats
        const totalTasks = transformedTasks.length;
        const completedCounts = transformedTasks.filter(task => task.current_status === 'completed').length;
        const reviewCounts = transformedTasks.filter(task => task.current_status === 'review').length;
        const newCounts = transformedTasks.filter(task => task.current_status === 'new').length;
        const analysisCounts = transformedTasks.filter(task => task.current_status === 'analysis').length;

        setStats(prevStats => ({
          ...prevStats,
          totalTasks,
          completedCounts,
          reviewCounts,
          newCounts,
          analysisCounts
        }));
      } else if (result.status === 'error' || result.status === 'failure') {
        console.error('API returned error:', result);
        toast({
          title: "Error",
          description: result.message || result.error || "Failed to fetch tasks",
          variant: "destructive",
        });
      } else {
        console.error('API returned unexpected format:', result);
        toast({
          title: "Error",
          description: result.message || result.error || "Unexpected response format from API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });

      // Refresh tasks list
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = async (task: any) => {
    try {
      console.log('Editing task:', task);
      
      // Navigate to EditTask page
      navigate(`/edit-task/${task.task_id}`, { 
        state: { from: 'admin-dashboard' } 
      });
      
    } catch (error) {
      console.error('Error navigating to task edit:', error);
      toast({
        title: "Error",
        description: `Failed to navigate to task edit`,
        variant: "destructive",
      });
    }
  };

  // Mock leave requests data - in a real app, this would come from Supabase
  const mockLeaveRequests = [
    {
      id: 'leave-001',
      employeeId: 'emp-001',
      employeeName: 'John Smith',
      leaveType: 'Annual Leave',
      startDate: '2024-07-15',
      endDate: '2024-07-19',
      reason: 'Family vacation',
      status: 'pending',
      submittedDate: '2024-06-20',
      days: 5
    },
    {
      id: 'leave-002',
      employeeId: 'emp-002',
      employeeName: 'Alice Johnson',
      leaveType: 'Sick Leave',
      startDate: '2024-07-10',
      endDate: '2024-07-12',
      reason: 'Medical appointment',
      status: 'pending',
      submittedDate: '2024-06-18',
      days: 3
    },
    {
      id: 'leave-003',
      employeeId: 'emp-003',
      employeeName: 'Bob Wilson',
      leaveType: 'Personal Leave',
      startDate: '2024-07-25',
      endDate: '2024-07-26',
      reason: 'Personal matters',
      status: 'approved',
      submittedDate: '2024-06-15',
      days: 2
    },
    {
      id: 'leave-004',
      employeeId: 'emp-001',
      employeeName: 'John Smith',
      leaveType: 'Maternity Leave',
      startDate: '2024-08-01',
      endDate: '2024-11-01',
      reason: 'Maternity leave',
      status: 'rejected',
      submittedDate: '2024-06-10',
      days: 90
    }
  ];

  // Fetch ALL leave requests for cards (no pagination)
  const fetchAllLeaveRequests = async () => {
    setLoadingAllLeaves(true);
    try {
      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '';
      let jwtToken = '';

      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        sessionId = session.sessionId || '';
        jwtToken = session.jwtToken || '';
      }

      // Fetch all leave requests with a large size limit from backend
      const url = `http://localhost:3000/admin/getleaves?page=1&size=10000`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'session_id': sessionId || '',
          'jwt_token': jwtToken || ''
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        if (Array.isArray(result) && result.length > 0) {
          const firstResult = result[0];
          if (firstResult.status === 'success' && firstResult.data) {
            setAllLeaveRequests(firstResult.data);
          } else if (firstResult.status === 'error' || firstResult.status === 'failure') {
            console.error('API returned error:', firstResult);
            toast({
              title: "Error",
              description: firstResult.message || firstResult.error || "Failed to fetch all leave requests",
              variant: "destructive",
            });
          }
        } else if (result.status === 'success' && result.data) {
          setAllLeaveRequests(result.data);
        } else if (result.status === 'error' || result.status === 'failure') {
          console.error('API returned error:', result);
          toast({
            title: "Error",
            description: result.message || result.error || "Failed to fetch all leave requests",
            variant: "destructive",
          });
        }
      } else {
        const errorMessage = result?.message || result?.error || `Failed to fetch all leave requests (Status: ${response.status})`;
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error fetching all leave requests:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to fetch all leave requests",
        variant: "destructive",
      });
    } finally {
      setLoadingAllLeaves(false);
    }
  };

  const fetchLeaveRequests = async () => {
    setLeaveLoading(true);
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

      console.log('Fetching leave requests data...');

      // Use backend endpoint instead of n8n webhook
      const url = `http://localhost:3000/admin/getleaves?page=${leaveCurrentPage}&size=${parseInt(leavePageLimit)}`;
      console.log('Fetching leave requests with URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'session_id': sessionId || '',
          'jwt_token': jwtToken || ''
        }
      });

      const result = await response.json();
      console.log('Leave requests data:', result);

      // Handle non-200 status codes
      if (!response.ok) {
        const errorMessage = result?.message || result?.error || `Failed to fetch leave requests (Status: ${response.status})`;
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Handle array response structure
      if (Array.isArray(result) && result.length > 0) {
        const firstResult = result[0];
        console.log('First result:', firstResult);
        console.log('Data array length:', firstResult.data?.length);
        if (firstResult.status === 'success' && firstResult.data) {
          setLeaveRequests(firstResult.data);
          console.log('Setting leave requests:', firstResult.data);
        } else if (firstResult.status === 'error' || firstResult.status === 'failure') {
          console.error('API returned error:', firstResult);
          toast({
            title: "Error",
            description: firstResult.message || firstResult.error || "Failed to fetch leave requests",
            variant: "destructive",
          });
        }
      } else if (result.status === 'success' && result.data) {
        // Handle direct object response
        setLeaveRequests(result.data);
      } else if (result.status === 'error' || result.status === 'failure') {
        console.error('API returned error:', result);
        toast({
          title: "Error",
          description: result.message || result.error || "Failed to fetch leave requests",
          variant: "destructive",
        });
      } else {
        console.error('API returned unexpected format:', result);
        toast({
          title: "Error",
          description: result.message || result.error || "Unexpected response format from API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leave requests",
        variant: "destructive",
      });
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleDownloadReport = async (report: any) => {
    try {
      // Create a formatted report content
      const reportContent = `
Case Report - ID: ${report.case_id}
Update Date: ${report.update_date}
User ID: ${report.user_id}

Progress Description:
${report.progress_description}

Challenges Faced:
${report.challenges_faced}

Next Steps:
${report.next_steps}

Created Time: ${report.created_time}
      `;

      // Create and download the file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `case-report-${report.case_id}-${report.update_date}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Report downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
    }
  };

  const handleViewReport = (report: any) => {
    // Create a formatted report content for viewing
    const reportContent = `
Case Report - ID: ${report.case_id}
Update Date: ${report.update_date}
User ID: ${report.user_id}

Progress Description:
${report.progress_description}

Challenges Faced:
${report.challenges_faced}

Next Steps:
${report.next_steps}

Created Time: ${report.created_time}
    `;

    // Show the report content in an alert or modal
    alert(reportContent);

    // Alternatively, you could open a modal with the report content
    // For now, using alert for simplicity
  };

  const handleViewUser = (user: any) => {
    console.log('handleViewUser called with user:', user);
    setSelectedUser(user);
    setShowUserModal(true);
    console.log('Modal state set to true');
  };

  const handleEditUser = async (user: any) => {
    try {
      console.log('Edit user:', user);
      
      // Get user ID from the user object being edited
      const userId = user.id || '';
      
      console.log('User ID to edit:', userId);
      
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
        id: userId || '',
        type: 'edit'
      });
      
      const url = `http://localhost:3000/admin/getusers?${params.toString()}`;
      
      console.log('Calling getusers API with URL:', url);
      console.log('Query parameters:', { id: userId, type: 'edit' });
      
      // Send GET request with query parameters
      try {
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
      } catch (apiError) {
        console.error('Error sending edit request:', apiError);
        // Continue with navigation even if API call fails
      }
      
      // Navigate to EditRegister page with user ID and type parameter
      navigate(`/edit-register/${user.id}?type=edit`);
    } catch (error) {
      console.error('Error in handleEditUser:', error);
      // Still navigate even if there's an error
      navigate(`/edit-register/${user.id}?type=edit`);
    }
  };



  const handleReassignTasks = () => {
    if (!newAssignee) {
      toast({
        title: "Error",
        description: "Please select a new assignee for the tasks",
        variant: "destructive",
      });
      return;
    }

    console.log('Reassigning tasks from', selectedUser.name, 'to', newAssignee);

    // Here you would typically update the tasks in the database
    // For now, we'll just show a success message
    toast({
      title: "Tasks Reassigned",
      description: `Tasks have been reassigned from ${selectedUser.name} to ${newAssignee}`,
    });

    // Close modal and proceed with user deletion
    setShowReassignModal(false);
    setSelectedUser(null);
    setAssignedTasks([]);
    setNewAssignee('');

    // Now delete the user
    toast({
      title: "User Deleted",
      description: `User ${selectedUser.name} has been deleted`,
    });
  };

  const handleCancelReassign = () => {
    setShowReassignModal(false);
    setSelectedUser(null);
    setAssignedTasks([]);
    setNewAssignee('');
  };

  const handleDeleteUser = async (user: any) => {
    console.log('Delete user:', user);

    // Check if user is an employee and has assigned tasks
    if (user.role === 'Employee') {
      const assignedTasks = tasks.filter(task =>
        task.assigned_to_profile?.full_name === user.name
      );

      if (assignedTasks.length > 0) {
        // Show tasks reassignment modal
        setSelectedUser(user);
        setAssignedTasks(assignedTasks);
        setShowReassignModal(true);
        return;
      }
    }

    // Show professional confirmation dialog
    setUserToDelete(user);
    setShowDeleteConfirmDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      console.log('Deleting user:', userToDelete);
      
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
      jwtToken = jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjM0IiwiaWF0IjoxNzU2NTUwODUwfQ.Kmh5wQS9CXpRK0TmBXlJJhGlfr9ulMx8ou5nCk7th8g';

      // Call the delete user API
      const result = await UserService.deleteUser(userToDelete.id, sessionId, jwtToken);
      console.log('Delete user result:', result);

      if (result.success) {
        // Remove user from local state
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
        // Also remove from allUsersForSearch for search functionality
        setAllUsersForSearch(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
        // Also remove from allUsers for cards
        setAllUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
        
        toast({
          title: "Success",
          description: `User ${userToDelete.name} has been deleted successfully`,
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: `Failed to delete user ${userToDelete.name}`,
        variant: "destructive",
      });
    } finally {
      // Close dialog and reset state
      setShowDeleteConfirmDialog(false);
      setUserToDelete(null);
    }
  };

  const handleLeaveAction = async (leaveId: string, action: 'approved' | 'rejected') => {
    try {
      const userDetailsStr = localStorage.getItem('expertclaims_user_details');
      let sessionId = '';
      let jwtToken = '';
      let userId: number | string = '';

      if (userDetailsStr) {
        const parsedDetails = JSON.parse(userDetailsStr);
        const details = Array.isArray(parsedDetails) ? parsedDetails[0] : parsedDetails;
        sessionId = details.sessionid || '';
        jwtToken = details.jwt || '';
        userId = details.userid ?? '';
      }

      // Get session from localStorage if userDetails doesn't have it
      if (!sessionId || !jwtToken) {
        const sessionStr = localStorage.getItem('expertclaims_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          sessionId = sessionId || session.sessionId || '';
          jwtToken = jwtToken || session.jwtToken || '';
        }
      }

      // Current date as YYYY-MM-DD
      const approvedDate = new Date().toISOString().slice(0, 10);

      console.log(`Updating leave request ${leaveId} to ${action} by user ${userId} on ${approvedDate}...`);

      // Use backend endpoint instead of n8n webhook
      const response = await fetch('http://localhost:3000/admin/updateleavestatus', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'session_id': sessionId || '',
          'jwt_token': jwtToken || ''
        },
        body: JSON.stringify({
          application_id: leaveId,
          status: action,
          approved_by: userId ? String(userId) : null,
          approved_date: approvedDate,
          rejection_reason: action === 'rejected' ? null : undefined // Optional, can be set if needed
        })
      });

      const result = await response.json();
      console.log('Leave status update response:', result);

      // Handle array response structure
      let responseData = result;
      if (Array.isArray(result) && result.length > 0) {
        responseData = result[0];
      }

      if (response.ok && responseData.status === 'success') {
        // Reflect the change locally
        const updatedRequests = leaveRequests.map(req =>
          req.application_id === leaveId ? { ...req, status: action } : req
        );
        setLeaveRequests(updatedRequests);

        // Also update allLeaveRequests for the cards
        const updatedAllRequests = allLeaveRequests.map(req =>
          req.application_id === leaveId ? { ...req, status: action } : req
        );
        setAllLeaveRequests(updatedAllRequests);

        const successMessage = responseData.message || `Leave request ${action} successfully`;
        toast({
          title: 'Success',
          description: successMessage,
        });
      } else {
        // Handle error response
        const errorMessage = responseData?.message || responseData?.error || `Failed to ${action} leave request`;
        console.error('Failed to update leave request:', response.status, responseData);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating leave request:', error);
      toast({
        title: 'Error',
        description: `Failed to ${action} leave request`,
        variant: 'destructive',
      });
    }
  };

  // Backlog functions
  const fetchBacklogData = async () => {
    setIsLoadingBacklog(true);
    try {
      console.log('Fetching backlog data from API...');
      
      const response = await fetch('https://n8n.srv952553.hstgr.cloud/webhook/get_all_backlog_data?user_id=0', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'content-type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Backlog API response:', result);
        
        if (Array.isArray(result)) {
          setBacklogData(result);
        } else {
          console.error('Backlog API returned unexpected format:', result);
          setBacklogData([]);
        }
      } else {
        console.error('Failed to fetch backlog data:', response.status);
        setBacklogData([]);
      }
    } catch (error) {
      console.error('Error fetching backlog data:', error);
      setBacklogData([]);
    } finally {
      setIsLoadingBacklog(false);
    }
  };

  // Fetch ALL cases for cards (no pagination)
  const fetchAllCasesData = async () => {
    setLoadingAllCases(true);
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
      
      const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3ODYsImV4cCI6MjA3MDQ4Mjc4Nn0.Ssi2327jY_9cu5lQorYBdNjJJBWejz91j_kCgtfaj0o';
      
      // Fetch all cases for gap analysis (employee_id=0)
      const response = await fetch('http://localhost:3000/admin/gapanalysis?employee_id=0', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'apikey': API_KEY,
          'authorization': `Bearer ${API_KEY}`,
          'content-type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result)) {
          setAllCasesData(result);
        }
      }
    } catch (error) {
      console.error('Error fetching all cases:', error);
    } finally {
      setLoadingAllCases(false);
    }
  };

  // Cases functions
  const fetchCasesData = async () => {
    setIsLoadingCases(true);
    try {
      console.log('Fetching cases data from API...');
      
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
      
      const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3ODYsImV4cCI6MjA3MDQ4Mjc4Nn0.Ssi2327jY_9cu5lQorYBdNjJJBWejz91j_kCgtfaj0o';
      
      // Fetch all cases for gap analysis (employee_id=0)
      const response = await fetch('http://localhost:3000/admin/gapanalysis?employee_id=0', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'apikey': API_KEY,
          'authorization': `Bearer ${API_KEY}`,
          'content-type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Cases API response:', result);
        
        if (Array.isArray(result)) {
          // Log entity data for debugging
          if (result.length > 0) {
            console.log('Sample case data:', result[0]);
            if (result[0].partners) {
              console.log('Partners data in first case:', result[0].partners);
              console.log('Entity from partners:', result[0].partners["name of entity"] || result[0].partners.entity_name);
            }
          }
          setCasesData(result);
        } else {
          console.error('Cases API returned unexpected format:', result);
          setCasesData([]);
        }
      } else {
        console.error('Failed to fetch cases data:', response.status);
        toast({
          title: "Error",
          description: "Failed to fetch cases data",
          variant: "destructive",
        });
        setCasesData([]);
      }
    } catch (error) {
      console.error('Error fetching cases data:', error);
      toast({
        title: "Error",
        description: "Error loading cases data",
        variant: "destructive",
      });
      setCasesData([]);
    } finally {
      setIsLoadingCases(false);
    }
  };

  // Function to open modal with backlog details
  const openBacklogModal = async (item: any) => {
    setIsModalOpen(true);
    setIsLoadingBacklog(true);
    
    try {
      console.log('Fetching detailed backlog information for:', item.backlog_id);
      
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
      
      const response = await fetch(`http://localhost:3000/admin/backlog_id?backlog_id=${item.backlog_id}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'content-type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Backlog detail API response:', result);
        
        if (Array.isArray(result) && result.length > 0) {
          setSelectedBacklogItem(result[0]);
        } else {
          console.error('Backlog detail API returned unexpected format:', result);
          setSelectedBacklogItem(item); // Fallback to original item
        }
      } else {
        console.error('Failed to fetch backlog details:', response.status);
        setSelectedBacklogItem(item); // Fallback to original item
      }
    } catch (error) {
      console.error('Error fetching backlog details:', error);
      setSelectedBacklogItem(item); // Fallback to original item
    } finally {
      setIsLoadingBacklog(false);
    }
  };

  // Function to handle edit action - navigate to detail page
  const handleEdit = (backlogId: number) => {
    console.log('Navigating to admin backlog detail page:', backlogId);
    navigate(`/admin-backlog-detail/${backlogId}`);
  };

  // Function to handle delete action - show confirmation dialog
  const handleDeleteCase = (caseItem: any) => {
    setCaseToDelete(caseItem);
    setShowDeleteCaseDialog(true);
  };

  // Function to confirm and execute delete
  const confirmDeleteCase = async () => {
    if (!caseToDelete) return;

    setIsDeletingCase(true);
    try {
      // Get session details from localStorage
      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '211b694f-495c-4b44-b8ad-68559589267d';
      let jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBhZG1pbkBleGFtcGxlLmNvbSIsInBhc3N3b3JkIjoiYWRtaW4xMjMiLCJpYXQiOjE3NTUxNzM4MDB9.hAzLoa_XBoVwJFl5vASaX617UAJLYQLjIc9kaxXwJyA';

      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          sessionId = session.sessionId || '211b694f-495c-4b44-b8ad-68559589267d';
          jwtToken = session.jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBhZG1pbkBleGFtcGxlLmNvbSIsInBhc3N3b3JkIjoiYWRtaW4xMjMiLCJpYXQiOjE3NTUxNzM4MDB9.hAzLoa_XBoVwJFl5vASaX617UAJLYQLjIc9kaxXwJyA';
        } catch (e) {
          console.error('Error parsing session:', e);
        }
      }

      const response = await fetch('http://localhost:3000/admin/deletecase', {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'session_id': sessionId,
          'jwt_token': jwtToken
        },
        body: JSON.stringify({
          backlog_id: caseToDelete.backlog_id
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Case ${caseToDelete.backlog_id} has been deleted successfully`,
        });
        
        // Remove the case from the local state
        setCasesData(prevCases => prevCases.filter(c => c.backlog_id !== caseToDelete.backlog_id));
        
        // Close dialog and reset state
        setShowDeleteCaseDialog(false);
        setCaseToDelete(null);
      } else {
        const errorText = await response.text();
        console.error('Failed to delete case:', response.status, errorText);
        toast({
          title: "Error",
          description: "Failed to delete case. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting case:', error);
      toast({
        title: "Error",
        description: "Failed to delete case",
        variant: "destructive",
      });
    } finally {
      setIsDeletingCase(false);
    }
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'analysis': return 'bg-purple-100 text-purple-800';
      case 'review': return 'bg-orange-100 text-orange-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case '1st instalment paid': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary-500 shadow-sm border-b border-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-white/80 mt-1">
                Welcome, {adminName} • Manage tasks, users, and system settings
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <SessionExpiry />
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Dashboard Overview</h2>
          {/* <Button
            variant="outline"
            onClick={fetchDashboardData}
            disabled={dashboardLoading}
            className="flex items-center space-x-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>{dashboardLoading ? 'Loading...' : 'Refresh Data'}</span>
          </Button> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-8">
          {tabStats.cards.map((card, index) => {
            const getColorClass = (color: string) => {
              switch (color) {
                case 'blue': return 'text-blue-600';
                case 'green': return 'text-green-600';
                case 'orange': return 'text-orange-600';
                case 'purple': return 'text-purple-600';
                case 'yellow': return 'text-yellow-600';
                case 'red': return 'text-red-600';
                case 'gray': return 'text-gray-600';
                default: return 'text-blue-600';
              }
            };
            
            return (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="text-sm font-medium text-gray-600 mb-2">{card.label}</div>
                  <div className={`text-3xl font-bold ${getColorClass(card.color)}`}>
                    {tabStats.loading ? '...' : card.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Task Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="leave">Leave Management</TabsTrigger>
            <TabsTrigger value="cases">Gap Analysis</TabsTrigger>
            {/* <TabsTrigger value="reports">Reports</TabsTrigger> */}
            {/* <TabsTrigger value="settings">Settings</TabsTrigger> */}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Admin Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/new-task')}
                >
                  <CardContent className="p-6 text-center">
                    <Plus className="h-8 w-8 mx-auto mb-3 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Create New Task</h3>
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/register')}
                >
                  <CardContent className="p-6 text-center">
                    <UserPlus className="h-8 w-8 mx-auto mb-3 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Create New User</h3>
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTabChange('tasks')}
                >
                  <CardContent className="p-6 text-center">
                    <List className="h-8 w-8 mx-auto mb-3 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">View All Tasks</h3>
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTabChange('users')}
                >
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 mx-auto mb-3 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Manage Users</h3>
                  </CardContent>
                </Card>
                {/* <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTabChange('reports')}
                >
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-3 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">View Reports</h3>
                  </CardContent>
                </Card> */}
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/leave-management')}
                >
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-3 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Leave Management</h3>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">All Task</h2>
            </div>

            {/* Search and Filter Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <Input
                      placeholder="Search by task ID, assignee, customer, or status..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-2 border-gray-200 rounded-lg focus:border-primary-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-40 border-2 border-gray-200 rounded-lg focus:border-primary-500">
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
                      <SelectTrigger className="w-32 border-2 border-gray-200 rounded-lg focus:border-primary-500">
                        <SelectValue placeholder="Page limit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>

                    {(searchTerm || statusFilter !== 'all') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                        }}
                        className="border-2 border-gray-300 hover:border-primary-500"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTasks.map((task: any) => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                            onClick={() => navigate(`/task/${task.task_id}`)}
                          >
                            {task.task_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {task.assigned_employee_name || 'Unassigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {task.customer_profile?.full_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(task.current_status)}>
                              {task.current_status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/task/${task.task_id}`)}
                              className="border-2 border-gray-300 hover:border-primary-500"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTask(task)}
                              className="border-2 border-gray-300 hover:border-primary-500"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredTasks.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                            No tasks found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {filteredTasks.length} tasks
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTaskCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={taskCurrentPage === 1}
                  className="border-2 border-gray-300 hover:border-primary-500"
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
                  className="border-2 border-gray-300 hover:border-primary-500"
                >
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            </div>

            {/* Search and Filter Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <Input
                      placeholder="Search by user ID, name, role, or status..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10 border-2 border-gray-200 rounded-lg focus:border-primary-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select
                      value={userStatusFilter}
                      onValueChange={setUserStatusFilter}
                    >
                      <SelectTrigger className="w-40 border-2 border-gray-200 rounded-lg focus:border-primary-500">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={userPartnerTypeFilter}
                      onValueChange={setUserPartnerTypeFilter}
                    >
                      <SelectTrigger className="w-40 border-2 border-gray-200 rounded-lg focus:border-primary-500">
                        <SelectValue placeholder="Filter by partner type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Partner Types</SelectItem>
                        {partnerTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {formatPartnerType(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={userPageLimit}
                      onValueChange={(value) => {
                        setUserPageLimit(value);
                        setUserCurrentPage(1); // Reset to first page when limit changes
                      }}
                    >
                      <SelectTrigger className="w-32 border-2 border-gray-200 rounded-lg focus:border-primary-500">
                        <SelectValue placeholder="Page limit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        
                      </SelectContent>
                    </Select>
                    {(userSearchTerm || userStatusFilter !== 'all' || userPartnerTypeFilter !== 'all') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUserSearchTerm('');
                          setUserStatusFilter('all');
                          setUserPartnerTypeFilter('all');
                        }}
                        className="border-2 border-gray-300 hover:border-primary-500"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.role}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.department || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{(user as any).entity || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatPartnerType((user as any).partner_type)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewUser(user)}
                              className="border-2 border-gray-300 hover:border-primary-500"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="border-2 border-gray-300 hover:border-primary-500"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              className="border-2 border-gray-300 hover:border-primary-500"
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {isSearchingOrFiltering ? (
                  <>Showing {filteredUsers.length} of {allFilteredUsers.length} filtered users</>
                ) : (
                  <>Showing {filteredUsers.length} users</>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={userCurrentPage === 1}
                  className="border-2 border-gray-300 hover:border-primary-500"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {userCurrentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // If filtering by partner type and we don't have enough filtered users for next page, fetch more
                    const nextPageStartIndex = userCurrentPage * pageLimit;
                    if (userPartnerTypeFilter !== 'all' && nextPageStartIndex >= allFilteredUsers.length && hasMoreUsers) {
                      // Fetch next page from API to get more users that might match the filter
                      setUserCurrentPage(prev => prev + 1);
                    } else {
                      // Normal pagination - move to next page
                      setUserCurrentPage(prev => prev + 1);
                    }
                  }}
                  disabled={
                    isSearchingOrFiltering
                      ? (endIndex >= allFilteredUsers.length) // No more filtered users when searching/filtering
                      : (userPartnerTypeFilter !== 'all'
                          ? (endIndex >= allFilteredUsers.length && !hasMoreUsers) // No more filtered users AND no more API pages
                          : !hasMoreUsers) // Normal pagination: disabled when no more pages from API
                  }
                  className="border-2 border-gray-300 hover:border-primary-500"
                >
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leave" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Leave Management</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show:</span>
                <Select
                  value={leavePageLimit}
                  onValueChange={(value) => {
                    setLeavePageLimit(value);
                    setLeaveCurrentPage(1); // Reset to first page when limit changes
                  }}
                >
                  <SelectTrigger className="w-32 border-2 border-gray-200 rounded-lg focus:border-primary-500">
                    <SelectValue placeholder="Page limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                {leaveLoading ? (
                  <div className="p-6 text-center">Loading leave requests...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leaveRequests.map((request: any) => (
                          <tr key={request.application_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{request.application_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{request.employees.first_name} {request.employees.last_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{request.leave_types?.type_name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{request.start_date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{request.end_date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{request.total_days}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate" title={request.reason}>{request.reason}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getStatusColor(request.status)}>
                                <span className="capitalize">{request.status}</span>
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(request.applied_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                              {request.status === 'pending' && (
                                <>
                                  <button
                                    className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                                    onClick={() => handleLeaveAction(request.application_id, 'approved')}
                                    title="Approve"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                  <button
                                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                    onClick={() => handleLeaveAction(request.application_id, 'rejected')}
                                    title="Reject"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {request.status !== 'pending' && (
                                <span className="text-gray-400 text-xs">
                                  {request.status === 'approved' ? 'Approved' : 'Rejected'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {leaveRequests.length === 0 && (
                          <tr>
                            <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                              No leave requests found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {leaveRequests.length} leave requests
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLeaveCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={leaveCurrentPage === 1}
                  className="border-2 border-gray-300 hover:border-primary-500"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {leaveCurrentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLeaveCurrentPage(prev => prev + 1)}
                  disabled={leaveRequests.length < parseInt(leavePageLimit)}
                  className="border-2 border-gray-300 hover:border-primary-500"
                >
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cases" className="space-y-4">
            <Card className="border-none shadow-xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Gap Analysis
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Track all the cases for evaluation
                    </CardDescription>
                  </div>
                  {/* Page Size Selector */}
                  {!isLoadingCases && casesData.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Show:</span>
                      <Select
                        value={pageSizeCases.toString()}
                        onValueChange={(value) => setPageSizeCases(parseInt(value))}
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
                <div className="flex items-center space-x-2 mt-4">
                  <div className="relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <Input
                      placeholder="Search by case summary, description, case type, or ID..."
                      value={casesSearchTerm}
                      onChange={(e) => setCasesSearchTerm(e.target.value)}
                      className="pl-10 max-w-sm border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchCasesData}
                      disabled={isLoadingCases}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCases ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingCases ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                    <span className="text-gray-600">Loading cases data...</span>
                  </div>
                ) : casesData.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                    <p className="text-gray-500">No cases have been created yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left p-4 font-semibold text-gray-700">
                            Case ID
                          </th>
                          <th className="text-left p-4 font-semibold text-gray-700">
                            Case Summary
                          </th>
                          <th className="text-left p-4 font-semibold text-gray-700">
                            Case Description
                          </th>
                          {/* <th className="text-left p-4 font-semibold text-gray-700">
                            Type of Policysss
                          </th> */}
                          <th className="text-left p-4 font-semibold text-gray-700">
                            Referral Date
                          </th>
                          <th className="text-left p-4 font-semibold text-gray-700">
                            Status
                          </th>
                          <th className="text-left p-4 font-semibold text-gray-700">
                            Assigned Expert
                          </th>
                          <th className="text-left p-4 font-semibold text-gray-700">
                            Entity
                          </th>
                          <th className="text-left p-4 font-semibold text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {casesData
                          .filter((item) => {
                            if (!casesSearchTerm) return true;
                            const searchLower = casesSearchTerm.toLowerCase();
                            return (
                              item.case_summary?.toLowerCase().includes(searchLower) ||
                              item.case_description?.toLowerCase().includes(searchLower) ||
                              item.backlog_id?.toString().includes(searchLower) ||
                              item.case_type_id?.toString().includes(searchLower) ||
                              item.case_types?.case_type_name?.toLowerCase().includes(searchLower)
                            );
                          })
                          .slice((currentPageCases - 1) * pageSizeCases, currentPageCases * pageSizeCases)
                          .map((item, index) => {
                            // Get status badge color
                            let statusBadgeClass = "bg-gray-100 text-gray-800";
                            const status = item.status?.toLowerCase() || '';
                            if (status === 'new') {
                              statusBadgeClass = "bg-yellow-100 text-yellow-800";
                            } else if (status === 'in progress' || status === 'in_progress') {
                              statusBadgeClass = "bg-blue-100 text-blue-800";
                            } else if (status === 'complete' || status === 'completed') {
                              statusBadgeClass = "bg-green-100 text-green-800";
                            }

                            return (
                              <tr
                                key={item.backlog_id || index}
                                className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-200"
                              >
                                <td className="p-4">
                                  <span className="font-mono text-sm text-blue-600">
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
                                {/* <td className="p-4 text-gray-700">
                                  {item.case_types?.case_type_name || `Type ${item.case_type_id}` || "N/A"}
                                </td> */}
                                <td className="p-4 text-sm text-gray-600">
                                  {item.backlog_referral_date || "N/A"}
                                </td>
                                <td className="p-4">
                                  <Badge className={statusBadgeClass}>
                                    {item.status || "N/A"}
                                  </Badge>
                                </td>
                                <td className="p-4 text-gray-700">
                                  {item.assigned_consultant_name ? item.assigned_consultant_name : 'Not Assigned'}
                                </td>
                                <td className="p-4 text-gray-700">
                                  {item.partners ? (item.partners["name of entity"] || item.partners.entity_name || 'N/A') :
                                   item.entity_name || item["name of entity"] || 'N/A'}
                                </td>
                                <td className="p-4">
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                      onClick={() => navigate(`/admin-backlog-view/${item.backlog_id}`)}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
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
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-red-300 text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteCase(item)}
                                    >
                                      <Trash className="h-4 w-4 mr-2" />
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                    
                    {/* Pagination */}
                    {casesData.filter((item) => {
                      if (!casesSearchTerm) return true;
                      const searchLower = casesSearchTerm.toLowerCase();
                      return (
                        item.case_summary?.toLowerCase().includes(searchLower) ||
                        item.case_description?.toLowerCase().includes(searchLower) ||
                        item.backlog_id?.toString().includes(searchLower) ||
                        item.case_type_id?.toString().includes(searchLower) ||
                        item.case_types?.case_type_name?.toLowerCase().includes(searchLower)
                      );
                    }).length > pageSizeCases && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-500">
                          Showing {((currentPageCases - 1) * pageSizeCases) + 1} to {Math.min(currentPageCases * pageSizeCases, casesData.filter((item) => {
                            if (!casesSearchTerm) return true;
                            const searchLower = casesSearchTerm.toLowerCase();
                            return (
                              item.case_summary?.toLowerCase().includes(searchLower) ||
                              item.case_description?.toLowerCase().includes(searchLower) ||
                              item.backlog_id?.toString().includes(searchLower) ||
                              item.case_type_id?.toString().includes(searchLower) ||
                              item.case_types?.case_type_name?.toLowerCase().includes(searchLower)
                            );
                          }).length)} of {casesData.filter((item) => {
                            if (!casesSearchTerm) return true;
                            const searchLower = casesSearchTerm.toLowerCase();
                            return (
                              item.case_summary?.toLowerCase().includes(searchLower) ||
                              item.case_description?.toLowerCase().includes(searchLower) ||
                              item.backlog_id?.toString().includes(searchLower) ||
                              item.case_type_id?.toString().includes(searchLower) ||
                              item.case_types?.case_type_name?.toLowerCase().includes(searchLower)
                            );
                          }).length} entries
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPageCases(prev => Math.max(1, prev - 1))}
                            disabled={currentPageCases <= 1}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-gray-600">
                            Page {currentPageCases} of {Math.ceil(casesData.filter((item) => {
                              if (!casesSearchTerm) return true;
                              const searchLower = casesSearchTerm.toLowerCase();
                              return (
                                item.case_summary?.toLowerCase().includes(searchLower) ||
                                item.case_description?.toLowerCase().includes(searchLower) ||
                                item.backlog_id?.toString().includes(searchLower) ||
                                item.case_type_id?.toString().includes(searchLower) ||
                                item.case_types?.case_type_name?.toLowerCase().includes(searchLower)
                              );
                            }).length / pageSizeCases)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPageCases(prev => Math.min(Math.ceil(casesData.filter((item) => {
                              if (!casesSearchTerm) return true;
                              const searchLower = casesSearchTerm.toLowerCase();
                              return (
                                item.case_summary?.toLowerCase().includes(searchLower) ||
                                item.case_description?.toLowerCase().includes(searchLower) ||
                                item.backlog_id?.toString().includes(searchLower) ||
                                item.case_type_id?.toString().includes(searchLower) ||
                                item.case_types?.case_type_name?.toLowerCase().includes(searchLower)
                              );
                            }).length / pageSizeCases), prev + 1))}
                            disabled={currentPageCases >= Math.ceil(casesData.filter((item) => {
                              if (!casesSearchTerm) return true;
                              const searchLower = casesSearchTerm.toLowerCase();
                              return (
                                item.case_summary?.toLowerCase().includes(searchLower) ||
                                item.case_description?.toLowerCase().includes(searchLower) ||
                                item.backlog_id?.toString().includes(searchLower) ||
                                item.case_type_id?.toString().includes(searchLower) ||
                                item.case_types?.case_type_name?.toLowerCase().includes(searchLower)
                              );
                            }).length / pageSizeCases)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Case Reports</h2>
            </div>

            <Card>
              <CardContent className="p-0">
                {reportsLoading ? (
                  <div className="p-6 text-center">Loading reports...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <p className="text-center text-gray-500 p-4   ">No reports found</p>
                        {reports.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                              No reports found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent> */}

          {/* <TabsContent value="settings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
            </div>

            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">System Name</label>
                  <Input defaultValue="Claim Recovery System" className="max-w-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
                  <Input defaultValue="admin@example.com" className="max-w-md" />
                </div>
                <Button className="bg-gray-900 hover:bg-gray-800">Update Settings</Button>
              </CardContent>
            </Card>
          </TabsContent> */}
        </Tabs>
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">User Details - {selectedUser.name}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <strong>User ID:</strong> {selectedUser.id}
              </div>
              <div>
                <strong>Username:</strong> {selectedUser.name}
              </div>
              <div>
                <strong>Role:</strong> {selectedUser.role}
              </div>
              <div>
                <strong>Status:</strong> {selectedUser.status}
              </div>
              <div>
                <strong>Email:</strong> {selectedUser.email || 'Not provided'}
              </div>
              <div>
                <strong>Mobile Number:</strong> {selectedUser.mobile_number || 'Not provided'}
              </div>
              {selectedUser.employees && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Employee Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Employee ID:</strong> {selectedUser.employees.employee_id}</div>
                    <div><strong>Designation:</strong> {selectedUser.employees.designation}</div>
                    <div><strong>Manager:</strong> {selectedUser.employees.manager || 'N/A'}</div>
                    <div><strong>Joining Date:</strong> {selectedUser.employees.joining_date}</div>
                    <div><strong>Work Phone:</strong> {selectedUser.employees.work_phone || 'N/A'}</div>
                    <div><strong>Address:</strong> {selectedUser.employees.address || 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowUserModal(false)}
                className="bg-white border-2 border-gray-300 hover:border-primary-500 text-black"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}



      {/* Task Reassignment Modal */}
      {showReassignModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Reassign Tasks Before Deletion</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelReassign}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  <strong>Warning:</strong> You are about to delete user <strong>{selectedUser.name}</strong> who has {assignedTasks.length} assigned task(s).
                  Please reassign these tasks to another user before proceeding with deletion.
                </p>
              </div>

              {/* Assigned Tasks List */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Assigned Tasks</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assignedTasks.map((task: any) => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {task.task_id}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {task.title}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(task.current_status)}>
                              {task.current_status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* New Assignee Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select New Assignee</h3>
                <div className="max-w-md">
                  <Label className="text-sm font-medium text-gray-700">New Assignee *</Label>
                  <Select
                    value={newAssignee}
                    onValueChange={setNewAssignee}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select new assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter(user => user.id !== selectedUser.id && user.status === 'Active')
                        .map(user => (
                          <SelectItem key={user.id} value={user.name}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    Only active users are shown as potential assignees.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t">
              <Button
                variant="outline"
                onClick={handleCancelReassign}
                className="bg-white border-2 border-gray-300 hover:border-primary-500 text-black"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleReassignTasks}
                disabled={!newAssignee}
                className="bg-white border-2 border-gray-300 hover:border-primary-500 text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reassign & Delete User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Dialog */}
      {showDeleteConfirmDialog && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Delete User</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDeleteConfirmDialog(false);
                  setUserToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Are you sure?</h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">
                  You are about to permanently delete user <strong>{userToDelete.name}</strong> ({userToDelete.role}).
                  This will remove all associated data and access permissions.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirmDialog(false);
                  setUserToDelete(null);
                }}
                className="bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteUser}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Case Confirmation Dialog */}
      {showDeleteCaseDialog && caseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Delete Case</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDeleteCaseDialog(false);
                  setCaseToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={isDeletingCase}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Are you sure?</h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">
                  You are about to permanently delete case <strong>{caseToDelete.backlog_id}</strong>.
                  {caseToDelete.case_summary && (
                    <span className="block mt-2">
                      <strong>Summary:</strong> {caseToDelete.case_summary}
                    </span>
                  )}
                  This will remove all associated data.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteCaseDialog(false);
                  setCaseToDelete(null);
                }}
                className="bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700"
                disabled={isDeletingCase}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteCase}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isDeletingCase}
              >
                {isDeletingCase ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Case'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Backlog Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Backlog Case Details
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete information about the selected backlog case
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingBacklog ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-purple-600 mr-2" />
              <span className="text-gray-600">Loading detailed information...</span>
            </div>
          ) : selectedBacklogItem ? (
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

              {/* Main Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-gray-900">Case Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Case Summary</label>
                        <p className="text-gray-900 font-medium">
                          {selectedBacklogItem.case_summary || "No summary available"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Case Description</label>
                        <p className="text-gray-700">
                          {selectedBacklogItem.case_description || "No description available"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Case Type Name</label>
                        <p className="text-gray-900 font-medium">
                          {selectedBacklogItem.case_types?.case_type_name || `Type ${selectedBacklogItem.case_type_id}` || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Referring Partner ID</label>
                        <p className="text-gray-900 font-medium">
                          {selectedBacklogItem.backlog_referring_partner_id || "N/A"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-gray-900">Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Referral Date</label>
                        <p className="text-gray-900 font-medium">
                          {selectedBacklogItem.backlog_referral_date || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created Time</label>
                        <p className="text-gray-900 font-medium">
                          {selectedBacklogItem.created_time ? new Date(selectedBacklogItem.created_time).toLocaleString() : "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Updated Time</label>
                        <p className="text-gray-900 font-medium">
                          {selectedBacklogItem.updated_time ? new Date(selectedBacklogItem.updated_time).toLocaleString() : "N/A"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-gray-900">User Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created By</label>
                        <p className="text-gray-900 font-medium">
                          User ID: {selectedBacklogItem.created_by || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Updated By</label>
                        <p className="text-gray-900 font-medium">
                          User ID: {selectedBacklogItem.updated_by || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <div className="mt-1">
                          <Badge
                            className={`${selectedBacklogItem.deleted_flag ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"} px-3 py-1`}
                          >
                            {selectedBacklogItem.deleted_flag ? "Deleted" : "Active"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comments Section */}
                  {selectedBacklogItem.comment_text && (
                    <Card className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-gray-900">Comments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <p className="text-gray-700 leading-relaxed">
                            {selectedBacklogItem.comment_text}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Documents Section */}
                  {selectedBacklogItem.backlog_documents && selectedBacklogItem.backlog_documents.length > 0 && (
                    <Card className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-gray-900 flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-primary-500" />
                          <span>Documents ({selectedBacklogItem.backlog_documents.length})</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedBacklogItem.backlog_documents.map((doc: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-8 w-8 text-primary-500" />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {doc.original_filename || `Document ${index + 1}`}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Case types: {selectedBacklogItem?.case_types?.case_type_name || "N/A"}
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
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

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
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Failed to load backlog details</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      {showDocumentModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 z-10"
          style={{ overflow: 'hidden',zIndex:1000 }}
        >
          <div className="bg-white rounded-lg shadow-2xl w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[65vw] h-[95vh] flex flex-col max-w-7xl">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-gray-200 gap-3 sm:gap-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Document Viewer</h3>
              
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

export default AdminDashboard;
