
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Upload, FileText, LogOut, Phone, Shield, TrendingUp, Clock, CheckCircle, Mail, X, Search, Filter, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { AuthService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { SessionExpiry } from '@/components/SessionExpiry';
import { buildApiUrl } from '@/config/api';
import { formatDateDDMMYYYY } from '@/lib/utils';

const CustomerPortal = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [customerSessionDetails, setCustomerSessionDetails] = useState<any>(null);
  const [customerName, setCustomerName] = useState('Customer');
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customerClaims, setCustomerClaims] = useState<any[]>([]);
  const [caseData, setCaseData] = useState([]);
  const [allCasesForCounts, setAllCasesForCounts] = useState<any[]>([]); // All cases for accurate card counts
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  // Extract customer name from localStorage or API
  const getCustomerName = async () => {
    try {
      // First, try to get from localStorage (but we'll still refresh from API)
      const customerSessionRaw = localStorage.getItem('expertclaims_customer_session_details');
      let cachedName = null;
      if (customerSessionRaw) {
        try {
          const customerSessionData = JSON.parse(customerSessionRaw);
          const customerSession = Array.isArray(customerSessionData) ? customerSessionData[0] : customerSessionData;
          
          // Try multiple name fields - prioritize customer_name from API
          cachedName = customerSession?.customer_name ||
                      customerSession?.name || 
                      customerSession?.full_name ||
                      (customerSession?.first_name && customerSession?.last_name 
                        ? `${customerSession.first_name} ${customerSession.last_name}`.trim()
                        : customerSession?.first_name || customerSession?.last_name || null);
          
          if (cachedName && cachedName !== 'Customer') {
            console.log('Got customer name from localStorage:', cachedName);
            setCustomerName(cachedName);
          }
        } catch (e) {
          console.error('Error parsing customer session data:', e);
        }
      }
      
      // Always fetch from API to get the latest customer_name
      let mobileNumber = '';
      const customerSessionRaw2 = localStorage.getItem('expertclaims_customer_session_details');
      if (customerSessionRaw2) {
        try {
          const customerSessionData = JSON.parse(customerSessionRaw2);
          const customerSession = Array.isArray(customerSessionData) ? customerSessionData[0] : customerSessionData;
          mobileNumber = customerSession?.mobile_number || '';
        } catch (e) {
          console.error('Error parsing customer session data:', e);
        }
      }
      
      // Get session details
      const sessionStr = localStorage.getItem('expertclaims_session');
      let sessionId = '';
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          sessionId = session.sessionId || '';
        } catch (error) {
          console.error('Error parsing session:', error);
        }
      }
      
      // Call the API if we have mobileNumber
      if (mobileNumber) {
        try {
          console.log('Calling getcustomersessiondetails API with mobile_number:', mobileNumber);
          const sessionResponse = await fetch(`http://localhost:3000/customer/getcustomersessiondetails?mobile_number=${encodeURIComponent(mobileNumber)}`, {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'content-type': 'application/json',
              'session_id': sessionId
            }
          });
          
          console.log('getcustomersessiondetails API response status:', sessionResponse.status);
          
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            console.log('getcustomersessiondetails API response data:', sessionData);
            const sessionDetails = Array.isArray(sessionData) ? sessionData[0] : sessionData;
            
            // Try multiple name fields from API response - prioritize customer_name
            let name = sessionDetails?.customer_name ||
                      sessionDetails?.name || 
                      sessionDetails?.full_name ||
                      (sessionDetails?.first_name && sessionDetails?.last_name 
                        ? `${sessionDetails.first_name} ${sessionDetails.last_name}`.trim()
                        : sessionDetails?.first_name || sessionDetails?.last_name || null);
            
            console.log('API response customer_name:', sessionDetails?.customer_name);
            console.log('Extracted name from API:', name);
            
            if (name && name !== 'Customer') {
              console.log('Got customer name from API:', name);
              setCustomerName(name);
              
              // Update localStorage with the customer_name from API
              if (customerSessionRaw2) {
                try {
                  const customerSessionData = JSON.parse(customerSessionRaw2);
                  const customerSession = Array.isArray(customerSessionData) ? customerSessionData[0] : customerSessionData;
                  // Update with customer_name from API response
                  if (sessionDetails?.customer_name) {
                    customerSession.customer_name = sessionDetails.customer_name;
                    customerSession.name = sessionDetails.customer_name; // Also update name for backward compatibility
                    // Also update other fields from API response
                    Object.assign(customerSession, sessionDetails);
                    localStorage.setItem('expertclaims_customer_session_details', JSON.stringify(customerSession));
                    console.log('Updated localStorage with customer_name:', sessionDetails.customer_name);
                  } else if (!customerSession.name && !customerSession.full_name && !customerSession.customer_name) {
                    customerSession.name = name;
                    localStorage.setItem('expertclaims_customer_session_details', JSON.stringify(customerSession));
                  }
                } catch (e) {
                  console.error('Error updating customer session:', e);
                }
              } else {
                // If no existing session details, create new one with customer_name
                try {
                  localStorage.setItem('expertclaims_customer_session_details', JSON.stringify(sessionDetails));
                  console.log('Stored new customer session details with customer_name:', sessionDetails?.customer_name);
                } catch (e) {
                  console.error('Error storing customer session details:', e);
                }
              }
              return;
            } else {
              console.warn('No valid customer name found in API response');
            }
          } else {
            console.error('Failed to fetch customer session details:', sessionResponse.status, sessionResponse.statusText);
          }
        } catch (error) {
          console.error('Error fetching customer name from API:', error);
        }
      } else {
        console.warn('No mobile_number found, cannot call getcustomersessiondetails API');
      }
      
      // Fallback to cached name or 'Customer' if nothing found
      if (!cachedName || cachedName === 'Customer') {
        setCustomerName('Customer');
      }
    } catch (error) {
      console.error('Error extracting customer name:', error);
      setCustomerName('Customer');
    }
  };

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
    
    // 5. Last resort: Fetch from getcustomersessiondetails API if we have mobile number
    const customerSessionRaw2 = localStorage.getItem('expertclaims_customer_session_details');
    let mobileNumber = '';
    if (customerSessionRaw2) {
      try {
        const customerSessionData = JSON.parse(customerSessionRaw2);
        const customerSession = Array.isArray(customerSessionData) ? customerSessionData[0] : customerSessionData;
        mobileNumber = customerSession?.mobile_number || '';
      } catch (e) {
        console.error('Error parsing customer session data:', e);
      }
    }
    
    if (mobileNumber) {
      try {
        const sessionStr = localStorage.getItem('expertclaims_session');
        let sessionId = '';
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            sessionId = session.sessionId || '';
          } catch (error) {
            console.error('Error parsing session:', error);
          }
        }
        
        const sessionResponse = await fetch(`http://localhost:3000/customer/getcustomersessiondetails?mobile_number=${encodeURIComponent(mobileNumber)}`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'session_id': sessionId
          }
        });
        
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          const sessionDetails = Array.isArray(sessionData) ? sessionData[0] : sessionData;
          if (sessionDetails?.userid) {
            console.log('Got userId from getcustomersessiondetails API:', sessionDetails.userid);
            // Store it for future use
            if (sessionStr) {
              try {
                const session = JSON.parse(sessionStr);
                session.userId = sessionDetails.userid.toString();
                localStorage.setItem('expertclaims_session', JSON.stringify(session));
                localStorage.setItem('userId', sessionDetails.userid.toString());
              } catch (e) {
                console.error('Error updating session:', e);
              }
            }
            return sessionDetails.userid.toString();
          }
        }
      } catch (error) {
        console.error('Error fetching customer session details:', error);
      }
    }
    
    return null;
  };

  // Load customer session details on component mount
  useEffect(() => {
    getCustomerName(); // Now async, but we don't need to await it
    const sessionDetails = AuthService.getCustomerSessionDetails();
    if (sessionDetails) {
      setCustomerSessionDetails(sessionDetails);
      console.log('Customer session details loaded:', sessionDetails);
    }
  }, []);

  // Fetch customer dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const userId = await getUserId();
        
        if (!userId) {
          console.error('No userid found after all attempts');
          setLoading(false);
          return;
        }
        
        const formdata = new FormData();
        formdata.append('user_id', userId.toString());

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

        const response = await fetch(buildApiUrl('customer/customer-dashboard'), {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'accept-profile': 'expc',
            'content-profile': 'expc',
            'jwt_token': jwtToken,
            'session_id': sessionId
          },
          body: formdata,
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Full dashboard API response:', data);
          
          // Handle different response formats
          let dashboardResponse = Array.isArray(data) ? data[0] : data;
          
          // Extract summary data - could be nested or at root level
          let summary = dashboardResponse?.summary || dashboardResponse;
          
          // Map API response fields to our expected format
          // Handle different possible field names from API
          const mappedSummary = {
            totalClaims: summary?.totalClaims || 
                        summary?.total_claims || 
                        summary?.totalTasks || 
                        summary?.total_tasks ||
                        (summary?.claims ? summary.claims.length : 0) ||
                        0,
            underReview: summary?.underReview || 
                        summary?.under_review || 
                        summary?.reviewCounts || 
                        summary?.review_counts ||
                        summary?.inProgress ||
                        summary?.in_progress ||
                        0,
            approved: summary?.approved || 
                     summary?.completedCounts || 
                     summary?.completed_counts ||
                     summary?.approvedCounts ||
                     summary?.approved_counts ||
                     0,
            pending: summary?.pending || 
                     summary?.pendingCounts || 
                     summary?.pending_counts ||
                     summary?.waitingCounts ||
                     summary?.waiting_counts ||
                     0
          };
          
          console.log('Mapped summary data:', mappedSummary);
          setDashboardData({ summary: mappedSummary });
          
          // Try to extract customer name from dashboard response if available
          if (dashboardResponse) {
            let name = dashboardResponse?.customer_name ||
                       dashboardResponse?.name ||
                       dashboardResponse?.full_name ||
                       (dashboardResponse?.first_name && dashboardResponse?.last_name 
                         ? `${dashboardResponse.first_name} ${dashboardResponse.last_name}`.trim()
                         : dashboardResponse?.first_name || dashboardResponse?.last_name || null);
            
            if (name && name !== 'Customer') {
              console.log('Got customer name from dashboard API (customer_name):', name);
              setCustomerName(name);
            }
          }
          
          console.log('Dashboard summary data loaded:', mappedSummary);
        } else {
          console.error('Failed to fetch dashboard data');
          const errorText = await response.text();
          console.error('Error response:', errorText);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch all cases for accurate card counts (not paginated)
  useEffect(() => {
    const fetchAllCasesForCounts = async () => {
      try {
        const userId = await getUserId();
        
        if (!userId) {
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

        // Fetch all cases with a large page size to get accurate counts
        const formData = new FormData();
        formData.append('user_id', userId.toString());
        formData.append('page', '1');
        formData.append('size', '1000'); // Large size to get all cases

        const apiUrl = buildApiUrl('customer/customer-case');
        const response = await fetch(
          apiUrl,
          {
            method: 'POST',
            headers: {
              'accept': '*/*',
              'accept-language': 'en-US,en;q=0.9',
              'accept-profile': 'expc',
              'content-profile': 'expc',
              'session_id': sessionId,
              'jwt_token': jwtToken,
              ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` })
            },
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          const allCases = Array.isArray(data) ? data : (data?.data || data?.cases || []);
          setAllCasesForCounts(allCases);
          console.log('✅ Fetched all cases for card counts:', allCases.length);
        } else {
          console.error('❌ Failed to fetch all cases for counts:', response.status);
        }
      } catch (error) {
        console.error('Error fetching all cases for counts:', error);
      }
    };

    fetchAllCasesForCounts();
  }, []);

  useEffect(() => {
    const fetchCustomerCase = async (limit: number = 10, page: number = 1) => {
      console.log('🔄 fetchCustomerCase called with:', { limit, page });
      try {
        setLoading(true);
  
        // Use the getUserId helper function which checks all possible sources
        const userId = await getUserId();
  
        if (!userId) {
          console.error('❌ No userid found after all attempts - API call will not be made');
          console.log('Available localStorage keys:', Object.keys(localStorage).filter(key => key.includes('expert') || key.includes('user')));
          setLoading(false);
          return;
        }
        
        console.log('✅ UserId found:', userId);
  
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
  
        // Build FormData payload with pagination
        const formData = new FormData();
        formData.append('user_id', userId.toString());
        formData.append('page', page.toString());
        formData.append('size', limit.toString());
  
        console.log('Customer Case API Body:', { user_id: userId, page: page, size: limit });
        console.log('Session data:', { sessionId: sessionId ? 'present' : 'missing', jwtToken: jwtToken ? 'present' : 'missing' });
  
        const apiUrl = buildApiUrl('customer/customer-case');
        console.log('Calling Customer Case API:', apiUrl);
  
        const response = await fetch(
          apiUrl,
          {
            method: 'POST',
            headers: {
              'accept': '*/*',
              'accept-language': 'en-US,en;q=0.9',
              'accept-profile': 'expc',
              'content-profile': 'expc',
              'session_id': sessionId,
              'jwt_token': jwtToken,
              ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` })
            },
            body: formData,
          }
        );
  
        console.log('Customer Case API Response Status:', response.status, response.statusText);
  
        if (response.ok) {
          const data = await response.json();
          // Ensure data is an array
          const caseArray = Array.isArray(data) ? data : (data?.data || data?.cases || []);
          setCaseData(caseArray);
          
          // Determine if there are more pages
          // If we got a full page of results, there might be more pages
          const hasMore = caseArray.length === limit;
          setHasMorePages(hasMore);
          
          // If API provides total count, use it
          if (data?.total !== undefined) {
            setTotalCount(data.total);
          } else if (data?.totalCount !== undefined) {
            setTotalCount(data.totalCount);
          } else if (data?.count !== undefined) {
            setTotalCount(data.count);
          } else {
            // Estimate total count based on current page and hasMore
            if (hasMore) {
              // If we have a full page, estimate at least (currentPage * pageSize) + 1
              setTotalCount(null); // Keep null to indicate we don't know exact count
            } else {
              // This is the last page, total is approximately (currentPage - 1) * pageSize + caseArray.length
              setTotalCount((page - 1) * limit + caseArray.length);
            }
          }
          
          console.log('Customer case data:', caseArray);
          console.log('Has more pages:', hasMore);
          console.log('Total count:', totalCount);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch customer case:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          setHasMorePages(false);
        }
      } catch (error) {
        console.error('Error fetching customer case:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message, error.stack);
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchCustomerCase(pageSize, currentPage);
  }, [pageSize, currentPage]);

  

  // Calculate customer stats from actual table data (allCasesForCounts)
  const customerStats = React.useMemo(() => {
    const allCases = Array.isArray(allCasesForCounts) ? allCasesForCounts : [];
    
    // Helper function to normalize status
    const normalizeStatus = (status: string): string => {
      if (!status) return '';
      return status.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[_-]/g, ' ');
    };

    // Count cases by status category
    let inProgress = 0;
    let approved = 0;
    let pending = 0;
    const totalClaims = allCases.length;

    allCases.forEach(claim => {
      const status = normalizeStatus(claim.ticket_stage || '');
      
      // Pending: includes "under process", "payment pending", "partner payment pending", etc.
      if (
        status.includes('under process') ||
        status.includes('payment pending') ||
        status.includes('partner payment pending') ||
        status.includes('agreement pending') ||
        status === 'pending'
      ) {
        pending++;
      }
      // In Progress: includes other active/processing statuses (not pending)
      else if (
        status.includes('in progress') ||
        status.includes('under review') ||
        status.includes('processing') ||
        status.includes('review') ||
        status.includes('evaluation') ||
        status.includes('evaluated') ||
        status.includes('litigation') ||
        status.includes('arbitration') ||
        status.includes('analysis') ||
        status === 'open' ||
        status === 'new' ||
        (status.includes('under') && !status.includes('process') && !status.includes('done'))
      ) {
        inProgress++;
      }
      // Approved/Completed: includes all completed/resolved statuses
      else if (
        status.includes('completed') ||
        status.includes('resolved') ||
        status.includes('closed') ||
        status.includes('approved') ||
        status.includes('paid') ||
        status.includes('done') ||
        status.includes('partner payment done') ||
        status.includes('payment done') ||
        status.includes('1st instalment paid') ||
        status.includes('instalment paid')
      ) {
        approved++;
      }
      // Default: if status doesn't match any category, count as in progress
      else if (status) {
        inProgress++;
      }
    });

    console.log('📊 Calculated customer stats from table data:', {
      totalClaims,
      inProgress,
      approved,
      pending,
      allCasesCount: allCases.length
    });

    // Merge with API data if available, but prioritize calculated values
    const apiStats = dashboardData?.summary || {};
    
    return {
      totalClaims: totalClaims > 0 ? totalClaims : (apiStats.totalClaims || 0),
      underReview: inProgress > 0 ? inProgress : (apiStats.underReview || 0),
      approved: approved > 0 ? approved : (apiStats.approved || 0),
      pending: pending > 0 ? pending : (apiStats.pending || 0)
    };
  }, [allCasesForCounts, dashboardData]);

  // Get claims from API data or fallback to mock data
  const customerClaimsData = dashboardData?.claims || [];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in progress': return 'bg-yellow-100 text-yellow-800';
      case 'under review': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to normalize status names for comparison
  const normalizeStatus = (status: string): string => {
    if (!status) return '';
    return status.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[_-]/g, ' ');
  };

  // Helper function to check if status matches filter (handles variations)
  const statusMatches = (claimStatus: string, filterValue: string): boolean => {
    if (filterValue === 'all') return true;
    if (!claimStatus) return false;
    
    const normalizedClaimStatus = normalizeStatus(claimStatus);
    const normalizedFilter = normalizeStatus(filterValue);
    
    // Direct match
    if (normalizedClaimStatus === normalizedFilter) return true;
    
    // Handle common variations and synonyms
    const statusMappings: { [key: string]: string[] } = {
      'in progress': ['in progress', 'under process', 'processing', 'inprocess', 'in-process', 'underprocess'],
      'under review': ['under review', 'review', 'reviewing', 'underreview', 'under-review'],
      'open': ['open', 'new', 'pending'],
      'resolved': ['resolved', 'completed', 'done', 'finished'],
      'closed': ['closed', 'completed', 'done'],
      'agreement pending': ['agreement pending', 'agreement-pending', 'pending agreement', 'agreement']
    };
    
    // Check if claim status matches any variation of the filter
    if (statusMappings[normalizedFilter]) {
      return statusMappings[normalizedFilter].some(variation => 
        normalizedClaimStatus === variation || 
        normalizedClaimStatus.includes(variation) || 
        variation.includes(normalizedClaimStatus)
      );
    }
    
    // Fallback: check if normalized strings are similar (contains match)
    return normalizedClaimStatus.includes(normalizedFilter) || normalizedFilter.includes(normalizedClaimStatus);
  };

  // Filter claims based on search term and status filter
  const filteredClaims = (Array.isArray(caseData) ? caseData : []).filter(claim => {
    const matchesSearch = claim.case_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.case_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.case_types?.case_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.assigned_agent?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusMatches(claim.ticket_stage || '', statusFilter);
    return matchesSearch && matchesStatus;
  });

  // Get unique statuses from the data for dynamic filter options
  const uniqueStatuses = React.useMemo(() => {
    const statusSet = new Set<string>();
    (Array.isArray(caseData) ? caseData : []).forEach(claim => {
      if (claim.ticket_stage) {
        statusSet.add(claim.ticket_stage);
      }
    });
    return Array.from(statusSet).sort();
  }, [caseData]);

  // Pagination logic - use server-side pagination
  const displayClaims = filteredClaims;
  // For server-side pagination, we don't slice the data - API already returns the correct page
  // But we still need totalPages for UI display
  // If we have totalCount, use it; otherwise estimate based on hasMorePages
  const estimatedTotalPages = totalCount !== null 
    ? Math.ceil(totalCount / pageSize)
    : (hasMorePages ? currentPage + 1 : currentPage); // If hasMore, at least one more page exists
  const totalPages = estimatedTotalPages;
  
  // Calculate start and end indices for display (server-side pagination)
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + displayClaims.length;

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    const size = Number(newPageSize);
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const contactInfo = {
    email: 'support@expertclaims.com',
    phone: '+91 98765 43210'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Modern Header */}
      <header className="bg-primary-500 backdrop-blur-md shadow-sm border-b border-primary-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div> */}
              <div>
                <img src="/leaders/logo.jpeg" alt="ExpertClaims" className="w-48" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Customer Portal
                </h1>
                <p className="text-xs text-white/80 font-medium">Welcome back, {customerName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <SessionExpiry />
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
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in">
          <Card className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-blue-600/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl mb-3 shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{customerStats.underReview}</div>
                <div className="text-sm text-gray-600 font-medium">In Progress</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-emerald-50/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-400/10 to-emerald-600/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl mb-3 shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-green-600">{customerStats.approved}</div>
                <div className="text-sm text-gray-600 font-medium">Approved</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-orange-50/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-400/10 to-orange-600/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl mb-3 shadow-lg">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-orange-600">{customerStats.pending}</div>
                <div className="text-sm text-gray-600 font-medium">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-gray-400/10 to-gray-600/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl mb-3 shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{customerStats.totalClaims}</div>
                <div className="text-sm text-gray-600 font-medium">Total Claims</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Claims Table */}
        <Card className="mb-8 border-none shadow-xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm animate-slide-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">My Claims</CardTitle>
                <CardDescription className="text-gray-600">
                  Track the progress of your insurance claim recoveries ({displayClaims.length} total)
                </CardDescription>
              </div>
              {/* Page Size Selector */}
              {!loading && displayClaims.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Show:</span>
                  <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
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
            <div className="flex items-center space-x-4 mt-4">
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  placeholder="Search by case ID, summary, type, or agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 max-w-sm border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all duration-300"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 border-2 border-gray-200 rounded-xl focus:border-blue-500">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in progress">In Progress</SelectItem>
                    <SelectItem value="under process">Under Process</SelectItem>
                    <SelectItem value="under review">Under Review</SelectItem>
                    <SelectItem value="agreement pending">Agreement Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    {/* Add unique statuses from data that aren't already in the list */}
                    {uniqueStatuses
                      .filter(status => {
                        const normalized = normalizeStatus(status);
                        const commonStatuses = ['all', 'open', 'in progress', 'under process', 'under review', 'agreement pending', 'resolved', 'closed'];
                        return !commonStatuses.some(common => normalizeStatus(common) === normalized);
                      })
                      .map(status => (
                        <SelectItem key={status} value={status.toLowerCase()}>
                          {status}
                        </SelectItem>
                      ))}
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
                    className="border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-lg transition-all duration-300"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your claims...</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-4 font-semibold text-gray-700">Case ID</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Summary</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Agent</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Created</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                {displayClaims.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <FileText className="h-12 w-12 text-gray-400" />
                          <h3 className="text-lg font-medium text-gray-900">No claims found</h3>
                          <p className="text-gray-600">
                            {caseData.length === 0 
                              ? "No claims have been created yet." 
                              : "No claims match your current search criteria."
                            }
                          </p>
                          {(searchTerm || statusFilter !== 'all') && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                              }}
                              className="mt-2"
                            >
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayClaims.map(claim => (
                    <tr key={claim.case_id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-200">
                      <td className="p-4 font-mono text-sm text-gray-600">{claim.case_id}</td>
                      <td className="p-4 font-medium text-gray-900">{claim.case_types?.case_type_name || 'N/A'}</td>
                      <td className="p-4 text-gray-700">{claim.case_summary || 'No summary available'}</td>
                      <td className="p-4 font-medium text-gray-900">{claim.assigned_agent || 'Not assigned'}</td>
                      <td className="p-4">
                        <Badge className={`${getStatusColor(claim.ticket_stage)} px-3 py-1 rounded-full font-medium`}>
                          {claim.ticket_stage || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{formatDateDDMMYYYY(claim.created_time)}</td>
                      <td className="p-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/customer-claim/${claim.case_id}`)}
                          className="border-2 border-gray-300 hover:border-primary-500 rounded-lg transition-all duration-300"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
            )}
          </CardContent>
          
          {/* Pagination Controls */}
          {!loading && displayClaims.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Pagination Info */}
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {endIndex} of {totalCount !== null ? totalCount : displayClaims.length} entries
                </div>

                {/* Pagination Navigation */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center space-x-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {(() => {
                      // Calculate which pages to show
                      const maxPagesToShow = 5;
                      let pagesToShow: number[] = [];
                      
                      if (totalPages <= maxPagesToShow) {
                        // Show all pages if total is small
                        pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1);
                      } else if (currentPage <= 3) {
                        // Show first 5 pages
                        pagesToShow = [1, 2, 3, 4, 5];
                      } else if (currentPage >= totalPages - 2) {
                        // Show last 5 pages
                        pagesToShow = [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                      } else {
                        // Show pages around current page
                        pagesToShow = [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
                      }
                      
                      return pagesToShow.map((pageNum) => (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                          disabled={pageNum > totalPages && !hasMorePages}
                        >
                          {pageNum}
                        </Button>
                      ));
                    })()}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!hasMorePages}
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

        {/* Support Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                <Phone className="h-5 w-5 text-blue-600" />
                <span>Contact My Agent</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Need to speak with your assigned agent about your claim?
              </p>
              <Button 
                onClick={() => setShowContactPopup(true)}
                className="w-full bg-white text-gray-700 border-2 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-500 transition-all duration-300"
              >
                Contact Agent
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                <Upload className="h-5 w-5 text-green-600" />
                <span>Upload Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Submit additional documents for your claims
              </p>
              <Button 
                onClick={() => navigate('/customer-upload')}
                className="w-full bg-white text-gray-700 border-2 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-500 transition-all duration-300"
              >
                Upload Files
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                <MessageCircle className="h-5 w-5 text-purple-600" />
                <span>FAQ & Support</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Find answers to common questions
              </p>
              <Button 
                onClick={() => navigate('/customer-faq')}
                className="w-full bg-white text-gray-700 border-2 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-500 transition-all duration-300"
              >
                View FAQ
              </Button>
            </CardContent>
          </Card>
        </div>


      </div>

      <Dialog open={showContactPopup} onOpenChange={setShowContactPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-xl font-bold text-gray-900">
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-blue-600" />
                <span>Contact Information</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContactPopup(false)}
                className="h-6 w-6 p-0"
              >
                {/* <X className="h-4 w-4" /> */}
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-gray-600">{contactInfo.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <Phone className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Phone</p>
                <p className="text-gray-600">{contactInfo.phone}</p>
              </div>
            </div>
            <div className="text-center pt-4">
              <Button 
                onClick={() => setShowContactPopup(false)}
                className="w-full bg-primary-500 hover:bg-primary-600"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerPortal;
