-- Add image_url column to messages table for image attachments
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create reactions table for message likes/reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL, -- emoji like '❤️', '👍', '😂', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction)
);

-- Enable RLS on reactions table
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Reactions policies
CREATE POLICY "Users can view reactions on their messages"
ON message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages 
    WHERE messages.id = message_reactions.message_id 
    AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can add reactions"
ON message_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
ON message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Storage policies for chat images
DROP POLICY IF EXISTS "Authenticated users can upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update chat images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete chat images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view chat images" ON storage.objects;

CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Authenticated users can update chat images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-images');

CREATE POLICY "Authenticated users can delete chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-images');

CREATE POLICY "Public can view chat images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-images');
