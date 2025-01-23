'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSupabase } from '@/hooks/useSupabase';

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
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-white text-xl font-bold">
            gm-autocrm
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/customer"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/customer')
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Customer
            </Link>
            <Link
              href="/worker"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/worker')
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Worker
            </Link>
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/admin')
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Admin
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-white">{userName}</span>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
              {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : ''}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 