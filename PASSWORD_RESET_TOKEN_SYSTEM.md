# Token-Based Password Reset System

## Overview

A secure, custom token-based password reset system that:
- Generates cryptographically secure tokens
- Stores tokens in database with 24-hour expiration
- Sends reset links via Brevo email service
- Verifies tokens before allowing password reset
- Updates password in Supabase Auth
- Prevents token reuse

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    User Flow                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ForgotPasswordPage                                      │
│     ↓                                                       │
│  2. requestPasswordReset()                                  │
│     ├─ Generate token (64-char hex)                        │
│     ├─ Store in password_reset_tokens table                │
│     └─ Send email via Brevo                                │
│     ↓                                                       │
│  3. User receives email with token link                    │
│     ↓                                                       │
│  4. ResetPasswordPage?token=abc123...                       │
│     ↓                                                       │
│  5. verifyResetToken()                                      │
│     ├─ Check token exists                                  │
│     ├─ Check not already used                              │
│     ├─ Check not expired                                   │
│     └─ Return user_id if valid                             │
│     ↓                                                       │
│  6. User enters new password                               │
│     ↓                                                       │
│  7. resetPasswordWithToken()                                │
│     ├─ Verify token again                                  │
│     ├─ Update password in Supabase Auth                    │
│     ├─ Mark token as used                                  │
│     └─ Clean up old tokens                                 │
│     ↓                                                       │
│  8. Success! User can login with new password              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,        -- 64-char hex string
  expires_at TIMESTAMP,               -- 24 hours from creation
  used BOOLEAN DEFAULT FALSE,         -- Prevents reuse
  created_at TIMESTAMP
);
```

### Key Features

- **Secure Token Generation**: Uses `crypto.getRandomValues()` for 32 bytes of randomness
- **Token Format**: 64-character hexadecimal string
- **Expiration**: 24 hours from creation
- **One-Time Use**: Tokens marked as used after password reset
- **Email Integration**: Sends via Brevo with clickable link
- **Database Storage**: Tokens stored with user_id and email
- **RLS Protection**: Row-level security policies for data protection

---

## Implementation Details

### 1. Token Generation

```typescript
function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
```

**Result**: 64-character hex string like `a1b2c3d4e5f6...`

### 2. Request Password Reset

**File**: `src/lib/passwordResetService.ts`

```typescript
export async function requestPasswordReset(email: string): Promise<PasswordResetResult>
```

**Steps**:
1. Find user by email in profiles table
2. Generate 64-char token
3. Store token in `password_reset_tokens` table with 24-hour expiration
4. Build reset link: `/auth/reset-password?token=abc123...`
5. Send email via Brevo with reset link

**Email Contains**:
- User's name (personalized)
- Clickable button with reset link
- Link format: `https://roshlingua.vercel.app/auth/reset-password?token=abc123...`
- Expiration info: "This link expires in 24 hours"

### 3. Verify Token

**File**: `src/lib/passwordResetService.ts`

```typescript
export async function verifyResetToken(token: string): Promise<TokenVerificationResult>
```

**Checks**:
1. Token format (must be 64 characters)
2. Token exists in database
3. Token not already used
4. Token not expired (current time < expires_at)

**Returns**:
- `valid: true` + `userId` + `email` if valid
- `valid: false` + `error` message if invalid

### 4. Reset Password with Token

**File**: `src/lib/passwordResetService.ts`

```typescript
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<PasswordResetResult>
```

**Steps**:
1. Verify token (all checks)
2. Update password in Supabase Auth
3. Mark token as used in database
4. Clean up old expired tokens

**Result**: Password updated, user can login with new password

---

## File Structure

### New Files Created

1. **`src/lib/passwordResetService.ts`**
   - Core password reset logic
   - Token generation, verification, and password update
   - 200+ lines of well-documented code

2. **`supabase/migrations/20251118_create_password_reset_tokens.sql`**
   - Database table creation
   - Indexes for performance
   - RLS policies for security

### Modified Files

1. **`src/pages/auth/ForgotPasswordPage.tsx`**
   - Uses `requestPasswordReset()` function
   - Sends email via Brevo with token

2. **`src/pages/auth/ResetPasswordPage.tsx`**
   - Extracts token from URL query parameter
   - Verifies token on page load
   - Uses `resetPasswordWithToken()` to update password

---

## Security Features

### 1. Token Security
- ✅ Cryptographically secure random generation
- ✅ 64-character hex string (256-bit entropy)
- ✅ Unique constraint in database
- ✅ One-time use only

### 2. Expiration
- ✅ 24-hour expiration time
- ✅ Automatic cleanup of expired tokens
- ✅ Expired tokens cannot be used

### 3. Database Security
- ✅ Row-level security (RLS) policies
- ✅ Service role only can insert/update tokens
- ✅ Users cannot directly access tokens
- ✅ Tokens stored separately from user data

### 4. Email Security
- ✅ Email sent via Brevo (trusted provider)
- ✅ Link includes token in query parameter
- ✅ Token verified before password update
- ✅ No sensitive data in email body

### 5. Password Update
- ✅ Token verified before update
- ✅ Password updated in Supabase Auth
- ✅ Token marked as used immediately
- ✅ Old tokens cleaned up

---

## Testing Password Reset

### Test Flow

1. **Request Reset**
   ```
   Go to: /auth/signin
   Click: "Forgot Password?"
   Enter: test@example.com
   Click: "Send Reset Link"
   ```

