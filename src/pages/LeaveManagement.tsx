import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Eye,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { buildApiUrl } from "@/config/api";

const LeaveManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showLeaveDetails, setShowLeaveDetails] = useState(false);
  const [showApplyLeaveForm, setShowApplyLeaveForm] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [leaves, setLeaves] = useState<UILLeave[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [designation, setDesignation] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalLeaves, setTotalLeaves] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Summary counts state (for summary cards)
  const [summaryCounts, setSummaryCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Apply Leave Form State
  const [applyLeaveForm, setApplyLeaveForm] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    total_days: "",
    reason: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Leave Types State
  const [leaveTypes, setLeaveTypes] = useState<
    Array<{
      leave_type_id: number;
      type_name: string;
      description: string;
      annual_entitlement: number;
      carry_forward_allowed: boolean;
      max_carry_forward: number;
      is_active: boolean;
      created_time: string;
    }>
  >([]);
  const [isLoadingLeaveTypes, setIsLoadingLeaveTypes] = useState(false);

  useEffect(() => {
    const userDetailsStr = localStorage.getItem("expertclaims_user_details");

    if (userDetailsStr) {
      try {
        const userDetails = JSON.parse(userDetailsStr);
        // Handle array or object
        const details = Array.isArray(userDetails)
          ? userDetails[0]
          : userDetails;
        setDesignation(details?.designation || null);
        setUserRole(details?.role || details?.designation || null);
      } catch (error) {
        console.error("Error parsing user details:", error);
      }
    }
  }, []);

  // derive HR and Admin check
  const isHR = designation?.toLowerCase() === "hr" || designation?.toLowerCase() === "HR";
  const isAdmin = designation?.toLowerCase() === "admin" || designation?.toLowerCase() === "Admin" || userRole?.toLowerCase() === "admin" || userRole?.toLowerCase() === "Admin";

  type ApiLeave = {
    id?: string;
    application_id?: number;
    employee_id?: string;
    designation?: string;
    start_date?: string;
    end_date?: string | null;
    total_days?: number;
    applied_date?: string;
    reason?: string;
    status?: "pending" | "approved" | "rejected" | string;
    employees?: { first_name?: string; last_name?: string };
    leave_types?: { type_name?: string };
    emergency_contact?: { name?: string; phone?: string };
    employee_email?: string;
    contact_number?: string;
    // ...any other fields you return
  };

  type UILLeave = {
    id: string;
    application_id: number;
    employeeName: string;
    employeeId: string;
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    status: "pending" | "approved" | "rejected" | string;
    appliedDate: string;
    approvedBy: string | null;
    employeeEmail?: string;
    department: string; // designation
    contactNumber?: string;
    emergencyContact?: { name?: string; phone?: string };
  };

  // Fetch all leaves for summary counts (no pagination)
  const fetchAllLeavesForSummary = async () => {
    try {
      const userDetailsStr = localStorage.getItem("expertclaims_user_details");
      const userDetails = userDetailsStr ? JSON.parse(userDetailsStr) : {};
      const details = Array.isArray(userDetails) ? userDetails[0] : userDetails;
      const employeeId = details?.employee_id;
      const role = details?.role || "employee";
      const jwtToken = localStorage.getItem("jwtToken") || "";

      // Use backend API endpoints - fetch with a large size to get all records
      const baseUrl = buildApiUrl('');
      const url =
        role === "employee" && employeeId
          ? `${baseUrl}/support/getempleaves?employee_id=${employeeId}&page=1&size=10000`
          : `${baseUrl}/admin/getleaves?page=1&size=10000`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(jwtToken && { Authorization: `Bearer ${jwtToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      let responseData;
      if (Array.isArray(result)) {
        responseData = result.length > 0 ? result[0] : { status: 'error', message: 'Empty response array' };
      } else if (result && typeof result === 'object') {
        responseData = result;
      } else {
        throw new Error('Unexpected response format from API');
      }

      if (responseData.status !== 'success') {
        throw new Error(responseData.message || 'Failed to fetch leaves');
      }

      const payload: ApiLeave[] = Array.isArray(responseData.data) ? responseData.data : [];
      
      // Calculate summary counts
      const counts = {
        total: payload.length,
        pending: payload.filter((leave) => leave.status === "pending").length,
        approved: payload.filter((leave) => leave.status === "approved").length,
        rejected: payload.filter((leave) => leave.status === "rejected").length,
      };

      setSummaryCounts(counts);
    } catch (err: any) {
      console.error("Failed to fetch summary counts:", err);
      // Don't show error toast for summary fetch failure, just log it
    }
  };

  const fetchLeaves = async (limit: number = 10, page: number = 1) => {
    setIsLoading(true);
    try {
      const userDetailsStr = localStorage.getItem("expertclaims_user_details");
      const userDetails = userDetailsStr ? JSON.parse(userDetailsStr) : {};
      const details = Array.isArray(userDetails) ? userDetails[0] : userDetails;
      const employeeId = details?.employee_id;
      const role = details?.role || "employee"; // fallback to employee if not set
      const jwtToken = localStorage.getItem("jwtToken") || "";

      // Use backend API endpoints
      // Vite uses import.meta.env, but fallback to process.env for compatibility
      const baseUrl = buildApiUrl('');
      const url =
        role === "employee" && employeeId
          ? `${baseUrl}/support/getempleaves?employee_id=${employeeId}&page=${page}&size=${limit}`
          : `${baseUrl}/admin/getleaves?page=${page}&size=${limit}`;

      console.log("=== Leave Fetch Debug ===");
      console.log("Role:", role);
      console.log("Employee ID:", employeeId);
      console.log("Base URL:", baseUrl);
      console.log("Full URL:", url);
      console.log("JWT Token present:", !!jwtToken);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(jwtToken && { Authorization: `Bearer ${jwtToken}` }),
        },
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Raw API response:", JSON.stringify(result, null, 2));
      console.log("Response type:", Array.isArray(result) ? 'array' : typeof result);
      
      // Backend returns: [{ status: 'success', data: [...], pagination: {...} }]
      let responseData;
      if (Array.isArray(result)) {
        responseData = result.length > 0 ? result[0] : { status: 'error', message: 'Empty response array' };
      } else if (result && typeof result === 'object') {
        // Handle case where backend returns object directly
        responseData = result;
      } else {
        throw new Error('Unexpected response format from API');
      }
      
      console.log("Parsed response data:", responseData);
      console.log("Response status:", responseData.status);
      
      if (responseData.status !== 'success') {
        console.error("API returned error status:", responseData);
        throw new Error(responseData.message || 'Failed to fetch leaves');
      }

      const payload: ApiLeave[] = Array.isArray(responseData.data) ? responseData.data : [];
      console.log("Leave payload:", payload);
      console.log("Number of leaves:", payload.length);
      
      // Update pagination state from backend
      if (responseData.pagination) {
        setTotalLeaves(responseData.pagination.total || 0);
        setTotalPages(responseData.pagination.totalPages || 0);
        console.log("Pagination info:", responseData.pagination);
      }

      console.log("Mapped leaves count:", payload.length);

      const mapped: UILLeave[] = payload.map((item, idx) => {
        const first = item.employees?.first_name?.trim?.() || "";
        const last = item.employees?.last_name?.trim?.() || "";
        const employeeName =
          [first, last].filter(Boolean).join(" ").trim() || "Unknown";

        return {
          id: item.application_id?.toString() || `LEAVE-${idx + 1}`,
          application_id: item.application_id || idx + 1,
          employeeName,
          employeeId: item.employee_id?.toString() || "N/A",
          type: item.leave_types?.type_name || "N/A",
          startDate: item.start_date || "—",
          endDate: item.end_date || "—",
          days:
            typeof item.total_days === "number"
              ? item.total_days
              : Number(item.total_days) || 0,
          reason: item.reason || "—",
          status: (item.status as UILLeave["status"]) || "pending",
          appliedDate: item.applied_date || "—",
          approvedBy: null,
          department: item.designation || "N/A",
          employeeEmail: item.employee_email || "N/A",
          contactNumber: item.contact_number || "N/A",
          emergencyContact: item.emergency_contact || undefined,
        };
      });

      setLeaves(mapped);
      console.log("Mapped leaves set in state:", mapped.length);
      
      if (mapped.length === 0 && (responseData.pagination?.total || 0) === 0) {
        toast({
          title: "No Leaves Found",
          description: "There are no leave applications in the system yet.",
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch leaves:", err);
      setLeaves([]);
      toast({
        title: "Error",
        description: err.message || "Failed to fetch leaves from API.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    setIsLoadingLeaveTypes(true);
    try {
      const baseUrl = buildApiUrl('');
      const jwtToken = localStorage.getItem("jwtToken") || "";

      const response = await fetch(`${baseUrl}/support/getlevetypes`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(jwtToken && { Authorization: `Bearer ${jwtToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      // Backend returns: { status: 'success', data: [...] }
      const leaveTypesData = result.data || [];
      setLeaveTypes(leaveTypesData);

      console.log("Leave types loaded:", leaveTypesData);
    } catch (err: any) {
      console.error("Failed to fetch leave types:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to fetch leave types from API.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLeaveTypes(false);
    }
  };

  useEffect(() => {
    fetchLeaves(pageSize, currentPage);
    fetchLeaveTypes();
    fetchAllLeavesForSummary(); // Fetch all leaves for summary counts
  }, [pageSize, currentPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleViewLeave = (leave: any) => {
    setSelectedLeave(leave);
    setShowLeaveDetails(true);
  };

  const handleApproveLeave = async () => {
    setIsProcessing(true);
    try {
      const userDetailsStr = localStorage.getItem("expertclaims_user_details");
      let approvedBy = null;

      if (userDetailsStr) {
        try {
          const parsedDetails = JSON.parse(userDetailsStr);
          const details = Array.isArray(parsedDetails)
            ? parsedDetails[0]
            : parsedDetails;
          approvedBy = details?.userid || details?.user_id;
        } catch (error) {
          console.error("Error parsing user details:", error);
        }
      }

      if (!approvedBy) {
        throw new Error("User not authenticated");
      }

      const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

      console.log("Approving leave:", {
        applicationId: selectedLeave.application_id,
        approvedBy,
        currentDate,
      });

      const baseUrl = buildApiUrl('');
      const jwtToken = localStorage.getItem("jwtToken") || "";

      // Call the backend updateleavestatus API for approval
      const response = await fetch(`${baseUrl}/admin/updateleavestatus`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(jwtToken && { Authorization: `Bearer ${jwtToken}` }),
        },
        body: JSON.stringify({
          application_id: selectedLeave.application_id,
          status: "approved",
          approved_by: approvedBy,
          approved_date: currentDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Approval API Response:", result);

      // Handle array response format: [{"status":"success","message":"Updated successfully"}]
      const responseData = Array.isArray(result) ? result[0] : result;

      if (responseData.status === "success") {
        const employeeName = selectedLeave?.employeeName || "Employee";
        toast({
          title: "Leave Approved",
          description: `${employeeName}'s leave application has been approved successfully.`,
        });

        setShowLeaveDetails(false);
        setSelectedLeave(null);

        // Refresh the leaves list to show updated status
        fetchLeaves(pageSize, currentPage);
        fetchAllLeavesForSummary(); // Refresh summary counts
      } else {
        throw new Error(
          responseData.message || "Failed to approve leave application"
        );
      }
    } catch (error) {
      console.error("Error approving leave:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to approve leave application.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectLeave = async () => {
    setIsProcessing(true);
    try {
      // Get user details from localStorage
      const userDetailsStr = localStorage.getItem("expertclaims_user_details");
      let approvedBy = null;

      if (userDetailsStr) {
        try {
          const parsedDetails = JSON.parse(userDetailsStr);
          const details = Array.isArray(parsedDetails)
            ? parsedDetails[0]
            : parsedDetails;
          approvedBy = details?.userid || details?.user_id;
        } catch (error) {
          console.error("Error parsing user details:", error);
        }
      }

      if (!approvedBy) {
        throw new Error("User not authenticated");
      }
      const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

      console.log("Rejecting leave:", {
        applicationId: selectedLeave.application_id,
        approvedBy,
        currentDate,
      });

      const baseUrl = buildApiUrl('');
      const jwtToken = localStorage.getItem("jwtToken") || "";

      // Call the backend updateleavestatus API for rejection
      const response = await fetch(`${baseUrl}/admin/updateleavestatus`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(jwtToken && { Authorization: `Bearer ${jwtToken}` }),
        },
        body: JSON.stringify({
          application_id: selectedLeave.application_id,
          status: "rejected",
          approved_by: approvedBy,
          approved_date: currentDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Rejection API Response:", result);

      // Handle array response format: [{"status":"success","message":"Updated successfully"}]
      const responseData = Array.isArray(result) ? result[0] : result;

      if (responseData.status === "success") {
        const employeeName = selectedLeave?.employeeName || "Employee";
        toast({
          title: "Leave Rejected",
          description: `${employeeName}'s leave application has been rejected.`,
        });

        setShowLeaveDetails(false);
        setSelectedLeave(null);

        // Refresh the leaves list to show updated status
        fetchLeaves(pageSize, currentPage);
        fetchAllLeavesForSummary(); // Refresh summary counts
      } else {
        throw new Error(
          responseData.message || "Failed to reject leave application"
        );
      }
    } catch (error) {
      console.error("Error rejecting leave:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to reject leave application.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate total days between start and end date
  const calculateTotalDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  };

  // Handle form input changes
  const handleFormChange = (field: string, value: string) => {
    setApplyLeaveForm((prev) => ({ ...prev, [field]: value }));

    // Auto-calculate total days when dates change
    if (field === "start_date" || field === "end_date") {
      const startDate =
        field === "start_date" ? value : applyLeaveForm.start_date;
      const endDate = field === "end_date" ? value : applyLeaveForm.end_date;
      if (startDate && endDate) {
        const totalDays = calculateTotalDays(startDate, endDate);
        setApplyLeaveForm((prev) => ({
          ...prev,
          total_days: totalDays.toString(),
        }));
      }
    }
  };

  // Submit leave application
  const handleSubmitLeave = async () => {
    if (
      !applyLeaveForm.leave_type_id ||
      !applyLeaveForm.start_date ||
      !applyLeaveForm.reason
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingLeave(true);
    try {
      // Get employee_id from localStorage or fetch from backend
      const userDetailsStr = localStorage.getItem("expertclaims_user_details");
      let employeeId = null;
      let userId = null;

      if (userDetailsStr) {
        try {
          const userDetails = JSON.parse(userDetailsStr);
          // Handle array or object
          const details = Array.isArray(userDetails)
            ? userDetails[0]
            : userDetails;
          employeeId = details?.employee_id;
          userId = details?.userid || details?.user_id;
        } catch (error) {
          console.error("Error parsing user details:", error);
        }
      }

      // If employee_id is not found but user_id is available, fetch it from backend
      if (!employeeId && userDetailsStr) {
        try {
          const baseUrl = buildApiUrl('');
          const jwtToken = localStorage.getItem("jwtToken") || "";
          
          // Parse user details to get email
          const parsedDetails = JSON.parse(userDetailsStr);
          const details = Array.isArray(parsedDetails) ? parsedDetails[0] : parsedDetails;
          const email = details?.email;
          
          if (email) {
            console.log("Fetching employee_id for email:", email);
            const userDetailsResponse = await fetch(`${baseUrl}/support/getuserdetails?email=${encodeURIComponent(email)}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                ...(jwtToken && { Authorization: `Bearer ${jwtToken}` }),
              },
            });

            if (userDetailsResponse.ok) {
              const userDetailsData = await userDetailsResponse.json();
              const userDetails = Array.isArray(userDetailsData) ? userDetailsData[0] : userDetailsData;
              employeeId = userDetails?.employee_id;
              console.log("Fetched employee_id:", employeeId);
              
              // Update localStorage with the fetched employee_id
              if (employeeId) {
                const updatedDetails = Array.isArray(parsedDetails) 
                  ? [{ ...parsedDetails[0], employee_id: employeeId }, ...parsedDetails.slice(1)]
                  : { ...parsedDetails, employee_id: employeeId };
                localStorage.setItem("expertclaims_user_details", JSON.stringify(updatedDetails));
              }
            }
          }
        } catch (error) {
          console.error("Error fetching employee_id:", error);
        }
      }

      if (!employeeId) {
        throw new Error("Employee ID not found. You must be an employee to apply for leave. Please contact your administrator.");
      }

      const baseUrl = buildApiUrl('');
      const jwtToken = localStorage.getItem("jwtToken") || "";

      const leaveData = {
        employee_id: employeeId,
        leave_type_id: parseInt(applyLeaveForm.leave_type_id),
        start_date: applyLeaveForm.start_date,
        end_date: applyLeaveForm.end_date || applyLeaveForm.start_date,
        total_days: parseInt(applyLeaveForm.total_days) || 1,
        reason: applyLeaveForm.reason,
        emergency_contact_name: applyLeaveForm.emergency_contact_name || "Not provided",
        emergency_contact_phone: applyLeaveForm.emergency_contact_phone || "Not provided",
      };

      console.log("Submitting leave data:", leaveData);

      // Call the backend apply-leave API
      const response = await fetch(`${baseUrl}/support/apply-leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(jwtToken && { Authorization: `Bearer ${jwtToken}` }),
        },
        body: JSON.stringify(leaveData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("API Response:", result);

      // Check if the API call was successful
      if (result.status === "success") {
        toast({
          title: "Leave Applied Successfully",
          description:
            result.message ||
            "Your leave application has been submitted and is pending approval.",
        });

        // Reset form and close modal
        setApplyLeaveForm({
          leave_type_id: "",
          start_date: "",
          end_date: "",
          total_days: "",
          reason: "",
          emergency_contact_name: "",
          emergency_contact_phone: "",
        });
        setShowApplyLeaveForm(false);

        // Refresh the leaves list
        fetchLeaves(pageSize, currentPage);
        fetchAllLeavesForSummary(); // Refresh summary counts
      } else {
        throw new Error(result.message || "Failed to submit leave application");
      }
    } catch (error) {
      console.error("Error submitting leave:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit leave application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  // Client-side filtering
  const filteredLeaves = leaves.filter((leave) => {
    const matchesStatus =
      filterStatus === "all" || leave.status === filterStatus;
    const matchesSearch =
      (leave.employeeName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (leave.employeeId || "")
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (leave.type || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Use backend pagination data
  const calculatedTotalPages = totalPages || (leaves.length === pageSize ? currentPage + 1 : currentPage);
  const paginatedLeaves = filteredLeaves; // Use filtered results directly since API handles pagination

  // Debug logging
  console.log("Pagination Debug:", {
    totalLeaves: totalLeaves,
    currentLeaves: leaves.length,
    filteredLeaves: filteredLeaves.length,
    currentPage,
    pageSize,
    totalPages: calculatedTotalPages,
    paginatedLeaves: paginatedLeaves.length,
  });

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    const size = Number(newPageSize);
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle page change - simplified logic
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handle next page
  const handleNextPage = () => {
    setCurrentPage((prev) => {
      const next = prev + 1;
      return next <= (totalPages || 1) ? next : prev;
    });
  };

  // Handle previous page
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  const pendingLeaves = leaves.filter((leave) => leave.status === "pending");
  const approvedLeaves = leaves.filter((leave) => leave.status === "approved");
  const rejectedLeaves = leaves.filter((leave) => leave.status === "rejected");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-primary-500 backdrop-blur-md shadow-sm border-b border-primary-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 border-2 border-gray-300 hover:border-primary-500 rounded-xl transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Leave Management
                </h1>
                <p className="text-sm text-white/80 font-medium">
                  Review and manage employee leave applications
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* <Button
                variant="outline"
                onClick={() => {
                  setIsLoading(true);
                  fetchLeaves(pageSize, currentPage);
                  fetchLeaveTypes();
                }}
                disabled={isLoading}
                className="flex items-center space-x-2 border-2 border-white/20 hover:border-white/40 text-white rounded-xl transition-all duration-300"
              >
                <div className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}>
                  {isLoading ? (
                    <div className="rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </div>
                <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
              </Button> */}

              {/* Apply Leave Button - Only for Employees (not Admin) */}
              {!isAdmin && (
              <Button
                onClick={() => setShowApplyLeaveForm(true)}
                className="flex items-center space-x-2 bg-white text-primary-600 hover:bg-gray-50 rounded-xl transition-all duration-300 font-semibold"
              >
                <Plus className="h-4 w-4" />
                <span>Apply Leave</span>
              </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Applications
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? "..." : summaryCounts.total}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-yellow-50/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? "..." : summaryCounts.pending}
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-green-50/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? "..." : summaryCounts.approved}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-red-50/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? "..." : summaryCounts.rejected}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 w-full md:max-w-md">
            <Input
              placeholder="Search by employee name, ID, or leave type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              onClick={() => setFilterStatus("all")}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              All
            </Button>
            <Button
              variant={filterStatus === "pending" ? "default" : "outline"}
              onClick={() => setFilterStatus("pending")}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Pending
            </Button>
            <Button
              variant={filterStatus === "approved" ? "default" : "outline"}
              onClick={() => setFilterStatus("approved")}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Approved
            </Button>
            <Button
              variant={filterStatus === "rejected" ? "default" : "outline"}
              onClick={() => setFilterStatus("rejected")}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Rejected
            </Button>
          </div>
        </div>

        {/* Leave Applications Table */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Leave Applications
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Review and manage all employee leave applications
                </CardDescription>
              </div>
              {/* Page Size Selector */}
              {!isLoading && filteredLeaves.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Show:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={handlePageSizeChange}
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading leaves...</p>
                </div>
              )}

              {!isLoading &&
                filteredLeaves.length > 0 &&
                filteredLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="p-6 border border-gray-200 rounded-xl hover:bg-blue-50/50 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {leave.employeeName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {leave.employeeId} • {leave.department}
                            </p>
                          </div>
                          <Badge
                            className={`${getStatusColor(
                              leave.status
                            )} px-3 py-1 rounded-full font-medium flex items-center space-x-1`}
                          >
                            {getStatusIcon(leave.status)}
                            <span className="capitalize">{leave.status}</span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Leave Type:</span>{" "}
                            {leave.type}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span>{" "}
                            {leave.startDate} to {leave.endDate}
                          </div>
                          <div>
                            <span className="font-medium">Days:</span>{" "}
                            {leave.days}
                          </div>
                          <div>
                            <span className="font-medium">Applied:</span>{" "}
                            {leave.appliedDate}
                          </div>
                        </div>

                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Reason:</span>{" "}
                          {leave.reason && leave.reason.length > 100
                            ? `${leave.reason.substring(0, 100)}...`
                            : leave.reason || "—"}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewLeave(leave)}
                          className="flex items-center space-x-1 w-full sm:w-auto"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">View</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

              {!isLoading && leaves.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No leave applications found.</p>
                </div>
              )}

              {!isLoading &&
                leaves.length > 0 &&
                filteredLeaves.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No leave applications found matching your criteria.
                    </p>
                  </div>
                )}
            </div>
          </CardContent>

          {/* Pagination Controls */}
          {!isLoading && leaves.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Pagination Info */}
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {calculatedTotalPages} - Showing {filteredLeaves.length} of{" "}
                  {totalLeaves || leaves.length} entries
                </div>

                {/* Pagination Navigation */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage <= 1}
                    className="flex items-center space-x-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, calculatedTotalPages) }, (_, i) => {
                      let pageNum;
                      if (calculatedTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= calculatedTotalPages - 2) {
                        pageNum = calculatedTotalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                          disabled={pageNum > calculatedTotalPages}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= calculatedTotalPages}
                    className="flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Leave Details Modal */}
        <Dialog open={showLeaveDetails} onOpenChange={setShowLeaveDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Calendar className="h-6 w-6 text-primary-600" />
                <span>Leave Application Details</span>
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Review the complete leave application details before making a
                decision.
              </DialogDescription>
            </DialogHeader>

            {selectedLeave && (
              <div className="space-y-6 mt-6">
                {/* Employee Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">
                    Employee Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Name:</span>
                      <span className="ml-2 text-blue-600">
                        {selectedLeave.employeeName}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">
                        Employee ID:
                      </span>
                      <span className="ml-2 text-blue-600">
                        {selectedLeave.employeeId}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">
                        Department:
                      </span>
                      <span className="ml-2 text-blue-600">
                        {selectedLeave.department}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">
                        Email:
                      </span>
                      <span className="ml-2 text-blue-600">
                        {selectedLeave.employeeEmail || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">
                        Contact Number:
                      </span>
                      <span className="ml-2 text-blue-600">
                        {selectedLeave.contactNumber || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">
                        Emergency Contact:
                      </span>
                      <span className="ml-2 text-blue-600">
                        {selectedLeave.emergencyContact ? (
                          <span>
                            {selectedLeave.emergencyContact.name || "Unknown"} -{" "}
                            {selectedLeave.emergencyContact.phone || "No phone"}
                          </span>
                        ) : (
                          "Not provided"
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Leave Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Leave Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-700 font-medium">
                        Leave Type:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {selectedLeave.type}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">
                        Duration:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {selectedLeave.startDate} to {selectedLeave.endDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">
                        Number of Days:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {selectedLeave.days}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">
                        Applied Date:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {selectedLeave.appliedDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">Status:</span>
                      <Badge
                        className={`${getStatusColor(
                          selectedLeave.status
                        )} ml-2`}
                      >
                        {getStatusIcon(selectedLeave.status)}
                        <span className="ml-1 capitalize">
                          {selectedLeave.status}
                        </span>
                      </Badge>
                    </div>
                    {selectedLeave.approvedBy && (
                      <div>
                        <span className="text-gray-700 font-medium">
                          Approved By:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {selectedLeave.approvedBy}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reason for Leave */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h4 className="font-semibold text-yellow-900 mb-3">
                    Reason for Leave
                  </h4>
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    {selectedLeave.reason}
                  </p>
                </div>

                {/* Action Buttons */}
                {(isAdmin || isHR) && (
                  <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      className="border-2 border-gray-300 hover:border-gray-400 rounded-xl transition-all duration-300"
                      onClick={() => setShowLeaveDetails(false)}
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    {/* Show reject button if status is pending or approved */}
                    {(selectedLeave.status === "pending" || selectedLeave.status === "approved") && (
                      <Button
                        variant="outline"
                        className="border-2 border-red-300 hover:border-red-400 text-red-600 hover:text-red-700 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleRejectLeave()}
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Processing..." : "Reject Leave"}
                      </Button>
                    )}
                    {/* Show approve button if status is pending or rejected */}
                    {(selectedLeave.status === "pending" || selectedLeave.status === "rejected") && (
                      <Button
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleApproveLeave()}
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Processing..." : "Approve Leave"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Apply Leave Form Modal */}
        <Dialog open={showApplyLeaveForm} onOpenChange={setShowApplyLeaveForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Plus className="h-6 w-6 text-primary-600" />
                <span>Apply for Leave</span>
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Fill in the details below to submit your leave application.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Leave Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Leave Type *
                </label>
                {isLoadingLeaveTypes ? (
                  <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                    <span className="text-gray-500">
                      Loading leave types...
                    </span>
                  </div>
                ) : (
                  <select
                    value={applyLeaveForm.leave_type_id}
                    onChange={(e) =>
                      handleFormChange("leave_type_id", e.target.value)
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map((leaveType) => (
                      <option
                        key={leaveType.leave_type_id}
                        value={leaveType.leave_type_id}
                      >
                        {leaveType.type_name} - {leaveType.annual_entitlement}{" "}
                        days/year
                        {leaveType.carry_forward_allowed &&
                          ` (Carry forward: ${leaveType.max_carry_forward} days)`}
                      </option>
                    ))}
                  </select>
                )}
                {leaveTypes.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Select the type of leave you want to apply for
                  </p>
                )}

                {/* Show selected leave type description */}
                {applyLeaveForm.leave_type_id && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    {(() => {
                      const selectedType = leaveTypes.find(
                        (lt) =>
                          lt.leave_type_id.toString() ===
                          applyLeaveForm.leave_type_id
                      );
                      if (selectedType) {
                        return (
                          <div className="text-sm">
                            <p className="font-medium text-blue-900">
                              {selectedType.type_name}
                            </p>
                            <p className="text-blue-700">
                              {selectedType.description}
                            </p>
                            <div className="mt-2 text-xs text-blue-600 space-y-1">
                              <p>
                                • Annual Entitlement:{" "}
                                {selectedType.annual_entitlement} days
                              </p>
                              {selectedType.carry_forward_allowed && (
                                <p>
                                  • Carry Forward: Up to{" "}
                                  {selectedType.max_carry_forward} days
                                </p>
                              )}
                              {!selectedType.carry_forward_allowed && (
                                <p>• No carry forward allowed</p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={applyLeaveForm.start_date}
                    onChange={(e) =>
                      handleFormChange("start_date", e.target.value)
                    }
                    className="w-full"
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={applyLeaveForm.end_date}
                    onChange={(e) =>
                      handleFormChange("end_date", e.target.value)
                    }
                    className="w-full"
                    min={applyLeaveForm.start_date || new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              {/* Total Days */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Total Days
                </label>
                <Input
                  type="number"
                  value={applyLeaveForm.total_days}
                  onChange={(e) =>
                    handleFormChange("total_days", e.target.value)
                  }
                  className="w-full"
                  min="1"
                  readOnly
                />
                <p className="text-xs text-gray-500">
                  Automatically calculated based on start and end dates
                </p>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Reason for Leave *
                </label>
                <textarea
                  value={applyLeaveForm.reason}
                  onChange={(e) => handleFormChange("reason", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                  placeholder="Please provide a detailed reason for your leave request..."
                  required
                />
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">
                  Emergency Contact (Optional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Contact Name
                    </label>
                    <Input
                      type="text"
                      value={applyLeaveForm.emergency_contact_name}
                      onChange={(e) =>
                        handleFormChange(
                          "emergency_contact_name",
                          e.target.value
                        )
                      }
                      className="w-full"
                      placeholder="e.g., Husband, Wife, Parent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Contact Phone
                    </label>
                    <Input
                      type="tel"
                      value={applyLeaveForm.emergency_contact_phone}
                      minLength={10}
                      maxLength={10}
                      onChange={(e) =>
                        handleFormChange(
                          "emergency_contact_phone",
                          e.target.value
                        )
                      }
                      className="w-full"
                      placeholder="+91-XXXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowApplyLeaveForm(false)}
                  disabled={isSubmittingLeave}
                  className="border-2 border-gray-300 hover:border-gray-400 rounded-xl transition-all duration-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitLeave}
                  disabled={isSubmittingLeave}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                >
                  {isSubmittingLeave
                    ? "Submitting..."
                    : "Submit Leave Application"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LeaveManagement;
