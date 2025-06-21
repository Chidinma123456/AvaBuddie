/*
  # Create Chat Images Storage Bucket

  1. Storage Setup
    - Create chat_images bucket for storing uploaded images
    - Configure bucket settings for image uploads
    - Set up proper access policies

  2. Security
    - Users can only upload to their own folders
    - Folder structure: user_id/session_id/filename
    - 10MB file size limit for images
*/

-- Create the chat_images bucket if it doesn't exist
DO $$
BEGIN
  -- Insert bucket if it doesn't exist
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
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Bucket creation handled: %', SQLERRM;
END $$;

-- Create storage policies using the storage schema functions
-- Note: These policies will be created in the storage schema, not public schema

-- Policy to allow authenticated users to upload images to their own folder
CREATE POLICY IF NOT EXISTS "Users can upload images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow authenticated users to read their own images
CREATE POLICY IF NOT EXISTS "Users can read own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow authenticated users to delete their own images
CREATE POLICY IF NOT EXISTS "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow authenticated users to update their own images
CREATE POLICY IF NOT EXISTS "Users can update own images"
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

-- Create a function to help with image uploads
CREATE OR REPLACE FUNCTION upload_chat_image(
  user_id uuid,
  session_id text,
  file_name text,
  file_data bytea,
  content_type text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  file_path text;
  result text;
BEGIN
  -- Construct the file path
  file_path := user_id::text || '/' || session_id || '/' || file_name;
  
  -- Upload the file to storage
  SELECT storage.upload(
    'chat_images',
    file_path,
    file_data,
    content_type
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission on the upload function
GRANT EXECUTE ON FUNCTION upload_chat_image TO authenticated;