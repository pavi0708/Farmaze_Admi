import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import FirstLoginPasswordGate from "./components/auth/FirstLoginPasswordGate";
import AuthLayout from "./components/layout/AuthLayout";
import PublicLayout from "./components/layout/PublicLayout";
import NotFound from "./pages/NotFound";
// Products page removed — use /smart-order instead
import Orders from "./pages/Orders";
import GRN from "./pages/GRN";
import OrderDetails from "./pages/OrderDetails";
import OrderScanner from "./pages/OrderScanner";
import Analytics from "./pages/Analytics";
import RoleBasedRoute from "./components/auth/RoleBasedRoute";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import GoogleCallback from "./pages/GoogleCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Invoices from "./pages/Invoices";
import InvoiceDetails from "./pages/InvoiceDetails";
import SmartOrder from "./pages/SmartOrder";
import OrderSuccess from "./pages/OrderSuccess";
import AIOrderForecast from "./pages/AIOrderForecast";
import Intelligence from "./pages/Intelligence";
import Dashboard from "./pages/Dashboard";
import Cart from "./pages/Cart";
// ProcurementOverview removed — was a placeholder
// SupplierManagement removed — exists as separate page
import ForecastDashboard from "./pages/procurement/ForecastDashboard";
// WasteReport removed — exists as separate page
// OrderHistory removed — exists as separate page
import PriceIntelligence from "./pages/procurement/PriceIntelligence";
import ProcurementAgent from "./pages/procurement/ProcurementAgent";
import InsightsAgent from "./pages/InsightsAgent";
import Onboarding from "./pages/Onboarding";
import OnboardingSetup from "./pages/OnboardingSetup";
import Today from "./pages/Today";
import PendingConfirmations from "./pages/PendingConfirmations";
import VendorList from "./pages/VendorList";
import VendorProfile from "./pages/VendorProfile";
import SharedConversation from "./pages/SharedConversation";
import ProcurementChat from "./pages/ProcurementChat";
import MyProducts from "./pages/MyProducts";
import Users from "./pages/Users";
import SupplySetup from "./pages/SupplySetup";
import ComplaintForm from "./pages/ComplaintForm";
import ComplaintDetail from "./pages/ComplaintDetail";
import Support from "./pages/Support";
import Variance from "./pages/Variance";
import { useAuth } from "./context/AuthContext";
import { useOnboarding } from "./hooks/useOnboarding";
import { FloatingChat } from "./components/chat/FloatingChat";
import analytics from "./services/analytics";
import sessionTracking from "./services/sessionTracking";
import { useActivityTracking } from "./hooks/useActivityTracking";
import { useEffect } from "react";

// Create a redirection component for the root path — role-aware + onboarding-aware
const RootRedirect = () => {
  const { user, isLoggedIn } = useAuth();
  const { needsOnboarding } = useOnboarding();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  return user?.role === 'client_admin'
    ? <Navigate to="/insights" replace />
    : <Navigate to="/smart-order" replace />;
};

// Component to conditionally render FloatingChat for authenticated users only
const AuthenticatedFloatingChat = () => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <FloatingChat /> : null;
};

const queryClient = new QueryClient();

