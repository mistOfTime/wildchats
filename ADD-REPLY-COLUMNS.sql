-- Add reply columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reply_to_text TEXT,
ADD COLUMN IF NOT EXISTS reply_to_sender UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id);
