import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Shield, FileText, User, Calendar, Phone, Mail, MapPin, DollarSign, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { ClaimService, ClaimDetail } from '@/services/claimService';
import { useToast } from '@/hooks/use-toast';

const PartnerClaimDetail = () => {
  const { case_id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);



  const { toast } = useToast();

  useEffect(() => {
    fetchClaimDetails();
  }, [case_id]);

  const fetchClaimDetails = async () => {
    if (!case_id) return;
    
    setLoading(true);
    try {
      // Use mock session data for now - replace with real auth when available
      const sessionId = 'a9bfe0a4-1e6c-4c69-860f-ec50846a7da6';
      const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiIsInBhc3N3b3JkIjoiIiwiaWF0IjoxNzU2NTQ3MjAzfQ.rW9zIfo1-B_Wu2bfJ8cPai0DGZLfaapRE7kLt2dkCBc';
            const sessionStr = localStorage.getItem("expertclaims_session");

  const session = JSON.parse(sessionStr);

  let partnerId = session.userId || "1";
      const claimData = await ClaimService.getClaimDetails(case_id, sessionId, jwtToken, partnerId);
      if (claimData) {
        setClaim(claimData);
      }
    } catch (error) {
      console.error('Error fetching claim details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch claim details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBonusStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress': return <Clock className="h-5 w-5 text-blue-600" />;
      case 'pending': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'cancelled': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Claim Not Found</h2>
              <p className="text-gray-600 mb-6">The claim you're looking for doesn't exist or you don't have access to it.</p>
              <Button onClick={() => navigate('/partner-dashboard')} className="bg-primary-500 hover:bg-primary-600">
                Back to Dashboard
              </Button>
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
                onClick={() => navigate('/partner-dashboard')}
                className="bg-white text-blue-600 border-2 border-gray-300 hover:bg-gray-50 hover:text-black rounded-xl transition-all duration-200 flex items-center space-x-2 px-4 py-2"
              >
                <ArrowLeft className="h-4 w-4 text-blue-600 group-hover:text-black" />
                <span className="text-blue-600 hover:text-black font-medium">Back</span>
              </Button>
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Claim Details
                </h1>
                <p className="text-xs text-white/80 font-medium">{claim.case_id} • {claim.partners?.first_name || 'Unknown'} {claim.partners?.last_name || 'Partner'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-white text-gray-700 px-4 py-2 rounded-full font-medium flex items-center space-x-2 border border-gray-200">
                {getStatusIcon(claim.ticket_stage || 'Unknown')}
                <span className="capitalize">{claim.ticket_stage || 'Unknown Status'}</span>
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
                    <p className="text-lg font-semibold text-gray-900">{claim.case_types?.case_type_name || 'Unknown Type'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <p className="text-lg font-semibold text-gray-900">{claim.priority || 'Not Set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Due Date</label>
                    <p className="text-lg font-semibold text-gray-900">{claim.due_date || 'Not Set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Case Value</label>
                    <p className="text-lg font-semibold text-green-600">₹{(claim.case_value || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Referral Date</label>
                    <p className="text-lg font-semibold text-gray-900">{claim.referral_date || (claim.created_time ? claim.created_time.split('T')[0] : 'N/A')}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 mt-1">{claim.case_description || 'No description available'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Partner & Case Information */}
            <Card className="border-none shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary-500" />
                  <span>Partner & Case Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Partner Name</label>
                    <p className="text-lg font-semibold text-gray-900">{claim.partners?.first_name || 'Unknown'} {claim.partners?.last_name || 'Partner'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Partner ID</label>
                    <p className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{claim.partners?.partner_id || 'N/A'}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer ID</label>
                    <p className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{claim.customer_id || 'N/A'}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Referring Partner ID</label>
                    <p className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{claim.referring_partner_id || 'N/A'}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Referral Bonus Status */}
            <Card className="border-none shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <span>Referral Bonus</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Estimated Bonus</label>
                  <p className="text-2xl font-bold text-green-600">₹{claim.bonus_eligible ? ((claim.case_value || 0) * 0.1).toLocaleString() : '0'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Bonus Status</label>
                  <Badge className={`${getBonusStatusColor(claim.bonus_eligible ? 'approved' : 'pending')} px-3 py-1 rounded-full font-medium mt-1`}>
                    {claim.bonus_eligible ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Bonus Eligible</label>
                  <p className="text-lg font-semibold text-gray-900">{claim.bonus_eligible ? 'Yes' : 'No'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Case Progress */}
            <Card className="border-none shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Case Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Stage</label>
                  <p className="text-lg font-semibold text-gray-900">{claim.ticket_stage || 'Unknown Status'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <p className="text-lg font-semibold text-primary-600">{claim.priority || 'Not Set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-lg font-semibold text-gray-900">{claim.updated_time ? claim.updated_time.split('T')[0] : 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerClaimDetail;
