import { createClient } from '@supabase/supabase-js';
import type { User as SupabaseUser, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Better error handling for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'Set' : 'Missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Set' : 'Missing'
  });
  
  // Don't throw error in production, just log it
  if (import.meta.env.MODE === 'development') {
    throw new Error('Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  }
}

if (supabaseUrl === 'YOUR_SUPABASE_PROJECT_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('Placeholder Supabase credentials detected. Please update with actual values.');
  
  if (import.meta.env.MODE === 'development') {
    throw new Error('Please replace the placeholder Supabase credentials in your .env file with your actual project credentials from the Supabase dashboard.');
  }
}

// Validate URL format only if URL is provided
if (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL') {
  try {
    new URL(supabaseUrl);
  } catch {
    console.error('Invalid Supabase URL format:', supabaseUrl);
    if (import.meta.env.MODE === 'development') {
      throw new Error('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL in the .env file.');
    }
  }
}

// Create a fallback client if environment variables are missing (for production)
let supabase: any;

if (supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL' && 
    supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
  
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-client-info': 'avabuddie-web'
      },
      fetch: (url, options = {}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        return fetch(url, {
          ...options,
          signal: controller.signal
        }).then(response => {
          clearTimeout(timeoutId);
          return response;
        }).catch(error => {
          clearTimeout(timeoutId);
          console.error('Supabase fetch error:', error);
          
          if (error.name === 'AbortError') {
            throw new Error('Connection timeout: Unable to reach Supabase server');
          }
          
          if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error: Please check your internet connection and Supabase URL');
          }
          
          throw new Error(`Failed to connect to Supabase: ${error.message}`);
        });
      }
    }
  });
} else {
  // Create a mock client for when environment variables are missing
  console.warn('Supabase client not initialized due to missing environment variables. Using mock client.');
  
  supabase = {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.reject(new Error('Supabase not configured')),
      signUp: () => Promise.reject(new Error('Supabase not configured')),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      delete: () => Promise.resolve({ error: { message: 'Supabase not configured' } })
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} })
    }),
    rpc: () => Promise.resolve({ error: { message: 'Supabase not configured' } })
  };
}

export { supabase };

// Test connection on initialization only if properly configured
const testConnection = async () => {
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'YOUR_SUPABASE_PROJECT_URL' || 
      supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.log('Skipping Supabase connection test - not configured');
    return;
  }
  
  try {
    const { error } = await supabase.from('profiles').select('count').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.warn('Supabase connection test failed:', error.message);
    } else {
      console.log('Supabase connection established successfully');
    }
  } catch (error) {
    console.warn('Supabase connection test failed:', error);
  }
};

// Run connection test after a short delay to allow for initialization
setTimeout(testConnection, 1000);

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
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  profile_id: string;
  license_number: string;
  specialties: string[];
  years_experience: number;
  clinic_name?: string;
  clinic_address?: string;
  consultation_fee?: number;
  available_hours?: any;
  languages: string[];
  bio?: string;
  verified: boolean;
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

// Chat History Types
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

