'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await login(form);
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      router.push(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#fafaf8' }}>
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex"
        style={{
          flex: 1,
          background: '#0c0c0c',
          padding: '80px 64px',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 26, fontWeight: 500, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Spray<em style={{ fontStyle: 'italic', fontWeight: 300 }}>kart</em>
          </span>
        </Link>

        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 24 }}>Est. 2024 · India</p>
          <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 48, fontWeight: 300, color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>
            India&apos;s most<br />trusted luxury<br />fragrance store.
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.8 }}>
            100% authentic perfumes, attars &amp; niche fragrances.<br />
            MCA registered · GST invoiced · Pan-India delivery.
          </p>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.15)', letterSpacing: '0.1em' }}>
          © {new Date().getFullYear()} Spraykart
        </p>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: '0 0 480px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden" style={{ display: 'inline-block', marginBottom: 32, textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 24, fontWeight: 500, color: '#0c0c0c' }}>
              Spray<em style={{ fontStyle: 'italic', fontWeight: 300 }}>kart</em>
            </span>
          </Link>

          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 12 }}>Welcome back</p>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 36, fontWeight: 400, color: '#0c0c0c', marginBottom: 36, letterSpacing: '-0.01em' }}>
            Sign in to your account
          </h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#737373', marginBottom: 8 }}>
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="login-password" style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#737373', marginBottom: 8 }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', marginTop: 4, fontSize: 11, letterSpacing: '0.1em' }}
            >
              {loading ? <><Spinner size="sm" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid #eeeeee' }}>
            <p style={{ fontSize: 13, color: '#737373', textAlign: 'center' }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" style={{ color: '#0c0c0c', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Create account
              </Link>
            </p>
          </div>

          {/* Trust signals */}
          <div style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'center' }}>
            {['MCA Registered', 'GST Invoiced', '100% Authentic'].map(s => (
              <span key={s} style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c0c0c0' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
