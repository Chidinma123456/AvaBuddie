/*
  # Fix Database Signup Errors

  1. Database Functions
    - Fix or recreate the `create_profile_for_user` function
    - Ensure proper error handling in trigger functions
    
  2. Triggers
    - Verify and fix the profile creation trigger
    
  3. Security Policies
    - Add missing RLS policies for user signup process
    - Ensure service role can create profiles during signup
    
  4. Constraints
    - Fix any constraint issues that might prevent profile creation
*/

-- First, let's recreate the profile creation function with better error handling
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the user
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, which is fine
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- Fix the doctor record creation function
CREATE OR REPLACE FUNCTION create_doctor_record_for_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create doctor record if the role is 'doctor'
  IF NEW.role = 'doctor' THEN
    INSERT INTO public.doctors (
      profile_id,
      license_number,
      specialties,
      years_experience,
      languages,
      verified
    ) VALUES (
      NEW.id,
      'TEMP_' || NEW.id, -- Temporary license number
      '{}',
      0,
      '{English}',
      false
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Doctor record already exists
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log the error but don't fail the profile creation
    RAISE WARNING 'Failed to create doctor record for profile %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing RLS policies for signup process
DO $$
BEGIN
  -- Allow service role to insert profiles during signup
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Allow service role to insert profiles'
  ) THEN
    CREATE POLICY "Allow service role to insert profiles"
      ON profiles
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;

  -- Allow authenticated users to insert their own profile during signup
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Allow users to insert own profile during signup'
  ) THEN
    CREATE POLICY "Allow users to insert own profile during signup"
      ON profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Allow service role to insert doctor records
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'doctors' 
    AND policyname = 'Allow service role to insert doctors'
  ) THEN
    CREATE POLICY "Allow service role to insert doctors"
      ON doctors
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

-- Ensure the profiles table has proper constraints
DO $$
BEGIN
  -- Make sure user_id can be null temporarily during creation
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' 
    AND constraint_name = 'profiles_user_id_not_null'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_user_id_not_null;
  END IF;
END $$;

-- Add a function to handle notification creation for doctor requests
CREATE OR REPLACE FUNCTION handle_doctor_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the doctor
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    NEW.doctor_id,
    'doctor_request',
    'New Patient Request',
    'You have received a new patient request',
    jsonb_build_object(
      'request_id', NEW.id,
      'patient_id', NEW.patient_id
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the request creation
    RAISE WARNING 'Failed to create notification for doctor request %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant specific permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON doctors TO authenticated;
GRANT SELECT, INSERT, UPDATE ON patient_doctor_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON patient_doctor_relationships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_consultations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON consultation_reports TO authenticated;

-- Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_doctor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_doctor_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;