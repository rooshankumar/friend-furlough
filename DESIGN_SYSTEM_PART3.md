# roshLingua Zerodha-Style Design System v1.0
## PART 3: Notifications Page & Implementation Guidelines

---

## PAGE 12: NOTIFICATIONS PAGE (Continued)

**Notification Item Time:**
- Font: 12px, secondary
- Right-aligned
- Format: "2h ago", "Just now", "Yesterday"

**Unread Indicator:**
- 8px circle
- Background: `#1F6FEB`
- Right side, centered vertically

**Notification Types:**

| Type | Icon | Color | Action |
|------|------|-------|--------|
| Connection Request | Users | `#1F6FEB` | Accept/Decline |
| Message | MessageCircle | `#24A148` | Open Chat |
| Post Like | Heart | `#D32F2F` | View Post |
| Comment | MessageSquare | `#F57C00` | View Post |
| System | Info | `#8A95A3` | Dismiss |

**States:**
- Unread: Background `#F8F9FB`, bold text
- Read: Background `#FFFFFF`, normal text
- Hover: Background `#F3F5F8` (150ms)

**Animation:**
- Page Enter: Fade in (150ms)
- Item Stagger: 50ms delay
- Notification Badge: Scale (200ms)

**Empty State:**
- Centered icon (Bell, 48px)
- Title: "No notifications"
- Description: "You're all caught up!"

**Error State:**
- Error icon (Alert, 48px)
- Title: "Failed to load notifications"
- Description: "Check your connection"
- Button: "Try again"

**Loading State:**
- Skeleton items (3-5)
- Shimmer animation (1.5s)

---

## IMPLEMENTATION GUIDELINES

### React Component Structure

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

**List Item Component:**
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

### Tailwind Configuration

Add to `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: '#1F6FEB',
      'primary-hover': '#1A5FD6',
      'primary-dark': '#1550C1',
      'primary-light': '#E8F1FF',
      background: '#F8F9FB',
      surface: '#FFFFFF',
      'surface-secondary': '#F3F5F8',
      'border-light': '#E8ECEF',
      'border-default': '#D1D8E0',
      'text-primary': '#1A202C',
      'text-secondary': '#5A6B7D',
      'text-tertiary': '#8A95A3',
      'text-disabled': '#B8C1CC',
      success: '#24A148',
      'success-light': '#E8F5E9',
      error: '#D32F2F',
      'error-light': '#FFEBEE',
      warning: '#F57C00',
      'warning-light': '#FFF3E0',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
      '4xl': '40px',
    },
    borderRadius: {
      xs: '4px',
      sm: '6px',
      md: '8px',
      lg: '12px',
      xl: '16px',
    },
    transitionDuration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
  },
}
```

### CSS Custom Properties

Add to `src/index.css`:

```css
:root {
  /* Colors */
  --primary: #1F6FEB;
  --primary-hover: #1A5FD6;
  --primary-dark: #1550C1;
  --primary-light: #E8F1FF;
  
  --background: #F8F9FB;
  --surface: #FFFFFF;
  --surface-secondary: #F3F5F8;
  
  --border-light: #E8ECEF;
  --border-default: #D1D8E0;
  
  --text-primary: #1A202C;
  --text-secondary: #5A6B7D;
  --text-tertiary: #8A95A3;
  --text-disabled: #B8C1CC;
  
  --success: #24A148;
  --error: #D32F2F;
  --warning: #F57C00;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;
  --space-3xl: 32px;
  
  /* Border Radius */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 200ms ease-out;
  --transition-slow: 300ms ease-out;
}

.dark {
  --background: #0F1419;
  --surface: #1A1F2E;
  --surface-secondary: #242B3A;
  --border-light: #3A4556;
  --text-primary: #F5F7FA;
  --text-secondary: #B8C1CC;
}
```

### Mobile-Specific Guidelines

**Touch Targets:**
- Minimum size: 44px × 44px
- Padding around: 8px
- Spacing between: 12px

**Safe Area:**
- Top: 16px (or notch height)
- Bottom: 16px (or safe area + tab bar)
- Left/Right: 16px

**Keyboard Behavior:**
- Input scroll margin: 150px bottom
- Animation: 150-200ms ease-out
- No layout shift

**Pull-to-Refresh:**
- Trigger: 60px pull
- Threshold: 100px
- Release: Smooth snap (200ms)
- Animation: Spinner rotation (1s)

### Performance Notes

**Avoid:**
- Heavy animations on mobile
- Modal stacking (max 1 modal)
- Large lists without virtualization
- Unoptimized images