2. **Check Email**
   ```
   Open email inbox
   Look for: "Reset your password" email from roshLingua
   Click: "Reset Password" button in email
   ```

3. **Reset Password**
   ```
   Page opens: /auth/reset-password?token=abc123...
   Enter: New password
   Confirm: New password
   Click: "Reset Password"
   ```

4. **Verify Success**
   ```
   See: "Password Reset! ✅" message
   Redirected to: /auth/signin
   Login with: email + new password
   ```

### Expected Behavior

| Step | Expected Result |
|------|-----------------|
| Request reset | Email sent within seconds |
| Email arrives | Contains clickable button |
| Click link | Reset page loads with form |
| Enter password | Form validates password |
| Submit | Password updated successfully |
| Login | Can login with new password |
| Old token | Cannot be reused |
| Expired token | Shows "link expired" error |

---

## Database Setup

### Run Migration

```bash
# Apply migration to Supabase
supabase migration up

# Or manually run SQL in Supabase dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of: supabase/migrations/20251118_create_password_reset_tokens.sql
# 3. Run the SQL
```

### Verify Table Created

```sql
-- Check table exists
SELECT * FROM password_reset_tokens LIMIT 1;

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'password_reset_tokens';

-- Check RLS enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'password_reset_tokens';
```

---

## Brevo Email Template

### Template ID: 2 (Password Reset)

**Subject**: Reset your password

**Variables**:
- `{{name}}` - User's name
- `{{resetLink}}` - Full reset link with token
- `{{expiryTime}}` - "24 hours"

**HTML Template Example**:
```html
<h1>Hi {{name}},</h1>

<p>We received a request to reset your password. Click the button below to create a new password:</p>

<a href="{{resetLink}}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
  Reset Password
</a>

<p>This link expires in {{expiryTime}}.</p>

<p>If you didn't request this, you can safely ignore this email.</p>
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid token format" | Token not 64 chars | Request new reset link |
| "Invalid or expired reset link" | Token not in DB | Request new reset link |
| "This reset link has already been used" | Token marked as used | Request new reset link |
| "This reset link has expired" | Token older than 24 hours | Request new reset link |
| "Failed to update password" | Supabase Auth error | Check auth settings |
| "Failed to send reset email" | Brevo API error | Check Brevo API key |

---

## Cleanup & Maintenance

### Automatic Cleanup

Expired tokens are automatically cleaned up:
1. When user resets password (old tokens deleted)
2. Via `cleanupExpiredTokens()` function (call periodically)

### Manual Cleanup

```typescript
import { cleanupExpiredTokens } from '@/lib/passwordResetService';

// Call this periodically (e.g., daily)
await cleanupExpiredTokens();
```

### Database Cleanup

```sql
-- Delete expired tokens
DELETE FROM password_reset_tokens 
WHERE expires_at < NOW();

-- Delete used tokens older than 7 days
DELETE FROM password_reset_tokens 
WHERE used = true AND created_at < NOW() - INTERVAL '7 days';
```

---

## Environment Variables

Required in `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BREVO_API_KEY=xkeysib-...
VITE_BREVO_SENDER_EMAIL=roshlingua@gmail.com
VITE_BREVO_SENDER_NAME=roshLingua
VITE_BREVO_TEMPLATE_FORGOT_PASSWORD=2
```

---

## API Reference

### requestPasswordReset(email: string)

Initiates password reset process.

**Parameters**:
- `email` - User's email address

**Returns**:
```typescript
{
  success: boolean;
  error?: string;
  message?: string;
}
```

**Example**:
```typescript
const result = await requestPasswordReset('user@example.com');
if (result.success) {
  console.log('Email sent');
}
```

### verifyResetToken(token: string)

Verifies if token is valid and not expired.

**Parameters**:
- `token` - Reset token from URL

**Returns**:
```typescript
{
  valid: boolean;
  userId?: string;
  email?: string;
  error?: string;
}
```

**Example**:
```typescript
const verification = await verifyResetToken(token);
if (verification.valid) {
  console.log('User ID:', verification.userId);
}
```

### resetPasswordWithToken(token: string, newPassword: string)

Resets password if token is valid.

**Parameters**:
- `token` - Reset token from URL
- `newPassword` - New password (min 6 chars)

**Returns**:
```typescript
{
  success: boolean;
  error?: string;
  message?: string;
}
```

**Example**:
```typescript
const result = await resetPasswordWithToken(token, 'newPassword123');
if (result.success) {
  console.log('Password updated');
}
```

---

## Troubleshooting

### Email Not Received

1. Check spam folder
2. Verify email in Brevo dashboard
3. Check Brevo API key in `.env.local`
4. Check browser console for errors

### Token Invalid Error

1. Token must be exactly 64 characters
2. Token must be in database
3. Token must not be expired (24 hours)
4. Token must not be already used

### Password Not Updating

1. Check Supabase Auth settings
2. Verify password meets requirements (min 6 chars)
3. Check browser console for errors
4. Verify token is valid before submission

### Database Issues

1. Check migration was applied
2. Verify table exists: `SELECT * FROM password_reset_tokens;`
3. Check RLS policies are enabled
4. Verify Supabase connection

---

## Summary

✅ Secure token-based password reset
✅ 24-hour token expiration
✅ One-time use tokens
✅ Brevo email integration
✅ Database storage with RLS
✅ Comprehensive error handling
✅ Automatic cleanup
✅ Production-ready implementation
