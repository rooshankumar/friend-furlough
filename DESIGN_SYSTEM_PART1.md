# roshLingua Zerodha-Style Design System v1.0
## PART 1: Design Tokens & Components

---

## 1. GLOBAL DESIGN TOKENS

### 1.1 Typography

**Primary Font Stack:**
```
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Font Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

**Type Scale:**

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| H1 | 32px | 700 | 1.2 |
| H2 | 24px | 700 | 1.2 |
| H3 | 18px | 600 | 1.3 |
| Body Large | 16px | 400 | 1.5 |
| Body | 14px | 400 | 1.5 |
| Body Small | 12px | 400 | 1.5 |
| Caption | 11px | 500 | 1.4 |
| Button | 14px | 600 | 1.5 |

---

### 1.2 Color Palette

**Primary Brand:**
- Primary Blue: `#1F6FEB`
- Primary Hover: `#1A5FD6`
- Primary Light: `#E8F1FF`

**Greyscale:**
- Background: `#F8F9FB`
- Surface: `#FFFFFF`
- Surface Secondary: `#F3F5F8`
- Border Light: `#E8ECEF`
- Border: `#D1D8E0`
- Text Primary: `#1A202C`
- Text Secondary: `#5A6B7D`
- Text Tertiary: `#8A95A3`
- Text Disabled: `#B8C1CC`

**Status Colors:**
- Success: `#24A148` | Success Light: `#E8F5E9`
- Error: `#D32F2F` | Error Light: `#FFEBEE`
- Warning: `#F57C00` | Warning Light: `#FFF3E0`

**Dark Mode:**
- Background: `#0F1419`
- Surface: `#1A1F2E`
- Border: `#3A4556`
- Text Primary: `#F5F7FA`

---

### 1.3 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Micro spacing |
| sm | 8px | Tight spacing |
| md | 12px | Standard padding |
| lg | 16px | Default padding |
| xl | 20px | Large margins |
| 2xl | 24px | Section spacing |
| 3xl | 32px | Major breaks |

---

### 1.4 Corner Radii

| Component | Radius |
|-----------|--------|
| Cards | 12px |
| Buttons | 8px |
| Inputs | 8px |
| Modals | 16px |
| Badges | 6px |
| Avatars | 50% |

---

## 2. COMPONENTS

### 2.1 Input Fields

**Specifications:**
- Height: 40px
- Padding: 12px 16px
- Border: 1px solid `#E8ECEF`
- Border Radius: 8px
- Font Size: 14px

**States:**

| State | Border | Background |
|-------|--------|------------|
| Default | `#E8ECEF` | `#FFFFFF` |
| Focus | `#1F6FEB` (2px) | `#FFFFFF` |
| Error | `#D32F2F` (2px) | `#FFEBEE` |
| Disabled | `#E8ECEF` | `#F3F5F8` |

**Placeholder:** Color `#8A95A3`, Font Weight 400

---

### 2.2 Buttons

#### Primary Button
- Height: 40px | Padding: 12px 24px | Border Radius: 8px
- Background: `#1F6FEB` | Text: `#FFFFFF`
- Hover: `#1A5FD6` | Active: `#1550C1`
- Disabled: `#D1D8E0` text `#8A95A3`
- Transition: 150ms ease-out

#### Secondary Button
- Height: 40px | Padding: 12px 24px
- Background: `#F3F5F8` | Border: 1px `#E8ECEF` | Text: `#1A202C`
- Hover: `#E8ECEF` border `#D1D8E0`
- Transition: 150ms ease-out

#### Tertiary (Text) Button
- Background: Transparent | Text: `#1F6FEB`
- Hover: `#E8F1FF` background
- Transition: 150ms ease-out

---

### 2.3 Cards

- Background: `#FFFFFF`
- Border: 1px solid `#E8ECEF`
- Border Radius: 12px
- Padding: 16px
- **NO SHADOWS**
- Hover: Border `#D1D8E0`

---

### 2.4 Search Bar

- Height: 40px | Padding: 12px 16px
- Border Radius: 12px
- Background: `#F3F5F8` | Border: 1px `#E8ECEF`
- Icon: 16px `#8A95A3`
- Focus: Background `#FFFFFF`, Border `#1F6FEB` (2px)

---

### 2.5 List Items

- Height: 64px | Padding: 12px 16px
- Border Bottom: 1px `#E8ECEF`
- Avatar: 40px circle
- Name: 14px bold | Subtitle: 12px secondary
- Hover: Background `#F3F5F8`
- Ripple: `rgba(31, 111, 235, 0.1)` for 75-100ms

---

### 2.6 Chips / Tags

- Height: 28px | Padding: 6px 12px
- Border Radius: 6px | Font: 12px medium
- Unselected: Background `#F3F5F8`, Border `#E8ECEF`, Text `#5A6B7D`
- Selected: Background `#E8F1FF`, Border `#1F6FEB`, Text `#1F6FEB`
- Transition: 150ms ease-out

---

### 2.7 Bottom Tab Bar

- Height: 56px | Background: `#FFFFFF`
- Border Top: 1px `#E8ECEF` | **NO SHADOWS**
- Icon: 24px | Label: 10px medium
- Inactive: `#8A95A3` | Active: `#1F6FEB`
- Transition: 150ms ease-out

---

### 2.8 Modals

