/*
  # Auto-create doctor records for users with doctor role

  1. Functions
    - Update the profile creation trigger to also create doctor records
    - Create a function to handle doctor record creation
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper data integrity
*/

-- Create or replace function to handle doctor record creation
CREATE OR REPLACE FUNCTION create_doctor_record_for_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- If the profile role is 'doctor', create a corresponding doctor record
  IF NEW.role = 'doctor' THEN
    INSERT INTO doctors (
      profile_id,
      license_number,
      specialties,
      years_experience,
      languages,
      verified,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      'PENDING-' || substring(NEW.id::text from 1 for 8), -- Temporary license number
      ARRAY['General Medicine'], -- Default specialty
      0, -- Default experience
      ARRAY['English'], -- Default language
      false, -- Not verified by default
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create doctor records
DROP TRIGGER IF EXISTS create_doctor_record_trigger ON profiles;
CREATE TRIGGER create_doctor_record_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_doctor_record_for_profile();

-- Also create doctor records for existing doctor profiles that don't have them
INSERT INTO doctors (
  profile_id,
  license_number,
  specialties,
  years_experience,
  languages,
  verified,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'PENDING-' || substring(p.id::text from 1 for 8),
  ARRAY['General Medicine'],
  0,
  ARRAY['English'],
  false,
  NOW(),
  NOW()
FROM profiles p
WHERE p.role = 'doctor'
  AND NOT EXISTS (
    SELECT 1 FROM doctors d WHERE d.profile_id = p.id
  );

-- Update the existing profile creation function to work with the new trigger
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the existing trigger is properly set up
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();