import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { Toaster } from 'sonner';
import { SupabaseProvider } from '@/providers/SupabaseProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AutoCRM",
  description: "AI-Powered Customer Support Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className={inter.className}>
        <SupabaseProvider>
          <ClientLayout>{children}</ClientLayout>
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  );
}
