'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'bg-primary text-white' : 'text-gray-300 hover:text-white';
  };

  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-white hover:text-primary transition-colors">
            gm-autocrm
          </Link>
          
          <nav className="flex space-x-4">
            <Link 
              href="/customer" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/customer')}`}
            >
              Customer
            </Link>
            <Link 
              href="/worker" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/worker')}`}
            >
              Worker
            </Link>
            <Link 
              href="/admin" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin')}`}
            >
              Admin
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300">
              <span className="font-medium">Sarah Johnson</span>
            </div>
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-lg font-medium text-white">GA</span>
                </div>
              </label>
              <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                <li>
                  <a className="text-gray-700">Profile</a>
                </li>
                <li>
                  <a className="text-gray-700">Settings</a>
                </li>
                <li>
                  <a className="text-gray-700">Sign out</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 