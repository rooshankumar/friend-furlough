/**
 * Delete Conversation Confirmation Dialog
 * Allows users to safely delete conversations with confirmation
 */

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

interface DeleteConversationDialogProps {
  isOpen: boolean;
  conversationId: string;
  otherUserName?: string;
  isLoading?: boolean;
  onConfirm: (conversationId: string) => Promise<void>;
  onCancel: () => void;
}

export const DeleteConversationDialog: React.FC<DeleteConversationDialogProps> = ({
  isOpen,
  conversationId,
  otherUserName = 'this user',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm(conversationId);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base mt-2">
            Are you sure you want to delete this conversation with <strong>{otherUserName}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 my-4">
          <p className="text-sm text-destructive font-medium">
            ⚠️ This action cannot be undone. All messages in this conversation will be removed from your chat list.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? 'Deleting...' : 'Delete Conversation'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
