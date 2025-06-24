/*
  # Fix Profile Creation and RLS Policies

  1. Clean up duplicate profiles
  2. Update RLS policies for proper profile creation
  3. Create robust profile creation trigger
  4. Add unique constraint safely
*/

-- First, clean up any duplicate profiles (keep the oldest one for each user_id)
DELETE FROM profiles 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM profiles 
  ORDER BY user_id, created_at ASC
);

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

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
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT 
  TO authenticated 
  USING (
    auth.uid() = user_id OR
    auth.uid()::text = user_id::text
  );

-- Update the UPDATE policy to be more robust
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

-- Add unique constraint on user_id safely (only if it doesn't exist and no duplicates remain)
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' 
    AND constraint_name = 'profiles_user_id_unique'
  ) THEN
    -- Check if there are any remaining duplicates
    IF NOT EXISTS (
      SELECT user_id 
      FROM profiles 
      GROUP BY user_id 
      HAVING COUNT(*) > 1
    ) THEN
      -- Safe to add unique constraint
      ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
    ELSE
      -- Log that duplicates still exist
      RAISE NOTICE 'Cannot add unique constraint: duplicate user_id values still exist in profiles table';
    END IF;
  ELSE
    RAISE NOTICE 'Unique constraint profiles_user_id_unique already exists';
  END IF;
END $$;

-- Create or replace the function to handle profile creation with better error handling
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to insert profile, ignore if already exists
  INSERT INTO public.profiles (user_id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW()
  WHERE profiles.user_id = EXCLUDED.user_id;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE NOTICE 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- Also ensure service role can manage profiles (needed for triggers)
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);