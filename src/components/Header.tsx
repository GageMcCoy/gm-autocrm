'use client';

import ProfileMenu from './ProfileMenu';

export default function Header() {

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