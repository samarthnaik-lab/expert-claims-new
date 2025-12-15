
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Upload, FileText, LogOut, Phone, Shield, TrendingUp, Clock, CheckCircle, Mail, X, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';

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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Extract customer name from localStorage
  const getCustomerName = () => {
    try {
      const customerSessionRaw = localStorage.getItem('expertclaims_customer_session_details');
      if (customerSessionRaw) {
        const customerSessionData = JSON.parse(customerSessionRaw);
        const customerSession = Array.isArray(customerSessionData) ? customerSessionData[0] : customerSessionData;
        const name = customerSession?.name || 'Customer';
        setCustomerName(name);
      }
    } catch (error) {
      console.error('Error extracting customer name:', error);
      setCustomerName('Customer');
    }
  };

  // Load customer session details on component mount
  useEffect(() => {
    getCustomerName();
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
        
        // Get mobile number from customer session details
        const customerSessionRaw = localStorage.getItem('expertclaims_customer_session_details');
        let mobileNumber = '';
        let userId = null;
        
        if (customerSessionRaw) {
          try {
            const customerSessionData = JSON.parse(customerSessionRaw);
            const customerSession = Array.isArray(customerSessionData) ? customerSessionData[0] : customerSessionData;
            mobileNumber = customerSession?.mobile_number || '';
            userId = customerSession?.userid || null;
          } catch (e) {
            console.error('Error parsing customer session data:', e);
          }
        }
        
        // If we don't have userid yet, fetch from getcustomersessiondetails API
        if (!userId && mobileNumber) {
          try {
            // Get session_id from localStorage
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
              userId = sessionDetails?.userid || null;
            }
          } catch (error) {
            console.error('Error fetching customer session details:', error);
          }
        }
        
        if (!userId) {
          console.error('No userid found');
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

        const response = await fetch('http://localhost:3000/customer/customer-dashboard', {
          method: 'POST',
          headers: {
            'jwt_token': jwtToken,
            'session_id': sessionId
          },
          body: formdata,
        });

        if (response.ok) {
          const data = await response.json();
          // Only use the summary data, ignore the claims data
          const { summary } = data[0] || {};
          setDashboardData({ summary }); 
          console.log('Dashboard summary data loaded:', { summary });
        } else {
          console.error('Failed to fetch dashboard data');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  useEffect(() => {
    const fetchCustomerCase = async (limit: number = 10, page: number = 1) => {
      try {
        setLoading(true);
  
        // Get userid from customer session details (same as customer-dashboard)
        const customerSessionRaw = localStorage.getItem('expertclaims_customer_session_details');
        let mobileNumber = '';
        let userId = null;
        
        if (customerSessionRaw) {
          try {
            const customerSessionData = JSON.parse(customerSessionRaw);
            const customerSession = Array.isArray(customerSessionData) ? customerSessionData[0] : customerSessionData;
            mobileNumber = customerSession?.mobile_number || '';
            userId = customerSession?.userid || null;
          } catch (e) {
            console.error('Error parsing customer session data:', e);
          }
        }
        
        // If we don't have userid yet, fetch from getcustomersessiondetails API
        if (!userId && mobileNumber) {
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
              userId = sessionDetails?.userid || null;
            }
          } catch (error) {
            console.error('Error fetching customer session details:', error);
          }
        }
  
        if (!userId) {
          console.error('No userid found');
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
  
        // Build FormData payload with pagination
        const formData = new FormData();
        formData.append('user_id', userId.toString());
        formData.append('page', page.toString());
        formData.append('size', limit.toString());
  
        console.log('Customer Case API Body:', { user_id: userId, page: page, size: limit });
  
        const response = await fetch(
          'http://localhost:3000/customer/customer-case',
          {
            method: 'POST',
            headers: {
              'accept': '*/*',
              'accept-language': 'en-US,en;q=0.9',
              'accept-profile': 'expc',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
              'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
              'content-profile': 'expc',
              'jwt_token': jwtToken,
              'session_id': sessionId
            },
            body: formData,
          }
        );
  
        if (response.ok) {
          const data = await response.json();
          // Ensure data is an array
          const caseArray = Array.isArray(data) ? data : (data?.data || data?.cases || []);
          setCaseData(caseArray); 
          console.log('Customer case data:', data);
        } else {
          console.error('Failed to fetch customer case');
        }
      } catch (error) {
        console.error('Error fetching customer case:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchCustomerCase(pageSize, currentPage);
  }, [pageSize, currentPage]);

  

  // Get customer stats from API data or fallback to mock data
  const customerStats = dashboardData?.summary || {
    totalClaims: 0,
    inProgress: 0,
    approved: 0,
    rejected: 0
  };

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

  // Filter claims based on search term and status filter
  const filteredClaims = (Array.isArray(caseData) ? caseData : []).filter(claim => {
    const matchesSearch = claim.case_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.case_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.case_types?.case_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.assigned_agent?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.ticket_stage?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const displayClaims = filteredClaims;
  const totalPages = Math.ceil(displayClaims.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

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
          <Card className="border-none shadow-xl card-hover bg-gradient-to-br from-white to-red-50/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-400/10 to-red-600/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl mb-3 shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-red-600">{customerStats.rejected}</div>
                <div className="text-sm text-gray-600 font-medium">Rejected</div>
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
                    <SelectItem value="under review">Under Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
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
                      <td className="p-4 text-sm text-gray-600">{claim.created_time ? new Date(claim.created_time).toLocaleDateString() : 'N/A'}</td>
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
                  Showing {startIndex + 1} to {Math.min(endIndex, displayClaims.length)} of {displayClaims.length} entries
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
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
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
