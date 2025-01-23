'use client';

import { useState, useEffect } from 'react';
import { createClient, SupabaseClient, User, AuthError } from '@supabase/supabase-js';

// Define user role type
export type UserRole = 'customer' | 'worker' | 'admin';

// Define our custom user type that includes role
export interface CustomUser extends Omit<User, 'role'> {
  role?: UserRole;
}

// Define auth state type
export interface AuthState {
  user: CustomUser | null;
  role: UserRole | null;
  isLoading: boolean;
  error: string | null;
}

export function useSupabase() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      url: supabaseUrl
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      setAuthState(prev => ({ ...prev, error: 'Missing Supabase credentials', isLoading: false }));
      return;
    }

    try {
      console.log('Creating Supabase client...');
      const client = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client created');
      setSupabase(client);

      // Function to fetch user role
      const fetchUserRole = async (userId: string) => {
        try {
          console.log('Starting role fetch for user:', userId);
          
          if (!client) {
            throw new Error('Supabase client is not initialized');
          }

          // Set a timeout for the query
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000);
          });

          // Create the query with single()
          console.log('Starting database query...');
          const queryPromise = client
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

          // Race between the query and the timeout
          console.log('Executing query with timeout...');
          const { data, error } = await Promise.race([queryPromise, timeoutPromise])
            .catch(err => {
              console.error('Query failed or timed out:', err);
              throw err;
            }) as any;

          console.log('Query response:', { data, error });

          if (error) {
            console.error('Database query error:', error);
            throw error;
          }

          if (!data?.role) {
            console.error('No role found in data:', data);
            throw new Error('No role found');
          }

          const roleStr = data.role.toLowerCase() as UserRole;
          console.log('Role successfully fetched:', roleStr);
          return roleStr;
        } catch (err) {
          console.error('Error in fetchUserRole:', err);
          return 'customer' as UserRole;
        }
      };

      // Handle auth state changes
      const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setAuthState({
            user: { ...session.user } as CustomUser,
            role: null,
            isLoading: false,
            error: null
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            role: null,
            isLoading: false,
            error: null
          });
        }
      });

      // Check initial session
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setAuthState({
            user: { ...session.user } as CustomUser,
            role: null,
            isLoading: false,
            error: null
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (err) {
      console.error('Error in useSupabase:', err);
      setAuthState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to initialize Supabase',
        isLoading: false
      }));
    }
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };

    try {
      console.log('Attempting sign in with Supabase...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error: error as AuthError };
    }
  };

  // Sign out function
  const signOut = async () => {
    if (!supabase) return { error: new Error('Supabase client not initialized') };

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, name: string) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error: error as AuthError };
    }
  };

  return {
    supabase,
    ...authState,
    signIn,
    signUp,
    signOut
  };
} 