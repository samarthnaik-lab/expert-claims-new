import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, isLoading, session, userDetails } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    // Use session role first, fallback to userDetails role or designation
    const userRole = session?.userRole || userDetails?.role || userDetails?.designation;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log('Role check failed:', { 
        userRole, 
        allowedRoles, 
        sessionRole: session?.userRole,
        userDetailsRole: userDetails?.role,
        userDetailsDesignation: userDetails?.designation
      });
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};


