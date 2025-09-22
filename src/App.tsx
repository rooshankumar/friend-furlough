import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";
import SignUpPage from "./pages/auth/SignUpPage";
import SignInPage from "./pages/auth/SignInPage";
import CulturalProfilePage from "./pages/onboarding/CulturalProfilePage";
import LearningGoalsPage from "./pages/onboarding/LearningGoalsPage";

const queryClient = new QueryClient();

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
            <Route path="/explore" element={<ExplorePage />} />
            
            {/* Authentication Routes */}
            <Route path="/auth/signup" element={<SignUpPage />} />
            <Route path="/auth/signin" element={<SignInPage />} />
            
            {/* Onboarding Routes */}
            <Route path="/onboarding/cultural-profile" element={<CulturalProfilePage />} />
            <Route path="/onboarding/learning-goals" element={<LearningGoalsPage />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