**Do:**
- Use lazy loading for lists
- Debounce search (300ms)
- Memoize expensive components
- Optimize images (WebP, srcset)
- Use CSS transforms for animations
- Implement skeleton loaders

### Accessibility

**Color Contrast:**
- Text on background: 4.5:1 minimum
- UI components: 3:1 minimum
- Focus indicators: 2px solid `#1F6FEB`

**Touch Targets:**
- Minimum 44px × 44px
- Spacing: 8px minimum

**Keyboard Navigation:**
- Tab order: Logical
- Focus visible: Always
- Escape: Close modals/dropdowns

**Semantic HTML:**
- Use `<button>` for buttons
- Use `<input>` for inputs
- Use `<label>` for labels
- Use `<nav>` for navigation

---

## ZERODHA INTERACTION PHILOSOPHY

### Core Principles

**1. Minimal Distractions**
- One primary action per screen
- No unnecessary animations
- Clean, focused layouts
- Clear visual hierarchy

**2. High Readability**
- Large, clear typography (14px minimum)
- High contrast ratios (4.5:1)
- Generous whitespace
- Short line lengths (60-80 chars)

**3. Low Color Use**
- Monochromatic base (greys)
- Single accent color (blue)
- Status colors only when needed
- No gradients or complex patterns

**4. Simple Interactions**
- Predictable behavior
- No hidden gestures
- Clear affordances
- Immediate feedback

**5. Predictable Motion**
- Consistent durations (150-200ms)
- No bounce or overshoot
- Smooth, linear easing
- Purpose-driven animations

**6. Strong Information Hierarchy**
- Clear visual weight
- Logical grouping
- Progressive disclosure
- Scannable content

### Why This Feels Premium

**Restraint**
- Every element serves a purpose
- No clutter or decoration
- Focused on content
- Respects user attention

**Consistency**
- Predictable patterns
- Familiar interactions
- Reliable behavior
- Builds confidence

**Clarity**
- Information is presented clearly
- No ambiguity
- Easy to understand
- Self-explanatory

**Responsiveness**
- Immediate feedback
- Smooth transitions
- No lag or delays
- Feels fast and snappy

**Accessibility**
- High contrast
- Readable text
- Clear focus states
- Keyboard navigation

---

## COMPONENT LIBRARY CHECKLIST

### Forms
- ✅ Input fields (text, email, password, number)
- ✅ Textareas
- ✅ Labels
- ✅ Error messages
- ✅ Validation states
- ✅ Placeholders
- ✅ Focus states

### Buttons
- ✅ Primary button
- ✅ Secondary button
- ✅ Tertiary (text) button
- ✅ Loading state
- ✅ Disabled state
- ✅ Icon buttons

### Cards
- ✅ Basic card
- ✅ Card with header
- ✅ Card with footer
- ✅ Hover states
- ✅ Selected states

### Navigation
- ✅ Bottom tab bar
- ✅ Header navigation
- ✅ Breadcrumbs
- ✅ Pagination

### Feedback
- ✅ Toasts (success, error, warning, info)
- ✅ Modals
- ✅ Loaders/Spinners
- ✅ Skeleton loaders
- ✅ Empty states
- ✅ Error states

### Lists
- ✅ List items
- ✅ Avatar + text
- ✅ Dividers
- ✅ Ripple effect

### Chips/Tags
- ✅ Selected state
- ✅ Unselected state
- ✅ Disabled state
- ✅ Removable chips

### Search
- ✅ Search bar
- ✅ Clear button
- ✅ Icon support
- ✅ Focus state

### Data Display
- ✅ Badges
- ✅ Counters
- ✅ Progress bars
- ✅ Status indicators

---

## DEPLOYMENT CHECKLIST

- [ ] All colors updated to Zerodha palette
- [ ] All typography matches spec
- [ ] All spacing uses scale
- [ ] All border radius matches spec
- [ ] All animations use correct durations/easing
- [ ] All shadows removed (except modals)
- [ ] All components tested on mobile
- [ ] All components tested on desktop
- [ ] Accessibility audit passed
- [ ] Performance audit passed
- [ ] Dark mode tested
- [ ] Keyboard navigation tested
- [ ] Touch targets verified (44px minimum)
- [ ] Contrast ratios verified (4.5:1)

---

## FINAL NOTES

This design system is built on the principles of:
- **Clarity** over decoration
- **Simplicity** over complexity
- **Consistency** over variation
- **Accessibility** over aesthetics
- **Performance** over features

Every design decision should support these principles. When in doubt, choose the simpler, clearer option.

---

**Design System Version:** 1.0
**Last Updated:** November 19, 2025
**Status:** Ready for Implementation
