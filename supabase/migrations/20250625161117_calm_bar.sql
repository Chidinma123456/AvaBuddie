/*
  # Fix RLS policies for patient_doctor_relationships table

  1. Security Updates
    - Add INSERT policy for doctors to create relationships when approving requests
    - Add UPDATE policy for managing relationship status
    - Add DELETE policy for removing relationships if needed

  2. Policy Details
    - Doctors can insert relationships where they are the doctor
    - Patients and doctors can update relationships they are part of
    - Doctors can delete relationships where they are the doctor
*/

-- Allow doctors to insert patient relationships when approving requests
CREATE POLICY "Doctors can create patient relationships"
  ON patient_doctor_relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = patient_doctor_relationships.doctor_id
      AND profiles.user_id = auth.uid()
      AND profiles.role = 'doctor'
    )
  );

-- Allow users to update relationships they are part of
CREATE POLICY "Users can update own relationships"
  ON patient_doctor_relationships
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = ANY(ARRAY[patient_doctor_relationships.patient_id, patient_doctor_relationships.doctor_id])
      AND profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = ANY(ARRAY[patient_doctor_relationships.patient_id, patient_doctor_relationships.doctor_id])
      AND profiles.user_id = auth.uid()
    )
  );

-- Allow doctors to delete relationships where they are the doctor
CREATE POLICY "Doctors can delete own relationships"
  ON patient_doctor_relationships
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = patient_doctor_relationships.doctor_id
      AND profiles.user_id = auth.uid()
      AND profiles.role = 'doctor'
    )
  );