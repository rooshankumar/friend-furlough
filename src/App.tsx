import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import ChatPage from "./pages/ChatPage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";
import SignUpPage from "./pages/auth/SignUpPage";
import SignInPage from "./pages/auth/SignInPage";
import WelcomePage from "./pages/onboarding/WelcomePage";
import CulturalProfilePage from "./pages/onboarding/CulturalProfilePage";
import LearningGoalsPage from "./pages/onboarding/LearningGoalsPage";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, onboardingCompleted } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }
  
  if (!onboardingCompleted) {
    return <Navigate to="/onboarding/cultural-profile" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
        <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* Authentication Routes */}
            <Route path="/auth/signup" element={<SignUpPage />} />
            <Route path="/auth/signin" element={<SignInPage />} />
            
            {/* Onboarding Routes */}
            <Route path="/onboarding/welcome" element={<WelcomePage />} />
            <Route path="/onboarding/cultural-profile" element={<CulturalProfilePage />} />
            <Route path="/onboarding/learning-goals" element={<LearningGoalsPage />} />
            
            {/* Protected Routes */}
            <Route path="/explore" element={
              <ProtectedRoute>
                <ExplorePage />
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } />
            <Route path="/chat/:conversationId" element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/profile/:username" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
