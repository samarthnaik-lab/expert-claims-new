import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, FileText, Clock, ZoomIn, ZoomOut, RotateCcw, XCircle } from "lucide-react";
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

const PartnerBacklogDetail = () => {
  const navigate = useNavigate();
  const { backlogId } = useParams<{ backlogId: string }>();
  const [backlogDetail, setBacklogDetail] = useState<BacklogDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [partnerName, setPartnerName] = useState<string>('');
  const [caseTypes, setCaseTypes] = useState<Array<{case_type_id: number, case_type_name: string}>>([]);
  const [selectedCaseType, setSelectedCaseType] = useState<string>("");
  
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

  useEffect(() => {
    if (backlogId) {
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

  const fetchCaseTypes = async () => {
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
        setPartnerName(name);
        console.log('Partner name from user details:', name);
        return;
      }

      setPartnerName('Partner');
    } catch (error) {
      console.error('Error getting partner name:', error);
      setPartnerName('Partner');
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

      // Use localhost:3000 API endpoint
      const response = await fetch(
        `http://localhost:3000/api/backlog_id?backlog_id=${id}`,
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
        console.log("API Response data:", data);
        if (data && data.length > 0) {
          console.log("Backlog detail data[0]:", data[0]);
          console.log("Comment text value:", data[0].comment_text);
          setBacklogDetail(data[0]);
          setSelectedCaseType(data[0].case_type_id?.toString() || "");
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
                <CardTitle className="text-2xl font-bold">Policy Details</CardTitle>
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
              <CardTitle className="text-2xl font-bold">Assignment Details</CardTitle>
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
                  <h2 className="text-xl font-semibold">Assignment ID: #{backlogDetail.backlog_id}</h2>
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

            {/* Task Summary */}
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Assignment Summary</h3>
              <p className="text-gray-700">{backlogDetail.case_summary}</p>
            </div>

            {/* Task Description */}
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Policy Description</h3>
              <p className="text-gray-700">{backlogDetail.case_description}</p>
            </div>

            {/* Task Details Grid */}
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
              </div>
            </div>

            {/* Partner Feedback Section - Only show if feedback exists */}
            {backlogDetail.feedback && backlogDetail.feedback.trim() !== '' && (
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Feedback</h3>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Comments</h3>
              {backlogDetail.backlog_comments && backlogDetail.backlog_comments.length > 0 ? (
                <div className="space-y-3">
                  {backlogDetail.backlog_comments.map((comment, index) => (
                    <div key={comment.backlog_commentid || index} className="bg-white p-4 rounded-lg border">
                      <p className="text-gray-700 mb-2">{comment.comment_text}</p>
                      <div className="text-xs text-gray-500 flex justify-between">
                      <span>
                        By: {comment.department === "technical_consultant"
                          ? "Expert"
                          : comment.department === "gap_analysis"
                          ? "By ECS"
                          : comment.department === "partner"
                          ? "Partner"
                          : "No role found"}
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

            {/* Documents Section - Only show if task is not deleted and there are documents */}
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
                            <p className="text-xs text-gray-400">
                                Service types: {selectedCaseType 
                                  ? caseTypes.find(ct => ct.case_type_id.toString() === selectedCaseType)?.case_type_name 
                                  : backlogDetail.case_types?.case_type_name || `Type ${backlogDetail.case_type_id}`}
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

export default PartnerBacklogDetail;
