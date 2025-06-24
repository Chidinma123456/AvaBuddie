import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth error callback
let authErrorCallback: (() => void) | null = null;

export const setAuthErrorCallback = (callback: () => void) => {
  authErrorCallback = callback;
};

// Enhanced error handling for auth operations
const handleAuthError = (error: any) => {
  console.error('Auth error:', error);
  if (error?.message?.includes('JWT') || error?.message?.includes('session')) {
    authErrorCallback?.();
  }
  throw error;
};

// Types
export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'patient' | 'health-worker' | 'doctor';
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string[];
  current_medications?: string[];
  insurance_provider?: string;
  insurance_number?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Doctor {
  id: string;
  profile_id: string;
  license_number: string;
  specialties: string[];
  years_experience?: number;
  clinic_name?: string;
  clinic_address?: string;
  consultation_fee?: number;
  available_hours?: any;
  languages?: string[];
  bio?: string;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
  profile?: Profile;
}

export interface PatientDoctorRequest {
  id: string;
  patient_id: string;
  doctor_id: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  responded_at?: string;
  patient?: Profile;
  doctor?: Profile;
}

export interface PatientDoctorRelationship {
  id: string;
  patient_id: string;
  doctor_id: string;
  is_primary: boolean;
  established_at: string;
  patient?: Profile;
  doctor?: Profile;
}

export interface AIConsultation {
  id: string;
  patient_id: string;
  session_id: string;
  messages: any[];
  ai_analysis?: string;
  symptoms?: string[];
  vital_signs?: any;
  images?: string[];
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ConsultationReport {
  id: string;
  consultation_id: string;
  patient_id: string;
  doctor_id: string;
  report_data: any;
  patient_message?: string;
  doctor_response?: string;
  status: 'sent' | 'reviewed' | 'responded';
  sent_at: string;
  reviewed_at?: string;
  responded_at?: string;
  patient?: Profile;
  doctor?: Profile;
  consultation?: AIConsultation;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'doctor_request' | 'report_received' | 'appointment_reminder' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export interface ChatSession {
  id: string;
  patient_id: string;
  session_name: string;
  messages: any[];
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

// Profile Service
export const profileService = {
  async getCurrentProfile(): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, this is expected for new users
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  async createProfileFromAuth(user: User, userData: { name: string; role: string }): Promise<Profile> {
    try {
      const profileData = {
        user_id: user.id,
        email: user.email!,
        full_name: userData.name,
        role: userData.role
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Profile creation error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  },

  async updateProfile(updates: Partial<Profile>): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleAuthError(error);
      return null;
    }
  },

  async getProfileById(id: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile by ID:', error);
      return null;
    }
  }
};

// Doctor Service
export const doctorService = {
  async getAllDoctors(): Promise<Doctor[]> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('verified', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleAuthError(error);
      return [];
    }
  },

  async getDoctorByProfileId(profileId: string): Promise<Doctor | null> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('profile_id', profileId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching doctor:', error);
      return null;
    }
  },

  async updateDoctor(updates: Partial<Doctor>): Promise<Doctor | null> {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) throw new Error('No profile found');

      const { data, error } = await supabase
        .from('doctors')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('profile_id', profile.id)
        .select(`
          *,
          profile:profiles(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleAuthError(error);
      return null;
    }
  }
};

// Patient-Doctor Request Service
export const patientDoctorRequestService = {
  async createRequest(doctorId: string, message?: string): Promise<PatientDoctorRequest | null> {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) throw new Error('No profile found');

      const { data, error } = await supabase
        .from('patient_doctor_requests')
        .insert([{
          patient_id: profile.id,
          doctor_id: doctorId,
          message: message || ''
        }])
        .select(`
          *,
          patient:profiles!patient_doctor_requests_patient_id_fkey(*),
          doctor:profiles!patient_doctor_requests_doctor_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleAuthError(error);
      return null;
    }
  },

  async getRequestsForDoctor(): Promise<PatientDoctorRequest[]> {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) return [];

      const { data, error } = await supabase
        .from('patient_doctor_requests')
        .select(`
          *,
          patient:profiles!patient_doctor_requests_patient_id_fkey(*),
          doctor:profiles!patient_doctor_requests_doctor_id_fkey(*)
        `)
        .eq('doctor_id', profile.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleAuthError(error);
      return [];
    }
  },

  async updateRequestStatus(requestId: string, status: 'approved' | 'rejected'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('patient_doctor_requests')
        .update({ 
          status, 
          responded_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      if (error) throw error;

      // If approved, create a patient-doctor relationship
      if (status === 'approved') {
        const { data: request } = await supabase
          .from('patient_doctor_requests')
          .select('patient_id, doctor_id')
          .eq('id', requestId)
          .single();

        if (request) {
          await supabase
            .from('patient_doctor_relationships')
            .insert([{
              patient_id: request.patient_id,
              doctor_id: request.doctor_id
            }]);
        }
      }

      return true;
    } catch (error) {
      handleAuthError(error);
      return false;
    }
  }
};

