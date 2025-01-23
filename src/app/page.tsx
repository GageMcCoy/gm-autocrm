'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">gm-autocrm</h1>
          <p className="text-xl text-gray-300">Customer Support & Ticket Management System</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Customer Portal Card */}
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-bold mb-4 text-primary">Customer Portal</h2>
            <p className="text-gray-300 mb-8 min-h-[3rem]">
              Access your tickets, view responses, and manage your account
            </p>
            <Link 
              href="/customer" 
              className="btn btn-primary w-full"
            >
              Enter Customer View
            </Link>
          </div>

          {/* Worker Dashboard Card */}
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-bold mb-4 text-primary">Worker Dashboard</h2>
            <p className="text-gray-300 mb-8 min-h-[3rem]">
              Manage tickets, respond to customers, and track your tasks
            </p>
            <Link 
              href="/worker" 
              className="btn btn-primary w-full"
            >
              Enter Worker View
            </Link>
          </div>

          {/* Admin Console Card */}
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-bold mb-4 text-primary">Admin Console</h2>
            <p className="text-gray-300 mb-8 min-h-[3rem]">
              Manage users, view analytics, and configure system settings
            </p>
            <Link 
              href="/admin" 
              className="btn btn-primary w-full"
            >
              Enter Admin View
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
