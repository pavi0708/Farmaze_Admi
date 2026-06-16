import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import api from '@/api/authApi';
import { toast } from 'sonner';
import analytics from '@/services/analytics';
import sessionTracking from '@/services/sessionTracking';
import { getUserFromToken, isTokenExpired } from '@/utils/jwtDecoder';
import { branchApi, Branch } from '@/api/branchApi';

type AuthUser = {
  id: string;
  client_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  must_change_password?: boolean;
} | null;

type AuthContextType = {
  user: AuthUser;
  isLoggedIn: boolean;
  branches: Branch[];
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  refreshBranches: () => Promise<void>;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  clearMustChangePassword: () => void;
  signUp: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load branches when user is logged in
  const loadBranches = async () => {
    try {
      const fetchedBranches = await branchApi.listBranches();
      setBranches(fetchedBranches);

      // Restore selected branch from localStorage or select default
      const savedBranchId = localStorage.getItem('farmaze_selected_branch_id');
      const savedBranch = savedBranchId
        ? fetchedBranches.find(b => b.id === savedBranchId)
        : null;

      if (savedBranch) {
        setSelectedBranchState(savedBranch);
      } else {
        // Auto-select default branch
        const defaultBranch = fetchedBranches.find(b => b.is_default) || fetchedBranches[0] || null;
        setSelectedBranchState(defaultBranch);
        if (defaultBranch) {
          localStorage.setItem('farmaze_selected_branch_id', defaultBranch.id);
        }
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const setSelectedBranch = (branch: Branch | null) => {
    setSelectedBranchState(branch);
    if (branch) {
      localStorage.setItem('farmaze_selected_branch_id', branch.id);
    } else {
      localStorage.removeItem('farmaze_selected_branch_id');
    }
  };

  const refreshBranches = async () => {
    await loadBranches();
  };

  const loadClientName = async (): Promise<string | null> => {
    try {
      const res = await api.get('/b2bclients/details');
      return res.data?.company_name || res.data?.name || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('farmaze_token');
        
        if (storedToken) {
          // Check if token is expired
          if (isTokenExpired(storedToken)) {
            console.log('🔍 Token expired, clearing auth data');
            localStorage.removeItem('farmaze_user');
            localStorage.removeItem('farmaze_token');
            localStorage.removeItem('farmaze_refresh_token');
            return;
          }
          
          // Decode user from token
          const decodedUser = getUserFromToken(storedToken);
          if (decodedUser) {
            // Rehydrate must_change_password from the stored user record,
            // since it isn't in the JWT.
            let mustChange = false;
            try {
              const stored = localStorage.getItem('farmaze_user');
              if (stored) {
                mustChange = JSON.parse(stored)?.must_change_password === true;
              }
            } catch { /* ignore */ }
            const clientName = await loadClientName().catch(() => null);
            const user: AuthUser = { ...decodedUser, must_change_password: mustChange, name: clientName ?? undefined };
            console.log('🔍 Restored user from token:', user);
            setUser(user);
            setIsLoggedIn(true);

            // Initialize session tracking
            sessionTracking.setUserId(user.id);

            // Await branches so Dashboard doesn't get branchId change after mount
            try {
              await loadBranches();
            } catch (err) {
              console.error('Branch load on init failed:', err);
            }
          } else {
            console.log('🔍 Could not decode user from token, clearing auth data');
            localStorage.removeItem('farmaze_user');
            localStorage.removeItem('farmaze_token');
            localStorage.removeItem('farmaze_refresh_token');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear potentially corrupted auth data
        localStorage.removeItem('farmaze_user');
        localStorage.removeItem('farmaze_token');
        localStorage.removeItem('farmaze_refresh_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<void> => {
    try {
      const response = await authApi.login(usernameOrEmail, password);
      console.log('🔍 AuthContext - Full login response:', response);
      
      // Handle different response structures
      const tokenData = response.data || response;
      const token = tokenData.access_token || tokenData.token;
      const refreshToken = tokenData.refresh_token;
      
      if (!token) {
        throw new Error('No access token received from login response');
      }
      
      // Decode JWT token to extract user information
      const decodedUser = getUserFromToken(token);
      if (!decodedUser) {
        throw new Error('Invalid token - could not extract user information');
      }

      // The must_change_password flag isn't in the JWT claims; merge from the
      // login response body so the FirstLoginPasswordGate can read it.
      const user: AuthUser = {
        ...decodedUser,
        must_change_password: tokenData?.user?.must_change_password === true,
      };

      console.log('🔍 Decoded user from JWT:', user);

      localStorage.setItem('farmaze_token', token);
      if (refreshToken) {
        localStorage.setItem('farmaze_refresh_token', refreshToken);
      }
      localStorage.setItem('farmaze_user', JSON.stringify(user));

      setUser(user);
      setIsLoggedIn(true);

      // Initialize session tracking with user ID
      sessionTracking.setUserId(user.id);
      analytics.trackLogin('email_password', user.id);

      // Load branches + client name in background after login
      loadBranches().catch(err => console.error('Branch load after login failed:', err));
      loadClientName().then(name => {
        if (name) {
          setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, name };
            localStorage.setItem('farmaze_user', JSON.stringify(updated));
            return updated;
          });
        }
      }).catch(() => {});

      toast.success("Login successful", {
        description: "Welcome back to Farmaze"
      });

      const searchParams = new URLSearchParams(location.search);
      const returnTo = searchParams.get('returnTo');
      
      const from = returnTo || location.state?.from || '/orders';
      
      const pendingProductId = localStorage.getItem('pendingProductId');
      const pendingAction = localStorage.getItem('pendingAction');
      
      if (pendingProductId && pendingAction) {
        localStorage.removeItem('pendingProductId');
        localStorage.removeItem('pendingAction');
      }
      
      navigate(from);
    } catch (error: any) {
      console.error('🚨 Login error in AuthContext:', {
        error,
        response: error.response,
        responseData: error.response?.data,
        message: error.message,
        fullErrorStructure: JSON.stringify(error, null, 2)
      });
      
      // Try to extract error message from different possible locations
      let errorMessage = "Please check your credentials and try again";
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data && typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('🔍 Final error message to display:', errorMessage);
      console.log('🍞 About to call toast.error with:', errorMessage);
      
      // Make sure toast is being called
      const toastResult = toast.error("Failed to log in", {
        description: errorMessage
      });
      
      console.log('🍞 Toast result:', toastResult);
      
      throw error;
    }
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    try {
      const { data, message } = await authApi.signUp(email, password);
      
      if (data.token) {
        localStorage.setItem('farmaze_token', data.token);
        localStorage.setItem('farmaze_user', JSON.stringify(data.user));
        
        setUser(data.user);
        setIsLoggedIn(true);
      }

      toast.success("Registration successful", {
        description: data.token ? "You are now logged in" : "Please check your email for verification"
      });

      if (data.token) {
        navigate('/orders');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error("Failed to sign up", {
        description: error.response?.data?.message || "Please try again with a different email"
      });
      throw error;
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      await authApi.loginWithGoogle();
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error("Failed to log in with Google", {
        description: "Please try again later"
      });
      throw error;
    }
  };

  const requestOtp = async (phone: string): Promise<void> => {
    try {
      await authApi.requestOtp(phone);
      
      toast.success("OTP sent successfully", {
        description: "Please check your phone for the verification code"
      });
    } catch (error: any) {
      console.error('OTP request error:', error);
      toast.error("Failed to send OTP", {
        description: error.response?.data?.message || "Please check your phone number and try again"
      });
      throw error;
    }
  };

  const verifyOtp = async (phone: string, otp: string): Promise<void> => {
    try {
      const { data, message } = await authApi.verifyOtp(phone, otp);
      
      localStorage.setItem('farmaze_token', data.token);
      localStorage.setItem('farmaze_user', JSON.stringify(data.user));
      
      setUser(data.user);
      setIsLoggedIn(true);

      toast.success("Phone verification successful", {
        description: "You are now logged in"
      });

      navigate('/orders');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error("Failed to verify OTP", {
        description: error.response?.data?.message || "Please check the verification code and try again"
      });
      throw error;
    }
  };

  const clearMustChangePassword = () => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, must_change_password: false };
      try {
        localStorage.setItem('farmaze_user', JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  };

  const logout = async (): Promise<void> => {
    try {
      const userId = user?.id;

      // End session tracking
      sessionTracking.endSession();

      setUser(null);
      setIsLoggedIn(false);
      setBranches([]);
      setSelectedBranchState(null);
      localStorage.removeItem('farmaze_selected_branch_id');

      await authApi.logout();
      
      toast.info("You have been logged out successfully");
      
      navigate('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // End session even on error
      sessionTracking.endSession();
      
      navigate('/login');
      toast.info("You have been logged out");
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn,
      branches,
      selectedBranch,
      setSelectedBranch,
      refreshBranches,
      login,
      clearMustChangePassword,
      signUp,
      loginWithGoogle,
      requestOtp,
      verifyOtp,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
