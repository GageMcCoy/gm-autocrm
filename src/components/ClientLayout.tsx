'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  return (
    <div className="min-h-screen bg-gray-900">
      {!isAuthPage && <Header />}
      {children}
    </div>
  );
} 