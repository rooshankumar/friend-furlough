import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

/**
 * Global Tokens: --primary=#1F6FEB, --bg=#F8F9FB, --card=#FFFFFF, --border=#E8ECEF, --muted=#8A95A3, --text=#1A202C, --error=#D32F2F
 * Motion: 150ms fast, 200ms normal, ease-out
 */

const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password: string): boolean => password.length >= 8;

export function AuthLoginRefactored() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signInWithGoogle, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email || !validateEmail(email)) newErrors.email = 'Valid email required';
    if (!password || !validatePassword(password)) newErrors.password = 'Min 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await signIn(email, password);
      toast({ title: 'Welcome back!', description: 'Signed in successfully.' });
      navigate('/explore');
    } catch (error) {
      toast({
        title: 'Sign in failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        toast({ title: 'Google sign-in failed', description: result.error.message, variant: 'destructive' });
      } else {
        navigate('/explore');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg, #F8F9FB)' }}>
      {/* Hero (Desktop) */}
      <div
        className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center"
        style={{ background: 'linear-gradient(135deg, rgba(31, 111, 235, 0.1) 0%, rgba(243, 245, 248, 1) 100%)' }}
      >
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-6" style={{ color: 'var(--text, #1A202C)' }}>
            Welcome Back
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--muted, #8A95A3)' }}>
            Continue your cultural journey. Connect with language learners worldwide.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-lg border p-6"
          style={{ backgroundColor: 'var(--card, #FFFFFF)', borderColor: 'var(--border, #E8ECEF)' }}
        >
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text, #1A202C)' }}>
            Sign In
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted, #8A95A3)' }}>
            Enter your credentials
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold block mb-2" style={{ color: 'var(--text, #1A202C)' }}>
                Email
              </label>
              <input
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="your@email.com"
                className="w-full h-10 px-4 py-3 border rounded-md text-sm transition-all duration-150 focus:outline-none"
                style={{
                  borderColor: errors.email ? 'var(--error, #D32F2F)' : 'var(--border, #E8ECEF)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary, #1F6FEB)';
                  e.currentTarget.style.borderWidth = '2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.email ? 'var(--error, #D32F2F)' : 'var(--border, #E8ECEF)';
                  e.currentTarget.style.borderWidth = '1px';
                }}
              />
              {errors.email && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" style={{ color: 'var(--error, #D32F2F)' }} />
                  <span className="text-xs" style={{ color: 'var(--error, #D32F2F)' }}>
                    {errors.email}
                  </span>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold block mb-2" style={{ color: 'var(--text, #1A202C)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="••••••••"
                  className="w-full h-10 px-4 py-3 border rounded-md text-sm transition-all duration-150 focus:outline-none pr-10"
                  style={{
                    borderColor: errors.password ? 'var(--error, #D32F2F)' : 'var(--border, #E8ECEF)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary, #1F6FEB)';
                    e.currentTarget.style.borderWidth = '2px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = errors.password ? 'var(--error, #D32F2F)' : 'var(--border, #E8ECEF)';
                    e.currentTarget.style.borderWidth = '1px';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted, #8A95A3)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <span className="text-xs" style={{ color: 'var(--error, #D32F2F)' }}>
                  {errors.password}
                </span>
              )}
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <a
                href="/auth/forgot-password"
                className="text-xs font-semibold transition-colors duration-150"
                style={{ color: 'var(--primary, #1F6FEB)' }}
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full h-10 rounded-md font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-150 active:scale-98"
              style={{
                backgroundColor: isSubmitting || isLoading ? 'var(--border, #E8ECEF)' : 'var(--primary, #1F6FEB)',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting && !isLoading) e.currentTarget.style.backgroundColor = 'var(--primary-hover, #1A5FD6)';
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting && !isLoading) e.currentTarget.style.backgroundColor = 'var(--primary, #1F6FEB)';
              }}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border, #E8ECEF)' }} />
            <span className="text-xs" style={{ color: 'var(--muted, #8A95A3)' }}>
              Or continue with
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border, #E8ECEF)' }} />
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || isLoading}
            className="w-full h-10 rounded-md font-semibold text-sm flex items-center justify-center gap-2 border transition-all duration-150"
            style={{
              backgroundColor: 'var(--card, #FFFFFF)',
              borderColor: 'var(--border, #E8ECEF)',
              color: 'var(--text, #1A202C)',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && !isLoading) e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.05)';
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting && !isLoading) e.currentTarget.style.backgroundColor = 'var(--card, #FFFFFF)';
            }}
          >
            {isSubmitting || isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-sm mt-6" style={{ color: 'var(--muted, #8A95A3)' }}>
            New to roshLingua?{' '}
            <a href="/auth/signup" className="font-semibold" style={{ color: 'var(--primary, #1F6FEB)' }}>
              Sign up
            </a>
          </p>
        </div>
      </div>

      <style>{`button.active\\:scale-98:active { transform: scale(0.98); }`}</style>
    </div>
  );
}

export default AuthLoginRefactored;
