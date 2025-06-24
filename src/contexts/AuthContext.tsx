import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, profileService, setAuthErrorCallback, type Profile } from '../services/supabaseService';
import type { User as SupabaseUser, AuthChangeEvent, Session } from '@supabase/supabase-js';

export type UserRole = 'patient' | 'health-worker' | 'doctor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  profile?: Profile;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<{ user: User; role: UserRole }>;
  signup: (email: string, password: string, userData: { name: string; role: UserRole }) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth error callback to handle session errors
    setAuthErrorCallback(() => {
      console.log('Auth error detected, logging out user');
      if (mounted) {
        logout();
      }
    });

    // Get initial session with timeout
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<any>((_, reject) => 
            setTimeout(() => reject(new Error('Session timeout')), 10000)
          )
        ]);

        if (!mounted) return;

        if (error) {
          console.error('Session error:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          await handleUserSession(session.user);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;

      console.log('Auth state change:', event, session?.user?.email);

      if (session?.user) {
        await handleUserSession(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUserSession = async (supabaseUser: SupabaseUser) => {
    try {
      // Create user object immediately from auth data
      const userObj: User = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
        role: (supabaseUser.user_metadata?.role as UserRole) || 'patient'
      };

      setUser(userObj);

      // Try to get profile in background, but don't block
      try {
        const userProfile = await Promise.race([
          profileService.getCurrentProfile(),
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Profile timeout')), 2000)
          )
        ]);

        if (userProfile) {
          setProfile(userProfile);
          setUser(prev => prev ? {
            ...prev,
            name: userProfile.full_name,
            role: userProfile.role,
            avatar: userProfile.avatar_url,
            profile: userProfile
          } : null);
        }
      } catch (profileError) {
        console.warn('Profile fetch failed or timed out:', profileError);
        // Continue without profile - user can still use the app
      }
    } catch (error) {
      console.error('Error handling user session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ user: User; role: UserRole }> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error('Login timeout')), 20000)
        )
      ]);
      
      if (error) {
        throw new Error(`Login failed: ${error.message}`);
      }

      if (!data.user) {
        throw new Error('No user returned from login');
      }

      // Create user object immediately
      const userObj: User = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
        role: (data.user.user_metadata?.role as UserRole) || 'patient'
      };

      setUser(userObj);
      
      return { user: userObj, role: userObj.role };
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string, userData: { name: string; role: UserRole }) => {
    setIsLoading(true);
    
    try {
      console.log('Starting signup process for:', email, userData);
      
      const { data, error: authError } = await Promise.race([
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: userData.name,
              role: userData.role
            }
          }
        }),
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error('Signup timeout')), 30000)
        )
      ]);
      
      if (authError) {
        console.error('Supabase auth error:', authError);
        throw new Error(`Signup failed: ${authError.message}`);
      }

      if (!data.user) {
        throw new Error('No user returned from signup');
      }

      console.log('User created successfully:', data.user.id);

      // Create user object immediately
      const userObj: User = {
        id: data.user.id,
        email: data.user.email!,
        name: userData.name,
        role: userData.role
      };

      setUser(userObj);

      // Try to ensure profile exists with enhanced error handling
      try {
        console.log('Ensuring profile exists for new user...');
        const profile = await profileService.ensureProfileExists(data.user, userData);
        
        if (profile) {
          console.log('Profile created/found successfully:', profile.id);
          setProfile(profile);
          setUser(prev => prev ? {
            ...prev,
            name: profile.full_name,
            role: profile.role,
            avatar: profile.avatar_url,
            profile: profile
          } : null);
        } else {
          console.warn('Profile creation returned null, but continuing...');
        }
      } catch (profileError: any) {
        console.error('Profile creation/verification failed:', profileError);
        
        // Provide more specific error messages
        if (profileError.message?.includes('permission') || profileError.message?.includes('policy')) {
          throw new Error('Database permission error. Please contact support if this persists.');
        } else if (profileError.message?.includes('duplicate')) {
          console.log('Profile already exists, continuing...');
          // This is actually okay - the profile exists
        } else {
          // For other errors, still allow the user to continue but log the issue
          console.warn('Profile creation failed but user was created successfully. Profile may be created by database trigger.');
        }
      }
      
      console.log('Signup process completed successfully');
    } catch (error: any) {
      console.error('Signup process failed:', error);
      setIsLoading(false);
      
      // Provide user-friendly error messages
      if (error.message?.includes('Database error saving new user')) {
        throw new Error('There was a problem setting up your account. Please try again or contact support.');
      } else if (error.message?.includes('User already registered')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      } else if (error.message?.includes('timeout')) {
        throw new Error('The signup process timed out. Please check your connection and try again.');
      } else {
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) throw new Error('No profile to update');
    
    const updatedProfile = await profileService.updateProfile(updates);
    if (updatedProfile) {
      setProfile(updatedProfile);
      setUser(prev => prev ? {
        ...prev,
        name: updatedProfile.full_name,
        avatar: updatedProfile.avatar_url,
        profile: updatedProfile
      } : null);
    }
  };

  const value = {
    user,
    profile,
    login,
    signup,
    logout,
    updateProfile,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}