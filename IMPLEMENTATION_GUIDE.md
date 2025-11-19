# roshLingua Zerodha-Style UI/UX Implementation Guide

## Quick Start

This guide provides step-by-step instructions to implement the Zerodha-style design system across your React app.

---

## PHASE 1: Update CSS Variables (1-2 hours)

### Step 1: Update `src/index.css`

Replace all color definitions with the new palette:

```css
:root {
  /* Primary Brand */
  --primary: 205 90% 45%;
  --primary-foreground: 0 0% 100%;
  --primary-hover: 205 90% 40%;
  
  /* Background & Surfaces */
  --background: 210 20% 98%;
  --foreground: 210 10% 23%;
  --card: 0 0% 100%;
  --card-foreground: 210 10% 23%;
  
  /* Greyscale */
  --muted: 210 20% 94%;
  --muted-foreground: 210 10% 45%;
  --border: 210 20% 90%;
  --input: 210 20% 90%;
  
  /* Status Colors */
  --success: 145 63% 42%;
  --success-foreground: 0 0% 100%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  
  /* Border Radius */
  --radius: 0.5rem;
}

.dark {
  --background: 210 10% 12%;
  --foreground: 210 20% 96%;
  --card: 210 10% 16%;
  --card-foreground: 210 20% 96%;
  --muted: 210 10% 20%;
  --muted-foreground: 210 10% 60%;
  --border: 210 10% 25%;
  --input: 210 10% 25%;
  --success: 145 63% 52%;
  --destructive: 0 72% 51%;
}
```

### Step 2: Remove Custom Component Styles

Delete all `.btn-*`, `.card-*`, `.badge-*` classes from `src/index.css`.

The app will now use default `shadcn/ui` component styles, which automatically adopt the new color tokens.

### Step 3: Update Tailwind Config

Update `tailwind.config.ts` with new spacing and radius scales:

```typescript
theme: {
  extend: {
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
    },
    borderRadius: {
      xs: '4px',
      sm: '6px',
      md: '8px',
      lg: '12px',
      xl: '16px',
    },
  },
}
```

---

## PHASE 2: Update Components (2-3 hours)

### Step 1: Input Fields

Update all input components to use new styling:

```jsx
// Before
<input className="border border-primary rounded-lg" />

// After
<input className="h-10 px-4 py-3 border border-[#E8ECEF] rounded-md text-sm focus:border-primary focus:border-2 focus:outline-none transition-all duration-150" />
```

### Step 2: Buttons

Update button variants:

```jsx
// Primary Button
<button className="h-10 px-6 bg-primary text-white rounded-md font-semibold text-sm hover:bg-[#1A5FD6] active:bg-[#1550C1] disabled:bg-[#D1D8E0] disabled:text-[#8A95A3] transition-colors duration-150">
  Click Me
</button>

// Secondary Button
<button className="h-10 px-6 bg-[#F3F5F8] text-[#1A202C] border border-[#E8ECEF] rounded-md font-semibold text-sm hover:bg-[#E8ECEF] active:bg-[#D1D8E0] transition-colors duration-150">
  Secondary
</button>

// Tertiary Button
<button className="h-10 px-6 bg-transparent text-primary font-semibold text-sm hover:bg-[#E8F1FF] transition-colors duration-150">
  Tertiary
</button>
```

### Step 3: Cards

Update card styling:

```jsx
// Before
<div className="bg-card-cultural shadow-cultural rounded-cultural" />

// After
<div className="bg-white border border-[#E8ECEF] rounded-lg p-4 hover:border-[#D1D8E0] transition-colors duration-150" />
```

### Step 4: Search Bars

Update search components:

```jsx
<div className="flex items-center h-10 px-4 bg-[#F3F5F8] border border-[#E8ECEF] rounded-xl focus-within:border-primary focus-within:border-2 transition-all duration-150">
  <Search className="w-4 h-4 text-[#8A95A3]" />
  <input 
    className="flex-1 ml-2 bg-transparent text-sm placeholder-[#8A95A3] focus:outline-none"
    placeholder="Search..."
  />
</div>
```

