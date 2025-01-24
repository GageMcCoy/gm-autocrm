'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSupabase } from '@/hooks/useSupabase';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, signOut } = useSupabase();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get user's display name or email
  const displayName = user?.user_metadata?.name || user?.email || 'User';

  // Define navigation links based on user role
  const getNavigationLinks = () => {
    if (!role) return [];

    switch (role) {
      case 'Admin':
        return [
          { href: '/customer', label: 'Customer View' },
          { href: '/worker', label: 'Worker View' },
          { href: '/admin', label: 'Admin View' },
        ];
      case 'Worker':
        return [
          { href: '/customer', label: 'Customer View' },
          { href: '/worker', label: 'Worker View' },
        ];
      case 'Customer':
        return [
          { href: '/customer', label: 'Customer View' },
        ];
      default:
        return [];
    }
  };

  const navigationLinks = getNavigationLinks();

  return (
    <div className="navbar bg-base-100 border-b">
      <div className="flex-1">
        <Link href="/" className="text-xl font-bold text-gray-900">
          gm-autocrm
        </Link>
        <div className="ml-8 flex gap-2">
          {navigationLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`btn btn-ghost text-gray-700 hover:text-gray-900 hover:bg-gray-100 ${
                pathname.startsWith(href) ? 'bg-gray-100 text-gray-900' : ''
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex-none gap-2">
        {role === 'Worker' && (
          <button className="btn btn-ghost btn-circle text-gray-700 hover:text-gray-900 hover:bg-gray-100">
            <div className="indicator">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </button>
        )}
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full relative">
              <Image
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`}
                alt={`${displayName}'s Avatar`}
                fill
                sizes="40px"
                className="rounded-full"
              />
            </div>
          </label>
          <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
            <li className="menu-title px-4 py-2">
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{displayName}</span>
                <span className="text-xs text-gray-500 capitalize">{role || 'Loading...'}</span>
              </div>
            </li>
            <div className="divider my-0"></div>
            <li>
              <button 
                onClick={handleSignOut}
                className="text-gray-700 hover:text-gray-900"
              >
                Sign out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 