-- Create the chat-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update chat images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete chat images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view chat images" ON storage.objects;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update chat images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-images');

-- Allow authenticated users to delete their own chat images
CREATE POLICY "Authenticated users can delete chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-images');

-- Allow public to view chat images
CREATE POLICY "Public can view chat images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-images');
