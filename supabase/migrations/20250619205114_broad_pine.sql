/*
  # Create Sample Doctors

  1. Sample Data
    - Create sample doctor profiles for testing
    - Include verified doctors with different specialties
    - Add realistic doctor information

  2. Security
    - Only create sample data if it doesn't already exist
*/

-- Insert sample doctor profiles (only if they don't exist)
DO $$
DECLARE
    doctor1_profile_id uuid;
    doctor2_profile_id uuid;
    doctor3_profile_id uuid;
    doctor4_profile_id uuid;
    doctor5_profile_id uuid;
BEGIN
    -- Check if sample doctors already exist
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'dr.sarah.johnson@virtualdoc.com') THEN
        
        -- Create Dr. Sarah Johnson (General Medicine)
        INSERT INTO profiles (
            user_id, email, full_name, role, phone, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 
            'dr.sarah.johnson@virtualdoc.com', 
            'Sarah Johnson', 
            'doctor',
            '+1-555-0101',
            now(), 
            now()
        ) RETURNING id INTO doctor1_profile_id;

        INSERT INTO doctors (
            profile_id, license_number, specialties, years_experience, 
            clinic_name, clinic_address, consultation_fee, languages, 
            bio, verified, created_at, updated_at
        ) VALUES (
            doctor1_profile_id,
            'MD-12345-NY',
            ARRAY['General Medicine', 'Internal Medicine'],
            12,
            'Manhattan Medical Center',
            '123 Medical Plaza, New York, NY 10001',
            150.00,
            ARRAY['English', 'Spanish'],
            'Dr. Sarah Johnson is a board-certified internal medicine physician with over 12 years of experience. She specializes in preventive care, chronic disease management, and comprehensive health assessments.',
            true,
            now(),
            now()
        );

        -- Create Dr. Michael Chen (Cardiology)
        INSERT INTO profiles (
            user_id, email, full_name, role, phone, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 
            'dr.michael.chen@virtualdoc.com', 
            'Michael Chen', 
            'doctor',
            '+1-555-0102',
            now(), 
            now()
        ) RETURNING id INTO doctor2_profile_id;

        INSERT INTO doctors (
            profile_id, license_number, specialties, years_experience, 
            clinic_name, clinic_address, consultation_fee, languages, 
            bio, verified, created_at, updated_at
        ) VALUES (
            doctor2_profile_id,
            'MD-23456-CA',
            ARRAY['Cardiology', 'Internal Medicine'],
            15,
            'Heart Care Institute',
            '456 Cardiac Way, Los Angeles, CA 90210',
            200.00,
            ARRAY['English', 'Mandarin'],
            'Dr. Michael Chen is a renowned cardiologist with 15 years of experience in treating heart conditions. He specializes in preventive cardiology, heart disease management, and cardiac rehabilitation.',
            true,
            now(),
            now()
        );

        -- Create Dr. Emily Rodriguez (Family Medicine)
        INSERT INTO profiles (
            user_id, email, full_name, role, phone, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 
            'dr.emily.rodriguez@virtualdoc.com', 
            'Emily Rodriguez', 
            'doctor',
            '+1-555-0103',
            now(), 
            now()
        ) RETURNING id INTO doctor3_profile_id;

        INSERT INTO doctors (
            profile_id, license_number, specialties, years_experience, 
            clinic_name, clinic_address, consultation_fee, languages, 
            bio, verified, created_at, updated_at
        ) VALUES (
            doctor3_profile_id,
            'MD-34567-TX',
            ARRAY['Family Medicine', 'Pediatrics'],
            8,
            'Family Health Clinic',
            '789 Family Drive, Austin, TX 78701',
            120.00,
            ARRAY['English', 'Spanish'],
            'Dr. Emily Rodriguez is a dedicated family medicine physician who provides comprehensive care for patients of all ages. She has a special interest in pediatric care and women''s health.',
            true,
            now(),
            now()
        );

        -- Create Dr. Priya Patel (Dermatology)
        INSERT INTO profiles (
            user_id, email, full_name, role, phone, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 
            'dr.priya.patel@virtualdoc.com', 
            'Priya Patel', 
            'doctor',
            '+1-555-0104',
            now(), 
            now()
        ) RETURNING id INTO doctor4_profile_id;

        INSERT INTO doctors (
            profile_id, license_number, specialties, years_experience, 
            clinic_name, clinic_address, consultation_fee, languages, 
            bio, verified, created_at, updated_at
        ) VALUES (
            doctor4_profile_id,
            'MD-45678-FL',
            ARRAY['Dermatology', 'Cosmetic Dermatology'],
            10,
            'Skin Health Center',
            '321 Dermatology Blvd, Miami, FL 33101',
            180.00,
            ARRAY['English', 'Hindi', 'Gujarati'],
            'Dr. Priya Patel is a board-certified dermatologist with expertise in medical and cosmetic dermatology. She specializes in skin cancer screening, acne treatment, and anti-aging procedures.',
            true,
            now(),
            now()
        );

        -- Create Dr. Robert Kim (Psychiatry)
        INSERT INTO profiles (
            user_id, email, full_name, role, phone, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 
            'dr.robert.kim@virtualdoc.com', 
            'Robert Kim', 
            'doctor',
            '+1-555-0105',
            now(), 
            now()
        ) RETURNING id INTO doctor5_profile_id;

        INSERT INTO doctors (
            profile_id, license_number, specialties, years_experience, 
            clinic_name, clinic_address, consultation_fee, languages, 
            bio, verified, created_at, updated_at
        ) VALUES (
            doctor5_profile_id,
            'MD-56789-WA',
            ARRAY['Psychiatry', 'Addiction Medicine'],
            14,
            'Mental Wellness Institute',
            '654 Wellness Ave, Seattle, WA 98101',
            175.00,
            ARRAY['English', 'Korean'],
            'Dr. Robert Kim is a compassionate psychiatrist with 14 years of experience in mental health care. He specializes in anxiety, depression, ADHD, and addiction treatment.',
            true,
            now(),
            now()
        );

        RAISE NOTICE 'Sample doctors created successfully';
    ELSE
        RAISE NOTICE 'Sample doctors already exist, skipping creation';
    END IF;
END $$;