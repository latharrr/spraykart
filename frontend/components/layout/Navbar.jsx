'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ShoppingCart, Search, Menu, X, User, Package, Shield, Heart } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useAuthStore, useCartItemCount, useWishlistCount } from '@/lib/store';
import clsx from 'clsx';

const navLinks = [
  { href: '/products', label: 'All Fragrances' },
  { href: '/products?category=Men', label: 'Men' },
  { href: '/products?category=Women', label: 'Women' },
  { href: '/products?category=Unisex', label: 'Unisex' },
  { href: '/products?category=Attar', label: 'Attar' },
  { href: '/products?category=Gift+Sets', label: 'Gift Sets' },
];

function NavbarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const itemCount = useCartItemCount();
  const wishlistCount = useWishlistCount();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      {/* Announcement strip */}
      <div className="marquee-container" style={{ background: '#0c0c0c', color: 'rgba(255,255,255,.65)', padding: '8px 0', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
        <div className="marquee-content">
          <span style={{ paddingRight: '40px' }}>100% Authentic Luxury Fragrances &nbsp;·&nbsp; Free Shipping Above ₹999 &nbsp;·&nbsp; Razorpay Secured Payments</span>
          <span style={{ paddingRight: '40px' }}>100% Authentic Luxury Fragrances &nbsp;·&nbsp; Free Shipping Above ₹999 &nbsp;·&nbsp; Razorpay Secured Payments</span>
          <span style={{ paddingRight: '40px' }}>100% Authentic Luxury Fragrances &nbsp;·&nbsp; Free Shipping Above ₹999 &nbsp;·&nbsp; Razorpay Secured Payments</span>
          <span style={{ paddingRight: '40px' }}>100% Authentic Luxury Fragrances &nbsp;·&nbsp; Free Shipping Above ₹999 &nbsp;·&nbsp; Razorpay Secured Payments</span>
        </div>
      </div>

      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#ffffff',
        borderBottom: scrolled ? '1px solid #e8e8e8' : '1px solid #f0f0f0',
        boxShadow: scrolled ? '0 1px 16px rgba(0,0,0,.06)' : 'none',
        transition: 'box-shadow .2s, border-color .2s',
      }}>
        <nav style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              className="lg:hidden"
              style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#737373', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '-8px' }}
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'baseline' }}>
              <span style={{
                fontFamily: "'Cormorant', Georgia, serif",
                fontSize: 22, fontWeight: 500,
                color: '#0c0c0c', letterSpacing: '-0.02em',
              }}>
                Spray<em style={{ fontWeight: 300, fontStyle: 'italic' }}>kart</em>
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center justify-center flex-1" style={{ gap: 28 }}>
            {navLinks.map(({ href, label }) => {
              const currentCategory = searchParams.get('category');
              const linkCategory = href.includes('category=') ? new URLSearchParams(href.split('?')[1]).get('category') : null;
              
              let active = false;
              if (href === '/products') {
                active = pathname === '/products' && !currentCategory;
              } else if (linkCategory) {
                active = pathname === '/products' && currentCategory === linkCategory;
              } else {
                active = pathname === href;
              }
              
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontSize: 11, fontWeight: 500,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: active ? '#0c0c0c' : '#909090',
                    textDecoration: 'none',
                    borderBottom: active ? '1px solid #0c0c0c' : '1px solid transparent',
                    paddingBottom: 2,
                    transition: 'color .15s',
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Link href="/products" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#909090', textDecoration: 'none', borderRadius: 2, transition: 'color .15s' }} aria-label="Search">
              <Search size={16} />
            </Link>

            {/* Wishlist */}
            <Link href="/wishlist" style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#909090', textDecoration: 'none', borderRadius: 2, transition: 'color .15s' }} aria-label="Wishlist">
              <Heart size={16} />
              {mounted && wishlistCount > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 14, height: 14, background: '#e11d48', color: '#ffffff',
                  fontSize: 8, fontWeight: 700, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#909090', textDecoration: 'none', borderRadius: 2, transition: 'color .15s' }} aria-label="Cart">
              <ShoppingCart size={16} />
              {mounted && itemCount > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 14, height: 14, background: '#0c0c0c', color: '#ffffff',
                  fontSize: 8, fontWeight: 700, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {mounted && user ? (
              <div className="relative group" style={{ display: 'none' }}>
                <button className="hidden lg:flex" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#737373', padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <User size={14} />
                  {user.name.split(' ')[0]}
                </button>
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 4,
                  width: 200, background: '#ffffff',
                  border: '1px solid #e8e8e8', borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,.08)',
                  padding: '4px 0',
                  opacity: 0, pointerEvents: 'none',
                }} className="group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150">
                  <Link href="/orders" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 12, color: '#3d3d3d', textDecoration: 'none' }}><Package size={12} /> My Orders</Link>
                  <Link href="/account" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 12, color: '#3d3d3d', textDecoration: 'none' }}><User size={12} /> Account</Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#0c0c0c', textDecoration: 'none', borderTop: '1px solid #f0f0f0', marginTop: 4 }}><Shield size={12} /> Admin Panel</Link>
                  )}
                  <button onClick={logout} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', borderTop: '1px solid #f0f0f0', marginTop: 4, display: 'block' }}>Sign out</button>
                </div>
              </div>
            ) : null}

            {mounted && user ? (
              <div className="relative group hidden lg:block">
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#737373', padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <User size={14} />
                  {user.name.split(' ')[0]}
                </button>
                <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, width: 200, background: '#ffffff', border: '1px solid #e8e8e8', boxShadow: '0 8px 32px rgba(0,0,0,.08)', padding: '4px 0', zIndex: 50 }}>
                  <Link href="/orders" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 12, color: '#3d3d3d', textDecoration: 'none' }}><Package size={12} /> My Orders</Link>
                  <Link href="/account" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 12, color: '#3d3d3d', textDecoration: 'none' }}><User size={12} /> Account</Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#0c0c0c', textDecoration: 'none', borderTop: '1px solid #f0f0f0', marginTop: 4 }}><Shield size={12} /> Admin Panel</Link>
                  )}
                  <button onClick={logout} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', borderTop: '1px solid #f0f0f0', marginTop: 4, display: 'block' }}>Sign out</button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="hidden lg:block" style={{
                marginLeft: 8,
                display: 'inline-flex', alignItems: 'center',
                padding: '8px 20px',
                fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: '#0c0c0c', color: '#ffffff',
                textDecoration: 'none', borderRadius: 2,
              }}>
                Sign in
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ background: '#ffffff', borderTop: '1px solid #f0f0f0', padding: '16px 20px 24px' }} className="lg:hidden">
            {navLinks.map(({ href, label }) => {
              const currentCategory = searchParams.get('category');
              const linkCategory = href.includes('category=') ? new URLSearchParams(href.split('?')[1]).get('category') : null;
              
              let active = false;
              if (href === '/products') {
                active = pathname === '/products' && !currentCategory;
              } else if (linkCategory) {
                active = pathname === '/products' && currentCategory === linkCategory;
              } else {
                active = pathname === href;
              }

              return (
                <Link key={href} href={href} style={{ display: 'block', padding: '10px 0', fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: active ? '#0c0c0c' : '#737373', textDecoration: 'none', borderBottom: '1px solid #f5f5f5' }}>
                  {label}
                </Link>
              );
            })}
            <div style={{ marginTop: 12, paddingTop: 12 }}>
              {mounted && user ? (
                <>
                  <Link href="/orders" style={{ display: 'block', padding: '10px 0', fontSize: 12, color: '#737373', textDecoration: 'none' }}>My Orders</Link>
                  <Link href="/account" style={{ display: 'block', padding: '10px 0', fontSize: 12, color: '#737373', textDecoration: 'none' }}>Account</Link>
                  {user.role === 'admin' && <Link href="/admin" style={{ display: 'block', padding: '10px 0', fontSize: 12, fontWeight: 700, color: '#0c0c0c', textDecoration: 'none' }}>Admin Panel</Link>}
                  <button onClick={logout} style={{ display: 'block', padding: '10px 0', fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>Sign out</button>
                </>
              ) : (
                <Link href="/login" style={{ display: 'inline-block', marginTop: 8, padding: '10px 24px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0c0c0c', color: '#ffffff', textDecoration: 'none' }}>
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
    <Suspense fallback={<div style={{ height: 100 }}></div>}>
      <NavbarInner />
    </Suspense>
  );
}
