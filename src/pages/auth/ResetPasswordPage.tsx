import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Globe, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { verifyResetToken, resetPasswordWithToken } from '@/lib/passwordResetService';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const resetToken = searchParams.get('token');

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Verify token on page load
  useEffect(() => {
    const verifyToken = async () => {
      if (!resetToken) {
        setTokenError('No reset token provided');
        setTimeout(() => navigate('/auth/signin'), 2000);
        return;
      }

      const verification = await verifyResetToken(resetToken);
      if (verification.valid) {
        setIsValidToken(true);
      } else {
        setTokenError(verification.error || 'Invalid reset link');
        toast({
          title: "Invalid Link",
          description: verification.error || "This password reset link has expired or is invalid.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/auth/signin'), 2000);
      }
    };

    verifyToken();
  }, [resetToken, navigate, toast]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!resetToken) {
      toast({
        title: "Error",
        description: "Reset token is missing",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Reset password with token verification
      const result = await resetPasswordWithToken(resetToken, data.password);

      if (result.success) {
        toast({
          title: "Password Reset! ✅",
          description: "Your password has been successfully updated. You can now sign in with your new password.",
        });

        // Redirect to signin after 2 seconds
        setTimeout(() => navigate('/auth/signin'), 2000);
      } else {
        throw new Error(result.error || 'Failed to reset password');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card-cultural to-background dark:auth-background flex items-center justify-center p-8">
        <Card className="w-full max-w-md card-cultural">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Globe className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-primary">roshLingua</h1>
            </div>
            <CardTitle className="text-2xl">Invalid Link</CardTitle>
            <CardDescription className="text-destructive">
              {tokenError}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/auth/signin">Return to Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card-cultural to-background dark:auth-background flex items-center justify-center p-8">
      <Card className="w-full max-w-md card-cultural">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">roshLingua</h1>
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a new password"
                          autoComplete="new-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your new password"
                          autoComplete="new-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                variant="cultural"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
