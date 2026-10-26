'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, X, Search, ShoppingBag } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useAuthStore, useCartItemCount, useWishlistCount, useBagUI } from '@/lib/store';
import BagDrawer from '@/components/layout/BagDrawer';

const departments = [
  { href: '/products', label: 'Fragrances' },
  { href: '/products?category=Men', label: 'Men' },
  { href: '/products?category=Women', label: 'Women' },
  { href: '/products?category=Attar', label: 'Attar' },
  { href: '/products?category=Gift+Sets', label: 'Gifts' },
];

const drawerDepartments = [
  ...departments.slice(0, 3),
  { href: '/products?category=Unisex', label: 'Unisex' },
  ...departments.slice(3),
  { href: '/fragrance-finder', label: 'Finder' },
];

function NavbarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const itemCount = useCartItemCount();
  const savedCount = useWishlistCount();
  const { user, logout } = useAuthStore();
  const openBag = useBagUI((s) => s.openBag);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setMenuOpen(false); }, [pathname, searchParams]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const isActive = (href) => {
    const cat = searchParams.get('category');
    if (href.includes('category=')) {
      return pathname === '/products' && cat === new URLSearchParams(href.split('?')[1]).get('category');
    }
    if (href === '/products') return pathname === '/products' && !cat;
    return pathname.startsWith(href);
  };

  const bagCount = mounted ? itemCount : 0;

  return (
    <>
      <div className="h-bar" role="note">
        <span>Originals only, with GST invoice</span>
        <span>Free delivery above ₹999</span>
        <span>Cash on delivery up to ₹2,999</span>
      </div>

      <header className="h-nav">
        <nav className="h-wrap h-nav__in" aria-label="Main">
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <button className="h-nav__icon" style={{ marginLeft: -12 }} onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
              <Menu size={20} strokeWidth={1.25} />
            </button>
            <Link href="/" className="h-wordmark hide-m-wordmark" aria-label="Spraykart home">Spraykart</Link>
          </div>

          <div className="h-nav__dept">
            {departments.map(({ href, label }) => (
              <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined}>{label}</Link>
            ))}
          </div>

          <div className="h-nav__util">
            <Link href="/products?focus=search" className="hide-m">Search</Link>
            <Link href="/products?focus=search" className="h-nav__icon" aria-label="Search">
              <Search size={18} strokeWidth={1.25} />
            </Link>
            {mounted && user ? (
              <div className="h-nav__menu hide-m">
                <Link href="/account" aria-haspopup="true">Account</Link>
                <div className="h-nav__menu-pop">
                  <Link href="/orders">Orders</Link>
                  <Link href="/account">Profile and addresses</Link>
                  <Link href="/wishlist">Saved{savedCount ? ` (${savedCount})` : ''}</Link>
                  {user.role === 'admin' && <Link href="/admin">Admin panel</Link>}
                  <button type="button" onClick={logout}>Sign out</button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="hide-m">Sign in</Link>
            )}
            <Link href="/wishlist" className="hide-m">Saved{mounted && savedCount ? ` (${savedCount})` : ''}</Link>
            <button type="button" className="hide-m" onClick={openBag} aria-label={`Bag, ${bagCount} items`}>
              Bag (<span className={bagCount ? 'h-nav__count' : undefined}>{bagCount}</span>)
            </button>
            <button type="button" className="h-nav__icon" style={{ marginRight: -12, position: 'relative' }} onClick={openBag} aria-label={`Bag, ${bagCount} items`}>
              <ShoppingBag size={18} strokeWidth={1.25} />
              {bagCount > 0 && <span style={{ position: 'absolute', top: 7, right: 6, fontSize: 10, fontWeight: 600 }} className="h-nav__count">{bagCount}</span>}
            </button>
          </div>
        </nav>
      </header>

      <div className={`h-scrim${menuOpen ? ' is-open' : ''}`} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <div className={`h-drawer h-drawer--left${menuOpen ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu" inert={menuOpen ? undefined : ''}>
        <div className="h-drawer__head">
          <Link href="/" className="h-wordmark" style={{ fontSize: 28 }}>Spraykart</Link>
          <button className="h-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} strokeWidth={1.25} /></button>
        </div>
        <div className="h-drawer__body">
          {drawerDepartments.map(({ href, label }) => (
            <Link key={href} href={href} className="h-drawer__big" aria-current={isActive(href) ? 'page' : undefined}>{label}</Link>
          ))}
          <div style={{ paddingBlock: 20 }}>
            <Link href="/wishlist" className="h-drawer__small">Saved{mounted && savedCount ? ` (${savedCount})` : ''}</Link>
            <Link href="/orders" className="h-drawer__small">Orders</Link>
            <Link href="/machine" className="h-drawer__small">Spraykart Machine</Link>
            <Link href="/contact" className="h-drawer__small">Contact</Link>
          </div>
        </div>
        <div className="h-drawer__foot">
          {mounted && user ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <Link href="/account" className="t-small">{user.name}</Link>
              <div style={{ display: 'flex', gap: 20 }}>
                {user.role === 'admin' && <Link href="/admin" className="h-link">Admin</Link>}
                <button type="button" onClick={logout} className="h-link">Sign out</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Link href="/login" className="h-btn">Sign in</Link>
              <Link href="/register" className="h-btn h-btn--ghost">Register</Link>
            </div>
          )}
        </div>
      </div>

      <BagDrawer />
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div style={{ height: 'calc(var(--nav-h) + var(--bar-h))' }} />}>
      <NavbarInner />
    </Suspense>
  );
}
