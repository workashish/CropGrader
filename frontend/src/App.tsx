import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AutoTranslate } from "@/components/AutoTranslate";
import Dashboard from "./pages/Dashboard";
import SingleGrader from "./pages/SingleGrader";
import BatchGrading from "./pages/BatchGrading";
import PriceEstimator from "./pages/PriceEstimator";
import AccuracyDashboard from "./pages/AccuracyDashboard";
import GradingHistory from "./pages/GradingHistory";
import PestDetection from "./pages/PestDetection";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <AutoTranslate>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/grader" element={<SingleGrader />} />
                          <Route path="/batch" element={<BatchGrading />} />
                          <Route path="/price" element={<PriceEstimator />} />
                          <Route path="/pest" element={<PestDetection />} />
                          <Route path="/accuracy" element={<AccuracyDashboard />} />
                          <Route path="/history" element={<GradingHistory />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </AutoTranslate>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
