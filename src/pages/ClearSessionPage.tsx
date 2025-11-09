import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

const ClearSessionPage = () => {
  const navigate = useNavigate();
  const { signOut } = useAuthStore();

  const handleClearSession = async () => {
    try {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Sign out from store
      await signOut();
      
      // Redirect to signin
      navigate('/auth/signin');
    } catch (error) {
      console.error('Error clearing session:', error);
      // Force redirect anyway
      navigate('/auth/signin');
    }
  };

  useEffect(() => {
    // Auto-clear on mount
    handleClearSession();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card-cultural to-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          </div>
          <CardTitle>Clearing Session</CardTitle>
          <CardDescription>
            Resetting your session and redirecting to sign in...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              If you're not redirected automatically, click the button below.
            </p>
            <Button onClick={handleClearSession} variant="cultural" className="w-full">
              Clear Session & Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClearSessionPage;
