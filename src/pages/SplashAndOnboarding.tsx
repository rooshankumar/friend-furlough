import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Global Design Tokens (Zerodha-style)
 * --primary = #1F6FEB
 * --primary-hover = #1A5FD6
 * --bg = #F8F9FB
 * --card = #FFFFFF
 * --border = #E8ECEF
 * --muted = #8A95A3
 * --text = #1A202C
 * --success = #24A148
 * --error = #D32F2F
 * Spacing: xs=4, sm=8, md=12, lg=16, xl=20, 2xl=24, 3xl=32
 * Radii: inputs/buttons=8px, cards=12px, modals=16px
 * Motion: duration.fast=150ms, duration.normal=200ms, easing.in=ease-in, easing.out=ease-out
 */

// ============================================================================
// SPLASH SCREEN
// ============================================================================

export function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-navigate to onboarding after 700ms (within 600-800ms window)
    const timer = setTimeout(() => {
      navigate('/onboarding');
    }, 700);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--bg, #F8F9FB)' }}
    >
      {/* Logo with fade-in + scale animation (600ms ease-out) */}
      <img
        src="/roshlingua-logo-512.png"
        alt="roshLingua"
        className="w-20 h-20"
        style={{
          animation: 'splashFadeIn 600ms ease-out forwards',
        }}
      />

      {/* Spinner (24px, 1s linear rotation) */}
      <div
        className="mt-4 w-6 h-6 border-2 rounded-full"
        style={{
          borderColor: 'var(--primary, #1F6FEB)',
          borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite',
        }}
        aria-label="Loading"
      />

      {/* Inline styles for animations */}
      <style>{`
        @keyframes splashFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// ONBOARDING CAROUSEL
// ============================================================================

interface OnboardingStep {
  id: number;
  imageSrc: string;
  imageAlt: string;
  title: string;
  body: string;
  ctaLabel: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 0,
    imageSrc: '/onboarding/connect.svg',
    imageAlt: 'Connect with people globally',
    title: 'Connect with global friends',
    body: 'Match with learners and natives who share your cultural interests.',
    ctaLabel: 'Next',
  },
  {
    id: 1,
    imageSrc: '/onboarding/learn.svg',
    imageAlt: 'Practice languages',
    title: 'Practice languages daily',
    body: 'Short, meaningful conversations to build real fluency.',
    ctaLabel: 'Next',
  },
  {
    id: 2,
    imageSrc: '/onboarding/safe.svg',
    imageAlt: 'Safe and respectful',
    title: 'Safe, respectful community',
    body: 'Moderation tools and controls keep your experience positive.',
    ctaLabel: 'Get started',
  },
];

export function OnboardingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  // Mark onboarding as seen on mount
  useEffect(() => {
    localStorage.setItem('seen_onboarding', 'true');
  }, []);

  const isLast = currentIndex === ONBOARDING_STEPS.length - 1;
  const step = ONBOARDING_STEPS[currentIndex];

  const handleSkip = () => {
    localStorage.setItem('seen_onboarding', 'true');
    // Navigate to signup (or /explore if already logged in)
    navigate('/auth/signup');
  };

  const handleNext = () => {
    if (!isLast) {
      setCurrentIndex((idx) => Math.min(idx + 1, ONBOARDING_STEPS.length - 1));
      return;
    }
    // Last step: go to signup
    handleSkip();
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg, #F8F9FB)' }}
    >
      {/* Top bar with Skip button (tertiary style) */}
      <div className="flex items-center justify-end px-4 pt-4">
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs font-semibold rounded-md px-3 py-1 transition-colors duration-150"
          style={{
            color: 'var(--muted, #8A95A3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--primary, #1F6FEB)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--muted, #8A95A3)';
          }}
        >
          Skip
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-between px-6 pb-10">
        {/* Image area (40% height) */}
        <div className="flex-1 flex items-center justify-center w-full max-w-md">
          <img
            src={step.imageSrc}
            alt={step.imageAlt}
            className="w-full h-auto max-h-64 object-contain"
            style={{
              animation: `slideUpFadeIn 200ms ease-out forwards`,
            }}
          />
        </div>

        {/* Text content + CTA container */}
        <div
          className="w-full max-w-md"
          style={{
            animation: `slideUpFadeIn 200ms ease-out forwards`,
            animationDelay: '50ms',
          }}
        >
          {/* Title (H2: 24px semibold) */}
          <h2
            className="text-2xl font-semibold mb-3"
            style={{ color: 'var(--text, #1A202C)' }}
          >
            {step.title}
          </h2>

          {/* Body (16px) */}
          <p
            className="text-base mb-6 leading-relaxed"
            style={{ color: 'var(--muted, #8A95A3)' }}
          >
            {step.body}
          </p>

          {/* CTA Button (Primary, h-10, radius 8px) */}
          <button
            type="button"
            onClick={handleNext}
            className="w-full h-10 rounded-md font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-150 active:scale-98"
            style={{
              backgroundColor: 'var(--primary, #1F6FEB)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-hover, #1A5FD6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary, #1F6FEB)';
            }}
          >
            {step.ctaLabel}
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Pager dots (8px circles, active scale 1→1.25, 150ms) */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {ONBOARDING_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className="w-2 h-2 rounded-full transition-transform duration-150"
                style={{
                  backgroundColor:
                    idx === currentIndex
                      ? 'var(--primary, #1F6FEB)'
                      : 'var(--border, #E8ECEF)',
                  transform: idx === currentIndex ? 'scale(1.25)' : 'scale(1)',
                }}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === currentIndex}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Inline animations */}
      <style>{`
        @keyframes slideUpFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        button.active\\:scale-98:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// EXPORT BOTH SCREENS
// ============================================================================

export default { SplashScreen, OnboardingPage };
