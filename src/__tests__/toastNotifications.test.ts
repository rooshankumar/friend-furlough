/**
 * Unit tests for toast notification utilities
 */

import { toastNotifications, toastMessages } from '@/lib/toastNotifications';
import { toast } from 'sonner';

jest.mock('sonner');

describe('Toast Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toastNotifications', () => {
    it('should call toast.success with title', () => {
      toastNotifications.success('Profile updated');

      expect(toast.success).toHaveBeenCalledWith('Profile updated', expect.any(Object));
    });

    it('should call toast.success with title and description', () => {
      toastNotifications.success('Success', 'Operation completed');

      expect(toast.success).toHaveBeenCalledWith('Success', expect.objectContaining({
        description: 'Operation completed',
      }));
    });

    it('should call toast.error with title', () => {
      toastNotifications.error('Error occurred');

      expect(toast.error).toHaveBeenCalledWith('Error occurred', expect.any(Object));
    });

    it('should call toast.error with title and description', () => {
      toastNotifications.error('Error', 'Something went wrong');

      expect(toast.error).toHaveBeenCalledWith('Error', expect.objectContaining({
        description: 'Something went wrong',
      }));
    });

    it('should call toast.loading with title', () => {
      toastNotifications.loading('Loading...');

      expect(toast.loading).toHaveBeenCalledWith('Loading...', expect.any(Object));
    });

    it('should call toast.info with title', () => {
      toastNotifications.info('Info message');

      expect(toast.info).toHaveBeenCalledWith('Info message', expect.any(Object));
    });

    it('should call toast.warning with title', () => {
      toastNotifications.warning('Warning message');

      expect(toast.warning).toHaveBeenCalledWith('Warning message', expect.any(Object));
    });

    it('should call toast.promise with promise and messages', async () => {
      const promise = Promise.resolve('success');

      await toastNotifications.promise(promise, {
        loading: 'Loading...',
        success: 'Success!',
        error: 'Error!',
      });

      expect(toast.promise).toHaveBeenCalled();
    });

    it('should call toast.dismiss with no arguments', () => {
      toastNotifications.dismiss();

      expect(toast.dismiss).toHaveBeenCalledWith(undefined);
    });

    it('should call toast.dismiss with toast ID', () => {
      toastNotifications.dismiss('toast-123');

      expect(toast.dismiss).toHaveBeenCalledWith('toast-123');
    });

    it('should call toast.dismissAll', () => {
      toastNotifications.dismissAll();

      expect(toast.dismiss).toHaveBeenCalled();
    });
  });

  describe('toastMessages', () => {
    describe('success messages', () => {
      it('should have profileUpdated message', () => {
        expect(toastMessages.success.profileUpdated).toBeDefined();
        expect(typeof toastMessages.success.profileUpdated).toBe('string');
      });

      it('should have postCreated message', () => {
        expect(toastMessages.success.postCreated).toBeDefined();
      });

      it('should have commentAdded message', () => {
        expect(toastMessages.success.commentAdded).toBeDefined();
      });

      it('should have friendRequestSent message', () => {
        expect(toastMessages.success.friendRequestSent).toBeDefined();
      });

      it('should have conversationStarted message', () => {
        expect(toastMessages.success.conversationStarted).toBeDefined();
      });

      it('should have messageSent message', () => {
        expect(toastMessages.success.messageSent).toBeDefined();
      });
    });

    describe('error messages', () => {
      it('should have profileUpdateFailed message', () => {
        expect(toastMessages.error.profileUpdateFailed).toBeDefined();
        expect(typeof toastMessages.error.profileUpdateFailed).toBe('string');
      });

      it('should have postCreationFailed message', () => {
        expect(toastMessages.error.postCreationFailed).toBeDefined();
      });

      it('should have messageSendFailed message', () => {
        expect(toastMessages.error.messageSendFailed).toBeDefined();
      });

      it('should have networkError message', () => {
        expect(toastMessages.error.networkError).toBeDefined();
      });

      it('should have unauthorized message', () => {
        expect(toastMessages.error.unauthorized).toBeDefined();
      });
    });

    describe('loading messages', () => {
      it('should have savingProfile message', () => {
        expect(toastMessages.loading.savingProfile).toBeDefined();
        expect(typeof toastMessages.loading.savingProfile).toBe('string');
      });

      it('should have creatingPost message', () => {
        expect(toastMessages.loading.creatingPost).toBeDefined();
      });

      it('should have sendingMessage message', () => {
        expect(toastMessages.loading.sendingMessage).toBeDefined();
      });

      it('should have loading message', () => {
        expect(toastMessages.loading.loading).toBeDefined();
      });
    });

    describe('info messages', () => {
      it('should have offline message', () => {
        expect(toastMessages.info.offline).toBeDefined();
        expect(typeof toastMessages.info.offline).toBe('string');
      });

      it('should have reconnecting message', () => {
        expect(toastMessages.info.reconnecting).toBeDefined();
      });

      it('should have retrying message', () => {
        expect(toastMessages.info.retrying).toBeDefined();
      });
    });

    describe('warning messages', () => {
      it('should have unsavedChanges message', () => {
        expect(toastMessages.warning.unsavedChanges).toBeDefined();
        expect(typeof toastMessages.warning.unsavedChanges).toBe('string');
      });

      it('should have deleteConfirmation message', () => {
        expect(toastMessages.warning.deleteConfirmation).toBeDefined();
      });
    });
  });
});
