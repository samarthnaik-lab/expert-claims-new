import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Shield, FileText, User, Calendar, Phone, Mail, MapPin, DollarSign, Clock, CheckCircle, AlertCircle, XCircle, MessageCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDateDDMMYYYY } from '@/lib/utils';
import { buildApiUrl, getApiKey } from '@/config/api';



const CustomerClaimDetail = () => {
  const { case_id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [viewingDocumentId, setViewingDocumentId] = useState<number | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showDocumentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDocumentModal]);

  // Zoom functions
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

  // Pan functions for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 100) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 100) {
      const sensitivity = 0.7; // Reduce sensitivity for slower movement (0.5 = half speed, 0.7 = 70% speed)
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

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      // Zoom in
      setZoomLevel(prev => Math.min(prev + 10, 300));
    } else {
      // Zoom out
      setZoomLevel(prev => Math.max(prev - 10, 50));
    }
  };

  const generateSignedUrl = async (filePath: string) => {
    try {
      const AWS_ACCESS_KEY_ID = 'AKIAWQMOP6F2IGYLASP6';
      const AWS_SECRET_ACCESS_KEY = '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';
      const BUCKET_NAME = 'expert-claims-fire';
      const REGION = 'ap-south-1';
      
      const s3Url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${filePath}`;
      
      return s3Url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return null;
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
    
    return null;
  };

  // Helper function to compare case IDs (handles different formats)
  const compareCaseIds = (urlCaseId: string, apiCaseId: any): boolean => {
    // Convert both to strings for comparison
    const urlId = String(urlCaseId).toLowerCase().trim();
    const apiId = String(apiCaseId).toLowerCase().trim();
    
    // Direct match
    if (urlId === apiId) return true;
    
    // Try extracting numeric part from ECSI format (e.g., "ECSI-25-367" -> "367")
    const urlNumericMatch = urlId.match(/(\d+)$/);
    if (urlNumericMatch) {
      const urlNumeric = urlNumericMatch[1];
      if (urlNumeric === apiId) return true;
    }
    
    // Try matching numeric part of API ID
    const apiNumericMatch = apiId.match(/(\d+)$/);
    if (apiNumericMatch && urlNumericMatch) {
      if (apiNumericMatch[1] === urlNumericMatch[1]) return true;
    }
    
    return false;
  };

  useEffect(() => {
    const fetchClaimDetails = async () => {
      console.log('🔄 fetchClaimDetails called with case_id:', case_id);
      try {
        setLoading(true);
        
        if (!case_id) {
          console.error('❌ No case_id provided - API call will not be made');
          setLoading(false);
          return;
        }

        const userId = await getUserId();
        console.log('📦 UserId from getUserId:', userId);
        
        if (!userId) {
          console.error('❌ No userid found - API call will not be made');
          console.log('Available localStorage keys:', Object.keys(localStorage).filter(key => key.includes('expert') || key.includes('user')));
          toast({
            title: "Error",
            description: "User ID not found. Please ensure you are logged in.",
            variant: "destructive",
          });
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

        // Fetch cases across multiple pages to find the specific case
        let foundClaim: any = null;
        let page = 1;
        const pageSize = 50; // Fetch larger pages to reduce API calls
        let hasMore = true;

        console.log('Looking for case_id:', case_id);
  
        // Get API key dynamically
        const apiKey = getApiKey();
        const apiUrl = buildApiUrl('customer/customer-case');
        console.log('Calling Customer Case API:', apiUrl);
        console.log('Session data:', { sessionId: sessionId ? 'present' : 'missing', jwtToken: jwtToken ? 'present' : 'missing' });
  
        while (hasMore && !foundClaim) {
          // Build FormData payload with pagination
          const formData = new FormData();
          formData.append('user_id', userId.toString());
          formData.append('page', page.toString());
          formData.append('size', pageSize.toString());
  
          console.log(`Fetching page ${page} with user_id: ${userId} to find case_id: ${case_id}`);
  
        const response = await fetch(
          apiUrl,
          {
            method: 'POST',
            headers: {
              'accept': '*/*',
              'accept-language': 'en-US,en;q=0.9',
              'accept-profile': 'expc',
              'apikey': apiKey,
              'authorization': `Bearer ${apiKey}`,
              'content-profile': 'expc',
              'jwt_token': jwtToken,
              'session_id': sessionId
            },
            body: formData,
          }
        );
  
          console.log(`Page ${page} - API Response Status:`, response.status, response.statusText);
  
          if (response.ok) {
            const data = await response.json();
            const caseArray = Array.isArray(data) ? data : (data?.data || data?.cases || []);
            
            console.log(`Page ${page} - Found ${caseArray.length} cases`);
            console.log('Available case IDs:', caseArray.map((item: any) => item.case_id));
            
            // Search for the case using improved comparison
            foundClaim = caseArray.find((item: any) => compareCaseIds(case_id, item.case_id));
            
            // Check if there are more pages
            hasMore = caseArray.length === pageSize;
            page++;
            
            // Limit to 10 pages to prevent infinite loops
            if (page > 10) {
              console.warn('Reached maximum page limit (10) while searching for case');
              hasMore = false;
            }
          } else {
            const errorText = await response.text();
            console.error('Failed to fetch claim details from page', page, {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            });
            hasMore = false;
          }
        }

        if (foundClaim) {
          console.log('Found case:', foundClaim);
          setClaim(foundClaim);
          
          // Use the actual case_id from the API response
          const actualCaseId = String(foundClaim.case_id);
          fetchDocuments(actualCaseId);
        } else {
          console.error('Case not found with ID:', case_id);
          toast({
            title: "Case Not Found",
            description: `The case with ID ${case_id} was not found in your account.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching claim details:', error);
        toast({
          title: "Error",
          description: "Failed to fetch case details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClaimDetails();
  }, [case_id]);

  const fetchDocuments = async (caseId: string) => {
    try {
      setDocumentsLoading(true);
      
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
        setDocumentsLoading(false);
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

      const response = await fetch(
        buildApiUrl('support/list-documents'),
        {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'content-type': 'application/json',
            'jwt_token': jwtToken,
            'session_id': sessionId,
          },
          body: JSON.stringify({
            case_id: caseId
          }),
        }
      );

      if (!response.ok) {
        console.error("Failed to fetch documents:", response.status);
        setDocuments([]);
        return;
      }
  
      const data = await response.json();
      console.log("Documents data:", data);
  
      // Expected shapes:
      // A) [ { success, case_id, documents: [...] } ]
      // B) { success, case_id, documents: [...] }
      let envelope: any | null = null;
  
      if (Array.isArray(data)) {
        // If multiple entries, prefer the one matching the requested caseId
        const match =
          data.find((d) => String(d?.case_id) === String(caseId)) ?? data[0];
        envelope = match ?? null;
      } else if (data && typeof data === "object") {
        envelope = data;
      }
  
      const success = Boolean(envelope?.success);
      const docs = Array.isArray(envelope?.documents) ? envelope.documents : null;
  
      if (success && docs) {
        // docs: [{ document_id, file_path }, ...]
        setDocuments(docs);
      } else {
        console.log("No documents found or invalid response structure");
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const viewDocument = async (documentId: number) => {
    try {
      setViewingDocumentId(documentId);
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

      // Call the support/view API to get document
      console.log('Calling support/view API for document ID:', documentId);
      
      // Get API key dynamically
      const apiKey = getApiKey();
      
      const requestBody = {
        document_id: documentId
      };
      
      const response = await fetch(buildApiUrl('support/view'), {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Profile': 'expc',
          'Accept-Profile': 'expc',
          'session_id': sessionId,
          'jwt_token': jwtToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error('Failed to fetch document:', response.status, response.statusText);
        
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
        setViewingDocumentId(null);
        return;
      }

      // Process the binary document data
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
            
            toast({
              title: "Success",
              description: "Document opened successfully",
            });
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
          setViewingDocumentId(null);
        }
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: "Failed to view document",
        variant: "destructive",
      });
      setViewingDocumentId(null);
    }
  };

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

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in progress': return <Clock className="h-5 w-5 text-blue-600" />;
      case 'under review': return <Clock className="h-5 w-5 text-orange-600" />;
      case 'open': return <Clock className="h-5 w-5 text-blue-600" />;
      case 'resolved': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'closed': return <CheckCircle className="h-5 w-5 text-gray-600" />;
      case 'pending': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'cancelled': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-gray-600">Loading case details for ID: <strong>{case_id}</strong></p>
          </div>
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-none shadow-xl bg-white">
            <CardContent className="p-8 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Case Not Found</h2>
              <p className="text-gray-600 mb-6">
                The case with ID <strong>{case_id}</strong> was not found in your account. 
                This could be because:
              </p>
              <ul className="text-left text-gray-600 mb-6 max-w-md mx-auto space-y-2">
                <li>• The case ID is incorrect</li>
                <li>• The case belongs to another customer</li>
                <li>• The case has been removed or archived</li>
              </ul>
              <div className="space-y-3">
                <Button onClick={() => navigate('/customer-portal')} className="bg-primary-500 hover:bg-primary-600 w-full">
                  Back to Portal
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="w-full border-2 border-gray-300 hover:border-primary-500"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                  Claim Details
                </h1>
                <p className="text-xs text-white/80 font-medium">{claim.case_id} • {claim.case_types?.case_type_name || 'Unknown Type'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {claim.priority && (
                <Badge className={`${getPriorityColor(claim.priority)} px-3 py-2 rounded-full font-medium border border-gray-200`}>
                  Priority: {claim.priority.toUpperCase()}
                </Badge>
              )}
              <Badge className="bg-white text-gray-700 px-4 py-2 rounded-full font-medium flex items-center space-x-2 border border-gray-200 hover:bg-white hover:text-gray-700">
                {getStatusIcon(claim.ticket_stage)}
                <span className="capitalize">{claim.ticket_stage || 'Unknown'}</span>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Claim Overview */}
            <Card className="border-none shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary-500" />
                  <span>Claim Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Case ID</label>
                    <p className="text-lg font-semibold text-gray-900 font-mono">{claim.case_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Case Type</label>
                    <p className="text-lg font-semibold text-gray-900">{claim.case_types?.case_type_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Case Summary</label>
                    <p className="text-lg font-semibold text-gray-900">{claim.case_summary || 'No summary available'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <p className="text-lg font-semibold text-gray-900">{claim.priority || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Date</label>
                    <p className="text-lg font-semibold text-gray-900">{claim.start_date ? formatDateDDMMYYYY(claim.start_date) : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assign Date</label>
                    <p className="text-lg font-semibold text-gray-900">{claim.due_date ? new Date(claim.due_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 mt-1">{claim.case_description || claim.case_summary || 'No description available'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Agent Information */}
            <Card className="border-none shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary-500" />
                  <span>Your Assigned Agent</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Agent Name</label>
                    <p className="text-lg font-semibold text-gray-900">{claim.assigned_agent || 'Not assigned yet'}</p>
                  </div>

                  {/* <div>
                    <label className="text-sm font-medium text-gray-500">Employee ID</label>
                    <p className="text-lg font-semibold text-gray-900">{claim.employee_id || 'N/A'}</p>
                  </div> */}
                  {/* <div>
                    <label className="text-sm font-medium text-gray-500">Employee Email</label>
                    <p className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{claim.employee_email || 'N/A'}</span>
                    </p>
                  </div> */}
                  {/* <div>
                    <label className="text-sm font-medium text-gray-500">Employee Phone</label>
                    <p className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{claim.employee_phone || 'N/A'}</span>
                    </p>
                  </div> */}

                </div>
              </CardContent>
            </Card>

            {/* Case Comments */}
            <Card className="border-none shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-primary-500" />
                  <span>Case Comments</span>
                </CardTitle>
                <CardDescription>Comments and updates on this case</CardDescription>
              </CardHeader>
              <CardContent>
                {claim.case_comments && claim.case_comments.length > 0 ? (
                  <div className="space-y-6">
                    {claim.case_comments.map((comment: any, index: number) => (
                      <div key={index} className="relative">
                        {/* Comment Bubble */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-primary-500 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                                <MessageCircle className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-800 text-base leading-relaxed font-medium">
                                {comment.comment_text}
                              </p>
                              <div className="mt-3 flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500 font-medium">
                                  {new Date(comment.created_time).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Comments Yet</h3>
                    <p className="text-gray-500">Comments and updates will appear here once they are added to this case.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents Submitted */}
            <Card className="border-none shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary-500" />
                  <span>Documents Submitted</span>
                </CardTitle>
                <CardDescription>Documents you have provided for this claim</CardDescription>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading documents...</p>
                  </div>
                ) : documents && documents.length > 0 ? (
                  <div className="space-y-4">
                    {documents.filter((doc) => doc.document_id != 5).map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-primary-500" />
                          <div>
                            <p className="font-medium text-gray-900">
                              Document 
                            </p>
                            <p className="text-sm text-gray-500">
                              Document ID: {doc.document_id}
                            </p>
                            <p className="text-xs text-gray-400">
                              {doc.file_path ? doc.file_path.split('/')[1]?.replace(/_upload_v1_/, ' ').replace(/-/g, ':').replace('T', ' ').replace('Z', '') : 'Path not available'}
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
                            disabled={viewingDocumentId === doc.document_id}
                          >
                            {viewingDocumentId === doc.document_id ? (
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
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No documents have been submitted yet for this case.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4 border-2 border-gray-300 hover:border-primary-500 rounded-xl transition-all duration-300"
                      onClick={() => navigate('/customer-upload')}
                    >
                      Upload Documents
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Case Progress */}
            <Card className="border-none shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Case Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Stage</label>
                  <p className="text-lg font-semibold text-gray-900">{claim.ticket_stage || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Case Type</label>
                  <p className="text-lg font-semibold text-primary-600">{claim.case_types?.case_type_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <p className="text-lg font-semibold text-gray-900">{claim.priority || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="text-lg font-semibold text-gray-900">{claim.start_date ? formatDateDDMMYYYY(claim.start_date) : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-lg font-semibold text-gray-900">{claim.last_updated ? formatDateDDMMYYYY(claim.last_updated) : 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-none shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full border-2 border-gray-300 hover:border-primary-500 rounded-xl transition-all duration-300"
                  onClick={() => navigate('/customer-portal')}
                >
                  Back to Portal
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-2 border-gray-300 hover:border-primary-500 rounded-xl transition-all duration-300"
                  onClick={() => window.print()}
                >
                  Print Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
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
              <h3 className="text-base sm:text-lg font-semibold text-gray-900"></h3>
              
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
                <div className="h-full w-full overflow-auto">
                  <iframe
                    src={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=1&statusbar=0&messages=0&scrollbar=1`}
                    className="w-full h-full border-0 rounded-lg"
                    title="Document Viewer"
                    style={{ 
                      minHeight: '100%',
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: 'top left',
                      width: `${100 / (zoomLevel / 100)}%`,
                      height: `${100 / (zoomLevel / 100)}%`
                    }}
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

export default CustomerClaimDetail;
