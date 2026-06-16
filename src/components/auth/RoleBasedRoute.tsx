import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  allowedRoles, 
  fallbackPath = '/orders' 
}) => {
  const { user, isLoggedIn } = useAuth();
  const location = useLocation();

  // First check if user is logged in
  if (!isLoggedIn) {
    return <Navigate 
      to="/login" 
      state={{ 
        from: location.pathname + location.search, 
        message: "Please log in to access this page" 
      }} 
      replace 
    />;
  }

  // Check if user has the required role
  const userRole = user?.role;
  const hasRequiredRole = userRole && allowedRoles.includes(userRole);

  if (!hasRequiredRole) {
    return <Navigate 
      to={fallbackPath} 
      state={{ 
        message: "You don't have permission to access this page" 
      }} 
      replace 
    />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
