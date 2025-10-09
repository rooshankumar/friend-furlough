import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuthStore } from "./stores/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import ConnectionStatus from "./components/ConnectionStatus";
import Navigation from "./components/Navigation";
import InstallPWA from "./components/InstallPWA";
import PerformanceMonitor from "./components/PerformanceMonitor";
import { useAppDataPreloader } from "./hooks/useDataPreloader";
import { useGlobalSync } from "./hooks/useGlobalSync";
import { globalDataManager } from "./lib/globalDataManager";

// Lazy load pages for better performance
const HomePage = React.lazy(() => import("./pages/HomePage"));
const ExplorePage = React.lazy(() => import("./pages/ExplorePage"));
const ChatPage = React.lazy(() => import("./pages/ChatPage"));
const CommunityPage = React.lazy(() => import("./pages/CommunityPage"));
const PostDetailPage = React.lazy(() => import("./pages/PostDetailPage"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));
const EventsPage = React.lazy(() => import("./pages/EventsPage"));
const FriendsPage = React.lazy(() => import("./pages/FriendsPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const SignUpPage = React.lazy(() => import("./pages/auth/SignUpPage"));
const SignInPage = React.lazy(() => import("./pages/auth/SignInPage"));
const WelcomePage = React.lazy(() => import("./pages/onboarding/WelcomePage"));
const CulturalProfilePage = React.lazy(() => import("./pages/onboarding/CulturalProfilePage"));
const LearningGoalsPage = React.lazy(() => import("./pages/onboarding/LearningGoalsPage"));

// Enhanced QueryClient with better caching and retry logic
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md px-4">
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  </div>
);

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

// Component that uses QueryClient - must be inside QueryClientProvider
const AppContent = () => {
  const { user } = useAuthStore();
  
  // Initialize global sync system (needs QueryClient)
  useGlobalSync();
  
  // Setup global data manager when user is available
  React.useEffect(() => {
    if (user) {
      globalDataManager.setupRealtimeSubscriptions(user.id);
    }
  }, [user]);
  
  // Preload app data for better performance
  useAppDataPreloader();
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <ConnectionStatus />
      <PerformanceMonitor />
      <InstallPWA />
      <Suspense fallback={<PageLoadingFallback />}>
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
          
          <Route path="/post/:postId" element={
            <ProtectedRoute>
              <PostDetailPage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile/:userId" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/friends" element={
            <ProtectedRoute>
              <FriendsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/events" element={
            <ProtectedRoute>
              <EventsPage />
            </ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
};

const App = () => {
  const { initialize } = useAuthStore();
  // Initialize auth on mount
  React.useEffect(() => {
    initialize();
  }, [initialize]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="system">
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppContent />
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
