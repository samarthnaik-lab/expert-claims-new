import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, AlertTriangle } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-none bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-8 pt-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                ExpertClaims
              </span>
              <p className="text-xs text-gray-500 font-medium">Access Denied</p>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Access Denied</CardTitle>
          <CardDescription className="text-gray-600 font-medium">
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 px-8 pb-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Sorry, you don't have the required permissions to access this page. 
              Please contact your administrator if you believe this is an error.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/')}
              className="w-full h-12 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
            >
              Go to Home
            </Button>
            
            <Button 
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full h-12 border-2 border-gray-300 hover:border-primary-500 text-gray-700 rounded-xl transition-all duration-300 font-semibold"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;


