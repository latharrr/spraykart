'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, Star, Activity, LogOut, Server, HelpCircle } from 'lucide-react';
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
  { href: '/admin/faqs', label: 'FAQs', icon: HelpCircle },
  { href: '/admin/system', label: 'System', icon: Server },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  return (
    <aside className="w-full md:w-60 bg-gray-950 text-white flex flex-col md:min-h-screen border-b md:border-b-0 md:border-r border-gray-800 shrink-0">
      <div className="px-4 py-4 md:px-6 md:py-6 border-b border-gray-800 flex justify-between items-center md:block">
        <div>
          <Link href="/" className="text-xs text-gray-500 mb-1 block hover:text-gray-400 transition">← Back to store</Link>
          <span className="text-base font-bold tracking-tight text-white">ShopCore Admin</span>
        </div>
        <button onClick={logout} className="md:hidden text-gray-500 hover:text-red-400 p-2">
          <LogOut size={16} />
        </button>
      </div>

      <nav 
        className="flex-1 flex flex-row md:flex-col overflow-x-auto md:overflow-visible px-2 py-2 md:px-3 md:py-5 space-x-2 md:space-x-0 md:space-y-0.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{__html: `nav::-webkit-scrollbar { display: none; }`}} />
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap shrink-0',
                isActive
                  ? 'bg-white text-gray-950'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden md:block px-3 pb-6 border-t border-gray-800 pt-4">
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
