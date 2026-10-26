'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuthStore, useWishlistCount } from '@/lib/store';

export default function AccountPage() {
  const { user, logout } = useAuthStore();
  const saved = useWishlistCount();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && !user) router.push('/login?redirect=/account');
  }, [user, router, mounted]);

  if (!mounted || !user) return null;

  const rows = [
    { href: '/orders', title: 'Orders', note: 'Track deliveries and download GST invoices.' },
    { href: '/wishlist', title: `Saved${saved ? ` (${saved})` : ''}`, note: 'Bottles you are deciding on.' },
    { href: '/fragrance-finder', title: 'Finder', note: 'Five questions, a shortlist made for you.' },
    ...(user.role === 'admin' ? [{ href: '/admin', title: 'Admin', note: 'Products, orders and content.' }] : []),
  ];

  return (
    <>
      <header className="h-wrap pg-head">
        <h1 className="t-display t-xl">{user.name?.split(' ')[0] || 'Account'}</h1>
        <p className="t-body t-mute" style={{ marginTop: 16 }}>{user.email}</p>
      </header>
      <section className="h-wrap" style={{ paddingBlock: '24px 120px', maxWidth: 1100, marginInline: 0 }}>
        {rows.map((r) => (
          <Link key={r.href} href={r.href} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 24, padding: '28px 0', borderBottom: '1px solid var(--line)' }}>
            <span style={{ display: 'grid', gap: 6 }}>
              <span className="t-display t-m">{r.title}</span>
              <span className="t-small t-mute">{r.note}</span>
            </span>
            <ArrowRight size={18} strokeWidth={1.25} />
          </Link>
        ))}
        <button type="button" className="h-link" style={{ marginTop: 40 }} onClick={() => { logout(); router.push('/'); }}>Sign out</button>
      </section>
    </>
  );
}
