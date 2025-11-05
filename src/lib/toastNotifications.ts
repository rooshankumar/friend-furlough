import { toast } from 'sonner';

/**
 * Standardized toast notifications for common scenarios
 */

export const toastNotifications = {
  /**
   * Success notification
   */
  success: (title: string, description?: string) => {
    toast.success(title, {
      description,
      duration: 3000,
    });
  },

  /**
   * Error notification
   */
  error: (title: string, description?: string) => {
    toast.error(title, {
      description,
      duration: 4000,
    });
  },

  /**
   * Loading notification
   */
  loading: (title: string, description?: string) => {
    return toast.loading(title, {
      description,
    });
  },

  /**
   * Info notification
   */
  info: (title: string, description?: string) => {
    toast.info(title, {
      description,
      duration: 3000,
    });
  },

  /**
   * Warning notification
   */
  warning: (title: string, description?: string) => {
    toast.warning(title, {
      description,
      duration: 3500,
    });
  },

  /**
   * Promise-based notification (shows loading, then success/error)
   */
  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

/**
 * Common toast messages
 */
export const toastMessages = {
  // Success messages
  success: {
    profileUpdated: 'Profile updated successfully',
    postCreated: 'Post created successfully',
    commentAdded: 'Comment added successfully',
    friendRequestSent: 'Friend request sent',
    friendRequestAccepted: 'Friend request accepted',
    conversationStarted: 'Conversation started',
    messageSent: 'Message sent',
    attachmentUploaded: 'Attachment uploaded',
    voiceMessageSent: 'Voice message sent',
    saved: 'Saved successfully',
  },

  // Error messages
  error: {
    profileUpdateFailed: 'Failed to update profile',
    postCreationFailed: 'Failed to create post',
    commentFailed: 'Failed to add comment',
    friendRequestFailed: 'Failed to send friend request',
    conversationFailed: 'Failed to start conversation',
    messageSendFailed: 'Failed to send message',
    attachmentUploadFailed: 'Failed to upload attachment',
    voiceMessageFailed: 'Failed to send voice message',
    loadingFailed: 'Failed to load data',
    saveFailed: 'Failed to save',
    unauthorized: 'You are not authorized to perform this action',
    networkError: 'Network error. Please check your connection.',
  },

  // Loading messages
  loading: {
    savingProfile: 'Saving profile...',
    creatingPost: 'Creating post...',
    addingComment: 'Adding comment...',
    sendingFriendRequest: 'Sending friend request...',
    startingConversation: 'Starting conversation...',
    sendingMessage: 'Sending message...',
    uploadingAttachment: 'Uploading attachment...',
    sendingVoiceMessage: 'Sending voice message...',
    loading: 'Loading...',
  },

  // Info messages
  info: {
    offline: 'You are offline. Messages will be sent when you reconnect.',
    reconnecting: 'Reconnecting...',
    retrying: 'Retrying...',
    noData: 'No data available',
  },

  // Warning messages
  warning: {
    unsavedChanges: 'You have unsaved changes',
    deleteConfirmation: 'Are you sure you want to delete this?',
    confirmAction: 'Please confirm this action',
  },
};

/**
 * Helper function to show async operation feedback
 */
export const showAsyncFeedback = async <T,>(
  operation: Promise<T>,
  messages: {
    loading?: string;
    success?: string;
    error?: string;
  }
) => {
  const loadingToastId = messages.loading
    ? toastNotifications.loading(messages.loading)
    : undefined;

  try {
    const result = await operation;
    if (loadingToastId) toastNotifications.dismiss(loadingToastId);
    if (messages.success) toastNotifications.success(messages.success);
    return result;
  } catch (error) {
    if (loadingToastId) toastNotifications.dismiss(loadingToastId);
    if (messages.error) toastNotifications.error(messages.error);
    throw error;
  }
};
