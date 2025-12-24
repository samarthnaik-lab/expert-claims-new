import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  User,
  FileText,
  IndianRupee ,
  TrendingUp,
  Shield,
  LogOut,
  RefreshCw,
  Eye,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateDDMMYYYY } from "@/lib/utils";
import { ReferralService, ReferralCase } from "@/services/referralService";
import {
  PartnerStatusService,
  PartnerStatusResponse,
  BonusCalculation,
} from "@/services/partnerStatusService";
import SortableTableHeader from "@/components/ui/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import { useAuth } from "@/contexts/AuthContext";
import { SessionExpiry } from "@/components/SessionExpiry";
import { buildApiUrl } from "@/config/api";

const PartnerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout, session: authSession, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  // Map old status values to new ones for backward compatibility
  const getStatusFilter = () => {
    if (statusFilter === "pending") return "Analysis";
    if (statusFilter === "in-progress") return "In Progress";
    if (statusFilter === "completed") return "Completed";
    if (statusFilter === "cancelled") return "Closed";
    return statusFilter;
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [partnerName, setPartnerName] = useState("Partner");
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    pendingCases: 0,
    completedCases: 0,
    totalEarned: 0,
    pendingBonus: 0,
  });

  // Real data from API
  const [referrals, setReferrals] = useState<ReferralCase[]>([]);
  const [allReferrals, setAllReferrals] = useState<ReferralCase[]>([]); // All referrals for cards (no pagination)
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);
  const [loadingAllReferrals, setLoadingAllReferrals] = useState(false);

  // Bonus data from partner status API
  const [bonusData, setBonusData] = useState<BonusCalculation[]>([]);
  const [allBonusData, setAllBonusData] = useState<BonusCalculation[]>([]); // All bonus data for cards (no pagination)
  const [isLoadingBonus, setIsLoadingBonus] = useState(false);
  const [loadingAllBonus, setLoadingAllBonus] = useState(false);
  const [bonusStats, setBonusStats] = useState({
    totalBonusAmount: 0,
    totalCalculations: 0,
  });
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [bonusStatus, setBonusStatus] = useState<string>("");


  // Backlog data from API
  const [backlogData, setBacklogData] = useState<any[]>([]);
  const [allBacklogData, setAllBacklogData] = useState<any[]>([]); // All backlog data for cards (no pagination)
  const [isLoadingBacklog, setIsLoadingBacklog] = useState(false);
  const [loadingAllBacklog, setLoadingAllBacklog] = useState(false);
  const [backlogSearchTerm, setBacklogSearchTerm] = useState("");
  const [backlogStatusFilter, setBacklogStatusFilter] = useState("all");
  const [backlogStartDate, setBacklogStartDate] = useState("");
  const [backlogEndDate, setBacklogEndDate] = useState("");
  const [fromDateCalendarOpen, setFromDateCalendarOpen] = useState(false);
  const [toDateCalendarOpen, setToDateCalendarOpen] = useState(false);
  const [currentPageBacklog, setCurrentPageBacklog] = useState(1);
  const [pageSizeBacklog, setPageSizeBacklog] = useState(10);

  // Sorting for backlog data - use allBacklogData for searching across all records
  const { sortedData: sortedBacklogData, sortConfig: backlogSortConfig, handleSort: handleBacklogSort } = useTableSort(allBacklogData.length > 0 ? allBacklogData : backlogData);

  // Helper function to parse dd/mm/yyyy or YYYY-MM-DD to Date object
  const parseDDMMYYYY = (dateString: string): Date | null => {
    if (!dateString) return null;
    try {
      // Handle dd/mm/yyyy format
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime()) && date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
          return date;
        }
      }
      // Handle YYYY-MM-DD format (stored format)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) return date;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Reset page to 1 when search term or filters change
  useEffect(() => {
    setCurrentPageBacklog(1);
  }, [backlogSearchTerm, backlogStatusFilter, backlogStartDate, backlogEndDate]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalReferrals, setTotalReferrals] = useState(0);
  // Bonus pagination state
  const [currentPageBonus, setCurrentPageBonus] = useState(1);
  const [pageSizeBonus, setPageSizeBonus] = useState(10);

  // Refresh bonus data when switching to bonus tab
  const [activeTab, setActiveTab] = useState("overview");

  // Extract partner name from localStorage
  const getPartnerName = () => {
    try {
      // First try to get partner name from partner-status-check API response
      const partnerDetailsRaw = localStorage.getItem("partner_details");
      if (partnerDetailsRaw) {
        const partnerDetails = JSON.parse(partnerDetailsRaw);
        console.log("Partner details for name extraction:", partnerDetails);
        
        // Check if it's from partner-status-check API (has nested structure)
        if (partnerDetails.data && partnerDetails.data.partner_info && partnerDetails.data.partner_info.first_name) {
          const firstName = partnerDetails.data.partner_info.first_name;
          console.log("Extracted first name from partner-status-check API:", firstName);
          setPartnerName(firstName);
          return;
        }
        
        // Check if it's from partner details API (direct structure)
        if (Array.isArray(partnerDetails) && partnerDetails.length > 0) {
          const partnerData = partnerDetails[0];
          if (partnerData.first_name) {
            const firstName = partnerData.first_name;
            console.log("Extracted first name from partner details API:", firstName);
            setPartnerName(firstName);
            return;
          }
        }
      }
      
      // Fallback to user details if partner details not available
      const userDetailsRaw = localStorage.getItem("expertclaims_user_details");
      if (userDetailsRaw) {
        const userDetailsData = JSON.parse(userDetailsRaw);
        const userDetails = Array.isArray(userDetailsData)
          ? userDetailsData[0]
          : userDetailsData;
        const name = userDetails?.name || "Partner";
        setPartnerName(name);
      }
    } catch (error) {
      console.error("Error extracting partner name:", error);
      setPartnerName("Partner");
    }
  };

  const fetchPartnerDetails = async () => {
    try {
      // Get partner_id from localStorage
      let partnerId = "";
      const possibleKeys = [
        "expertclaims_user_details",
        "expertclaims_session", 
        "user_details",
        "session"
      ];
      
      for (const key of possibleKeys) {
        const dataStr = localStorage.getItem(key);
        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);
            const userData = Array.isArray(data) ? data[0] : data;
            
            if (userData && userData.partner_id) {
              partnerId = userData.partner_id;
              break;
            }
          } catch (error) {
            console.error(`Error parsing ${key}:`, error);
          }
        }
      }

      if (!partnerId) {
        console.log("No partner_id found in localStorage, using fallback");
        // Try to get partner ID from session data as fallback
        const sessionStr = localStorage.getItem("expertclaims_session");
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            partnerId = session.userId || session.partner_id || "3"; // Use session userId as fallback
            console.log("Using fallback partner ID:", partnerId);
          } catch (error) {
            console.error("Error parsing session:", error);
            partnerId = "3"; // Final fallback
          }
        } else {
          partnerId = "3"; // Final fallback
        }
      }

      console.log("Fetching partner details for partner_id:", partnerId);

      // Get JWT token from session
      const sessionStr = localStorage.getItem("expertclaims_session");
      let authToken = "";
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          authToken = session.jwtToken || "";
        } catch (error) {
          console.error("Error parsing session:", error);
        }
      }

      const response = await fetch(
        `${buildApiUrl('api/568419fb-3d1d-4178-9d39-002d4100a3c0')}?partner_id=${partnerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const partnerDetails = await response.json();
        console.log("Partner details fetched:", partnerDetails);
        
        // Store partner details in localStorage for later use
        localStorage.setItem("partner_details", JSON.stringify(partnerDetails));
        
        // Extract first name from partner details API response
        if (partnerDetails && partnerDetails.length > 0) {
          const partnerData = partnerDetails[0];
          if (partnerData.first_name) {
            console.log("Setting partner first name from partner details API:", partnerData.first_name);
            setPartnerName(partnerData.first_name);
          }
        }
        
        toast({
          title: "Success",
          description: "Partner details loaded successfully",
        });
      } else {
        console.error("Failed to fetch partner details:", response.status);
        toast({
          title: "Warning",
          description: "Failed to load partner details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching partner details:", error);
      toast({
        title: "Error",
        description: "Error loading partner details",
        variant: "destructive",
      });
    }
  };

  // Initial load - wait for auth to be ready
  useEffect(() => {
    if (!authLoading) {
    getPartnerName();
      fetchPartnerDetails();
    }
  }, [authLoading]);

  // Fetch data after partner details and session are ready
  useEffect(() => {
    if (!authLoading && authSession) {
      // Small delay to ensure localStorage is populated after login
      const timer = setTimeout(() => {
        fetchReferrals(pageSize, currentPage);
        fetchBonusData(pageSizeBonus, currentPageBonus);
        fetchBacklogData();
        // Fetch all data for cards
        fetchAllReferrals();
        fetchAllBonusData();
        fetchAllBacklogData();
      }, 100);
    
      return () => clearTimeout(timer);
    }
  }, [authLoading, authSession, pageSize, currentPage]);

  // Fetch all data when tab changes
  useEffect(() => {
    if (!authLoading && authSession) {
      if (activeTab === "referrals") {
        fetchAllReferrals();
      } else if (activeTab === "backlog") {
        fetchAllBacklogData();
      } else if (activeTab === "bonuses") {
        fetchAllBonusData();
      } else if (activeTab === "overview") {
        fetchAllReferrals();
        fetchAllBonusData();
      }
    }
  }, [activeTab, authLoading, authSession]);

  // Fetch referrals when page or page size changes (only if session is ready)
  useEffect(() => {
    if (!authLoading && authSession) {
    fetchReferrals(pageSize, currentPage);
    }
  }, [pageSize, currentPage, authLoading, authSession]);

  // useEffect(() => {
  //   fetchBonusData(pageSizeBonus, currentPageBonus);
  // }, [pageSizeBonus, currentPageBonus]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "bonuses") {
      fetchBonusData(pageSizeBonus, currentPageBonus);
      fetchAllBonusData();
    } else if (value === "referrals") {
      fetchAllReferrals();
    } else if (value === "backlog") {
      fetchAllBacklogData();
    }
  };

  // Fetch all referrals for cards (no pagination)
  const fetchAllReferrals = async () => {
    setLoadingAllReferrals(true);
    try {
      const sessionStr = localStorage.getItem("expertclaims_session");
      let partnerId = "1";
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          partnerId = session.userId || "1";
        } catch (error) {
          console.error("Error parsing session:", error);
        }
      }
      // Get JWT token from session
      let authToken = "";
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          authToken = session.jwtToken || "";
        } catch (error) {
          console.error("Error parsing session:", error);
        }
      }

      const baseUrl = buildApiUrl("api/MyReferral");
      const url = `${baseUrl}?partner_id=${partnerId}&page=1&size=10000`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAllReferrals(data);
        // Update totalReferrals with the actual count of all referrals (for pagination)
        setTotalReferrals(data.length);
      }
    } catch (error) {
      console.error("Error fetching all referrals:", error);
    } finally {
      setLoadingAllReferrals(false);
    }
  };

  // Fetch all bonus data for cards (no pagination)
  const fetchAllBonusData = async () => {
    setLoadingAllBonus(true);
    try {
      const sessionStr = localStorage.getItem("expertclaims_session");
      if (!sessionStr) return;
      const session = JSON.parse(sessionStr);
      const partnerId = session.userId;
      if (!partnerId) return;
      // Get JWT token from session
      let authToken = "";
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          authToken = session.jwtToken || "";
        } catch (error) {
          console.error("Error parsing session:", error);
        }
      }

      const baseUrl = buildApiUrl("api/partner-status-check");
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          partner_id: partnerId,
        }),
      });
      if (response.ok) {
        const bonusResponse = await response.json();
        if (bonusResponse && bonusResponse.length > 0 && bonusResponse[0].data && bonusResponse[0].data.calculations) {
          setAllBonusData(bonusResponse[0].data.calculations);
        }
      }
    } catch (error) {
      console.error("Error fetching all bonus data:", error);
    } finally {
      setLoadingAllBonus(false);
    }
  };

  // Fetch all backlog data for cards (no pagination)
  const fetchAllBacklogData = async () => {
    setLoadingAllBacklog(true);
    try {
      let partnerId = "";
      const sessionStr = localStorage.getItem("expertclaims_session");
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (session.userId) {
            partnerId = session.userId.toString();
          }
        } catch (error) {
          console.error("Error parsing session:", error);
        }
      }
      if (!partnerId) {
        const possibleKeys = ["expertclaims_user_details", "user_details"];
        for (const key of possibleKeys) {
          const dataStr = localStorage.getItem(key);
          if (dataStr) {
            try {
              const data = JSON.parse(dataStr);
              const userData = Array.isArray(data) ? data[0] : data;
              if (userData && userData.partner_id) {
                partnerId = userData.partner_id.toString();
                break;
              }
            } catch (error) {
              console.error(`Error parsing ${key}:`, error);
            }
          }
        }
      }
      if (!partnerId) return;
      
      // Get JWT token from session
      let authToken = "";
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          authToken = session.jwtToken || "";
        } catch (error) {
          console.error("Error parsing session:", error);
        }
      }

      const response = await fetch(
        `${buildApiUrl('api/referal_partner_id_data')}?backlog_referring_partner_id=${partnerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        // Use backlog_id from API response (e.g., "ECSI-GA-25-065")
        const mappedData = Array.isArray(data) ? data.map(item => ({
          ...item,
          backlog_id: item.backlog_id || item.backlog_int_id // Prioritize backlog_id over backlog_int_id
        })) : data;
        setAllBacklogData(mappedData);
      }
    } catch (error) {
      console.error("Error fetching all backlog data:", error);
    } finally {
      setLoadingAllBacklog(false);
    }
  };

  const fetchReferrals = async (limit: number = 10, page: number = 1) => {
    setIsLoadingReferrals(true);
    try {
      // Get partnerId from localStorage
      const sessionStr = localStorage.getItem("expertclaims_session");
      let partnerId = "1"; // Default fallback

      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          partnerId = session.userId || "1";
          console.log("Partner ID from localStorage:", partnerId);
        } catch (error) {
          console.error("Error parsing session from localStorage:", error);
        }
      }

      // Get JWT token from session
      let authToken = "";
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          authToken = session.jwtToken || "";
        } catch (error) {
          console.error("Error parsing session:", error);
        }
      }

      const baseUrl = buildApiUrl("api/MyReferral");
      const url = `${baseUrl}?partner_id=${partnerId}&page=${page}&size=${limit}`;

      console.log("Fetching referrals with URL:", url);
      console.log("Pagination parameters - page:", page, "size:", limit);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const referralsData = await response.json();
      console.log("Fetched referrals from MyReferral API:", referralsData);
      console.log("Number of referrals received:", referralsData.length);

      // Debug: Log the structure of first referral if available
      if (referralsData.length > 0) {
        console.log("First referral structure:", {
          case_id: referralsData[0].case_id,
          partners: referralsData[0].partners,
          case_types: referralsData[0].case_types,
          ticket_stage: referralsData[0].ticket_stage,
          case_value: referralsData[0].case_value,
          bonus_eligible: referralsData[0].bonus_eligible,
        });
      }

      setReferrals(referralsData);

      // Just set the referrals data, stats will be recalculated in useEffect

      // Update bonus stats if available
      if (bonusStats.totalBonusAmount > 0) {
        setReferralStats((prev) => ({
          ...prev,
          pendingBonus: bonusStats.totalBonusAmount,
        }));
      }
      
      // Calculate totalEarned from referrals data
      const totalEarned = referralsData.reduce(
        (sum, ref) => sum + (ref.case_value || 0),
        0
      );
      const pendingBonus = referralsData
        .filter(
          (ref) => ref.bonus_eligible && ref.ticket_stage === "Analysis"
        )
        .reduce((sum, ref) => sum + (ref.case_value || 0) * 0.1, 0);
      
      // Update totalEarned and pendingBonus
      setReferralStats((prev) => ({
        ...prev,
        totalEarned: totalEarned,
        pendingBonus: bonusStats.totalBonusAmount > 0 ? bonusStats.totalBonusAmount : pendingBonus,
      }));
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast({
        title: "Error",
        description: "Failed to fetch referrals data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReferrals(false);
      setLoading(false);
    }
  };

  const fetchBonusData = async (limit: number = 10, page: number = 1) => {
    setIsLoadingBonus(true);
    try {
      // Get partner ID from localStorage
      const sessionStr = localStorage.getItem("expertclaims_session");
      if (!sessionStr) {
        console.warn("No session found in localStorage");
        toast({
          title: "Warning",
          description: "Session not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const session = JSON.parse(sessionStr);
      const partnerId = session.userId;

      if (!partnerId) {
        console.warn("No partner ID found in session");
        toast({
          title: "Warning",
          description: "Partner ID not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      console.log("Fetching bonus data for partner ID:", partnerId);

      // Get JWT token from session
      let authToken = "";
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          authToken = session.jwtToken || "";
        } catch (error) {
          console.error("Error parsing session:", error);
        }
      }

      const baseUrl = buildApiUrl("api/partner-status-check");

      console.log("Bonus API URL:", baseUrl);
      console.log("Bonus API Body:", {
        partner_id: partnerId,
      });

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          partner_id: partnerId,
          page: page,
          size: limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const bonusResponse = await response.json();
      console.log(
        "Bonus API response from partner-status-check:",
        bonusResponse
      );

      if (bonusResponse && bonusResponse.length > 0) {
        const firstResponse = bonusResponse[0];
        console.log("Processing bonus response:", firstResponse);
        localStorage.setItem("partner_details", JSON.stringify(bonusResponse[0]));

        // Extract partner first name from API response
        if (firstResponse.data && firstResponse.data.partner_info && firstResponse.data.partner_info.first_name) {
          const firstName = firstResponse.data.partner_info.first_name;
          console.log("Setting partner first name from API:", firstName);
          setPartnerName(firstName);
        }

        if (firstResponse.data && firstResponse.data.calculations) {
          setBonusData(firstResponse.data.calculations);
          setBonusStats({
            totalBonusAmount: firstResponse.data.total_bonus_amount || 0,
            totalCalculations: firstResponse.data.total_calculations || 0,
          });

          // Set bonus status from the response
          const status = firstResponse.status || "unknown";
          setBonusStatus(status);
          console.log("Setting bonus status to:", status);

          // Set last updated timestamp
          setLastUpdated(new Date().toLocaleString());

          console.log("Bonus data set:", firstResponse.data.calculations);
          console.log("Bonus stats set:", {
            totalBonusAmount: firstResponse.data.total_bonus_amount || 0,
            totalCalculations: firstResponse.data.total_calculations || 0,
          });
          console.log("Bonus status set:", firstResponse.status);
        } else {
          console.log("No completed bonus calculations found");
          setBonusData([]);
          setBonusStats({
            totalBonusAmount: 0,
            totalCalculations: 0,
          });
        }
      } else {
        console.log("No bonus response data");
        setBonusData([]);
        setBonusStats({
          totalBonusAmount: 0,
          totalCalculations: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching bonus data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch bonus data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBonus(false);
    }
  };

  const fetchBacklogData = async () => {
    setIsLoadingBacklog(true);
    try {
      // Get partner ID from localStorage
      let partnerId = "";
      
      // First, try to get from session (most reliable after login)
      const sessionStr = localStorage.getItem("expertclaims_session");
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          // Try userId from session first (commonly used for partner_id)
          if (session.userId) {
            partnerId = session.userId.toString();
            console.log("Got partnerId from session.userId:", partnerId);
          }
        } catch (error) {
          console.error("Error parsing session:", error);
        }
      }
      
      // If not found in session, try user details
      if (!partnerId) {
      const possibleKeys = [
        "expertclaims_user_details",
          "user_details"
      ];
      
      for (const key of possibleKeys) {
        const dataStr = localStorage.getItem(key);
        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);
            const userData = Array.isArray(data) ? data[0] : data;
            
            if (userData && userData.partner_id) {
                partnerId = userData.partner_id.toString();
                console.log(`Got partnerId from ${key}:`, partnerId);
                break;
              }
              // Also check userId in user details
              if (userData && userData.userId) {
                partnerId = userData.userId.toString();
                console.log(`Got partnerId from ${key}.userId:`, partnerId);
              break;
            }
          } catch (error) {
            console.error(`Error parsing ${key}:`, error);
            }
          }
        }
      }

      // If still not found, try partner_details
      if (!partnerId) {
        const partnerDetails = localStorage.getItem('partner_details');
        if (partnerDetails) {
          try {
          const partnerDetailsData = JSON.parse(partnerDetails);
            // Check different possible structures
            if (partnerDetailsData.partner_id) {
              partnerId = partnerDetailsData.partner_id.toString();
              console.log("Got partnerId from partner_details.partner_id:", partnerId);
            } else if (partnerDetailsData.data && partnerDetailsData.data.partner_info && partnerDetailsData.data.partner_info.partner_id) {
              partnerId = partnerDetailsData.data.partner_info.partner_id.toString();
              console.log("Got partnerId from partner_details.data.partner_info.partner_id:", partnerId);
            } else if (Array.isArray(partnerDetailsData) && partnerDetailsData.length > 0 && partnerDetailsData[0].partner_id) {
              partnerId = partnerDetailsData[0].partner_id.toString();
              console.log("Got partnerId from partner_details array:", partnerId);
            }
          } catch (error) {
            console.error("Error parsing partner_details:", error);
          }
        } 
      }

      if (!partnerId) {
        console.error("No partnerId found, cannot fetch backlog data");
        toast({
          title: "Warning",
          description: "Partner ID not found. Please refresh the page.",
          variant: "destructive",
        });
        setIsLoadingBacklog(false);
        return;
      }

      console.log("Fetching backlog data for partner_id:", partnerId);

      // Get JWT token from session
      const sessionStrForBacklog = localStorage.getItem("expertclaims_session");
      let authTokenForBacklog = "";
      if (sessionStrForBacklog) {
        try {
          const session = JSON.parse(sessionStrForBacklog);
          authTokenForBacklog = session.jwtToken || "";
        } catch (error) {
          console.error("Error parsing session:", error);
        }
      }

      const response = await fetch(
        `${buildApiUrl('api/referal_partner_id_data')}?backlog_referring_partner_id=${partnerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authTokenForBacklog}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Use backlog_id from API response (e.g., "ECSI-GA-25-065")
        const mappedData = Array.isArray(data) ? data.map(item => ({
          ...item,
          backlog_id: item.backlog_id || item.backlog_int_id // Prioritize backlog_id over backlog_int_id
        })) : data;
        setBacklogData(mappedData);
        console.log("Backlog data fetched:", mappedData);
        
        // Update stats to include backlog data
        updateStatsWithBacklog(data);
      } else {
        console.error("Failed to fetch backlog data:", response.status);
        toast({
          title: "Error",
          description: "Failed to fetch backlog data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching backlog data:", error);
      toast({
        title: "Error",
        description: "Error loading backlog data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBacklog(false);
    }
  };

  // Function to update stats with backlog data
  const updateStatsWithBacklog = (backlogDataArray: any[]) => {
    // Count completed backlog cases
    const completedBacklogCases = backlogDataArray.filter(
      (item) => item.status?.toLowerCase() === "complete" || item.status?.toLowerCase() === "completed"
    ).length;
    
    // Update stats using current referrals state
    setReferrals((currentReferrals) => {
      const completedReferralCases = currentReferrals.filter(
        (ref) => ref.ticket_stage === "Completed"
      ).length;
      
      // Calculate pending cases: (referralsData.length - completedCases) + (backlogData.length - completedBacklogCases)
      const pendingReferralCases = currentReferrals.length - completedReferralCases;
      const pendingBacklogCases = backlogDataArray.length - completedBacklogCases;
      const totalPending = pendingReferralCases + pendingBacklogCases;
      
      // Calculate totals including backlog
      const totalCount = currentReferrals.length + backlogDataArray.length;
      // Total completed = My Claim Referrals completed + My Policy Referral completed
      const totalCompleted = completedReferralCases + completedBacklogCases;
      
      setReferralStats((prev) => ({
        totalReferrals: totalCount,
        pendingCases: totalPending, // (referralsData.length - completedCases) + (backlogData.length - completedBacklogCases)
        completedCases: totalCompleted, // My Claim Referrals completed + My Policy Referral completed
        totalEarned: prev.totalEarned, // Keep existing totalEarned
        pendingBonus: prev.pendingBonus, // Keep existing pendingBonus
      }));
      
      return currentReferrals;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBonusStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate constant stats for cards (using all data, not paginated) - same cards always shown
  const tabStats = useMemo(() => {
    const isLoading = loadingAllReferrals || loadingAllBacklog || loadingAllBonus;
    
    // Always show the same cards regardless of active tab
    const completedReferrals = allReferrals.filter(
      (ref) => ref.ticket_stage === "Completed"
    ).length;
    const pendingReferrals = allReferrals.length - completedReferrals;
    
    return {
      loading: isLoading,
      cards: [
        {
          label: "Total Assignments referred",
          value: allReferrals.length,
          color: "blue",
          icon: User,
        },
        {
          label: "Pending Assignments",
          value: pendingReferrals,
          color: "orange",
          icon: FileText,
        },
        {
          label: "Completed Assignment",
          value: completedReferrals,
          color: "green",
          icon: TrendingUp,
        },
        {
          label: "My Policy Referral",
          value: allBacklogData.length,
          color: "yellow",
          icon: FileText,
        },
        {
          label: "Referral Fee Earned",
          value: `₹${bonusStats.totalBonusAmount.toLocaleString()}`,
          color: "purple",
          icon: IndianRupee,
        },
      ],
    };
  }, [allReferrals, allBacklogData, bonusStats, loadingAllReferrals, loadingAllBacklog, loadingAllBonus]);

  // Client-side filtering for search (since API doesn't support search)
  const filteredReferrals = referrals.filter((referral) => {
    // Safe access to nested properties with fallbacks
    const partnerFirstName = referral.partners?.first_name?.trim() || referral.first_name?.trim() || "";
    const partnerLastName = referral.partners?.last_name?.trim() || referral.last_name?.trim() || "";
    const customerName = `${partnerFirstName} ${partnerLastName}`.trim() || "Customer";
    const caseTypeName = referral.case_types?.case_type_name?.trim() || referral.case_type_name?.trim() || "Unknown Type";
    const ticketStage = referral.ticket_stage?.trim() || referral.status?.trim() || "Unknown Status";
    const caseId = referral.case_id?.toString().trim() || "";

    // Only filter out if case_id is missing (required field)
    if (!caseId) {
      return false;
    }

    // Apply search filter if search term exists
    if (!searchTerm) return true; // Show all if no search term

    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      customerName.toLowerCase().includes(searchLower) ||
      caseId.toString().includes(searchLower) ||
      caseTypeName.toLowerCase().includes(searchLower) ||
      ticketStage.toLowerCase().includes(searchLower);

    return matchesSearch;
  });

  // Pagination logic - server-side pagination with client-side search filtering
  const displayReferrals = filteredReferrals; // Use filtered referrals for search
  // Use allReferrals.length for total count (since it contains all referrals)
  // When searching, use filteredReferrals.length, otherwise use allReferrals.length or totalReferrals
  const actualTotal = searchTerm 
    ? filteredReferrals.length 
    : (allReferrals.length > 0 ? allReferrals.length : (totalReferrals > 0 ? totalReferrals : referrals.length));
  const totalPages = Math.ceil(actualTotal / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, actualTotal);

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    const size = Number(newPageSize);
    console.log("Changing page size to:", size);
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Debug page changes
  useEffect(() => {
    console.log("Page changed to:", currentPage, "Page size:", pageSize);
  }, [currentPage, pageSize]);

  const filteredBonusData = bonusData.filter((bonus) => {
    const searchLower = searchTerm.toLowerCase();

    // Safe access to nested properties with fallbacks
    const customerFirstName = bonus.customer_first_name || "Unknown";
    const customerLastName = bonus.customer_last_name || "Customer";
    const customerName = `${customerFirstName} ${customerLastName}`;

    const matchesSearch =
      customerName.toLowerCase().includes(searchLower) ||
      bonus.case_id.toString().includes(searchLower) ||
      bonus.stage_bonus_amount.toString().includes(searchLower);

    return matchesSearch;
  });

  // Bonus pagination logic
  const displayBonusData = filteredBonusData;
  const totalPagesBonus = Math.ceil(displayBonusData.length / pageSizeBonus);
  const startIndexBonus = (currentPageBonus - 1) * pageSizeBonus;
  const endIndexBonus = startIndexBonus + pageSizeBonus;

  // Handle bonus page size change
  const handlePageSizeBonusChange = (newPageSize: string) => {
    const size = Number(newPageSize);
    setPageSizeBonus(size);
    setCurrentPageBonus(1); // Reset to first page when changing page size
  };

  // Reset to first page when filters change for bonus
  useEffect(() => {
    setCurrentPageBonus(1);
  }, [searchTerm]);

  // Reset to first page when backlog filters change
  useEffect(() => {
    setCurrentPageBacklog(1);
  }, [backlogSearchTerm, backlogStatusFilter, backlogStartDate, backlogEndDate]);

  // Recalculate stats whenever referrals or backlogData changes
  useEffect(() => {
    // Calculate stats from referrals data
    const completedReferralCases = referrals.filter(
      (ref) => ref.ticket_stage === "Completed"
    ).length;
    
    // Calculate stats from backlog data
    const completedBacklogCases = backlogData.filter(
      (item) => item.status?.toLowerCase() === "complete" || item.status?.toLowerCase() === "completed"
    ).length;
    
    // Calculate pending cases: (referralsData.length - completedCases) + (backlogData.length - completedBacklogCases)
    const pendingReferralCases = referrals.length - completedReferralCases;
    const pendingBacklogCases = backlogData.length - completedBacklogCases;
    const totalPending = pendingReferralCases + pendingBacklogCases;
    
    // Total count from both referrals and backlog
    const totalCount = referrals.length + backlogData.length;
    // Total completed = My Claim Referrals completed + My Policy Referral completed
    const totalCompleted = completedReferralCases + completedBacklogCases;
    
    setReferralStats((prev) => ({
      totalReferrals: totalCount, // Combined count from both tabs
      pendingCases: totalPending, // (referralsData.length - completedCases) + (backlogData.length - completedBacklogCases)
      completedCases: totalCompleted, // My Claim Referrals completed + My Policy Referral completed
      totalEarned: prev.totalEarned, // Keep existing totalEarned (calculated from referrals only)
      pendingBonus: prev.pendingBonus, // Keep existing pendingBonus (calculated from referrals only)
    }));
  }, [referrals, backlogData]);

  const fetchDashboardData = () => {
    fetchReferrals(pageSize, currentPage);
    fetchBonusData(pageSizeBonus, currentPageBonus);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Modern Header */}
      <header className="bg-primary-500 backdrop-blur-md shadow-sm border-b border-primary-600 sticky top-0 z-50">
        <div className="max-w-[80%] mx-auto px-2 sm:px-3 lg:px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Partner Dashboard
                </h1>
                <p className="text-xs text-white/80 font-medium">
                  Welcome back, {partnerName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <SessionExpiry />
              {/* Refresh Button */}
              <Button
                variant="outline"
                onClick={fetchDashboardData}
                disabled={loading}
                className="flex items-center space-x-2 border-2 border-gray-300 hover:border-primary-500 rounded-xl transition-all duration-300"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </Button>
              {/* Profile Picture */}
              {/* <Button
                variant="ghost"
                onClick={() => navigate('/partner-personal-info')}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-full transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  PA
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">Partner Agent</p>
                  <p className="text-xs text-white/80">Referral Partner</p>
                </div>
              </Button> */}
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  navigate("/login");
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

      <div className="max-w-[80%] mx-auto px-2 sm:px-3 lg:px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in ">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Welcome back,{partnerName}
          </h2>

          {/* Insurance Gap Analysis Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Welcome to Insurance Gap Analysis Module
              </h3>
              <p className="text-xs text-blue-700 leading-relaxed mb-3">
                Please mask the policyholder's name, address and contact details and upload the policy
              </p>
              <Button
                onClick={() => navigate("/partner-new-task")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Register Assignment
              </Button>
            </div>
          </div>

          {/* Quick Stats - Constant Cards */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
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
              
              const getBgGradient = (color: string) => {
                switch (color) {
                  case 'blue': return 'from-white to-blue-50/50';
                  case 'green': return 'from-white to-green-50/50';
                  case 'orange': return 'from-white to-yellow-50/50';
                  case 'purple': return 'from-white to-purple-50/50';
                  case 'yellow': return 'from-white to-yellow-50/50';
                  case 'red': return 'from-white to-red-50/50';
                  case 'gray': return 'from-white to-gray-50/50';
                  default: return 'from-white to-blue-50/50';
                }
              };
              
              const getIconBg = (color: string) => {
                switch (color) {
                  case 'blue': return 'from-blue-400 to-blue-600';
                  case 'green': return 'from-green-400 to-green-600';
                  case 'orange': return 'from-yellow-400 to-yellow-600';
                  case 'purple': return 'from-purple-400 to-purple-600';
                  case 'yellow': return 'from-yellow-400 to-yellow-600';
                  case 'red': return 'from-red-400 to-red-600';
                  case 'gray': return 'from-gray-400 to-gray-600';
                  default: return 'from-blue-400 to-blue-600';
                }
              };
              
              const getIconBgOpacity = (color: string) => {
                switch (color) {
                  case 'blue': return 'from-blue-400/10 to-blue-600/10';
                  case 'green': return 'from-green-400/10 to-green-600/10';
                  case 'orange': return 'from-yellow-400/10 to-yellow-600/10';
                  case 'purple': return 'from-purple-400/10 to-purple-600/10';
                  case 'yellow': return 'from-yellow-400/10 to-yellow-600/10';
                  case 'red': return 'from-red-400/10 to-red-600/10';
                  case 'gray': return 'from-gray-400/10 to-gray-600/10';
                  default: return 'from-blue-400/10 to-blue-600/10';
                }
              };
              
              const IconComponent = card.icon;
              
              return (
                <Card key={index} className={`w-full md:w-1/5 border-none shadow-xl card-hover bg-gradient-to-br ${getBgGradient(card.color)} backdrop-blur-sm cursor-pointer`}>
                  <CardContent className="p-6 text-center relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${getIconBgOpacity(card.color)} rounded-full -translate-y-8 translate-x-8`}></div>
                    <div className="relative z-10">
                      <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${getIconBg(card.color)} rounded-xl mb-3 shadow-lg`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className={`text-3xl font-bold ${getColorClass(card.color)} mb-2`}>
                        {tabStats.loading ? "..." : card.value}
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        {card.label}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6 animate-slide-up"
        >
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-1">
            <TabsTrigger value="overview" className="rounded-lg font-semibold">
              Overview
            </TabsTrigger>
            <TabsTrigger value="backlog" className="rounded-lg font-semibold">
              My Policy Referral 
            </TabsTrigger>
            <TabsTrigger value="referrals" className="rounded-lg font-semibold">
              My Claim Referrals
            </TabsTrigger>
            <TabsTrigger value="bonuses" className="rounded-lg font-semibold">
              Bonus Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="border-none shadow-xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle 
                  className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-300"
                  onClick={() => navigate('/partner-dashboard?tab=referrals')}
                >
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-gray-600">Get started with your Policy </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {/* <Button 
                    onClick={() => {
                      // Switch to referrals tab
                      setActiveTab('referrals');
                    }} 
                    className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                  >
                    View Referrals
                  </Button> */}
                  <Button 
                    onClick={() => navigate('/partner-new-task')}
                    className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                  >
                    Create Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-4">
            <Card className="border-none shadow-xl bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      My Referral Cases
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Track all the cases you've referred to ExpertClaims
                    </CardDescription>
                  </div>
                  {/* Page Size Selector */}
                  {!isLoadingReferrals && displayReferrals.length > 0 && (
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
                <div className="flex items-center space-x-2 mt-4">
                  <div className="relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <Input
                      placeholder="Search by name, mobile, ID, or status..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 max-w-sm border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        fetchBonusData(pageSizeBonus, currentPageBonus)
                      }
                      disabled={isLoadingBonus}
                      className="border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-lg transition-all duration-300"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${
                          isLoadingBonus ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingReferrals ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">
                      Loading referrals...
                    </span>
                  </div>
                ) : referrals.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No referrals found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-center p-4 font-semibold text-gray-700">
                            Case ID
                          </th>
                          <th className="text-center p-4 font-semibold text-gray-700">
                            Customer
                          </th>
                          <th className="text-center p-4 font-semibold text-gray-700">
                            Case Type
                          </th>
                          <th className="text-center p-4 font-semibold text-gray-700">
                            Status
                          </th>
                          <th className="text-center p-4 font-semibold text-gray-700">
                         Task Referral Date
                          </th>
                          <th className="text-center p-4 font-semibold text-gray-700">
                            Case Value
                          </th>
                          <th className="text-center p-4 font-semibold text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayReferrals.map((referral) => {
                          // Get partnerId from session for navigation
                          const getPartnerIdForNav = () => {
                            const sessionStr = localStorage.getItem("expertclaims_session");
                            if (sessionStr) {
                              try {
                                const session = JSON.parse(sessionStr);
                                return session.userId || "";
                              } catch (error) {
                                console.error("Error parsing session:", error);
                              }
                            }
                            return "";
                          };
                          const navPartnerId = getPartnerIdForNav();
                          
                          return (
                          <tr
                            key={referral.case_id}
                            className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-200"
                          >
                            <td className="p-4">
                              <button
                                onClick={() =>
                                  navigate(
                                      `/partner-claim/${referral.case_id}${navPartnerId ? `/${navPartnerId}` : ''}`
                                  )
                                }
                                className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors duration-200"
                              >
                                {referral.case_id}
                              </button>
                            </td>
                            <td className="p-4">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {referral.partners?.first_name || referral.first_name || "Unknown"}{" "}
                                  {referral.partners?.last_name || referral.last_name || "Customer"}
                                </div>
                                {/* <div className="text-sm text-gray-500 flex items-center space-x-2">
                                <Mail className="h-3 w-3" />
                                <span>Partner ID: {referral.partners?.partner_id || 'N/A'}</span>
                              </div> */}
                              </div>
                            </td>
                            <td className="p-4 text-gray-700">
                              {referral.case_types?.case_type_name || referral.case_type_name ||
                                "Unknown Type"}
                            </td>
                            <td className="p-4">
                              <Badge
                                className={`${getStatusColor(
                                  referral.ticket_stage || referral.status || "Unknown"
                                )} px-3 py-1 rounded-full font-medium`}
                              >
                                {referral.ticket_stage || referral.status || "Unknown Status"}
                              </Badge>
                            </td>
                            <td className="p-4 text-sm text-gray-600">
                              {referral.referral_date
                                ? formatDateDDMMYYYY(referral.referral_date)
                                : (referral.created_time
                                  ? formatDateDDMMYYYY(referral.created_time)
                                  : "Not Assigned")}
                            </td>
                            <td className="p-4 text-sm text-gray-600">
                              ₹{(referral.case_value || 0).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate(
                                      `/partner-claim/${referral.case_id}`
                                    )
                                  }
                                  className="border-2 border-gray-300 hover:border-primary-500 rounded-lg transition-all duration-300"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>

              {/* Pagination Controls */}
              {!isLoadingReferrals && displayReferrals.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Pagination Info */}
                    <div className="text-sm text-gray-600">
                      {searchTerm
                        ? `Showing ${displayReferrals.length} of ${actualTotal} entries (filtered)`
                        : displayReferrals.length > 0
                        ? `Showing ${
                            startIndex + 1
                          } to ${Math.min(endIndex, actualTotal)} of ${actualTotal} entries`
                        : `Showing 0 of ${actualTotal} entries`}
                    </div>

                    {/* Pagination Navigation - only show when not searching */}
                    {!searchTerm && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="flex items-center space-x-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Previous</span>
                        </Button>

                        {/* Page Numbers */}
                        <div className="flex items-center space-x-1">
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <Button
                                  key={pageNum}
                                  variant={
                                    currentPage === pageNum
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNum)}
                                  className="w-8 h-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              );
                            }
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="flex items-center space-x-1"
                        >
                          <span>Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="backlog" className="space-y-4">
            <Card className="border-none shadow-xl bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      View Assignments
                     </CardTitle>
                    <CardDescription className="text-gray-600">
                      Track here the Status of your Referrals
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
                        placeholder="Search across all records by case summary, description, ID, status, expert, or case type..."
                        value={backlogSearchTerm}
                        onChange={(e) => setBacklogSearchTerm(e.target.value)}
                        className="pl-10 max-w-sm border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-purple-500 transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="hidden">
                        <Select
                          value={backlogStatusFilter}
                          onValueChange={setBacklogStatusFilter}
                        >
                          <SelectTrigger className="w-48 border-2 border-purple-300 rounded-xl focus:border-purple-500">
                            <SelectValue placeholder="Filter by Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="in progress">In Progress</SelectItem>
                          
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
                      <Popover open={fromDateCalendarOpen} onOpenChange={setFromDateCalendarOpen}>
                        <PopoverTrigger asChild>
                          <div className="relative">
                            <Input
                              type="text"
                              readOnly
                              value={backlogStartDate ? (() => {
                                try {
                                  const dateStr = backlogStartDate;
                                  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                    const [year, month, day] = dateStr.split('-').map(Number);
                                    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                                  }
                                  const date = new Date(dateStr);
                                  if (!isNaN(date.getTime())) {
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const year = date.getFullYear();
                                    return `${day}/${month}/${year}`;
                                  }
                                  return '';
                                } catch {
                                  return '';
                                }
                              })() : ''}
                              placeholder="DD/MM/YYYY"
                              onClick={() => setFromDateCalendarOpen(true)}
                              className="border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 cursor-pointer pr-10 w-[140px]"
                            />
                            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={backlogStartDate ? (() => {
                              try {
                                const dateStr = backlogStartDate;
                                if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                  const [year, month, day] = dateStr.split('-').map(Number);
                                  return new Date(year, month - 1, day);
                                }
                                const date = new Date(dateStr);
                                return !isNaN(date.getTime()) ? date : undefined;
                              } catch {
                                return undefined;
                              }
                            })() : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const formattedDate = `${year}-${month}-${day}`;
                                setBacklogStartDate(formattedDate);
                                setFromDateCalendarOpen(false);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        To Date:
                      </label>
                      <Popover open={toDateCalendarOpen} onOpenChange={setToDateCalendarOpen}>
                        <PopoverTrigger asChild>
                          <div className="relative">
                            <Input
                              type="text"
                              readOnly
                              value={backlogEndDate ? (() => {
                                try {
                                  const dateStr = backlogEndDate;
                                  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                    const [year, month, day] = dateStr.split('-').map(Number);
                                    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                                  }
                                  const date = new Date(dateStr);
                                  if (!isNaN(date.getTime())) {
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const year = date.getFullYear();
                                    return `${day}/${month}/${year}`;
                                  }
                                  return '';
                                } catch {
                                  return '';
                                }
                              })() : ''}
                              placeholder="DD/MM/YYYY"
                              onClick={() => setToDateCalendarOpen(true)}
                              className="border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 cursor-pointer pr-10 w-[140px]"
                            />
                            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={backlogEndDate ? (() => {
                              try {
                                const dateStr = backlogEndDate;
                                if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                  const [year, month, day] = dateStr.split('-').map(Number);
                                  return new Date(year, month - 1, day);
                                }
                                const date = new Date(dateStr);
                                return !isNaN(date.getTime()) ? date : undefined;
                              } catch {
                                return undefined;
                              }
                            })() : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const formattedDate = `${year}-${month}-${day}`;
                                setBacklogEndDate(formattedDate);
                                setToDateCalendarOpen(false);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBacklogSearchTerm("");
                        setBacklogStatusFilter("all");
                        setBacklogStartDate("");
                        setBacklogEndDate("");
                      }}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      Clear All Filters
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
                    <table className="w-full" style={{ tableLayout: 'auto' }}>
                      <thead>
                        <tr className="border-b border-gray-200">
                          <SortableTableHeader
                            column="backlog_id"
                            label="Assignment ID"
                            sortColumn={backlogSortConfig?.column || ''}
                            sortDirection={backlogSortConfig?.direction || 'asc'}
                            onSort={handleBacklogSort}
                            className="px-2 sm:px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                          />
                          <SortableTableHeader
                            column="case_summary"
                            label="Assignment Summary"
                            sortColumn={backlogSortConfig?.column || ''}
                            sortDirection={backlogSortConfig?.direction || 'asc'}
                            onSort={handleBacklogSort}
                            sortable={false}
                            className="px-2 sm:px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
                          />
                          <SortableTableHeader
                            column="case_description"
                            label="Policy Description"
                            sortColumn={backlogSortConfig?.column || ''}
                            sortDirection={backlogSortConfig?.direction || 'asc'}
                            onSort={handleBacklogSort}
                            sortable={false}
                            className="px-2 sm:px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell min-w-[150px]"
                          />
                          <SortableTableHeader
                            column="backlog_referral_date"
                            label="Submitted Date"
                            sortColumn={backlogSortConfig?.column || ''}
                            sortDirection={backlogSortConfig?.direction || 'asc'}
                            onSort={handleBacklogSort}
                            sortable={false}
                            className="px-2 sm:px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                          />
                          <SortableTableHeader
                            column="status"
                            label="Status"
                            sortColumn={backlogSortConfig?.column || ''}
                            sortDirection={backlogSortConfig?.direction || 'asc'}
                            onSort={handleBacklogSort}
                            sortable={false}
                            className="px-2 sm:px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                          />
                          <th className="px-2 sm:px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell min-w-[120px]">
                            Assigned Expert
                          </th>
                          <th className="px-2 sm:px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[180px]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedBacklogData
                          .filter((item) => {
                            // Search filter - search across all fields
                            const searchMatch = !backlogSearchTerm || (() => {
                              const searchLower = backlogSearchTerm.toLowerCase();
                              return (
                                item.case_summary?.toLowerCase().includes(searchLower) ||
                                item.case_description?.toLowerCase().includes(searchLower) ||
                                item.backlog_id?.toString().includes(searchLower) ||
                                item.case_type_id?.toString().includes(searchLower) ||
                                item.status?.toLowerCase().includes(searchLower) ||
                                item.assigned_consultant_name?.toLowerCase().includes(searchLower) ||
                                item.case_types?.case_type_name?.toLowerCase().includes(searchLower)
                              );
                            })();

                            // Status filter
                            const statusMatch = backlogStatusFilter === "all" || 
                              (backlogStatusFilter && item.status && item.status.toLowerCase() === backlogStatusFilter.toLowerCase());

                            // Date range filter (handles dd/mm/yyyy format)
                            const dateMatch = (() => {
                              if (!backlogStartDate && !backlogEndDate) return true;
                              
                              const itemDate = item.backlog_referral_date ? new Date(item.backlog_referral_date) : null;
                              if (!itemDate || isNaN(itemDate.getTime())) return false;

                              const startDate = backlogStartDate ? parseDDMMYYYY(backlogStartDate) : null;
                              const endDate = backlogEndDate ? parseDDMMYYYY(backlogEndDate) : null;

                              if (startDate && endDate) {
                                // Set time to start/end of day for proper comparison
                                const startOfDay = new Date(startDate);
                                startOfDay.setHours(0, 0, 0, 0);
                                const endOfDay = new Date(endDate);
                                endOfDay.setHours(23, 59, 59, 999);
                                const itemDateOnly = new Date(itemDate);
                                itemDateOnly.setHours(0, 0, 0, 0);
                                return itemDateOnly >= startOfDay && itemDateOnly <= endOfDay;
                              } else if (startDate) {
                                const startOfDay = new Date(startDate);
                                startOfDay.setHours(0, 0, 0, 0);
                                const itemDateOnly = new Date(itemDate);
                                itemDateOnly.setHours(0, 0, 0, 0);
                                return itemDateOnly >= startOfDay;
                              } else if (endDate) {
                                const endOfDay = new Date(endDate);
                                endOfDay.setHours(23, 59, 59, 999);
                                const itemDateOnly = new Date(itemDate);
                                itemDateOnly.setHours(0, 0, 0, 0);
                                return itemDateOnly <= endOfDay;
                              }
                              return true;
                            })();

                            return searchMatch && statusMatch && dateMatch;
                          })
                          .slice((currentPageBacklog - 1) * pageSizeBacklog, currentPageBacklog * pageSizeBacklog)
                          .map((item, index) => (
                            <tr
                              key={item.backlog_id || index}
                              className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-200"
                            >
                              <td className="px-2 sm:px-3 py-3 text-center">
                                <span 
                                  className="font-mono text-xs sm:text-sm text-blue-600 hover:text-blue-800 cursor-pointer break-words"
                                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                  onClick={() => navigate(`/partner-backlog-detail/${item.backlog_id}`)}
                                  title={item.backlog_id}
                                >
                                  {item.backlog_id}
                                </span>
                              </td>
                              <td className="px-2 sm:px-3 py-3 text-center">
                                <div className="font-medium text-xs sm:text-sm text-gray-900 break-words max-w-[120px] sm:max-w-none" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} title={item.case_summary || "No Summary"}>
                                  {item.case_summary || "No Summary"}
                                </div>
                              </td>
                              <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-700 break-words hidden lg:table-cell max-w-[150px]" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} title={item.case_description || "No Description"}>
                                {item.case_description || "No Description"}
                              </td>
                              <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                                {item.backlog_referral_date
                                  ? formatDateDDMMYYYY(item.backlog_referral_date)
                                  : "N/A"}
                              </td>

                              <td className="px-2 sm:px-3 py-3 text-center whitespace-nowrap">
                              <Badge
                                className={`${
                                  item.status?.toLowerCase() === "new"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : item.status?.toLowerCase() === "in progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : item.status?.toLowerCase() === "complete"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              } px-2 sm:px-3 py-1 rounded-full text-xs font-medium`}
                              >
                                  {item.status ? item.status : "N/A"}
                                </Badge>
                              </td>
                              <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-600 break-words hidden md:table-cell max-w-[120px]" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} title={item.assigned_consultant_name || 'Not Assigned'}>
                                {item.assigned_consultant_name ? item.assigned_consultant_name : 'Not Assigned'}
                              </td>
                              <td className="px-2 sm:px-3 py-3 text-center whitespace-nowrap min-w-[180px]">
                                <div className="flex items-center justify-center gap-1 sm:gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50 h-7 sm:h-8 px-2 sm:px-3 text-xs"
                                    onClick={() => {
                                      navigate(`/partner-backlog-detail/${item.backlog_id}`);
                                    }}
                                    title="View"
                                  >
                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline ml-1">View</span>
                                  </Button>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-blue-500 text-blue-600 hover:bg-blue-50 h-7 sm:h-8 px-2 sm:px-3 text-xs"
                                    onClick={() => {
                                      navigate(`/partner-backlog-edit/${item.backlog_id}`);
                                    }}
                                    title="Transact"
                                  >
                                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline ml-1">Transact</span>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    
                    {/* Pagination */}
                    {(() => {
                      const filteredData = sortedBacklogData.filter((item) => {
                        // Search filter
                        const searchMatch = !backlogSearchTerm || (() => {
                          const searchLower = backlogSearchTerm.toLowerCase();
                          return (
                            item.case_summary?.toLowerCase().includes(searchLower) ||
                            item.case_description?.toLowerCase().includes(searchLower) ||
                            item.backlog_id?.toString().includes(searchLower) ||
                            item.case_type_id?.toString().includes(searchLower)
                          );
                        })();

                        // Date range filter (handles dd/mm/yyyy format)
                        const dateMatch = (() => {
                          if (!backlogStartDate && !backlogEndDate) return true;
                          
                          const itemDate = item.backlog_referral_date ? new Date(item.backlog_referral_date) : null;
                          if (!itemDate || isNaN(itemDate.getTime())) return false;

                          const startDate = backlogStartDate ? parseDDMMYYYY(backlogStartDate) : null;
                          const endDate = backlogEndDate ? parseDDMMYYYY(backlogEndDate) : null;

                          if (startDate && endDate) {
                            // Set time to start/end of day for proper comparison
                            const startOfDay = new Date(startDate);
                            startOfDay.setHours(0, 0, 0, 0);
                            const endOfDay = new Date(endDate);
                            endOfDay.setHours(23, 59, 59, 999);
                            const itemDateOnly = new Date(itemDate);
                            itemDateOnly.setHours(0, 0, 0, 0);
                            return itemDateOnly >= startOfDay && itemDateOnly <= endOfDay;
                          } else if (startDate) {
                            const startOfDay = new Date(startDate);
                            startOfDay.setHours(0, 0, 0, 0);
                            const itemDateOnly = new Date(itemDate);
                            itemDateOnly.setHours(0, 0, 0, 0);
                            return itemDateOnly >= startOfDay;
                          } else if (endDate) {
                            const endOfDay = new Date(endDate);
                            endOfDay.setHours(23, 59, 59, 999);
                            const itemDateOnly = new Date(itemDate);
                            itemDateOnly.setHours(0, 0, 0, 0);
                            return itemDateOnly <= endOfDay;
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
                            <ChevronLeft className="h-4 w-4" />
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
                            <ChevronRight className="h-4 w-4" />
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

          <TabsContent value="bonuses" className="space-y-4">
            {/* Bonus Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-none shadow-xl bg-gradient-to-br from-white to-green-50/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl mb-3 shadow-lg">
                    <IndianRupee className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    ₹
                    {isLoadingBonus
                      ? "..."
                      : bonusStats.totalBonusAmount.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    Total Bonus Amount
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-xl bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl mb-3 shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {isLoadingBonus ? "..." : bonusStats.totalCalculations}
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    Total Calculations
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-xl bg-gradient-to-br from-white to-purple-50/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl mb-3 shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    ₹
                    {isLoadingBonus
                      ? "..."
                      : bonusStats.totalCalculations > 0
                      ? (
                          bonusStats.totalBonusAmount /
                          bonusStats.totalCalculations
                        ).toLocaleString()
                      : "0"}
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    Average Bonus
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Bonus Payment Status
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Track your referral bonus payments and earnings from
                      completed cases
                      {lastUpdated && (
                        <span className="block text-xs text-gray-500 mt-1">
                          Last updated: {lastUpdated}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {/* Page Size Selector for Bonus */}
                  {!isLoadingBonus && displayBonusData.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Show:</span>
                      <Select
                        value={pageSizeBonus.toString()}
                        onValueChange={handlePageSizeBonusChange}
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
                      placeholder="Search by case ID, customer name, or bonus amount..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 max-w-sm border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        fetchBonusData(pageSizeBonus, currentPageBonus)
                      }
                      disabled={isLoadingBonus}
                      className="border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-lg transition-all duration-300"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${
                          isLoadingBonus ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingBonus ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">
                      Loading bonuses...
                    </span>
                  </div>
                ) : bonusData.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <IndianRupee className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-2">
                      No bonus calculations found
                    </p>
                    <p className="text-sm text-gray-400">
                      Bonus calculations will appear here once cases are
                      completed
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-center p-4 font-semibold text-gray-700">
                            Case ID
                          </th>
                          <th className="text-center p-4 font-semibold text-gray-700">
                            Customer
                          </th>
                          <th className="text-center p-4 font-semibold text-gray-700">
                            Total Bonus Amount
                          </th>
                          <th className="text-center p-4 font-semibold text-gray-700">
                            Bonus Status
                          </th>
                          <th className="text-center p-4 font-semibold text-gray-700">
                            Payment Date
                          </th>
                          {/* <th className="text-left p-4 font-semibold text-gray-700">Actions</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {displayBonusData.map((bonus, index) => (
                          <tr
                            key={bonus.case_id}
                            className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-200 ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                            }`}
                          >
                            <td className="p-4 text-center">
                              <span className="font-mono text-sm text-gray-900">
                                {bonus.case_id}
                              </span>
                            </td>
                            <td className="p-4 text-center text-gray-700">
                              {bonus.customer_first_name || "Unknown"}{" "}
                              {bonus.customer_last_name || "Customer"}
                            </td>
                            <td className="p-4 text-center">
                              <span className="font-semibold text-green-600">
                                ₹{bonus.stage_bonus_amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex flex-col items-center space-y-1">
                                <Badge
                                  className={`${getBonusStatusColor(
                                    bonusStatus || "unknown"
                                  )} px-3 py-1 rounded-full font-medium`}
                                >
                                  {bonusStatus || "Unknown"}
                                </Badge>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-gray-600">
                              {bonus.payment_date ? formatDateDDMMYYYY(bonus.payment_date) : "Not Paid Yet"}
                            </td>
                            <td className="p-4">
                              {/* <div className="flex items-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/partner-claim/${bonus.case_id}`)}
                                className="border-2 border-gray-300 hover:border-primary-500 rounded-lg transition-all duration-300"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Case
                              </Button>
                            </div> */}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* <tfoot>
                      <tr className="bg-gray-50/50 border-t-2 border-gray-200">
                        <td className="p-4 font-semibold text-gray-700" colSpan={2}>
                          Total
                        </td>
                        <td className="p-4 font-semibold text-green-600">
                          ₹{bonusStats.totalBonusAmount.toLocaleString()}
                        </td>
                        <td className="p-4 font-semibold text-gray-700">
                          {bonusStats.totalCalculations} calculations
                        </td>
                        <td className="p-4 text-sm text-gray-500" colSpan={2}>
                          Last updated: {lastUpdated}
                        </td>
                      </tr>
                    </tfoot> */}
                    </table>
                  </div>
                )}
              </CardContent>

              {/* Pagination Controls for Bonus */}
              {!isLoadingBonus && displayBonusData.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Pagination Info */}
                    <div className="text-sm text-gray-600">
                      Showing {startIndexBonus + 1} to{" "}
                      {Math.min(endIndexBonus, displayBonusData.length)} of{" "}
                      {displayBonusData.length} entries
                    </div>

                    {/* Pagination Navigation */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPageBonus((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPageBonus === 1}
                        className="flex items-center space-x-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous</span>
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from(
                          { length: Math.min(5, totalPagesBonus) },
                          (_, i) => {
                            let pageNum;
                            if (totalPagesBonus <= 5) {
                              pageNum = i + 1;
                            } else if (currentPageBonus <= 3) {
                              pageNum = i + 1;
                            } else if (
                              currentPageBonus >=
                              totalPagesBonus - 2
                            ) {
                              pageNum = totalPagesBonus - 4 + i;
                            } else {
                              pageNum = currentPageBonus - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  currentPageBonus === pageNum
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPageBonus(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPageBonus((prev) =>
                            Math.min(prev + 1, totalPagesBonus)
                          )
                        }
                        disabled={currentPageBonus === totalPagesBonus}
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
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
};

export default PartnerDashboard;
