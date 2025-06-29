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
import CourseViewPage from "@/pages/CourseViewPage";
import EditCoursePage from "@/pages/EditCoursePage";
import PublicCoursePage from "@/pages/PublicCoursePage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import LearnCoursePage from "@/pages/LearnCoursePage";
import TestingPage from "@/pages/TestingPage";
import RatingDemoPage from "@/pages/RatingDemoPage";

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
                <Route path="/course/:slug" element={<PublicCoursePage />} />
                <Route path="/learn/:id" element={<LearnCoursePage />} />
                <Route path="/payment-success" element={<PaymentSuccessPage />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
                <Route path="/instructor/courses/new" element={<CreateCoursePage />} />
                <Route path="/instructor/courses/:id" element={<CourseViewPage />} />
                <Route path="/instructor/courses/:id/edit" element={<EditCoursePage />} />
                <Route path="/testing" element={<TestingPage />} />
                <Route path="/rating-demo" element={<RatingDemoPage />} />
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