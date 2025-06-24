/*
  # Fix Profile Creation Policies

  1. Security Updates
    - Add proper INSERT policy for new user profile creation
    - Update existing policies to handle edge cases
    - Add policy for users to insert their own profile during signup

  2. Constraints
    - Ensure proper foreign key relationships
    - Add missing constraints if needed
*/

-- Drop existing INSERT policy if it exists and recreate with proper conditions
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a comprehensive INSERT policy that handles both signup and manual profile creation
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    -- Allow users to create their own profile
    auth.uid() = user_id OR
    -- Allow during signup when user_id matches the authenticated user
    (auth.uid()::text = user_id::text)
  );

-- Ensure we have a policy for users to read their own profile during signup
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT 
  TO authenticated 
  USING (
    auth.uid() = user_id OR
    auth.uid()::text = user_id::text
  );

-- Update the UPDATE policy to be more robust
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  TO authenticated 
  USING (
    auth.uid() = user_id OR
    auth.uid()::text = user_id::text
  )
  WITH CHECK (
    auth.uid() = user_id OR
    auth.uid()::text = user_id::text
  );

-- Ensure the profiles table has proper constraints
DO $$
BEGIN
  -- Add unique constraint on user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' 
    AND constraint_name = 'profiles_user_id_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Create or replace the function to handle profile creation
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();