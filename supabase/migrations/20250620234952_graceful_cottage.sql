/*
  # Create Storage Bucket for Chat Images

  1. Storage Setup
    - Create 'chat_images' bucket for storing uploaded medical images
    - Set up proper security policies for image access
    - Enable public read access for viewing images
    - Restrict upload/delete to authenticated users for their own folders

  2. Security
    - Users can only upload to their own folders (user_id/session_id/)
    - Public read access for viewing images
    - Users can delete/update their own images only
*/

-- Create the chat_images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_images', 'chat_images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images to their own folders
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all images
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chat_images');

-- Allow users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);