import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Navigation Bar */}
      <div className="navbar bg-base-100 border-b">
        <div className="flex-1">
          <Link href="/" className="text-xl font-bold">gm-autocrm</Link>
        </div>
        <div className="flex-none gap-4">
          <Link href="/customer" className="btn btn-ghost">Customer View</Link>
          <Link href="/worker" className="btn btn-ghost">Worker View</Link>
          <Link href="/admin" className="btn btn-ghost">Admin View</Link>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-circle">
              <div className="indicator">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </button>
            <button className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full relative">
                <Image
                  src="https://ui-avatars.com/api/?name=User"
                  alt="User Avatar"
                  fill
                  sizes="40px"
                  className="rounded-full"
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer View Card */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <h2 className="card-title">Customer Portal</h2>
              <p>Access your tickets, view responses, and manage your account</p>
              <div className="card-actions justify-end">
                <Link href="/customer" className="btn btn-primary">Enter Customer View</Link>
              </div>
            </div>
          </div>

          {/* Worker View Card */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <h2 className="card-title">Worker Dashboard</h2>
              <p>Manage tickets, respond to customers, and track your tasks</p>
              <div className="card-actions justify-end">
                <Link href="/worker" className="btn btn-primary">Enter Worker View</Link>
              </div>
            </div>
          </div>

          {/* Admin View Card */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <h2 className="card-title">Admin Console</h2>
              <p>Manage users, view analytics, and configure system settings</p>
              <div className="card-actions justify-end">
                <Link href="/admin" className="btn btn-primary">Enter Admin View</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