### Step 5: List Items

Update list item styling:

```jsx
<div className="h-16 px-4 py-3 border-b border-[#E8ECEF] hover:bg-[#F3F5F8] transition-colors duration-150 cursor-pointer">
  <div className="flex items-center gap-3">
    <img className="w-10 h-10 rounded-full" src="avatar.jpg" />
    <div className="flex-1">
      <p className="text-sm font-semibold text-[#1A202C]">Name</p>
      <p className="text-xs text-[#8A95A3]">Subtitle</p>
    </div>
  </div>
</div>
```

### Step 6: Modals

Update modal styling:

```jsx
<div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
  <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md md:max-h-96 p-4 shadow-lg">
    {/* Modal content */}
  </div>
</div>
```

### Step 7: Toasts

Update toast styling:

```jsx
// Success Toast
<div className="fixed bottom-4 right-4 bg-[#E8F5E9] border border-[#24A148] rounded-lg p-3 flex items-center gap-3 shadow-lg">
  <Check className="w-5 h-5 text-[#24A148]" />
  <span className="text-sm text-[#1A202C]">Success message</span>
</div>

// Error Toast
<div className="fixed bottom-4 right-4 bg-[#FFEBEE] border border-[#D32F2F] rounded-lg p-3 flex items-center gap-3 shadow-lg">
  <AlertCircle className="w-5 h-5 text-[#D32F2F]" />
  <span className="text-sm text-[#1A202C]">Error message</span>
</div>
```

---

## PHASE 3: Update Pages (3-4 hours)

### Page Update Priority

1. **Login/Signup** (Most visible)
2. **Explore** (Main feature)
3. **Chat** (Core functionality)
4. **Community** (Secondary feature)
5. **Profile** (User-specific)
6. **Settings** (Utility)

### Login Page Example

```jsx
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      {/* Left: Hero (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#E8F1FF] to-[#F3F5F8] p-12 flex-col justify-center">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold text-[#1A202C] mb-6">Welcome Back</h1>
          <p className="text-lg text-[#5A6B7D]">Continue your cultural journey</p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-[#E8ECEF] rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[#1A202C] mb-2">Sign In</h2>
          <p className="text-sm text-[#8A95A3] mb-6">Enter your credentials</p>

          {/* Email Input */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#1A202C] block mb-2">Email</label>
            <input 
              type="email"
              className="w-full h-10 px-4 py-3 border border-[#E8ECEF] rounded-md text-sm focus:border-primary focus:border-2 focus:outline-none transition-all duration-150"
              placeholder="your@email.com"
            />
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#1A202C] block mb-2">Password</label>
            <input 
              type="password"
              className="w-full h-10 px-4 py-3 border border-[#E8ECEF] rounded-md text-sm focus:border-primary focus:border-2 focus:outline-none transition-all duration-150"
              placeholder="••••••••"
            />
          </div>

          {/* Forgot Password */}
          <button className="text-xs text-primary hover:text-[#1A5FD6] transition-colors mb-6">
            Forgot password?
          </button>

          {/* Login Button */}
          <button className="w-full h-10 bg-primary text-white rounded-md font-semibold text-sm hover:bg-[#1A5FD6] active:bg-[#1550C1] transition-colors duration-150 mb-4">
            Sign In
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E8ECEF]"></div>
            <span className="text-xs text-[#8A95A3]">Or continue with</span>
            <div className="flex-1 h-px bg-[#E8ECEF]"></div>
          </div>

          {/* Google Button */}
          <button className="w-full h-10 bg-[#F3F5F8] text-[#1A202C] border border-[#E8ECEF] rounded-md font-semibold text-sm hover:bg-[#E8ECEF] transition-colors duration-150 mb-6">
            Continue with Google
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-[#8A95A3]">
            New to roshLingua? <a href="/signup" className="text-primary hover:text-[#1A5FD6]">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## PHASE 4: Testing & Refinement (2-3 hours)

### Testing Checklist

**Visual Testing:**
- [ ] All colors match spec
- [ ] All spacing matches scale
- [ ] All border radius matches spec
- [ ] All typography matches scale
- [ ] All shadows removed (except modals)
- [ ] Dark mode works correctly

**Interaction Testing:**
- [ ] Button hover/active states work
- [ ] Input focus states work
- [ ] Modals open/close smoothly
- [ ] Toasts appear/disappear correctly
- [ ] Animations use correct durations
- [ ] Transitions are smooth

**Mobile Testing:**
- [ ] Touch targets are 44px minimum
- [ ] Spacing is correct on mobile
- [ ] Keyboard doesn't cover inputs
- [ ] Bottom tab bar is accessible
- [ ] Safe area padding is correct

**Accessibility Testing:**
- [ ] Contrast ratios are 4.5:1
- [ ] Focus indicators are visible
- [ ] Keyboard navigation works
- [ ] Screen readers work correctly
- [ ] Color is not the only indicator

### Performance Testing

```bash
# Run Lighthouse audit
npm run build
npm run preview

