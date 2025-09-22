import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Globe, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFormData = z.infer<typeof signInSchema>;

const SignInPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, isLoading, onboardingCompleted } = useAuthStore();
  
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: SignInFormData) => {
    try {
      await signIn(data.email, data.password);
      toast({
        title: "Welcome back! 🌍",
        description: "Continue your cultural journey with roshLingua.",
      });
      
      // Navigate based on onboarding status
      if (onboardingCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding/cultural-profile');
      }
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card-cultural to-background flex">
      {/* Left Side - Welcome Back Message */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-secondary/10 p-12 flex-col justify-center">
        <div className="max-w-lg">
          <div className="flex items-center space-x-2 mb-8">
            <Globe className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">roshLingua</h1>
          </div>
          
          <h2 className="text-4xl font-bold text-card-foreground mb-6">
            Welcome Back to Your
            <br />
            <span className="text-cultural-warm">Global Community</span>
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8">
            Your cultural friends are waiting! Continue building international connections, 
            practicing languages, and sharing your unique heritage with the world.
          </p>
          
          <div className="bg-card/50 rounded-lg p-6 border border-border/50">
            <h3 className="font-semibold mb-4 text-card-foreground">What's New Today</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                <span className="text-muted-foreground">12 new cultural matches available</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="w-2 h-2 bg-secondary rounded-full"></span>
                <span className="text-muted-foreground">5 language exchange requests</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="w-2 h-2 bg-accent rounded-full"></span>
                <span className="text-muted-foreground">New cultural posts from your network</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md card-cultural">
          <CardHeader className="text-center">
            <div className="lg:hidden flex items-center justify-center space-x-2 mb-4">
              <Globe className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-primary">roshLingua</h1>
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to continue your cultural exchange journey
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password" 
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
                
                <div className="flex items-center justify-between">
                  <Link 
                    to="/auth/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="cultural"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                New to roshLingua?{' '}
                <Link to="/auth/signup" className="text-primary hover:underline font-medium">
                  Join our community
                </Link>
              </p>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Demo accounts: Use any email with password "123456"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignInPage;