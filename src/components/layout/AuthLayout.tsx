import React from 'react';
import AppShell from './AppShell';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  // New warm editorial layout — sidebar + content area.
  // ProtectedRoute/RoleBasedRoute handle auth redirects; AppShell handles the shell.
  return <AppShell>{children}</AppShell>;
};

export default AuthLayout;
