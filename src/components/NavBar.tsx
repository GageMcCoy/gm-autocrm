'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();

  return (
    <div className="navbar bg-base-100 border-b">
      <div className="flex-1">
        <Link href="/" className="text-xl font-bold text-gray-900">
          gm-autocrm
        </Link>
        <div className="ml-8 flex gap-2">
          <Link 
            href="/customer" 
            className={`btn btn-ghost text-gray-700 hover:text-gray-900 hover:bg-gray-100 ${pathname.startsWith('/customer') ? 'bg-gray-100 text-gray-900' : ''}`}
          >
            Customer View
          </Link>
          <Link 
            href="/worker" 
            className={`btn btn-ghost text-gray-700 hover:text-gray-900 hover:bg-gray-100 ${pathname.startsWith('/worker') ? 'bg-gray-100 text-gray-900' : ''}`}
          >
            Worker View
          </Link>
          <Link 
            href="/admin" 
            className={`btn btn-ghost text-gray-700 hover:text-gray-900 hover:bg-gray-100 ${pathname.startsWith('/admin') ? 'bg-gray-100 text-gray-900' : ''}`}
          >
            Admin View
          </Link>
        </div>
      </div>
      <div className="flex-none gap-2">
        <button className="btn btn-ghost btn-circle text-gray-700 hover:text-gray-900 hover:bg-gray-100">
          <div className="indicator">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        </button>
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <img src="https://ui-avatars.com/api/?name=User" alt="User Avatar" />
            </div>
          </label>
          <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
            <li><a className="text-gray-700 hover:text-gray-900">Profile</a></li>
            <li><a className="text-gray-700 hover:text-gray-900">Settings</a></li>
            <li><a className="text-gray-700 hover:text-gray-900">Logout</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
} 