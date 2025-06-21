/*
  # Allow patients to read doctor profiles

  1. Security Update
    - Add RLS policy to allow authenticated users to read doctor profiles
    - This enables patients to see doctor names in the "My Doctors" section
    - Maintains security by only allowing read access to doctor role profiles

  2. Changes
    - Creates new SELECT policy for profiles table
    - Allows authenticated users to read profiles where role = 'doctor'
*/

-- Allow authenticated users to read doctor profiles
CREATE POLICY "Patients can read doctor profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (role = 'doctor');