'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSupabase } from '@/hooks/useSupabase';
import ProfileMenu from './ProfileMenu';

export default function Header() {
  const pathname = usePathname();
  const { supabase, user } = useSupabase();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    async function fetchUserName() {
      if (!supabase || !user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user name:', error);
          return;
        }

        if (data?.name) {
          setUserName(data.name);
        }
      } catch (err) {
        console.error('Error in fetchUserName:', err);
      }
    }

    fetchUserName();
  }, [supabase, user]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <h1 className="text-white text-xl font-bold">gm-autocrm</h1>
          </div>
          <div className="ml-4 flex items-center md:ml-6">
            <ProfileMenu />
          </div>
        </div>
      </div>
    </header>
  );
} 