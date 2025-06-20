/*
  # Add Chat History Support

  1. New Tables
    - `chat_sessions` - Store chat sessions for patients
    
  2. Security
    - Enable RLS on chat_sessions table
    - Add policies for patients to manage their own chat sessions
*/

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_name text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]',
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Chat sessions policies
CREATE POLICY "Patients can manage own chat sessions"
  ON chat_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = chat_sessions.patient_id 
      AND profiles.user_id = auth.uid()
      AND profiles.role = 'patient'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = chat_sessions.patient_id 
      AND profiles.user_id = auth.uid()
      AND profiles.role = 'patient'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_patient_id ON chat_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON chat_sessions(last_message_at);