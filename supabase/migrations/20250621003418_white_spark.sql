/*
  # Create Chat Images Storage Bucket and Policies

  1. Storage Setup
    - Create chat_images bucket for storing uploaded images
    - Configure bucket settings (file size limit, allowed MIME types)
    - Set up RLS policies for secure access

  2. Security
    - Users can only access their own images
    - Images are organized by user_id/session_id/filename
    - Proper authentication required for all operations
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

-- Create storage policies using Supabase's storage policy functions
-- These policies will be applied to the storage.objects table

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload images to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;

-- Policy: Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat_images' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to read their own images
CREATE POLICY "Users can read own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat_images' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat_images' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own images (for metadata)
CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat_images' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'chat_images' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Create a helper function to generate signed URLs for images
CREATE OR REPLACE FUNCTION get_chat_image_url(
  file_path text,
  expires_in integer DEFAULT 3600
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signed_url text;
BEGIN
  -- Check if the user has access to this file
  IF (string_to_array(file_path, '/'))[1] != auth.uid()::text THEN
    RAISE EXCEPTION 'Access denied to file: %', file_path;
  END IF;
  
  -- Generate signed URL (this is a placeholder - actual implementation would use Supabase storage functions)
  signed_url := '/storage/v1/object/sign/chat_images/' || file_path;
  
  RETURN signed_url;
END;
$$;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION get_chat_image_url TO authenticated;