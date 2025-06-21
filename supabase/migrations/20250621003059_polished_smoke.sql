/*
  # Create chat_images storage bucket with RLS policies

  1. Storage Setup
    - Create `chat_images` bucket for storing medical images from chat sessions
    - Enable RLS on the bucket
    - Set up proper access policies

  2. Security Policies
    - Allow authenticated users to upload images to their own folders
    - Allow users to read their own uploaded images
    - Ensure proper folder structure: user_id/session_id/filename

  3. Bucket Configuration
    - Public access for reading (with proper RLS)
    - File size limits and type restrictions
*/

-- Create the chat_images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat_images',
  'chat_images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat_images' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Policy to allow authenticated users to read their own images
CREATE POLICY "Users can read own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat_images' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Policy to allow authenticated users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat_images' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Policy to allow authenticated users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat_images' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
)
WITH CHECK (
  bucket_id = 'chat_images' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);