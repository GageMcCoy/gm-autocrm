import { SupabaseClient } from '@supabase/supabase-js';
import React from 'react';

export interface SupabaseContextType {
  supabase: SupabaseClient;
}

export function SupabaseProvider(props: { children: React.ReactNode }): React.ReactElement;
export function useSupabase(): SupabaseContextType; 