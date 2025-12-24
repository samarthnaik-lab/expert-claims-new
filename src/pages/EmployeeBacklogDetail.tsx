import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, RefreshCw, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmployeeService } from '@/services/employeeService';
import { formatDateDDMMYYYY } from '@/lib/utils';
import { buildApiUrl } from '@/config/api';

// User interface for dropdown
interface User {
  id: string;
  full_name: string;
}

const EmployeeBacklogDetail = () => {
  const { backlogId } = useParams<{ backlogId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [backlogDetail, setBacklogDetail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Users for assignment dropdown
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');

  // Fetch backlog details
  const fetchBacklogDetail = async () => {
    if (!backlogId) return;
    
    setIsLoading(true);
    try {
      console.log('Fetching backlog details for:', backlogId);
      
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
      
      const response = await fetch(`${buildApiUrl('support/backlog_id')}?backlog_id=${backlogId}`, {
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
        console.log('Backlog detail:', result);
        
        if (Array.isArray(result) && result.length > 0) {
          setBacklogDetail(result[0]);
        }
      } else {
        console.error('Failed to fetch backlog details:', response.status);
        toast({
          title: "Error",
          description: "Failed to fetch backlog details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching backlog details:', error);
      toast({
        title: "Error",
        description: "An error occurred while fetching backlog details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch users for assignment dropdown
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
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

      console.log('Fetching users for assignment...');
      
      const employeesData = await EmployeeService.getEmployees(sessionId, jwtToken);
      console.log('Received employees from API:', employeesData);

      // Transform employee data to match the User interface
      const transformedUsers = employeesData.map((employee) => ({
        id: employee.employee_id.toString(),
        full_name: employee.employee_name,
      }));

      console.log('Transformed users:', transformedUsers);
      setUsers(transformedUsers);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Warning",
        description: "Failed to load employees for assignment",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Function to handle assign action
  const handleAssign = async () => {
    if (!backlogId) return;
    
    setIsAssigning(true);
    try {
      console.log('Assigning backlog item:', backlogId);
      
      if (!assignedTo) {
        toast({
          title: "Error",
          description: "Please select an employee to assign this task to",
          variant: "destructive",
        });
        return;
      }

      // Get the selected user's name
      const selectedUser = users.find(user => user.id === assignedTo);
      const assignedUserName = selectedUser ? selectedUser.full_name : 'Unknown User';

      // Prepare the payload
      const payload = {
        backlog_id: backlogId,
        assigned_to: parseInt(assignedTo),
        assigned_user_name: assignedUserName,
        case_summary: backlogDetail.case_summary,
        case_description: backlogDetail.case_description,
        case_type_name: backlogDetail.case_types?.case_type_name || `Type ${backlogDetail.case_type_id}` || "N/A",
        backlog_referring_partner_id: backlogDetail.backlog_referring_partner_id,
        backlog_referral_date: backlogDetail.backlog_referral_date,
        assigned_date: new Date().toISOString(),
        status: 'assigned',
        created_by: backlogDetail.created_by,
        updated_by: backlogDetail.updated_by,
        comment_text: backlogDetail.comment_text,
        // Add document data if available - same format as PartnerNewTask
        documents: backlogDetail.documents || [],
        document_count: backlogDetail.documents?.length || 0,
        selected_document_type: backlogDetail.selected_document_type || "",
        selected_document_type_name: backlogDetail.selected_document_type_name || ""
      };

      console.log('Sending assignment payload:', payload);

      // Call the assignment API
      const response = await fetch('https://n8n.srv952553.hstgr.cloud/webhook/evaluatortaskassigned', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'content-type': 'application/json',
          'session_id': '0276776c-99fa-4b79-a5a2-70f3a428a0c7',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3ODYsImV4cCI6MjA3MDQ4Mjc4Nn0.Ssi2327jY_9cu5lQorYBdNjJJBWejz91j_kCgtfaj0o',
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3ODYsImV4cCI6MjA3MDQ4Mjc4Nn0.Ssi2327jY_9cu5lQorYBdNjJJBWejz91j_kCgtfaj0o'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Assignment API response:', result);
        
        // Extract success message from API response
        const successMessage = result[0]?.message || `Backlog item #${backlogId} assigned to ${assignedUserName}`;
        
        toast({
          title: "Success",
          description: successMessage,
        });
        
        // Navigate back to dashboard
        navigate('/employee-dashboard?tab=Backlog');
      } else {
        const errorText = await response.text();
        console.error('Failed to assign backlog item:', response.status, errorText);
        toast({
          title: "Error",
          description: `Failed to assign the backlog item: ${response.status} - ${errorText}`,
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Error assigning backlog item:', error);
      toast({
        title: "Error",
        description: "An error occurred while assigning the backlog item",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  useEffect(() => {
    fetchBacklogDetail();
    fetchUsers();
  }, [backlogId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading backlog details...</span>
        </div>
      </div>
    );
  }

  if (!backlogDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Backlog Not Found</h2>
          <p className="text-gray-600 mb-4">The requested backlog item could not be found.</p>
          <Button onClick={() => navigate('/employee-dashboard?tab=Backlog')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Backlog Case Details
              </h2>
              <p className="text-gray-600">
                Complete information about the selected backlog case
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/employee-dashboard?tab=Backlog')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </div>
          
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Case ID: #{backlogDetail.backlog_id}
                  </h3>
                  <p className="text-lg text-gray-700 font-medium">
                    {backlogDetail.case_summary || "No Summary Available"}
                  </p>
                </div>
                <Badge
                  className={`${backlogDetail.deleted_flag ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"} px-4 py-2 text-sm font-semibold`}
                >
                  {backlogDetail.deleted_flag ? "Deleted" : "Active"}
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
                      <Label className="text-sm font-medium text-gray-500">Case Summary</Label>
                      <p className="text-gray-900 font-medium">
                        {backlogDetail.case_summary || "No summary available"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Case Description</Label>
                      <p className="text-gray-700">
                        {backlogDetail.case_description || "No description available"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Case Type Name</Label>
                      <p className="text-gray-900 font-medium">
                        {backlogDetail.case_types?.case_type_name || `Type ${backlogDetail.case_type_id}` || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Referring Partner ID</Label>
                      <p className="text-gray-900 font-medium">
                        {backlogDetail.backlog_referring_partner_id || "N/A"}
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
                      <Label className="text-sm font-medium text-gray-500">Referral Date</Label>
                      <p className="text-gray-900 font-medium">
                        {backlogDetail.backlog_referral_date || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Created Time</Label>
                      <p className="text-gray-700">
                        {backlogDetail.created_time ? formatDateDDMMYYYY(backlogDetail.created_time) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Updated Time</Label>
                      <p className="text-gray-700">
                        {backlogDetail.updated_time ? formatDateDDMMYYYY(backlogDetail.updated_time) : "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Assignment Section */}
                <Card className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-900">Assignment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="assigned-to">Assigned To</Label>
                      <Select
                        value={assignedTo}
                        onValueChange={setAssignedTo}
                      >
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingUsers ? (
                            <SelectItem value="loading" disabled>
                              Loading employees...
                            </SelectItem>
                          ) : users.length > 0 ? (
                            users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.full_name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-users" disabled>
                              No employees available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Comments Section */}
                {backlogDetail.comment_text && (
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-gray-900">Comments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <p className="text-gray-700 leading-relaxed">
                          {backlogDetail.comment_text}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Documents Section */}
                {backlogDetail.documents && backlogDetail.documents.length > 0 && (
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-gray-900">Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {backlogDetail.documents.map((doc: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {doc.document_name || doc.name || `Document ${index + 1}`}
                                </p>
                                {doc.document_type && (
                                  <p className="text-sm text-gray-600">
                                    Type: {doc.document_type}
                                  </p>
                                )}
                                {doc.file_size && (
                                  <p className="text-sm text-gray-600">
                                    Size: {doc.file_size}
                                  </p>
                                )}
                              </div>
                              {doc.document_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(doc.document_url, '_blank')}
                                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              )}
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
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => navigate('/employee-dashboard?tab=Backlog')}
                className="border-2 border-gray-300 hover:border-gray-400"
              >
                Close
              </Button>
              <Button
                onClick={handleAssign}
                disabled={isAssigning || !assignedTo}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isAssigning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Assign
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeBacklogDetail;
