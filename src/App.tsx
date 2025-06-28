
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/components/auth/AuthPage";
import CoursesPage from "@/pages/CoursesPage";
import NotFound from "./pages/NotFound";
import AdminDashboard from "@/pages/AdminDashboard";
import InstructorDashboard from "@/pages/InstructorDashboard";
import CreateCoursePage from "@/pages/CreateCoursePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-white">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
                <Route path="/instructor/courses/new" element={<CreateCoursePage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
