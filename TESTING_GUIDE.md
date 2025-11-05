# Testing Guide

## Overview

This document provides comprehensive guidance on testing the Friend Furlough application.

## Setup

### Install Testing Dependencies

```bash
npm install --save-dev jest ts-jest @types/jest @testing-library/react @testing-library/jest-dom
```

### Add Test Scripts to package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```

## Test Structure

```
src/
├── __tests__/
│   ├── setup.ts                 # Jest setup and mocks
│   ├── validation.test.ts       # Validation utilities tests
│   ├── errorHandler.test.ts     # Error handling tests
│   ├── apiPatterns.test.ts      # API patterns tests
│   ├── hooks/
│   │   ├── useAsyncState.test.ts
│   │   ├── useFilteredData.test.ts
│   │   └── useFormSubmit.test.ts
│   ├── components/
│   │   ├── AsyncDataWrapper.test.tsx
│   │   ├── LoadingStates.test.tsx
│   │   └── ...
│   └── integration/
│       ├── chat.integration.test.ts
│       ├── community.integration.test.ts
│       └── auth.integration.test.ts
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- validation.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="validateEmail"
```

### Debug Tests
```bash
npm run test:debug
```

## Test Coverage Goals

- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

## Writing Tests

### Unit Tests

Test individual functions in isolation:

```typescript
describe('validateEmail', () => {
  it('should validate correct email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('should reject invalid email', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

### Component Tests

Test React components with React Testing Library:

```typescript
import { render, screen } from '@testing-library/react';
import { AsyncDataWrapper } from '@/components/AsyncDataWrapper';

describe('AsyncDataWrapper', () => {
  it('should show loading spinner when loading', () => {
    render(
      <AsyncDataWrapper isLoading={true} error={null} data={null}>
        Content
      </AsyncDataWrapper>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### Hook Tests

Test custom hooks with React Hooks Testing Library:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAsyncState } from '@/hooks/useAsyncState';

describe('useAsyncState', () => {
  it('should handle async operations', async () => {
    const { result } = renderHook(() => useAsyncState());

    await act(async () => {
      await result.current.execute(async () => ({ data: 'test' }));
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual({ data: 'test' });
  });
});
```

### Integration Tests

Test multiple components working together:

```typescript
describe('Chat Integration', () => {
  it('should send and receive messages', async () => {
    // Test full chat flow
  });
});
```

## Mocking

### Mock Supabase

```typescript
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    })),
  },
}));
```

### Mock Hooks

```typescript
jest.mock('@/hooks/useAsyncState', () => ({
  useAsyncState: jest.fn(() => ({
    execute: jest.fn(),
    isLoading: false,
    error: null,
  })),
}));
```

## Best Practices

### 1. Test Behavior, Not Implementation

❌ Bad:
```typescript
it('should call setState', () => {
  const setState = jest.fn();
  // ...
});
```

✅ Good:
```typescript
it('should display error message when validation fails', () => {
  // ...
  expect(screen.getByText(/error/i)).toBeInTheDocument();
});
```

### 2. Use Descriptive Test Names

❌ Bad:
```typescript
it('works', () => {});
```

✅ Good:
```typescript
it('should reject email without @ symbol', () => {});
```

### 3. Keep Tests Focused

Each test should test one thing:

```typescript
it('should validate email format', () => {
  expect(validateEmail('user@example.com')).toBe(true);
});

it('should reject email without domain', () => {
  expect(validateEmail('user@')).toBe(false);
});
```

### 4. Use Setup and Teardown

```typescript
describe('User Service', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should create user', () => {});
});
```

### 5. Test Edge Cases

```typescript
describe('validateAge', () => {
  it('should accept age 13 (minimum)', () => {
    expect(validateAge(13)).toBe(true);
  });

  it('should reject age 12 (below minimum)', () => {
    expect(validateAge(12)).toBe(false);
  });

  it('should accept age 120 (maximum)', () => {
    expect(validateAge(120)).toBe(true);
  });

  it('should reject age 121 (above maximum)', () => {
    expect(validateAge(121)).toBe(false);
  });
});
```

## Test Files to Create

### Priority 1 (Core Utilities)
- [ ] `validation.test.ts` - ✅ Created
- [ ] `errorHandler.test.ts` - Validation and error parsing
- [ ] `apiPatterns.test.ts` - API operation patterns
- [ ] `toastNotifications.test.ts` - Toast notification utilities

### Priority 2 (Hooks)
- [ ] `useAsyncState.test.ts` - Async state management
- [ ] `useFilteredData.test.ts` - Data filtering and search
- [ ] `useFormSubmit.test.ts` - Form submission

### Priority 3 (Components)
- [ ] `AsyncDataWrapper.test.tsx` - Async data wrapper
- [ ] `LoadingStates.test.tsx` - Loading state components
- [ ] `MessageInput.test.tsx` - Chat message input
- [ ] `PostCreator.test.tsx` - Post creation

### Priority 4 (Integration)
- [ ] `chat.integration.test.ts` - Chat functionality
- [ ] `community.integration.test.ts` - Community features
- [ ] `auth.integration.test.ts` - Authentication flow

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

## Debugging Tests

### Use `screen.debug()`

```typescript
it('should render user profile', () => {
  render(<UserProfile userId="123" />);
  screen.debug(); // Prints DOM to console
});
```

### Use `screen.logTestingPlaygroundURL()`

```typescript
it('should render form', () => {
  render(<Form />);
  screen.logTestingPlaygroundURL(); // Generates Testing Playground URL
});
```

### Run Single Test

```bash
npm test -- --testNamePattern="should validate email"
```

## Common Issues

### Issue: "Cannot find module"
**Solution**: Check path aliases in `jest.config.js`

### Issue: "Timeout exceeded"
**Solution**: Increase timeout: `jest.setTimeout(10000)`

### Issue: "Mock not working"
**Solution**: Ensure mock is defined before import

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Next Steps

1. Install testing dependencies
2. Run existing tests: `npm test`
3. Create additional test files following Priority 1-4
4. Aim for 70%+ code coverage
5. Integrate tests into CI/CD pipeline
