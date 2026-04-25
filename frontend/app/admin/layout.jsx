'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user) router.push('/login');
    else if (user.role !== 'admin') router.push('/');
  }, [user, router, mounted]);

  if (!mounted || !user || user.role !== 'admin') return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto w-full">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
