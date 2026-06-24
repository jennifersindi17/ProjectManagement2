'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/store/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, loadUser, accessToken } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [bypassAuth, setBypassAuth] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadUser();
    // If loadUser takes too long, bypass auth after 3 seconds
    const timer = setTimeout(() => {
      if (!user) setBypassAuth(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [loadUser, user]);

  useEffect(() => {
    if (isClient && !isLoading && !user && !accessToken && !bypassAuth) {
      router.push('/auth/login');
    }
  }, [isLoading, user, accessToken, router, isClient, bypassAuth]);

  if (!isClient || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading ProjectFlow...</p>
        </div>
      </div>
    );
  }

  if (!user && !bypassAuth) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-[260px] flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
