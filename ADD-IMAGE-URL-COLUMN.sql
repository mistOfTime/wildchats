-- Add image_url column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_image_url ON messages(image_url) WHERE image_url IS NOT NULL;