# Check bundle size
npm run build -- --analyze

# Check performance metrics
# Target: LCP < 2.5s, FID < 100ms, CLS < 0.1
```

---

## MIGRATION CHECKLIST

### Before Starting
- [ ] Back up current design
- [ ] Create feature branch
- [ ] Update documentation

### During Migration
- [ ] Update CSS variables
- [ ] Update Tailwind config
- [ ] Update components (by phase)
- [ ] Test each phase
- [ ] Fix issues as they arise

### After Migration
- [ ] Visual regression testing
- [ ] Performance testing
- [ ] Accessibility audit
- [ ] Mobile testing
- [ ] Cross-browser testing
- [ ] Deploy to staging
- [ ] Get stakeholder approval
- [ ] Deploy to production

---

## COMMON ISSUES & SOLUTIONS

### Issue: Colors look different in dark mode

**Solution:** Ensure dark mode CSS variables are updated:
```css
.dark {
  --primary: 205 90% 55%;
  --background: 210 10% 12%;
  /* etc. */
}
```

### Issue: Animations feel choppy

**Solution:** Use CSS transforms instead of position changes:
```css
/* Bad */
transition: left 150ms ease-out;

/* Good */
transition: transform 150ms ease-out;
transform: translateX(0);
```

### Issue: Touch targets are too small

**Solution:** Ensure minimum 44px × 44px with 8px padding:
```jsx
<button className="min-w-11 min-h-11 p-2">
  Click Me
</button>
```

### Issue: Modals look different on mobile

**Solution:** Use responsive styling:
```jsx
<div className="fixed inset-0 flex items-end md:items-center">
  <div className="rounded-t-2xl md:rounded-2xl w-full md:max-w-md">
    {/* Content */}
  </div>
</div>
```

---

## ROLLBACK PLAN

If issues arise, you can quickly rollback:

```bash
# Revert to previous commit
git revert <commit-hash>

# Or restore from backup
git checkout <backup-branch>
```

---

## TIMELINE ESTIMATE

- **Phase 1 (CSS):** 1-2 hours
- **Phase 2 (Components):** 2-3 hours
- **Phase 3 (Pages):** 3-4 hours
- **Phase 4 (Testing):** 2-3 hours

**Total:** 8-12 hours (1-2 days)

---

## NEXT STEPS

1. Create feature branch: `git checkout -b design-system-update`
2. Start with Phase 1 (CSS variables)
3. Test after each phase
4. Create pull request for review
5. Deploy to staging for final testing
6. Deploy to production

---

**Implementation Guide Version:** 1.0
**Last Updated:** November 19, 2025
**Status:** Ready to Implement
