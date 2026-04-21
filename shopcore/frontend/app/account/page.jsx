'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { User, Mail, Shield, Package } from 'lucide-react';
import Link from 'next/link';

export default function AccountPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => { 
    if (mounted && !user) router.push('/login'); 
  }, [user, router, mounted]);
  
  if (!mounted || !user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile card */}
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-600">
              <User size={15} className="text-gray-400" />
              <span className="capitalize">{user.role}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Mail size={15} className="text-gray-400" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Shield size={15} className="text-gray-400" />
              <span className="text-green-600 font-medium">Account active</span>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="card p-6 space-y-3">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Links</h2>
          <Link href="/orders" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700">
            <Package size={16} className="text-gray-400" />
            My Orders
          </Link>
          {user.role === 'admin' && (
            <Link href="/admin" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-black">
              <Shield size={16} />
              Admin Dashboard
            </Link>
          )}
          <button
            onClick={logout}
            className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition text-sm text-red-600 border-t border-gray-100 mt-4 pt-4"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
