-- Add reply_to_image_url column to messages table
-- This allows users to reply to photo messages and show the image preview

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reply_to_image_url TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'reply_to_image_url';