- Background: `#FFFFFF` | Border Radius: 16px (top on mobile)
- Padding: 16px
- Shadow: `0 20px 60px rgba(0, 0, 0, 0.08)`
- Animation: Scale (0.95 → 1) + Fade, 200ms ease-out
- Exit: Reverse, 150ms ease-in
- Mobile: Full screen, swipe-down to close

---

### 2.9 Toasts

- Height: 48px | Padding: 12px 16px
- Border Radius: 8px | Font: 14px medium
- Position: Bottom-right (desktop), Bottom-center (mobile)
- Auto-dismiss: 2000ms

**Types:**
- Success: `#E8F5E9` bg, `#24A148` border/icon
- Error: `#FFEBEE` bg, `#D32F2F` border/icon
- Warning: `#FFF3E0` bg, `#F57C00` border/icon
- Info: `#E8F1FF` bg, `#1F6FEB` border/icon

**Animation:** Slide in from right (200ms ease-out), Slide out (150ms ease-in)

---

### 2.10 Skeleton Loaders

- Background: `#E8ECEF`
- Border Radius: 12px (cards), 8px (inputs), 4px (text)
- Shimmer: Gradient animation, 1.5s infinite
- Gradient: `linear-gradient(90deg, #E8ECEF 0%, #F3F5F8 50%, #E8ECEF 100%)`

---

### 2.11 Spinners

- Size: 24px (default) | Stroke: 2px
- Color: `#1F6FEB` | Track: `#E8ECEF`
- Animation: 1s linear rotation
- Variants: Circular, Linear, Dots

---

## 3. MOTION & ANIMATION

### Durations
- Button Hover: 150ms
- Input Focus: 150ms
- Modal Enter: 200ms | Exit: 150ms
- Toast Enter: 200ms | Exit: 150ms
- Ripple: 75-100ms
- Spinner: 1000ms (continuous)
- Page Transition: 200ms

### Easing
- Enter: `ease-out`
- Exit: `ease-in`
- Interaction: `ease-out`
- Continuous: `linear`
- Smooth: `cubic-bezier(0.4, 0, 0.2, 1)`

### Transitions
- **Fade:** opacity 0→1, 150-200ms ease-out
- **Slide Up:** translateY(20px)→0, opacity 0→1, 200ms ease-out
- **Slide Down:** translateY(-20px)→0, opacity 0→1, 200ms ease-out
- **NO BOUNCE, NO OVERSHOOT**

### Touch Behavior
- Ripple: 75-100ms, `rgba(31, 111, 235, 0.1)`
- Press: Scale 0.98, 100ms ease-out
- Long Press: 500ms trigger, haptic feedback

### Keyboard Behavior
- Animation: 150-200ms ease-out
- Auto-scroll input into view
- No layout jump
- Smooth push-up animation

---

## 4. IMPLEMENTATION GUIDELINES

### React Components

**Input Component:**
```jsx
<input
  className="h-10 px-4 py-3 border border-[#E8ECEF] rounded-lg text-sm focus:border-[#1F6FEB] focus:border-2 focus:outline-none transition-all duration-150"
  placeholder="Enter text..."
/>
```

**Button Component:**
```jsx
<button className="h-10 px-6 bg-[#1F6FEB] text-white rounded-lg font-semibold text-sm hover:bg-[#1A5FD6] active:bg-[#1550C1] disabled:bg-[#D1D8E0] disabled:text-[#8A95A3] transition-colors duration-150">
  Click Me
</button>
```

**Card Component:**
```jsx
<div className="bg-white border border-[#E8ECEF] rounded-xl p-4 hover:border-[#D1D8E0] transition-colors duration-150">
  Content
</div>
```

### Tailwind Configuration

Add to `tailwind.config.ts`:

```typescript
theme: {
  colors: {
    primary: '#1F6FEB',
    'primary-hover': '#1A5FD6',
    'primary-light': '#E8F1FF',
    background: '#F8F9FB',
    surface: '#FFFFFF',
    'surface-secondary': '#F3F5F8',
    'border-light': '#E8ECEF',
    'text-primary': '#1A202C',
    'text-secondary': '#5A6B7D',
    success: '#24A148',
    error: '#D32F2F',
  },
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
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
}
```

### Performance Notes
- Avoid heavy animations on mobile
- Use lazy loading for lists
- Avoid modal stacking
- Debounce search inputs (300ms)
- Memoize expensive components

---

## 5. ZERODHA INTERACTION PHILOSOPHY

### Core Principles

1. **Minimal Distractions**
   - No unnecessary animations
   - Clean, focused layouts
   - One primary action per screen

2. **High Readability**
   - Large, clear typography
   - High contrast ratios
   - Generous whitespace

3. **Low Color Use**
   - Monochromatic base
   - Single accent color (blue)
   - Status colors only when needed

4. **Simple Interactions**
   - Predictable behavior
   - No hidden gestures
   - Clear affordances

5. **Predictable Motion**
   - Consistent durations (150-200ms)
   - No bounce or overshoot
   - Smooth, linear easing

6. **Strong Information Hierarchy**
   - Clear visual weight
   - Logical grouping
   - Progressive disclosure

### Why This Feels Premium

- **Restraint:** Less is more. Every element serves a purpose.
- **Consistency:** Predictable patterns build confidence.
- **Clarity:** Information is presented without clutter.
- **Responsiveness:** Immediate, smooth feedback.
- **Accessibility:** High contrast, readable text, clear focus states.

---

**Status:** Ready for implementation
**Version:** 1.0
**Last Updated:** November 19, 2025
