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

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  audioUrl?: string;
  imageUrl?: string;
  isVoiceMessage?: boolean;
}

export interface ChatSession {
  id: string;
  patient_id: string;
  session_name: string;
  messages: ChatMessage[];
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

      console.log('Creating profile with data:', profileData);

      // First, check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', checkError);
        throw checkError;
      }

      if (existingProfile) {
        console.log('Profile already exists, returning existing profile');
        return existingProfile;
      }

      // Try to create the profile with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .insert([profileData])
            .select()
            .single();

          if (error) {
            console.error(`Profile creation error (attempt ${retryCount + 1}):`, error);
            
            // If it's a duplicate key error, try to fetch the existing profile
            if (error.code === '23505' || error.message?.includes('duplicate')) {
              const { data: existingData, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();
              
              if (existingData && !fetchError) {
                console.log('Found existing profile after duplicate error');
                return existingData;
              }
            }
            
            // If it's a permission error, wait and retry
            if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
              retryCount++;
              if (retryCount < maxRetries) {
                console.log(`Retrying profile creation in ${retryCount * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
                continue;
              }
            }
            
            throw error;
          }

          console.log('Profile created successfully:', data);
          return data;
        } catch (retryError) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw retryError;
          }
          console.log(`Retrying profile creation (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        }
      }

      throw new Error('Failed to create profile after maximum retries');
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  },

  async ensureProfileExists(user: User, userData: { name: string; role: string }): Promise<Profile> {
    try {
      // First try to get existing profile with a longer timeout
      let profile = await Promise.race([
        this.getCurrentProfile(),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
        )
      ]);
      
      if (profile) {
        console.log('Found existing profile');
        return profile;
      }

      // If no profile exists, wait a bit for the trigger to potentially create it
      console.log('No profile found, waiting for potential trigger creation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try again to get the profile
      profile = await this.getCurrentProfile();
      if (profile) {
        console.log('Profile found after waiting for trigger');
        return profile;
      }

      // If still no profile exists, create one manually
      console.log('No profile found after trigger wait, creating manually...');
      profile = await this.createProfileFromAuth(user, userData);
      
      return profile;
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
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
  },

  async searchDoctors(query: string): Promise<Doctor[]> {
    try {
      let queryBuilder = supabase
        .from('doctors')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('verified', true);

      if (query.trim()) {
        queryBuilder = queryBuilder.or(`
          specialties.cs.{${query}},
          clinic_name.ilike.%${query}%,
          profile.full_name.ilike.%${query}%
        `);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleAuthError(error);
      return [];
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
  },

  async getPatients(): Promise<Profile[]> {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) return [];

      const { data, error } = await supabase
        .from('patient_doctor_relationships')
        .select(`
          patient:profiles!patient_doctor_relationships_patient_id_fkey(*)
        `)
        .eq('doctor_id', profile.id);

      if (error) throw error;
      return (data as unknown as Array<{ patient: Profile }>)?.map(rel => rel.patient).filter(Boolean) || [];
    } catch (error) {
      handleAuthError(error);
      return [];
    }
  },

  async getPendingRequests(): Promise<PatientDoctorRequest[]> {
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
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleAuthError(error);
      return [];
    }
  },

  async approveRequest(requestId: string): Promise<boolean> {
    return patientDoctorRequestService.updateRequestStatus(requestId, 'approved');
  },

  async rejectRequest(requestId: string, _reason?: string): Promise<boolean> {
    return patientDoctorRequestService.updateRequestStatus(requestId, 'rejected');
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

  async getRequestsForPatient(): Promise<PatientDoctorRequest[]> {
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
        .eq('patient_id', profile.id)
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
  async getMyDoctors(): Promise<Doctor[]> {
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

      // Get doctor details for each relationship
      const doctorIds = data?.map(rel => rel.doctor_id) || [];
      if (doctorIds.length === 0) return [];

      const { data: doctors, error: doctorsError } = await supabase
        .from('doctors')
        .select(`
          *,
          profile:profiles(*)
        `)
        .in('profile_id', doctorIds);

      if (doctorsError) throw doctorsError;
      return doctors || [];
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

// Patient Service (for backward compatibility)
export const patientService = {
  async requestDoctor(doctorId: string, message?: string): Promise<PatientDoctorRequest | null> {
    return patientDoctorRequestService.createRequest(doctorId, message);
  },

  async getMyDoctors(): Promise<Doctor[]> {
    return patientDoctorRelationshipService.getMyDoctors();
  },

  async getPendingRequests(): Promise<PatientDoctorRequest[]> {
    return patientDoctorRequestService.getRequestsForPatient();
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

  // Alias for backward compatibility
  async getNotifications(): Promise<Notification[]> {
    return this.getMyNotifications();
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
  async createSession(sessionName: string = 'New Chat'): Promise<ChatSession | null> {
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

  async getSession(id: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
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
  },

  async saveMessage(sessionId: string, message: ChatMessage): Promise<boolean> {
    try {
      // Get current session
      const session = await this.getSession(sessionId);
      if (!session) throw new Error('Session not found');

      // Add new message to messages array
      const updatedMessages = [...session.messages, message];

      // Update session with new messages
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          messages: updatedMessages,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      handleAuthError(error);
      return false;
    }
  },

  async createNewSession(): Promise<ChatSession> {
    const session = await this.createSession('New Chat');
    if (!session) throw new Error('Failed to create new session');
    return session;
  },

  async getAllSessions(): Promise<ChatSession[]> {
    return this.getMySessions();
  },

  async updateSessionName(sessionId: string, sessionName: string): Promise<boolean> {
    const result = await this.updateSession(sessionId, { session_name: sessionName });
    return result !== null;
  }
};

// Export chatHistoryService as an alias to chatSessionService for backward compatibility
export const chatHistoryService = chatSessionService;