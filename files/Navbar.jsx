'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ShoppingCart, Search, Menu, X, User, Package, Shield, Heart } from 'lucide-react';
import { useState, useEffect, Suspense, useCallback, memo } from 'react';
import { useAuthStore, useCartItemCount, useWishlistCount } from '@/lib/store';

const navLinks = [
  { href: '/products', label: 'All Fragrances', category: null },
  { href: '/products?category=Men', label: 'Men', category: 'Men' },
  { href: '/products?category=Women', label: 'Women', category: 'Women' },
  { href: '/products?category=Unisex', label: 'Unisex', category: 'Unisex' },
  { href: '/products?category=Attar', label: 'Attar', category: 'Attar' },
  { href: '/products?category=Gift+Sets', label: 'Gift Sets', category: 'Gift Sets' },
];

// ─── Badge is isolated so cart/wishlist changes only repaint this tiny node ────
const CountBadge = memo(function CountBadge({ count, color = '#0c0c0c' }) {
  if (!count || count <= 0) return null;
  return (
    <span style={{
      position: 'absolute', top: 4, right: 4,
      width: 14, height: 14, background: color, color: '#ffffff',
      fontSize: 8, fontWeight: 700, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      {count > 9 ? '9+' : count}
    </span>
  );
});

function NavbarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');

  const itemCount = useCartItemCount();
  const wishlistCount = useWishlistCount();
  const { user, logout } = useAuthStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let ticking = false;
    const h = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 0);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const handleLogout = useCallback(() => {
    setUserMenuOpen(false);
    logout();
  }, [logout]);

  const isLinkActive = useCallback((link) => {
    if (link.href === '/products') return pathname === '/products' && !currentCategory;
    if (link.category) return pathname === '/products' && currentCategory === link.category;
    return pathname === link.href;
  }, [pathname, currentCategory]);

  return (
    <>
      {/* Announcement strip */}
      <div style={{
        background: '#0c0c0c', color: 'rgba(255,255,255,.65)', textAlign: 'center',
        padding: '8px 20px', fontSize: 10, letterSpacing: '0.18em',
        textTransform: 'uppercase', fontFamily: 'var(--font-inter), sans-serif',
        overflowX: 'auto', whiteSpace: 'nowrap',
      }}>
        100% Authentic Luxury Fragrances &nbsp;·&nbsp; Free Shipping Above ₹999 &nbsp;·&nbsp; Razorpay Secured Payments
      </div>

      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#ffffff',
        borderBottom: scrolled ? '1px solid #e8e8e8' : '1px solid #f0f0f0',
        boxShadow: scrolled ? '0 1px 16px rgba(0,0,0,.06)' : 'none',
        transition: 'box-shadow .2s, border-color .2s',
      }}>
        <nav style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 40px',
          height: 60, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 24,
        }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span style={{
              fontFamily: 'var(--font-cormorant), Georgia, serif',
              fontSize: 22, fontWeight: 500, color: '#0c0c0c', letterSpacing: '-0.02em',
            }}>
              Spray<em style={{ fontWeight: 300, fontStyle: 'italic' }}>kart</em>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 28, flex: 1, justifyContent: 'center' }}>
            {navLinks.map((link) => {
              const active = isLinkActive(link);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: 11, fontWeight: 500, letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: active ? '#0c0c0c' : '#909090',
                    textDecoration: 'none',
                    borderBottom: active ? '1px solid #0c0c0c' : '1px solid transparent',
                    paddingBottom: 2, transition: 'color .15s',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Link href="/products" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#909090', textDecoration: 'none', borderRadius: 2 }} aria-label="Search">
              <Search size={16} />
            </Link>

            {/* Wishlist */}
            <Link href="/wishlist" style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#909090', textDecoration: 'none', borderRadius: 2 }} aria-label="Wishlist">
              <Heart size={16} />
              {mounted && <CountBadge count={wishlistCount} color="#e11d48" />}
            </Link>

            {/* Cart */}
            <Link href="/cart" style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#909090', textDecoration: 'none', borderRadius: 2 }} aria-label="Cart">
              <ShoppingCart size={16} />
              {mounted && <CountBadge count={itemCount} />}
            </Link>

            {/* User menu — click-based (not hover) for accessibility + mobile */}
            {mounted && user ? (
              <div className="hidden lg:block relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#737373', padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <User size={14} />
                  {user.name.split(' ')[0]}
                </button>

                {userMenuOpen && (
                  <>
                    {/* Backdrop for click-away */}
                    <div
                      onClick={() => setUserMenuOpen(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    />
                    <div style={{
                      position: 'absolute', right: 0, top: '100%', marginTop: 4,
                      width: 200, background: '#ffffff', border: '1px solid #e8e8e8',
                      boxShadow: '0 8px 32px rgba(0,0,0,.08)', padding: '4px 0', zIndex: 50,
                    }}>
                      <Link href="/orders" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 12, color: '#3d3d3d', textDecoration: 'none' }}><Package size={12} /> My Orders</Link>
                      <Link href="/account" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 12, color: '#3d3d3d', textDecoration: 'none' }}><User size={12} /> Account</Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#0c0c0c', textDecoration: 'none', borderTop: '1px solid #f0f0f0', marginTop: 4 }}><Shield size={12} /> Admin Panel</Link>
                      )}
                      <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', borderTop: '1px solid #f0f0f0', marginTop: 4, display: 'block' }}>Sign out</button>
                    </div>
                  </>
                )}
              </div>
            ) : mounted && !user ? (
              <Link href="/login" className="hidden lg:block" style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', padding: '8px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0c0c0c', color: '#ffffff', textDecoration: 'none', borderRadius: 2 }}>
                Sign in
              </Link>
            ) : null}

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden"
              style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#737373', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ background: '#ffffff', borderTop: '1px solid #f0f0f0', padding: '16px 20px 24px' }} className="lg:hidden">
            {navLinks.map((link) => {
              const active = isLinkActive(link);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{ display: 'block', padding: '10px 0', fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: active ? '#0c0c0c' : '#737373', textDecoration: 'none', borderBottom: '1px solid #f5f5f5' }}
                >
                  {link.label}
                </Link>
              );
            })}

            <div style={{ marginTop: 12, paddingTop: 12 }}>
              {mounted && user ? (
                <>
                  <Link href="/orders" onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '10px 0', fontSize: 12, color: '#737373', textDecoration: 'none' }}>My Orders</Link>
                  <Link href="/account" onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '10px 0', fontSize: 12, color: '#737373', textDecoration: 'none' }}>Account</Link>
                  {user.role === 'admin' && <Link href="/admin" onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '10px 0', fontSize: 12, fontWeight: 700, color: '#0c0c0c', textDecoration: 'none' }}>Admin Panel</Link>}
                  <button onClick={handleLogout} style={{ display: 'block', padding: '10px 0', fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>Sign out</button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)} style={{ display: 'inline-block', marginTop: 8, padding: '10px 24px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0c0c0c', color: '#ffffff', textDecoration: 'none' }}>
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div style={{ height: 100 }} />}>
      <NavbarInner />
    </Suspense>
  );
}
