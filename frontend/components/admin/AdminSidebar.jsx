'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, Star, Activity, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import clsx from 'clsx';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/performance', label: 'Performance', icon: Activity },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  return (
    <aside className="w-60 bg-gray-950 text-white min-h-screen flex flex-col border-r border-gray-800 shrink-0">
      <div className="px-6 py-6 border-b border-gray-800">
        <Link href="/" className="text-xs text-gray-500 mb-1 block hover:text-gray-400 transition">← Back to store</Link>
        <span className="text-base font-bold tracking-tight text-white">ShopCore Admin</span>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                isActive
                  ? 'bg-white text-gray-950'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6 border-t border-gray-800 pt-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-950/30 transition w-full"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
