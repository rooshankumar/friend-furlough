/**
 * Password Reset Service
 * Handles token generation, storage, verification, and password updates
 */

import { supabase } from '@/integrations/supabase/client';
import { sendPasswordResetEmail } from './emailService';

interface PasswordResetResult {
  success: boolean;
  error?: string;
  message?: string;
}

interface TokenVerificationResult {
  valid: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

interface PasswordResetToken {
  id: string;
  user_id: string;
  email: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

/**
 * Generate a secure random token
 */
function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Request password reset - generates token and sends email
 */
export async function requestPasswordReset(email: string): Promise<PasswordResetResult> {
  try {
    // Step 1: Find user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      // Don't reveal if email exists for security
      console.warn('Email not found:', email);
      return {
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.',
      };
    }

    // Step 2: Generate reset token
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Step 3: Store token in database (using type casting for new table)
    const { error: insertError } = await (supabase
      .from('password_reset_tokens') as any)
      .insert({
        user_id: profile.id,
        email: profile.email,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      console.error('Failed to store reset token:', insertError);
      throw new Error('Failed to generate reset link');
    }

    // Step 4: Build reset link
    const resetLink = `${window.location.origin}/auth/reset-password?token=${resetToken}`;

    // Step 5: Send email via Brevo
    const emailResult = await sendPasswordResetEmail(
      profile.email,
      profile.name || 'User',
      resetLink
    );

    if (!emailResult.success) {
      console.error('Failed to send reset email:', emailResult.error);
      throw new Error('Failed to send reset email');
    }

    console.log('✅ Password reset email sent to:', profile.email);
    return {
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    };
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process password reset request',
    };
  }
}

/**
 * Verify reset token
 */
export async function verifyResetToken(token: string): Promise<TokenVerificationResult> {
  try {
    if (!token || token.length !== 64) {
      return {
        valid: false,
        error: 'Invalid token format',
      };
    }

    // Step 1: Find token in database (using type casting for new table)
    const result = await (supabase
      .from('password_reset_tokens') as any)
      .select('id, user_id, email, expires_at, used')
      .eq('token', token)
      .single();
    
    const resetToken = result.data as PasswordResetToken | null;
    const tokenError = result.error;

    if (tokenError || !resetToken) {
      console.warn('Token not found');
      return {
        valid: false,
        error: 'Invalid or expired reset link',
      };
    }

    // Step 2: Check if token is already used
    if (resetToken.used) {
      console.warn('Token already used');
      return {
        valid: false,
        error: 'This reset link has already been used',
      };
    }

    // Step 3: Check if token is expired
    const expiresAt = new Date(resetToken.expires_at);
    if (expiresAt < new Date()) {
      console.warn('Token expired');
      return {
        valid: false,
        error: 'This reset link has expired. Please request a new one.',
      };
    }

    // Step 4: Token is valid
    return {
      valid: true,
      userId: resetToken.user_id,
      email: resetToken.email,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return {
      valid: false,
      error: 'Failed to verify reset link',
    };
  }
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<PasswordResetResult> {
  try {
    // Step 1: Verify token
    const verification = await verifyResetToken(token);
    if (!verification.valid) {
      return {
        success: false,
        error: verification.error,
      };
    }

    const userId = verification.userId!;

    // Step 2: Update password in Supabase Auth
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateAuthError) {
      console.error('Failed to update auth password:', updateAuthError);
      throw new Error('Failed to update password');
    }

    // Step 3: Mark token as used (using type casting for new table)
    const { error: markUsedError } = await (supabase
      .from('password_reset_tokens') as any)
      .update({ used: true })
      .eq('token', token);

    if (markUsedError) {
      console.warn('Failed to mark token as used:', markUsedError);
      // Don't throw - password was already updated
    }

    // Step 4: Clean up old tokens for this user (using type casting for new table)
    const { error: cleanupError } = await (supabase
      .from('password_reset_tokens') as any)
      .delete()
      .eq('user_id', userId)
      .lt('expires_at', new Date().toISOString());

    if (cleanupError) {
      console.warn('Failed to cleanup old tokens:', cleanupError);
      // Don't throw - not critical
    }

    console.log('✅ Password reset successfully for user:', userId);
    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset password',
    };
  }
}

/**
 * Clean up expired tokens (call periodically)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    const { error } = await (supabase
      .from('password_reset_tokens') as any)
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.warn('Failed to cleanup expired tokens:', error);
    } else {
      console.log('✅ Expired tokens cleaned up');
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}
