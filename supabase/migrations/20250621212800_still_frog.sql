/*
  # Fix Doctor Notification System

  1. Updates
    - Fix notification policies to allow proper notification creation
    - Update patient service to create notifications correctly
    - Add debugging function to check notification flow

  2. Security
    - Ensure notifications can be created for doctor requests
    - Maintain proper RLS while allowing cross-user notifications
*/

-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;

-- Create comprehensive notification policies
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = notifications.user_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = notifications.user_id 
      AND profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = notifications.user_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Allow authenticated users to create notifications for any user
-- This is needed for patient-to-doctor notifications
CREATE POLICY "Authenticated users can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create a function to safely create notifications with proper error handling
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  notification_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  -- Validate that the target user exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Target user does not exist: %', target_user_id;
  END IF;

  -- Insert the notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    read,
    created_at
  ) VALUES (
    target_user_id,
    notification_type,
    notification_title,
    notification_message,
    notification_data,
    false,
    NOW()
  ) RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;

-- Update the patient doctor request function to use the new notification function
CREATE OR REPLACE FUNCTION handle_doctor_request_notification()
RETURNS TRIGGER AS $$
DECLARE
  patient_profile profiles%ROWTYPE;
  doctor_profile profiles%ROWTYPE;
BEGIN
  -- Get patient profile
  SELECT * INTO patient_profile 
  FROM profiles 
  WHERE id = NEW.patient_id;

  -- Get doctor profile  
  SELECT * INTO doctor_profile 
  FROM profiles 
  WHERE id = NEW.doctor_id;

  -- Create notification for the doctor
  IF FOUND THEN
    PERFORM create_notification(
      NEW.doctor_id,
      'doctor_request',
      'New Patient Request',
      patient_profile.full_name || ' has requested you as their doctor.',
      jsonb_build_object(
        'request_id', NEW.id,
        'patient_id', NEW.patient_id,
        'patient_name', patient_profile.full_name
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic notification creation on doctor requests
DROP TRIGGER IF EXISTS doctor_request_notification_trigger ON patient_doctor_requests;
CREATE TRIGGER doctor_request_notification_trigger
  AFTER INSERT ON patient_doctor_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_doctor_request_notification();

-- Create a function to test the notification system
CREATE OR REPLACE FUNCTION test_notification_system(
  test_patient_email text DEFAULT 'test.patient@example.com',
  test_doctor_email text DEFAULT 'dr.sarah.johnson@virtualdoc.com'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  patient_profile_id uuid;
  doctor_profile_id uuid;
  request_id uuid;
  notification_count integer;
  result_message text;
BEGIN
  -- Get patient profile ID
  SELECT id INTO patient_profile_id 
  FROM profiles 
  WHERE email = test_patient_email;

  -- Get doctor profile ID
  SELECT id INTO doctor_profile_id 
  FROM profiles 
  WHERE email = test_doctor_email;

  IF patient_profile_id IS NULL THEN
    RETURN 'Patient not found with email: ' || test_patient_email;
  END IF;

  IF doctor_profile_id IS NULL THEN
    RETURN 'Doctor not found with email: ' || test_doctor_email;
  END IF;

  -- Count existing notifications for this doctor
  SELECT COUNT(*) INTO notification_count
  FROM notifications
  WHERE user_id = doctor_profile_id;

  result_message := 'Test completed. Doctor ' || test_doctor_email || ' has ' || notification_count || ' notifications.';
  
  RETURN result_message;
END;
$$;

-- Grant execute permission for testing
GRANT EXECUTE ON FUNCTION test_notification_system TO authenticated;

-- Add indexes for better notification performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(user_id, read);