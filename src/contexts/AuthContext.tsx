import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, profileService, type Profile } from '../services/supabaseService';
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
          setTimeout(() => reject(new Error('Signup timeout')), 20000)
        )
      ]);
      
      if (authError) {
        throw new Error(`Signup failed: ${authError.message}`);
      }

      if (!data.user) {
        throw new Error('No user returned from signup');
      }

      // Create user object immediately
      const userObj: User = {
        id: data.user.id,
        email: data.user.email!,
        name: userData.name,
        role: userData.role
      };

      setUser(userObj);
    } catch (error) {
      setIsLoading(false);
      throw error;
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