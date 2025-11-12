
import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuthStore } from "./stores/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import ConnectionStatus from "./components/ConnectionStatus";
import MinimalNavigation from "./components/MinimalNavigation";
import InstallPWA from "./components/InstallPWA";
import PerformanceMonitor from "./components/PerformanceMonitor";
import { useMasterOptimization } from "./hooks/useMasterOptimization";
import { useActivityTracker } from "./hooks/useActivityTracker";

// Lazy load pages for better performance
const HomePage = React.lazy(() => import("./pages/HomePageProfessional"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./pages/TermsOfService"));
const GoogleVerificationStatus = React.lazy(() => import("./components/GoogleVerificationStatus"));
const ExplorePage = React.lazy(() => import("./pages/ExplorePage"));
const ChatPage = React.lazy(() => import("./pages/ChatPageV2"));
const CommunityPage = React.lazy(() => import("./pages/CommunityPage"));
const PostDetailPage = React.lazy(() => import("./pages/PostDetailPage"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));
const EventsPage = React.lazy(() => import("./pages/EventsPage"));
const FriendsPage = React.lazy(() => import("./pages/FriendsPage"));
const NotificationsPage = React.lazy(() => import("./pages/NotificationsPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const SignUpPage = React.lazy(() => import("./pages/auth/SignUpPage"));
const SignInPage = React.lazy(() => import("./pages/auth/SignInPage"));
const WelcomePage = React.lazy(() => import("./pages/onboarding/WelcomePage"));
const CulturalProfilePage = React.lazy(() => import("./pages/onboarding/CulturalProfilePage"));
const LearningGoalsPage = React.lazy(() => import("./pages/onboarding/LearningGoalsPage"));
const ImageViewerPage = React.lazy(() => import("./pages/ImageViewerPage"));
const ClearSessionPage = React.lazy(() => import("./pages/ClearSessionPage"));
const AuthCallback = React.lazy(() => import("./pages/AuthCallback"));

// Optimized QueryClient for fast initial load
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
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
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  
  // Initialize optimizations
  useMasterOptimization();
  
  // Track user activity and auto-logout after 30 days inactivity
  useActivityTracker();

  // Don't show MinimalNavigation on homepage or auth pages
  const showMinimalNav = isAuthenticated && 
    location.pathname !== '/' && 
    !location.pathname.startsWith('/auth/') &&
    !location.pathname.startsWith('/privacy-') &&
    !location.pathname.startsWith('/terms-') &&
    !location.pathname.startsWith('/community-') &&
    !location.pathname.startsWith('/data-') &&
    !location.pathname.startsWith('/verification-');

  return (
    <div className="min-h-screen bg-background">
      {showMinimalNav && <MinimalNavigation />}
      <ConnectionStatus />
      <PerformanceMonitor />
      <InstallPWA />
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* Legal Pages */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/community-guidelines" element={<TermsOfService />} />
          <Route path="/data-protection" element={<PrivacyPolicy />} />
          <Route path="/verification-status" element={<GoogleVerificationStatus />} />

          {/* Authentication Routes */}
          <Route path="/auth/signup" element={<SignUpPage />} />
          <Route path="/auth/signin" element={<SignInPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/clear-session" element={<ClearSessionPage />} />

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

          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />

          <Route path="/events" element={
            <ProtectedRoute>
              <EventsPage />
            </ProtectedRoute>
          } />

          <Route path="/image-viewer" element={
            <ProtectedRoute>
              <ImageViewerPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
};

const App = () => {
  const { initialize } = useAuthStore();

  // Initialize auth and OAuth listener on mount
  React.useEffect(() => {
    console.log('🚀 App initializing...');
    initialize();

    // Initialize OAuth deep link listener for mobile
    import('@/lib/mobileAuth').then(({ initOAuthListener }) => {
      initOAuthListener();
    }).catch(err => console.error('OAuth listener error:', err));

    // Initialize keyboard handling for mobile
    import('./lib/keyboardHandler').then(({ initKeyboardHandling }) => {
      initKeyboardHandling();
    }).catch(err => console.error('Keyboard handler error:', err));

    // Cleanup on unmount
    return () => {
      import('@/lib/mobileAuth').then(({ removeOAuthListener }) => {
        removeOAuthListener();
      });
      import('./lib/keyboardHandler').then(({ cleanupKeyboardHandling }) => {
        cleanupKeyboardHandling();
      });
    };
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <ThemeProvider defaultTheme="system">
            <Toaster />
            <Sonner />
            <AppContent />
          </ThemeProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
