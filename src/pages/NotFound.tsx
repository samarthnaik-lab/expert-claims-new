
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-emerald-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 text-center px-4 animate-fade-in">
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-md max-w-md mx-auto">
          <CardContent className="p-8">
            {/* 404 Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full mb-6 shadow-lg">
              <Search className="h-10 w-10 text-white" />
            </div>

            {/* Error Message */}
            <h1 className="text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
              404
            </h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
              >
                <Home className="mr-2 h-4 w-4" />
                Return Home
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate(-1)}
                className="border-2 border-gray-300 hover:border-primary-500 px-6 py-3 rounded-xl transition-all duration-300 font-semibold"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