// Analytics wrapper component
const AnalyticsWrapper = ({ children }: { children: React.ReactNode }) => {
  useActivityTracking();

  useEffect(() => {
    // Initialize GA4 and session tracking on app start
    analytics.init();
    sessionTracking.init();
  }, []);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnalyticsWrapper>
          <AuthProvider>
            <CartProvider>
            <Routes>
              {/* Root path now uses the RootRedirect component */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Onboarding — full-screen wizard, no AppShell */}
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingSetup />
                </ProtectedRoute>
              } />

              {/* Insights — client_admin only */}
              <Route path="/insights" element={
                <RoleBasedRoute allowedRoles={['client_admin']} fallbackPath="/smart-order">
                  <AuthLayout>
                    <InsightsAgent />
                  </AuthLayout>
                </RoleBasedRoute>
              } />

              {/* Protected routes */}
              <Route path="/products" element={<Navigate to="/smart-order" replace />} />
              <Route path="/cart" element={
                <RoleBasedRoute allowedRoles={['client']} fallbackPath="/insights">
                  <AuthLayout>
                    <Cart />
                  </AuthLayout>
                </RoleBasedRoute>
              } />
              <Route path="/orders" element={
                <RoleBasedRoute allowedRoles={['client']} fallbackPath="/insights">
                  <AuthLayout>
                    <Orders />
                  </AuthLayout>
                </RoleBasedRoute>
              } />
              <Route path="/orders/scan" element={
                <ProtectedRoute>
                  <OrderScanner />
                </ProtectedRoute>
              } />
              <Route path="/order/success/:orderId" element={
                <ProtectedRoute>
                  <AuthLayout>
                    <OrderSuccess />
                  </AuthLayout>
                </ProtectedRoute>
              } />
              <Route path="/order/:orderId" element={
                <ProtectedRoute>
                  <AuthLayout>
                    <OrderDetails />
                  </AuthLayout>
                </ProtectedRoute>
              } />
              <Route path="/order/:orderId/complaint" element={
                <ProtectedRoute>
                  <AuthLayout>
                    <ComplaintForm />
                  </AuthLayout>
                </ProtectedRoute>
              } />
              <Route path="/complaints/:complaintId" element={
                <ProtectedRoute>
                  <AuthLayout>
                    <ComplaintDetail />
                  </AuthLayout>
                </ProtectedRoute>
              } />
              <Route path="/support" element={
                <RoleBasedRoute allowedRoles={['client']} fallbackPath="/insights">
                  <AuthLayout>
                    <Support />
                  </AuthLayout>
                </RoleBasedRoute>
              } />
               <Route path="/invoices" element={
                 <ProtectedRoute>
                   <AuthLayout>
                     <Invoices />
                   </AuthLayout>
                 </ProtectedRoute>
               } />
                <Route path="/analytics" element={
                  <RoleBasedRoute allowedRoles={['client_admin']}>
                    <AuthLayout>
                      <Analytics />
                    </AuthLayout>
                  </RoleBasedRoute>
                } />
                <Route path="/dashboard" element={
                  <RoleBasedRoute allowedRoles={['client_admin']} fallbackPath="/smart-order">
                    <AuthLayout>
                      <Dashboard />
                    </AuthLayout>
                  </RoleBasedRoute>
                } />
                <Route path="/users" element={
                  <RoleBasedRoute allowedRoles={['client_admin']} fallbackPath="/smart-order">
                    <AuthLayout>
                      <Users />
                    </AuthLayout>
                  </RoleBasedRoute>
                } />
                <Route path="/setup" element={
                  <ProtectedRoute>
                    <AuthLayout>
                      <SupplySetup />
                    </AuthLayout>
                  </ProtectedRoute>
                } />
               <Route path="/invoice/:invoiceId" element={
                 <ProtectedRoute>
                   <AuthLayout>
                     <InvoiceDetails />
                   </AuthLayout>
                 </ProtectedRoute>
               } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <AuthLayout>
                    <Profile />
                  </AuthLayout>
                </ProtectedRoute>
              } />
              <Route path="/smart-order" element={
                <RoleBasedRoute allowedRoles={['client']} fallbackPath="/insights">
                  <AuthLayout>
                    <SmartOrder />
                  </AuthLayout>
                </RoleBasedRoute>
              } />
              <Route path="/chat-order" element={
                <RoleBasedRoute allowedRoles={['client']} fallbackPath="/insights">
                  <AuthLayout>
                    <ProcurementChat />
                  </AuthLayout>
                </RoleBasedRoute>
              } />
              <Route path="/ai-forecast" element={
                <ProtectedRoute>
                  <AuthLayout>
                    <AIOrderForecast />
                  </AuthLayout>
                </ProtectedRoute>
              } />
              {/* Intelligence page removed — was using mock data */}

              {/* Redirects for old routes */}
              <Route path="/branches" element={<Navigate to="/my-products?tab=branches" replace />} />
              <Route path="/my-suppliers" element={<Navigate to="/my-products?tab=suppliers" replace />} />

              {/* My Business — Products, Branches, Suppliers */}
              <Route path="/my-products" element={
                <ProtectedRoute>
                  <AuthLayout>
                    <MyProducts />
                  </AuthLayout>
                </ProtectedRoute>
              } />

              {/* Procurement routes */}
              {/* /procurement removed — placeholder, use /chat-order for Procurement Agent */}
              <Route path="/procurement/forecast" element={<RoleBasedRoute allowedRoles={['client']} fallbackPath="/insights"><AuthLayout><ForecastDashboard /></AuthLayout></RoleBasedRoute>} />
              <Route path="/procurement/agent" element={<RoleBasedRoute allowedRoles={['client']} fallbackPath="/insights"><AuthLayout><ProcurementAgent /></AuthLayout></RoleBasedRoute>} />
              <Route path="/procurement/prices" element={<RoleBasedRoute allowedRoles={['client']} fallbackPath="/insights"><AuthLayout><PriceIntelligence /></AuthLayout></RoleBasedRoute>} />
              {/* Removed: suppliers, waste, orders — exist as separate pages */}

              {/* Shared Conversation — requires login, only owning client + admins */}
              <Route path="/shared/:token" element={
                <ProtectedRoute>
                  <AuthLayout>
                    <SharedConversation />
                  </AuthLayout>
                </ProtectedRoute>
              } />

              {/* ── Daily-ops routes (client — staff/kitchen manager) ── */}
              <Route path="/today" element={
                <RoleBasedRoute allowedRoles={['client']} fallbackPath="/insights">
                  <AuthLayout><Today /></AuthLayout>
                </RoleBasedRoute>
              } />
              <Route path="/grn/:orderId?" element={
                <RoleBasedRoute allowedRoles={['client']} fallbackPath="/insights">
                  <AuthLayout><GRN /></AuthLayout>
                </RoleBasedRoute>
              } />
              <Route path="/confirm" element={
                <RoleBasedRoute allowedRoles={['client']} fallbackPath="/insights">
                  <AuthLayout><PendingConfirmations /></AuthLayout>
                </RoleBasedRoute>
              } />
              {/* /inbox is the AppShell nav entry point → same page */}
              <Route path="/inbox" element={
                <RoleBasedRoute allowedRoles={['client']} fallbackPath="/insights">
                  <AuthLayout><PendingConfirmations /></AuthLayout>
                </RoleBasedRoute>
              } />
              <Route path="/vendors" element={
                <RoleBasedRoute allowedRoles={['client']} fallbackPath="/insights">
                  <AuthLayout><VendorList /></AuthLayout>
                </RoleBasedRoute>
              } />
              <Route path="/vendors/:id" element={
                <RoleBasedRoute allowedRoles={['client']} fallbackPath="/insights">
                  <AuthLayout><VendorProfile /></AuthLayout>
                </RoleBasedRoute>
              } />
              <Route path="/variance" element={
                <RoleBasedRoute allowedRoles={['client']} fallbackPath="/insights">
                  <AuthLayout><Variance /></AuthLayout>
                </RoleBasedRoute>
              } />

              {/* Temporary preview route — no auth needed */}
              <Route path="/preview-dashboard" element={<AuthLayout><Dashboard /></AuthLayout>} />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AuthenticatedFloatingChat />
            <FirstLoginPasswordGate />
          </CartProvider>
        </AuthProvider>
        </AnalyticsWrapper>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
