'use client';

import { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function useSupabase() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setError('Missing Supabase credentials');
      setIsLoading(false);
      return;
    }

    try {
      const client = createClient(supabaseUrl, supabaseKey);
      setSupabase(client);
    } catch (err) {
      setError('Failed to initialize Supabase client');
      console.error('Supabase initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { supabase, error, isLoading };
} 