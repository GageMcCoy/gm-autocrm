'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ProfileMenu from './ProfileMenu';
import { useSupabase } from '@/hooks/useSupabase';

export default function Header() {
  const pathname = usePathname();
  const { role } = useSupabase();

  const getNavigationLinks = () => {
    if (!role) return [];

    switch (role) {
      case 'Admin':
        return [
          { href: '/customer', label: 'Customer' },
          { href: '/worker', label: 'Worker' },
          { href: '/admin', label: 'Admin' },
        ];
      case 'Worker':
        return [
          { href: '/customer', label: 'Customer' },
          { href: '/worker', label: 'Worker' },
        ];
      case 'Customer':
        return [
          { href: '/customer', label: 'Customer' },
        ];
      default:
        return [];
    }
  };

  const navigationLinks = getNavigationLinks();

  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-white text-xl font-bold">
                gm-autocrm
              </Link>
            </div>
            <nav className="ml-10 flex items-center space-x-4">
              {navigationLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === href
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="ml-4 flex items-center md:ml-6">
            <ProfileMenu />
          </div>
        </div>
      </div>
    </header>
  );
} 