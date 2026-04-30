'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  ShoppingCart, Search, Menu, X, User, Package, Shield,
  Heart, LogOut, ChevronRight, ChevronLeft, Home, Store,
  Tag, Sparkles, Info, Phone, Zap,
} from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useAuthStore, useCartItemCount, useWishlistCount } from '@/lib/store';

/* ─── Desktop nav links ──────────────────────────────────────────────────── */
const desktopNavLinks = [
  { href: '/products', label: 'All Fragrances' },
  { href: '/products?category=Men', label: 'Men' },
  { href: '/products?category=Women', label: 'Women' },
  { href: '/products?category=Unisex', label: 'Unisex' },
  { href: '/products?category=Attar', label: 'Attar' },
  { href: '/products?category=Gift+Sets', label: 'Gift Sets' },
  { href: '/fragrance-finder', label: 'Fragrance Finder' },
  { href: '/machine', label: 'Machine ⚡', badge: true },
];

/* ─── Mobile drawer structure ────────────────────────────────────────────── */
const drawerMainLinks = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: Home,
  },
  {
    id: 'shop',
    label: 'Shop',
    icon: Store,
    children: [
      { label: 'All Fragrances', href: '/products' },
      { label: 'Men', href: '/products?category=Men' },
      { label: 'Women', href: '/products?category=Women' },
      { label: 'Unisex', href: '/products?category=Unisex' },
      { label: 'Attar', href: '/products?category=Attar' },
      { label: 'Gift Sets', href: '/products?category=Gift+Sets' },
    ],
  },
  {
    id: 'brands',
    label: 'Brands',
    href: '/products',
    icon: Tag,
  },
  {
    id: 'fragrance-finder',
    label: 'Fragrance Finder',
    href: '/fragrance-finder',
    icon: Sparkles,
  },
  {
    id: 'about',
    label: 'About Us',
    href: '/#about',
    icon: Info,
  },
  {
    id: 'contact',
    label: 'Contact Us',
    href: '/contact',
    icon: Phone,
  },
  {
    id: 'machine',
    label: 'Spraykart Machine',
    href: '/machine',
    icon: Zap,
    badge: 'New',
  },
];

/* ─── Inline styles ──────────────────────────────────────────────────────── */
const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 49,
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  },
  drawer: {
    position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
    width: 320, maxWidth: '88vw',
    background: '#ffffff',
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto',
    boxShadow: '4px 0 32px rgba(0,0,0,.12)',
  },
  drawerHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 20px 14px',
    borderBottom: '1px solid #f0f0f0',
  },
  authRow: {
    display: 'flex', alignItems: 'center', gap: 0,
    padding: '14px 20px',
    borderBottom: '2px solid #f0f0f0',
    background: '#fafafa',
  },
  authBtn: (primary) => ({
    flex: 1, textAlign: 'center',
    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '10px 0',
    textDecoration: 'none',
    color: primary ? '#ffffff' : '#0c0c0c',
    background: primary ? '#0c0c0c' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity .15s',
  }),
  authDivider: {
    width: 1, height: 36, background: '#d8d8d8', flexShrink: 0,
  },
  navItem: (active) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '15px 20px',
    fontSize: 12, fontWeight: 600, letterSpacing: '0.10em',
    textTransform: 'uppercase',
    color: active ? '#0c0c0c' : '#4a4a4a',
    textDecoration: 'none',
    background: 'none', border: 'none', width: '100%', cursor: 'pointer',
    textAlign: 'left',
    borderBottom: '1px solid #f2f2f2',
    transition: 'background .1s',
  }),
  navItemIcon: {
    display: 'flex', alignItems: 'center', gap: 12,
  },
  subPanel: {
    position: 'absolute', inset: 0,
    background: '#ffffff',
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto',
  },
  subHead: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '18px 20px 14px',
    borderBottom: '1px solid #f0f0f0',
    background: '#fafafa',
  },
  subBack: {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: '#737373',
    padding: 0,
  },
  subLink: (active) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px',
    fontSize: 12, fontWeight: active ? 700 : 500,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: active ? '#0c0c0c' : '#4a4a4a',
    textDecoration: 'none',
    borderBottom: '1px solid #f2f2f2',
    transition: 'background .1s',
  }),
  utilSection: {
    padding: '20px 0',
    borderTop: '1px solid #f0f0f0',
    marginTop: 'auto',
  },
  utilLink: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 20px',
    fontSize: 12, color: '#4a4a4a',
    textDecoration: 'none',
    background: 'none', border: 'none', cursor: 'pointer',
    width: '100%', textAlign: 'left',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
function NavbarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const itemCount = useCartItemCount();
  const wishlistCount = useWishlistCount();
  const { user, logout } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // id of open sub-panel
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Sync scroll state immediately on mount to avoid flash
    setScrolled(window.scrollY > 0);
  }, []);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  useEffect(() => {
    setDrawerOpen(false);
    setActivePanel(null);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    const currentCategory = searchParams.get('category');
    if (href.includes('category=')) {
      const linkCat = new URLSearchParams(href.split('?')[1]).get('category');
      return pathname === '/products' && currentCategory === linkCat;
    }
    if (href === '/products') return pathname === '/products' && !currentCategory;
    return pathname.startsWith(href);
  };

  /* ── Sub-panel for a menu item ─────────────────────────────────────────── */
  const openSubPanel = drawerMainLinks.find((l) => l.id === activePanel);

  return (
    <>
      {/* ── Announcement strip ─────────────────────────────────────────────── */}
      <div className="marquee-container" style={{ background: '#0c0c0c', color: 'rgba(255,255,255,.65)', padding: '8px 0', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
        <div className="marquee-content">
          {[...Array(4)].map((_, i) => (
            <span key={i} style={{ paddingRight: '40px', flexShrink: 0, whiteSpace: 'nowrap' }}>
              100% Authentic Luxury Fragrances &nbsp;·&nbsp; Free Shipping Above ₹999 &nbsp;·&nbsp; Razorpay Secured Payments
            </span>
          ))}
        </div>
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#ffffff',
        borderBottom: scrolled ? '1px solid #e8e8e8' : '1px solid #f0f0f0',
        boxShadow: scrolled ? '0 1px 16px rgba(0,0,0,.06)' : 'none',
        transition: 'box-shadow .2s, border-color .2s',
      }}>
        <nav style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }} className="md:!px-10">

          {/* Left: hamburger + logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              className="lg:hidden"
              style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0c0c0c', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '-8px' }}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} strokeWidth={1.8} />
            </button>

            <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 22, fontWeight: 500, color: '#0c0c0c', letterSpacing: '-0.02em' }}>
                Spray<em style={{ fontWeight: 300, fontStyle: 'italic' }}>kart</em>
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center justify-center flex-1" style={{ gap: 28 }}>
            {desktopNavLinks.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href} style={{
                  fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: active ? '#0c0c0c' : '#909090', textDecoration: 'none',
                  borderBottom: active ? '1px solid #0c0c0c' : '1px solid transparent',
                  paddingBottom: 2, transition: 'color .15s',
                }}>
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Link href="/products" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#909090', textDecoration: 'none', borderRadius: 2, transition: 'color .15s' }} aria-label="Search">
              <Search size={16} />
            </Link>

            <Link href="/wishlist" style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#909090', textDecoration: 'none', borderRadius: 2, transition: 'color .15s' }} aria-label="Wishlist">
              <Heart size={16} />
              {mounted && wishlistCount > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, background: '#e11d48', color: '#ffffff', fontSize: 8, fontWeight: 700, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            <Link href="/cart" style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#909090', textDecoration: 'none', borderRadius: 2, transition: 'color .15s' }} aria-label="Cart">
              <ShoppingCart size={16} />
              {mounted && itemCount > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, background: '#0c0c0c', color: '#ffffff', fontSize: 8, fontWeight: 700, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Desktop user */}
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
                  <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', borderTop: '1px solid #f0f0f0', marginTop: 4 }}><LogOut size={12} /> Sign out</button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="hidden lg:inline-flex items-center" style={{ marginLeft: 8, padding: '8px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#0c0c0c', color: '#ffffff', textDecoration: 'none', borderRadius: 2 }}>
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Mobile Drawer                                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {/* Overlay */}
      {drawerOpen && (
        <div
          style={{
            ...s.overlay,
            contain: 'layout style', // isolate overlay from page layout
          }}
          onClick={() => { setDrawerOpen(false); setActivePanel(null); }}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <div
        className="lg:hidden"
        style={{
          ...s.drawer,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.26s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',          // GPU layer — no layout reflow
          contain: 'layout style paint',    // isolate drawer repaint
        }}
        aria-modal="true"
        role="dialog"
        aria-label="Navigation menu"
      >
        {/* ── Drawer header ─────────────────────────────────────────────── */}
        <div style={s.drawerHead}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 20, fontWeight: 500, color: '#0c0c0c', letterSpacing: '-0.02em' }}>
              Spray<em style={{ fontWeight: 300, fontStyle: 'italic' }}>kart</em>
            </span>
          </Link>
          <button
            onClick={() => { setDrawerOpen(false); setActivePanel(null); }}
            style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#737373', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 2 }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Register / Sign In row ────────────────────────────────────── */}
        {mounted && !user && (
          <div style={s.authRow}>
            <Link href="/register" style={s.authBtn(false)}>Register</Link>
            <div style={s.authDivider} />
            <Link href="/login" style={s.authBtn(true)}>Sign In</Link>
          </div>
        )}
        {mounted && user && (
          <div style={{ ...s.authRow, flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <span style={{ fontSize: 10, color: '#909090', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Welcome back</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0c0c0c' }}>{user.name}</span>
          </div>
        )}

        {/* ── Main nav items ────────────────────────────────────────────── */}
        <nav style={{ flex: 1 }}>
          {drawerMainLinks.map((item) => {
            const active = item.href ? isActive(item.href) : false;
            const Icon = item.icon;
            if (item.children) {
              return (
                <button
                  key={item.id}
                  style={s.navItem(false)}
                  onClick={() => setActivePanel(item.id)}
                >
                  <span style={s.navItemIcon}>
                    <Icon size={15} strokeWidth={1.8} color="#909090" />
                    {item.label}
                  </span>
                  <ChevronRight size={14} color="#c0c0c0" />
                </button>
              );
            }
            return (
              <Link
                key={item.id}
                href={item.href}
                style={s.navItem(active)}
              >
                <span style={s.navItemIcon}>
                  <Icon size={15} strokeWidth={1.8} color={active ? '#0c0c0c' : '#909090'} />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ── Utility links at bottom ───────────────────────────────────── */}
        <div style={s.utilSection}>
          {mounted && user ? (
            <>
              <Link href="/orders" style={s.utilLink}><Package size={14} color="#909090" /> My Orders</Link>
              <Link href="/account" style={s.utilLink}><User size={14} color="#909090" /> Account</Link>
              {user.role === 'admin' && (
                <Link href="/admin" style={{ ...s.utilLink, fontWeight: 700, color: '#0c0c0c' }}><Shield size={14} color="#0c0c0c" /> Admin Panel</Link>
              )}
              <button onClick={logout} style={{ ...s.utilLink, color: '#dc2626' }}><LogOut size={14} color="#dc2626" /> Sign out</button>
            </>
          ) : (
            <></>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Sub-panel (slides in over main panel)                             */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {openSubPanel && (
          <div style={{
            ...s.subPanel,
            transform: activePanel ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.24s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {/* Sub-panel header */}
            <div style={s.subHead}>
              <button style={s.subBack} onClick={() => setActivePanel(null)}>
                <ChevronLeft size={14} />
                Back
              </button>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0c0c0c', textAlign: 'center', paddingRight: 40 }}>
                {openSubPanel.label}
              </span>
            </div>

            {/* Sub-panel links */}
            {openSubPanel.children?.map((child) => {
              const active = isActive(child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  style={s.subLink(active)}
                >
                  {child.label}
                  {active && <ChevronRight size={12} color="#0c0c0c" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>
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
