/*
  # Fix Doctor Notification System

  1. Database Functions
    - Create robust notification creation function
    - Add automatic notification triggers for doctor requests
    - Add test function for debugging notifications

  2. Security
    - Update RLS policies for notifications
    - Ensure proper access control for notification creation

  3. Triggers
    - Automatic notification creation when patient requests doctor
    - Error handling and logging for notification failures
*/

-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;

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

  RAISE NOTICE 'Notification created successfully: %', notification_id;
  RETURN notification_id;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating notification: %', SQLERRM;
    RETURN NULL;
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
  notification_id uuid;
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
  IF patient_profile.id IS NOT NULL AND doctor_profile.id IS NOT NULL THEN
    SELECT create_notification(
      NEW.doctor_id,
      'doctor_request',
      'New Patient Request',
      patient_profile.full_name || ' has requested you as their doctor.',
      jsonb_build_object(
        'request_id', NEW.id,
        'patient_id', NEW.patient_id,
        'patient_name', patient_profile.full_name
      )
    ) INTO notification_id;
    
    IF notification_id IS NOT NULL THEN
      RAISE NOTICE 'Doctor request notification created: %', notification_id;
    ELSE
      RAISE NOTICE 'Failed to create doctor request notification';
    END IF;
  ELSE
    RAISE NOTICE 'Patient or doctor profile not found for notification';
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error in handle_doctor_request_notification: %', SQLERRM;
    RETURN NEW; -- Don't fail the main operation
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
  test_notification_id uuid;
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

  -- Test creating a notification directly
  SELECT create_notification(
    doctor_profile_id,
    'system',
    'Test Notification',
    'This is a test notification to verify the system is working.',
    jsonb_build_object('test', true, 'timestamp', NOW())
  ) INTO test_notification_id;

  IF test_notification_id IS NOT NULL THEN
    result_message := 'Test completed successfully. Doctor ' || test_doctor_email || ' has ' || (notification_count + 1) || ' notifications. Test notification ID: ' || test_notification_id;
  ELSE
    result_message := 'Test failed. Could not create test notification for doctor ' || test_doctor_email;
  END IF;
  
  RETURN result_message;
EXCEPTION
  WHEN others THEN
    RETURN 'Test failed with error: ' || SQLERRM;
END;
$$;

-- Grant execute permission for testing
GRANT EXECUTE ON FUNCTION test_notification_system TO authenticated;

-- Add indexes for better notification performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(user_id, read);

-- Create function to approve doctor requests with proper notification
CREATE OR REPLACE FUNCTION approve_doctor_request(request_id uuid)
RETURNS void AS $$
DECLARE
  request_record patient_doctor_requests%ROWTYPE;
  patient_profile profiles%ROWTYPE;
  doctor_profile profiles%ROWTYPE;
  notification_id uuid;
BEGIN
  -- Get the request record
  SELECT * INTO request_record
  FROM patient_doctor_requests 
  WHERE id = request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found: %', request_id;
  END IF;

  -- Get patient and doctor profiles
  SELECT * INTO patient_profile FROM profiles WHERE id = request_record.patient_id;
  SELECT * INTO doctor_profile FROM profiles WHERE id = request_record.doctor_id;

  -- Update request status
  UPDATE patient_doctor_requests 
  SET status = 'approved', responded_at = now()
  WHERE id = request_id;
  
  -- Create relationship
  INSERT INTO patient_doctor_relationships (patient_id, doctor_id)
  VALUES (request_record.patient_id, request_record.doctor_id)
  ON CONFLICT (patient_id, doctor_id) DO NOTHING;
  
  -- Create notification for patient
  SELECT create_notification(
    request_record.patient_id,
    'doctor_request',
    'Doctor Request Approved',
    'Dr. ' || doctor_profile.full_name || ' has accepted your request to be your doctor.',
    jsonb_build_object(
      'request_id', request_id, 
      'doctor_id', request_record.doctor_id,
      'doctor_name', doctor_profile.full_name
    )
  ) INTO notification_id;

  RAISE NOTICE 'Doctor request approved and notification sent: %', notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reject doctor requests with proper notification
CREATE OR REPLACE FUNCTION reject_doctor_request(request_id uuid, rejection_reason text DEFAULT NULL)
RETURNS void AS $$
DECLARE
  request_record patient_doctor_requests%ROWTYPE;
  patient_profile profiles%ROWTYPE;
  doctor_profile profiles%ROWTYPE;
  notification_id uuid;
BEGIN
  -- Get the request record
  SELECT * INTO request_record
  FROM patient_doctor_requests 
  WHERE id = request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found: %', request_id;
  END IF;

  -- Get patient and doctor profiles
  SELECT * INTO patient_profile FROM profiles WHERE id = request_record.patient_id;
  SELECT * INTO doctor_profile FROM profiles WHERE id = request_record.doctor_id;

  -- Update request status
  UPDATE patient_doctor_requests 
  SET status = 'rejected', responded_at = now()
  WHERE id = request_id;
  
  -- Create notification for patient
  SELECT create_notification(
    request_record.patient_id,
    'doctor_request',
    'Doctor Request Declined',
    'Dr. ' || doctor_profile.full_name || ' has declined your request.' || 
    CASE WHEN rejection_reason IS NOT NULL THEN ' Reason: ' || rejection_reason ELSE '' END,
    jsonb_build_object(
      'request_id', request_id, 
      'doctor_id', request_record.doctor_id, 
      'doctor_name', doctor_profile.full_name,
      'reason', rejection_reason
    )
  ) INTO notification_id;

  RAISE NOTICE 'Doctor request rejected and notification sent: %', notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_doctor_request TO authenticated;
GRANT EXECUTE ON FUNCTION reject_doctor_request TO authenticated;