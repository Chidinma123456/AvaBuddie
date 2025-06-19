/*
  # VirtualDoc Database Schema

  1. New Tables
    - `profiles` - Extended user profiles with medical information
    - `doctors` - Doctor-specific information and credentials
    - `patient_doctor_requests` - Pending doctor-patient relationship requests
    - `patient_doctor_relationships` - Confirmed doctor-patient relationships
    - `ai_consultations` - AI chat sessions and analysis
    - `consultation_reports` - Reports sent from patients to doctors
    - `notifications` - System notifications for users

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure patient-doctor data access
*/

-- Create profiles table for extended user information
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('patient', 'health-worker', 'doctor')),
  phone text,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_history text,
  allergies text[],
  current_medications text[],
  insurance_provider text,
  insurance_number text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create doctors table for doctor-specific information
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  license_number text UNIQUE NOT NULL,
  specialties text[] NOT NULL DEFAULT '{}',
  years_experience integer DEFAULT 0,
  clinic_name text,
  clinic_address text,
  consultation_fee decimal(10,2),
  available_hours jsonb DEFAULT '{}',
  languages text[] DEFAULT '{"English"}',
  bio text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patient-doctor relationship requests
CREATE TABLE IF NOT EXISTS patient_doctor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(patient_id, doctor_id)
);

-- Create confirmed patient-doctor relationships
CREATE TABLE IF NOT EXISTS patient_doctor_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  established_at timestamptz DEFAULT now(),
  UNIQUE(patient_id, doctor_id)
);

-- Create AI consultations table
CREATE TABLE IF NOT EXISTS ai_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]',
  ai_analysis text,
  symptoms text[],
  vital_signs jsonb,
  images text[],
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create consultation reports table
CREATE TABLE IF NOT EXISTS consultation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid REFERENCES ai_consultations(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  report_data jsonb NOT NULL,
  patient_message text,
  doctor_response text,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'reviewed', 'responded')),
  sent_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  responded_at timestamptz
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('doctor_request', 'report_received', 'appointment_reminder', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_doctor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_doctor_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

-- Doctors policies
CREATE POLICY "Anyone can read doctor profiles"
  ON doctors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Doctors can update own profile"
  ON doctors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = doctors.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Patient-doctor requests policies
CREATE POLICY "Users can read own requests"
  ON patient_doctor_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id IN (patient_doctor_requests.patient_id, patient_doctor_requests.doctor_id)
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can create requests"
  ON patient_doctor_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = patient_doctor_requests.patient_id 
      AND profiles.user_id = auth.uid()
      AND profiles.role = 'patient'
    )
  );

CREATE POLICY "Doctors can update requests"
  ON patient_doctor_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = patient_doctor_requests.doctor_id 
      AND profiles.user_id = auth.uid()
      AND profiles.role = 'doctor'
    )
  );

-- Patient-doctor relationships policies
CREATE POLICY "Users can read own relationships"
  ON patient_doctor_relationships
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id IN (patient_doctor_relationships.patient_id, patient_doctor_relationships.doctor_id)
      AND profiles.user_id = auth.uid()
    )
  );

-- AI consultations policies
CREATE POLICY "Patients can manage own consultations"
  ON ai_consultations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = ai_consultations.patient_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can read patient consultations"
  ON ai_consultations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN patient_doctor_relationships pdr ON p1.id = pdr.doctor_id
      WHERE pdr.patient_id = ai_consultations.patient_id
      AND p1.user_id = auth.uid()
      AND p1.role = 'doctor'
    )
  );

-- Consultation reports policies
CREATE POLICY "Users can read own reports"
  ON consultation_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id IN (consultation_reports.patient_id, consultation_reports.doctor_id)
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can create reports"
  ON consultation_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = consultation_reports.patient_id 
      AND profiles.user_id = auth.uid()
      AND profiles.role = 'patient'
    )
  );

-- Notifications policies
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
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_doctors_profile_id ON doctors(profile_id);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_requests_patient_id ON patient_doctor_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_requests_doctor_id ON patient_doctor_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_relationships_patient_id ON patient_doctor_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_relationships_doctor_id ON patient_doctor_relationships(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ai_consultations_patient_id ON ai_consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_reports_patient_id ON consultation_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_reports_doctor_id ON consultation_reports(doctor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Create functions for automatic profile creation
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- Create function to handle doctor request approval
CREATE OR REPLACE FUNCTION approve_doctor_request(request_id uuid)
RETURNS void AS $$
BEGIN
  -- Update request status
  UPDATE patient_doctor_requests 
  SET status = 'approved', responded_at = now()
  WHERE id = request_id;
  
  -- Create relationship
  INSERT INTO patient_doctor_relationships (patient_id, doctor_id)
  SELECT patient_id, doctor_id 
  FROM patient_doctor_requests 
  WHERE id = request_id;
  
  -- Create notification for patient
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    p.id,
    'doctor_request',
    'Doctor Request Approved',
    'Dr. ' || d.full_name || ' has accepted your request to be your doctor.',
    jsonb_build_object('request_id', request_id, 'doctor_id', pdr.doctor_id)
  FROM patient_doctor_requests pdr
  JOIN profiles p ON p.id = pdr.patient_id
  JOIN profiles d ON d.id = pdr.doctor_id
  WHERE pdr.id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle doctor request rejection
CREATE OR REPLACE FUNCTION reject_doctor_request(request_id uuid, rejection_reason text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Update request status
  UPDATE patient_doctor_requests 
  SET status = 'rejected', responded_at = now()
  WHERE id = request_id;
  
  -- Create notification for patient
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    p.id,
    'doctor_request',
    'Doctor Request Declined',
    'Dr. ' || d.full_name || ' has declined your request.' || 
    CASE WHEN rejection_reason IS NOT NULL THEN ' Reason: ' || rejection_reason ELSE '' END,
    jsonb_build_object('request_id', request_id, 'doctor_id', pdr.doctor_id, 'reason', rejection_reason)
  FROM patient_doctor_requests pdr
  JOIN profiles p ON p.id = pdr.patient_id
  JOIN profiles d ON d.id = pdr.doctor_id
  WHERE pdr.id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;