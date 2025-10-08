-- Add 'voice' as a valid message type to the messages table

-- First, let's check the current constraint and drop it
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check;

-- Add the new constraint that includes 'voice' type
ALTER TABLE messages ADD CONSTRAINT messages_type_check 
CHECK (type IN ('text', 'image', 'file', 'voice'));

-- Update any existing voice messages that might have been created
UPDATE messages SET type = 'voice' 
WHERE media_url LIKE '%voicemail%' OR media_url LIKE '%.webm%' OR media_url LIKE '%.mp3%' OR media_url LIKE '%.wav%';
