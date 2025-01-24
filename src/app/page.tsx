'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function RootPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/sign-in');
          return;
        }

        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error || !userData?.role) {
          console.error('Error fetching user role:', error);
          router.push('/auth/sign-in');
          return;
        }

        // Redirect based on role
        switch (userData.role) {
          case 'Customer':
            router.push('/customer');
            break;
          case 'Worker':
            router.push('/worker');
            break;
          case 'Admin':
            router.push('/admin');
            break;
          default:
            router.push('/auth/sign-in');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        router.push('/auth/sign-in');
      }
    };

    checkUserRole();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  );
}
