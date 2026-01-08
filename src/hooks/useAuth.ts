'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User as AuthUser } from '@supabase/supabase-js';
import type { User, UserRole } from '@/types/database';

interface AuthState {
  authUser: AuthUser | null;
  profile: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  universityId: string | null;
}

interface UseAuthReturn extends AuthState {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }

    return data as User;
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (!authUser) return;

    const userProfile = await fetchProfile(authUser.id);
    setProfile(userProfile);
  }, [authUser, fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setAuthUser(session.user);
          const userProfile = await fetchProfile(session.user.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setAuthUser(session.user);
          const userProfile = await fetchProfile(session.user.id);
          setProfile(userProfile);
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  return {
    authUser,
    profile,
    isLoading,
    isAuthenticated: !!authUser && !!profile,
    role: profile?.role ?? null,
    universityId: profile?.university_id ?? null,
    signOut,
    refreshProfile,
  };
}

// Role check utilities
export function isAdmin(role: UserRole | null): boolean {
  return role === 'admin';
}

export function isNepalAgency(role: UserRole | null): boolean {
  return role === 'nepal_agency';
}

export function isUniversity(role: UserRole | null): boolean {
  return role === 'university';
}

export function canAccessAdmin(role: UserRole | null): boolean {
  return role === 'admin';
}

export function canAccessAgency(role: UserRole | null): boolean {
  return role === 'admin' || role === 'nepal_agency';
}

export function canAccessUniversity(role: UserRole | null): boolean {
  return role === 'admin' || role === 'university';
}

// Redirect path helper
export function getRedirectPath(role: UserRole | null): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'nepal_agency':
      return '/agency';
    case 'university':
      return '/university';
    default:
      return '/login';
  }
}
