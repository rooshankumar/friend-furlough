/**
 * React Hook for Email Service
 * Simplifies email sending in components with loading/error states
 */

import { useState, useCallback } from 'react';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendNewMessageNotification,
  sendCustomEmail,
  sendBulkEmail,
} from '@/lib/emailService';

interface UseEmailServiceState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export function useEmailService() {
  const [state, setState] = useState<UseEmailServiceState>({
    isLoading: false,
    error: null,
    success: false,
  });

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: false,
    });
  }, []);

  const sendWelcome = useCallback(
    async (email: string, name: string) => {
      setState({ isLoading: true, error: null, success: false });
      try {
        const result = await sendWelcomeEmail(email, name);
        if (result.success) {
          setState({ isLoading: false, error: null, success: true });
          return result;
        } else {
          setState({ isLoading: false, error: result.error || 'Failed to send email', success: false });
          return result;
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to send email';
        setState({ isLoading: false, error: errorMsg, success: false });
        return { success: false, error: errorMsg };
      }
    },
    []
  );

  const sendPasswordReset = useCallback(
    async (email: string, name: string, resetLink: string) => {
      setState({ isLoading: true, error: null, success: false });
      try {
        const result = await sendPasswordResetEmail(email, name, resetLink);
        if (result.success) {
          setState({ isLoading: false, error: null, success: true });
          return result;
        } else {
          setState({ isLoading: false, error: result.error || 'Failed to send email', success: false });
          return result;
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to send email';
        setState({ isLoading: false, error: errorMsg, success: false });
        return { success: false, error: errorMsg };
      }
    },
    []
  );

  const sendVerification = useCallback(
    async (email: string, name: string, verifyLink: string) => {
      setState({ isLoading: true, error: null, success: false });
      try {
        const result = await sendVerificationEmail(email, name, verifyLink);
        if (result.success) {
          setState({ isLoading: false, error: null, success: true });
          return result;
        } else {
          setState({ isLoading: false, error: result.error || 'Failed to send email', success: false });
          return result;
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to send email';
        setState({ isLoading: false, error: errorMsg, success: false });
        return { success: false, error: errorMsg };
      }
    },
    []
  );

  const sendMessageNotification = useCallback(
    async (
      email: string,
      recipientName: string,
      senderName: string,
      messagePreview: string,
      chatLink: string
    ) => {
      setState({ isLoading: true, error: null, success: false });
      try {
        const result = await sendNewMessageNotification(
          email,
          recipientName,
          senderName,
          messagePreview,
          chatLink
        );
        if (result.success) {
          setState({ isLoading: false, error: null, success: true });
          return result;
        } else {
          setState({ isLoading: false, error: result.error || 'Failed to send email', success: false });
          return result;
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to send email';
        setState({ isLoading: false, error: errorMsg, success: false });
        return { success: false, error: errorMsg };
      }
    },
    []
  );

  const sendCustom = useCallback(
    async (email: string, templateId: number, params: Record<string, any>, tags?: string[]) => {
      setState({ isLoading: true, error: null, success: false });
      try {
        const result = await sendCustomEmail(email, templateId, params, tags);
        if (result.success) {
          setState({ isLoading: false, error: null, success: true });
          return result;
        } else {
          setState({ isLoading: false, error: result.error || 'Failed to send email', success: false });
          return result;
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to send email';
        setState({ isLoading: false, error: errorMsg, success: false });
        return { success: false, error: errorMsg };
      }
    },
    []
  );

  const sendBulk = useCallback(
    async (
      emails: string[],
      templateId: number,
      params: Record<string, any>,
      tags?: string[]
    ) => {
      setState({ isLoading: true, error: null, success: false });
      try {
        const result = await sendBulkEmail(emails, templateId, params, tags);
        if (result.success) {
          setState({ isLoading: false, error: null, success: true });
          return result;
        } else {
          setState({ isLoading: false, error: result.error || 'Failed to send email', success: false });
          return result;
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to send email';
        setState({ isLoading: false, error: errorMsg, success: false });
        return { success: false, error: errorMsg };
      }
    },
    []
  );

  return {
    ...state,
    resetState,
    sendWelcome,
    sendPasswordReset,
    sendVerification,
    sendMessageNotification,
    sendCustom,
    sendBulk,
  };
}
