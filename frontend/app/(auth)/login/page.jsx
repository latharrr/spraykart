'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { login } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Spinner from '@/components/ui/Spinner';
import AuthShell, { safeRedirect } from '@/components/layout/AuthShell';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const next = safeRedirect(params.get('redirect'), null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await login(form);
      setUser(data.user);
      toast.success(`Welcome back, ${data.user?.name?.split(' ')[0] || 'there'}`);
      router.push(next || (data.user?.role === 'admin' ? '/admin' : '/'));
    } catch (err) {
      toast.error(err?.error || "That email and password don't match. Try again or reset your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Sign in" lede="For your orders, saved bottles and faster checkout.">
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
        <label className="h-field">
          <span>Email</span>
          <input id="login-email" type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
        </label>
        <label className="h-field">
          <span>Password</span>
          <input id="login-password" type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="current-password" />
        </label>
        <Link href="/forgot-password" className="h-textlink t-small" style={{ justifySelf: 'end' }}>Forgot password?</Link>
        <button type="submit" disabled={loading} className="h-btn h-btn--block">{loading ? <><Spinner size="sm" /> Signing in</> : 'Sign in'}</button>
      </form>
      <p className="t-small t-mute" style={{ borderTop: '1px solid var(--line)', paddingTop: 22 }}>
        New to Spraykart? <Link href={next ? `/register?redirect=${encodeURIComponent(next)}` : '/register'} className="h-textlink" style={{ color: 'var(--ink)' }}>Create an account</Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
