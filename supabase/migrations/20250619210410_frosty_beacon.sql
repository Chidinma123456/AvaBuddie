/*
  # Fix notifications RLS policy

  1. Security
    - Update RLS policy to allow authenticated users to insert notifications for any user
    - This enables patients to create notifications for doctors when requesting them
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;

-- Create new INSERT policy that allows authenticated users to insert notifications for any user
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);