// Storage Services
export const storageService = {
  async uploadImage(file: File, sessionId?: string): Promise<string> {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) {
        throw new Error('User not authenticated');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${sessionId || 'general'}/${Date.now()}.${fileExt}`;

      console.log('Uploading image to Supabase Storage:', fileName);

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('chat_images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat_images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      console.log('Image uploaded successfully:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts.slice(-3).join('/'); // Get last 3 parts: userId/sessionId/filename

      const { error } = await supabase.storage
        .from('chat_images')
        .remove([fileName]);

      if (error) {
        console.error('Error deleting image:', error);
        // Don't throw error for deletion failures to avoid breaking the app
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw error for deletion failures
    }
  }
};

// Profile Services
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
          // No profile found
          return null;
        }
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCurrentProfile:', error);
      return null;
    }
  },

  async createProfileFromAuth(user: SupabaseUser): Promise<Profile | null> {
    try {
      const profileData = {
        user_id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: user.user_metadata?.role || 'patient',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile manually:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createProfileFromAuth:', error);
      return null;
    }
  },

  async updateProfile(updates: Partial<Profile>): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async searchDoctors(query: string = ''): Promise<Doctor[]> {
    try {
      console.log('Searching doctors with query:', query);
      
      let queryBuilder = supabase
        .from('doctors')
        .select(`
          *,
          profile:profiles!doctors_profile_id_fkey(*)
        `)
        .eq('verified', true)
        .order('years_experience', { ascending: false });

      // If no query provided, get all doctors
      if (!query.trim()) {
        queryBuilder = queryBuilder.limit(50); // Reasonable limit for all doctors
      } else {
        queryBuilder = queryBuilder.limit(20); // Smaller limit for search results
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error in searchDoctors query:', error);
        throw error;
      }

      console.log('Raw doctors data from database:', data);

      // Filter results based on query if provided
      let filteredData = data || [];
      
      if (query.trim()) {
        const searchText = query.toLowerCase();
        filteredData = data?.filter((doctor: Doctor) => {
          const fullName = doctor.profile?.full_name?.toLowerCase() || '';
          const specialties = doctor.specialties?.join(' ').toLowerCase() || '';
          const clinicName = doctor.clinic_name?.toLowerCase() || '';
          
          return fullName.includes(searchText) || 
                 specialties.includes(searchText) || 
                 clinicName.includes(searchText);
        }) || [];
      }

      console.log('Filtered doctors data:', filteredData);
      return filteredData;
    } catch (error) {
      console.error('Error searching doctors:', error);
      return [];
    }
  }
};

// Doctor Services
export const doctorService = {
  async createDoctorProfile(doctorData: Omit<Doctor, 'id' | 'profile_id' | 'created_at' | 'updated_at'>): Promise<Doctor> {
    const profile = await profileService.getCurrentProfile();
    if (!profile || profile.role !== 'doctor') {
      throw new Error('Only doctors can create doctor profiles');
    }

    const { data, error } = await supabase
      .from('doctors')
      .insert({
        ...doctorData,
        profile_id: profile.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDoctorProfile(updates: Partial<Doctor>): Promise<Doctor | null> {
    const profile = await profileService.getCurrentProfile();
    if (!profile || profile.role !== 'doctor') {
      throw new Error('Only doctors can update doctor profiles');
    }

    const { data, error } = await supabase
      .from('doctors')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('profile_id', profile.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDoctorProfile(): Promise<Doctor | null> {
    const profile = await profileService.getCurrentProfile();
    if (!profile || profile.role !== 'doctor') return null;

    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('profile_id', profile.id)
      .single();

    if (error) {
      console.error('Error fetching doctor profile:', error);
      return null;
    }

    return data;
  },

  async getPatients(): Promise<Profile[]> {
    const profile = await profileService.getCurrentProfile();
    if (!profile || profile.role !== 'doctor') return [];

    const { data, error } = await supabase
      .from('patient_doctor_relationships')
      .select(`
        patient:profiles!patient_doctor_relationships_patient_id_fkey(*)
      `)
      .eq('doctor_id', profile.id);

    if (error) throw error;
    
    // Fix the type conversion issue by properly extracting and typing the patient data
    const patients: Profile[] = [];
    if (data) {
      for (const item of data) {
        if (item.patient && typeof item.patient === 'object' && !Array.isArray(item.patient)) {
          patients.push(item.patient as Profile);
        }
      }
    }
    
    return patients;
  },

  async getPendingRequests(): Promise<PatientDoctorRequest[]> {
    const profile = await profileService.getCurrentProfile();
    if (!profile || profile.role !== 'doctor') return [];

    const { data, error } = await supabase
      .from('patient_doctor_requests')
      .select(`
        *,
        patient:profiles!patient_doctor_requests_patient_id_fkey(*)
      `)
      .eq('doctor_id', profile.id)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async approveRequest(requestId: string): Promise<void> {
    const { error } = await supabase.rpc('approve_doctor_request', {
      request_id: requestId
    });

    if (error) throw error;
  },

  async rejectRequest(requestId: string, reason?: string): Promise<void> {
    const { error } = await supabase.rpc('reject_doctor_request', {
      request_id: requestId,
      rejection_reason: reason
    });

    if (error) throw error;
  }
};

// Patient Services
export const patientService = {
  async requestDoctor(doctorId: string, message?: string): Promise<PatientDoctorRequest> {
    const profile = await profileService.getCurrentProfile();
    if (!profile || profile.role !== 'patient') {
      throw new Error('Only patients can request doctors');
    }

    console.log('Creating doctor request:', { patient_id: profile.id, doctor_id: doctorId, message });

    try {
      const { data, error } = await supabase
        .from('patient_doctor_requests')
        .insert({
          patient_id: profile.id,
          doctor_id: doctorId,
          message
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating doctor request:', error);
        throw error;
      }

      console.log('Doctor request created successfully:', data);

      // The notification will be created automatically by the database trigger
      // But let's also try to create it manually as a fallback
      try {
        const { error: notificationError } = await supabase.rpc('create_notification', {
          target_user_id: doctorId,
          notification_type: 'doctor_request',
          notification_title: 'New Patient Request',
          notification_message: `${profile.full_name} has requested you as their doctor.`,
          notification_data: {
            request_id: data.id,
            patient_id: profile.id,
            patient_name: profile.full_name
          }
        });

        if (notificationError) {
          console.error('Error creating notification manually:', notificationError);
        } else {
          console.log('Notification created successfully');
        }
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't throw error here as the main request was successful
      }

      return data;
    } catch (error) {
      console.error('Error in requestDoctor:', error);
      throw error;
    }
  },

  async getMyDoctors(): Promise<Doctor[]> {
    const profile = await profileService.getCurrentProfile();
    if (!profile || profile.role !== 'patient') return [];

    try {
      console.log('Getting my doctors for patient:', profile.id);
      
      // First get the doctor profile IDs from relationships
      const { data: relationships, error: relationshipError } = await supabase
        .from('patient_doctor_relationships')
        .select('doctor_id')
        .eq('patient_id', profile.id);

      if (relationshipError) {
        console.error('Error fetching relationships:', relationshipError);
        throw relationshipError;
      }

      if (!relationships || relationships.length === 0) {
        console.log('No doctor relationships found');
        return [];
      }

      const doctorProfileIds = relationships.map((rel: { doctor_id: string }) => rel.doctor_id);
      console.log('Doctor profile IDs:', doctorProfileIds);

      // Now get the doctor records using the profile IDs
      const { data: doctors, error: doctorsError } = await supabase
        .from('doctors')
        .select(`
          *,
          profile:profiles!doctors_profile_id_fkey(*)
        `)
        .in('profile_id', doctorProfileIds);

      if (doctorsError) {
        console.error('Error fetching doctors:', doctorsError);
        throw doctorsError;
      }

      console.log('Final doctors data:', doctors);
      return doctors || [];
    } catch (error) {
      console.error('Error fetching my doctors:', error);
      return [];
    }
  },

  async getPendingRequests(): Promise<PatientDoctorRequest[]> {
    const profile = await profileService.getCurrentProfile();
    if (!profile || profile.role !== 'patient') return [];

    const { data, error } = await supabase
      .from('patient_doctor_requests')
      .select(`
        *,
        doctor:profiles!patient_doctor_requests_doctor_id_fkey(*)
      `)
      .eq('patient_id', profile.id)
      .order('requested_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async sendReportToDoctor(consultationId: string, doctorId: string, message?: string): Promise<ConsultationReport> {
    const profile = await profileService.getCurrentProfile();
    if (!profile || profile.role !== 'patient') {
      throw new Error('Only patients can send reports');
    }

    // Get consultation data
    const { data: consultation, error: consultationError } = await supabase
      .from('ai_consultations')
      .select('*')
      .eq('id', consultationId)
      .eq('patient_id', profile.id)
      .single();

    if (consultationError) throw consultationError;

    const { data, error } = await supabase
      .from('consultation_reports')
      .insert({
        consultation_id: consultationId,
        patient_id: profile.id,
        doctor_id: doctorId,
        report_data: consultation,
        patient_message: message
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for doctor using the new function
    try {
      await supabase.rpc('create_notification', {
        target_user_id: doctorId,
        notification_type: 'report_received',
        notification_title: 'New Consultation Report',
        notification_message: `${profile.full_name} has sent you a consultation report.`,
        notification_data: {
          report_id: data.id,
          patient_id: profile.id,
          patient_name: profile.full_name
        }
      });
    } catch (notificationError) {
      console.error('Failed to create report notification:', notificationError);
    }

    return data;
  }
};

// Chat History Services
export const chatHistoryService = {
  async getCurrentSession(): Promise<ChatSession | null> {
    const profile = await profileService.getCurrentProfile();
    if (!profile || profile.role !== 'patient') return null;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('patient_id', profile.id)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCurrentSession:', error);
      return null;
    }
  },

  async createNewSession(sessionName?: string): Promise<ChatSession> {
    const profile = await profileService.getCurrentProfile();
    if (!profile || profile.role !== 'patient') {
      throw new Error('Only patients can create chat sessions');
    }

    const defaultName = `Chat ${new Date().toLocaleDateString()}`;
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        patient_id: profile.id,
        session_name: sessionName || defaultName,
        messages: [],
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async saveMessage(sessionId: string, message: ChatMessage): Promise<void> {
    try {
      // Get current session
      const { data: session, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('messages')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Add new message to existing messages
      const updatedMessages = [...(session.messages || []), message];

      // Update session with new message
      const { error: updateError } = await supabase
        .from('chat_sessions')
        .update({
          messages: updatedMessages,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  },

  async getAllSessions(): Promise<ChatSession[]> {
    const profile = await profileService.getCurrentProfile();
    if (!profile || profile.role !== 'patient') return [];

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('patient_id', profile.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all sessions:', error);
      return [];
    }
  },

  async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching session:', error);
      return null;
    }
  },

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  },

  async updateSessionName(sessionId: string, newName: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ 
        session_name: newName,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  }
};

// AI Consultation Services
export const consultationService = {
  async createConsultation(sessionId: string): Promise<AIConsultation> {
    const profile = await profileService.getCurrentProfile();
    if (!profile || profile.role !== 'patient') {
      throw new Error('Only patients can create consultations');
    }

    const { data, error } = await supabase
      .from('ai_consultations')
      .insert({
        patient_id: profile.id,
        session_id: sessionId,
        messages: []
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateConsultation(consultationId: string, updates: Partial<AIConsultation>): Promise<AIConsultation> {
    const { data, error } = await supabase
      .from('ai_consultations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', consultationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getConsultations(): Promise<AIConsultation[]> {
    const profile = await profileService.getCurrentProfile();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('ai_consultations')
      .select('*')
      .eq('patient_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20); // Reduced limit for performance

    if (error) throw error;
    return data || [];
  }
};

// Notification Services
export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const profile = await profileService.getCurrentProfile();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20); // Reduced limit for performance

    if (error) throw error;
    return data || [];
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async markAllAsRead(): Promise<void> {
    const profile = await profileService.getCurrentProfile();
    if (!profile) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', profile.id)
      .eq('read', false);

    if (error) throw error;
  },

  // Test function to check notifications
  async testNotificationSystem(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('test_notification_system');
      
      if (error) {
        console.error('Error testing notification system:', error);
        return `Error: ${error.message}`;
      }
      
      return data || 'Test completed';
    } catch (error) {
      console.error('Error in testNotificationSystem:', error);
      return `Error: ${error}`;
    }
  }
};

// Real-time subscriptions
export const subscribeToNotifications = (userId: string, callback: (notification: Notification) => void) => {
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload: RealtimePostgresChangesPayload<Notification>) => callback(payload.new as Notification)
    )
    .subscribe();
};

export const subscribeToPatientRequests = (doctorId: string, callback: (request: PatientDoctorRequest) => void) => {
  return supabase
    .channel('patient_requests')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'patient_doctor_requests',
        filter: `doctor_id=eq.${doctorId}`
      },
      (payload: RealtimePostgresChangesPayload<PatientDoctorRequest>) => callback(payload.new as PatientDoctorRequest)
    )
    .subscribe();
};