// Patient-Doctor Relationship Service
export const patientDoctorRelationshipService = {
  async getMyDoctors(): Promise<PatientDoctorRelationship[]> {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) return [];

      const { data, error } = await supabase
        .from('patient_doctor_relationships')
        .select(`
          *,
          doctor:profiles!patient_doctor_relationships_doctor_id_fkey(*)
        `)
        .eq('patient_id', profile.id)
        .order('established_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleAuthError(error);
      return [];
    }
  },

  async getMyPatients(): Promise<PatientDoctorRelationship[]> {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) return [];

      const { data, error } = await supabase
        .from('patient_doctor_relationships')
        .select(`
          *,
          patient:profiles!patient_doctor_relationships_patient_id_fkey(*)
        `)
        .eq('doctor_id', profile.id)
        .order('established_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleAuthError(error);
      return [];
    }
  }
};

// AI Consultation Service
export const aiConsultationService = {
  async createConsultation(sessionId: string): Promise<AIConsultation | null> {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) throw new Error('No profile found');

      const { data, error } = await supabase
        .from('ai_consultations')
        .insert([{
          patient_id: profile.id,
          session_id: sessionId,
          messages: []
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleAuthError(error);
      return null;
    }
  },

  async updateConsultation(id: string, updates: Partial<AIConsultation>): Promise<AIConsultation | null> {
    try {
      const { data, error } = await supabase
        .from('ai_consultations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleAuthError(error);
      return null;
    }
  },

  async getConsultation(id: string): Promise<AIConsultation | null> {
    try {
      const { data, error } = await supabase
        .from('ai_consultations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleAuthError(error);
      return null;
    }
  },

  async getMyConsultations(): Promise<AIConsultation[]> {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) return [];

      const { data, error } = await supabase
        .from('ai_consultations')
        .select('*')
        .eq('patient_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleAuthError(error);
      return [];
    }
  }
};

// Consultation Report Service
export const consultationReportService = {
  async createReport(consultationId: string, doctorId: string, reportData: any, message?: string): Promise<ConsultationReport | null> {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) throw new Error('No profile found');

      const { data, error } = await supabase
        .from('consultation_reports')
        .insert([{
          consultation_id: consultationId,
          patient_id: profile.id,
          doctor_id: doctorId,
          report_data: reportData,
          patient_message: message
        }])
        .select(`
          *,
          patient:profiles!consultation_reports_patient_id_fkey(*),
          doctor:profiles!consultation_reports_doctor_id_fkey(*),
          consultation:ai_consultations(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleAuthError(error);
      return null;
    }
  },

  async getReportsForDoctor(): Promise<ConsultationReport[]> {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) return [];

      const { data, error } = await supabase
        .from('consultation_reports')
        .select(`
          *,
          patient:profiles!consultation_reports_patient_id_fkey(*),
          doctor:profiles!consultation_reports_doctor_id_fkey(*),
          consultation:ai_consultations(*)
        `)
        .eq('doctor_id', profile.id)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleAuthError(error);
      return [];
    }
  },

  async updateReportStatus(reportId: string, status: 'reviewed' | 'responded', doctorResponse?: string): Promise<boolean> {
    try {
      const updates: any = { 
        status,
        [`${status}_at`]: new Date().toISOString()
      };

      if (doctorResponse) {
        updates.doctor_response = doctorResponse;
      }

      const { error } = await supabase
        .from('consultation_reports')
        .update(updates)
        .eq('id', reportId);

      if (error) throw error;
      return true;
    } catch (error) {
      handleAuthError(error);
      return false;
    }
  }
};

// Notification Service
export const notificationService = {
  async getMyNotifications(): Promise<Notification[]> {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleAuthError(error);
      return [];
    }
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      handleAuthError(error);
      return false;
    }
  },

  async markAllAsRead(): Promise<boolean> {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) return false;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', profile.id)
        .eq('read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      handleAuthError(error);
      return false;
    }
  }
};

// Chat Session Service
export const chatSessionService = {
  async createSession(sessionName: string): Promise<ChatSession | null> {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) throw new Error('No profile found');

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([{
          patient_id: profile.id,
          session_name: sessionName,
          messages: []
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleAuthError(error);
      return null;
    }
  },

  async updateSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleAuthError(error);
      return null;
    }
  },

  async getMySessions(): Promise<ChatSession[]> {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) return [];

      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('patient_id', profile.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleAuthError(error);
      return [];
    }
  },

  async deleteSession(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleAuthError(error);
      return false;
    }
  }
};