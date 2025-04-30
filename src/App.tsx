
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import RegisterPage from "./pages/auth/RegisterPage";
import LoginPage from "./pages/auth/LoginPage";
import PublicBookingPage from "./pages/booking/PublicBookingPage";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ServicesPage from "./pages/dashboard/ServicesPage";
import NewServicePage from "./pages/dashboard/NewServicePage";
import AvailabilityPage from "./pages/dashboard/AvailabilityPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import PlansPage from "./pages/dashboard/PlansPage";
import { PrivateRoute } from "./components/auth/PrivateRoute";
import { SubscriptionProvider } from "./hooks/useSubscription";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SubscriptionProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/booking/:username" element={<PublicBookingPage />} />
            
            {/* Protected Dashboard routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="services/new" element={<NewServicePage />} />
                <Route path="availability" element={<AvailabilityPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="plans" element={<PlansPage />} />
              </Route>
            </Route>
            
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SubscriptionProvider>
  </QueryClientProvider>
);

export default App;
