import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

/**
 * Global Tokens: --primary=#1F6FEB, --bg=#F8F9FB, --card=#FFFFFF, --border=#E8ECEF, --muted=#8A95A3, --text=#1A202C, --error=#D32F2F, --success=#24A148
 * Motion: 150ms fast, 200ms normal, ease-out
 */

const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password: string): boolean => password.length >= 8;

export function AuthSignupRefactored() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, isLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const getPasswordStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
    if (pwd.length < 6) return 'weak';
    if (pwd.length < 8) return 'medium';
    return 'strong';
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColor =
    passwordStrength === 'weak'
      ? 'var(--error, #D32F2F)'
      : passwordStrength === 'medium'
        ? '#F57C00'
        : 'var(--success, #24A148)';

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name || name.length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!email || !validateEmail(email)) newErrors.email = 'Valid email required';
    if (!password || !validatePassword(password)) newErrors.password = 'Min 8 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!agreeToTerms) newErrors.terms = 'You must agree to the terms';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await signUp(email, password, name);
      toast({
        title: 'Welcome to roshLingua!',
        description: 'Account created. Check your email to verify.',
      });
      navigate('/onboarding/cultural-profile');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Sign up failed';
      toast({
        title: 'Sign up failed',
        description: errorMsg,
        variant: 'destructive',
      });
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
            Join roshLingua
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--muted, #8A95A3)' }}>
            Connect with language learners and natives. Practice languages. Share cultures.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-lg border p-6 max-h-screen overflow-y-auto"
          style={{ backgroundColor: 'var(--card, #FFFFFF)', borderColor: 'var(--border, #E8ECEF)' }}
        >
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text, #1A202C)' }}>
            Sign Up
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted, #8A95A3)' }}>
            Create your account to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold block mb-2" style={{ color: 'var(--text, #1A202C)' }}>
                Full Name
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="John Doe"
                className="w-full h-10 px-4 py-3 border rounded-md text-sm transition-all duration-150 focus:outline-none"
                style={{
                  borderColor: errors.name ? 'var(--error, #D32F2F)' : 'var(--border, #E8ECEF)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary, #1F6FEB)';
                  e.currentTarget.style.borderWidth = '2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.name ? 'var(--error, #D32F2F)' : 'var(--border, #E8ECEF)';
                  e.currentTarget.style.borderWidth = '1px';
                }}
              />
              {errors.name && (
                <span className="text-xs" style={{ color: 'var(--error, #D32F2F)' }}>
                  {errors.name}
                </span>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold block mb-2" style={{ color: 'var(--text, #1A202C)' }}>
                Email
              </label>
              <input
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
                <span className="text-xs" style={{ color: 'var(--error, #D32F2F)' }}>
                  {errors.email}
                </span>
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
              {password && (
                <div className="mt-1 h-1 rounded-full" style={{ backgroundColor: strengthColor }} />
              )}
              {errors.password && (
                <span className="text-xs" style={{ color: 'var(--error, #D32F2F)' }}>
                  {errors.password}
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-semibold block mb-2" style={{ color: 'var(--text, #1A202C)' }}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  placeholder="••••••••"
                  className="w-full h-10 px-4 py-3 border rounded-md text-sm transition-all duration-150 focus:outline-none pr-10"
                  style={{
                    borderColor: errors.confirmPassword ? 'var(--error, #D32F2F)' : 'var(--border, #E8ECEF)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary, #1F6FEB)';
                    e.currentTarget.style.borderWidth = '2px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = errors.confirmPassword
                      ? 'var(--error, #D32F2F)'
                      : 'var(--border, #E8ECEF)';
                    e.currentTarget.style.borderWidth = '1px';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted, #8A95A3)' }}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" style={{ color: 'var(--error, #D32F2F)' }} />
                  <span className="text-xs" style={{ color: 'var(--error, #D32F2F)' }}>
                    {errors.confirmPassword}
                  </span>
                </div>
              )}
              {password && confirmPassword && password === confirmPassword && (
                <div className="flex items-center gap-1 mt-1">
                  <Check className="w-3 h-3" style={{ color: 'var(--success, #24A148)' }} />
                  <span className="text-xs" style={{ color: 'var(--success, #24A148)' }}>
                    Passwords match
                  </span>
                </div>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  if (errors.terms) setErrors({ ...errors, terms: undefined });
                }}
                className="mt-1 w-4 h-4 rounded"
                style={{
                  accentColor: 'var(--primary, #1F6FEB)',
                  borderColor: 'var(--border, #E8ECEF)',
                }}
              />
              <label htmlFor="terms" className="text-xs" style={{ color: 'var(--text, #1A202C)' }}>
                I agree to the{' '}
                <a href="/terms-of-service" className="font-semibold" style={{ color: 'var(--primary, #1F6FEB)' }}>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy-policy" className="font-semibold" style={{ color: 'var(--primary, #1F6FEB)' }}>
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.terms && (
              <span className="text-xs" style={{ color: 'var(--error, #D32F2F)' }}>
                {errors.terms}
              </span>
            )}

            {/* Sign Up Button */}
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
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm mt-6" style={{ color: 'var(--muted, #8A95A3)' }}>
            Already have an account?{' '}
            <a href="/auth/signin" className="font-semibold" style={{ color: 'var(--primary, #1F6FEB)' }}>
              Sign in
            </a>
          </p>
        </div>
      </div>

      <style>{`button.active\\:scale-98:active { transform: scale(0.98); }`}</style>
    </div>
  );
}

export default AuthSignupRefactored;
