/*
  # Create chat_images storage bucket with RLS policies

  1. Storage Setup
    - Create `chat_images` storage bucket if it doesn't exist
    - Enable RLS on the bucket
    - Set bucket to be private (not public by default)

  2. Security Policies
    - Allow authenticated users to upload images to their own folders
    - Allow authenticated users to read images they uploaded
    - Allow authenticated users to delete their own images
    - Folder structure: `user_id/session_id/filename`

  3. Important Notes
    - Images are organized by user ID and session ID for better organization
    - Only authenticated users can upload/access images
    - Users can only access images in their own folders
*/

-- Create the chat_images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat_images',
  'chat_images',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];

-- Enable RLS on the storage.objects table for our bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to read their own images
CREATE POLICY "Users can read own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own images (for metadata)
CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'chat_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);