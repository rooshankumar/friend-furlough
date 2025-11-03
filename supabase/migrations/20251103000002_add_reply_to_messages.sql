-- Add reply_to_message_id column to messages table for reply functionality

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_reply_to 
ON public.messages(reply_to_message_id) 
WHERE reply_to_message_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.messages.reply_to_message_id IS 
'Reference to the message being replied to (WhatsApp/Telegram style replies)';
