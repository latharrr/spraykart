'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { register } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Spinner from '@/components/ui/Spinner';
import AuthShell, { safeRedirect } from '@/components/layout/AuthShell';

const FIELDS = [
  { id: 'reg-name', label: 'Full name', type: 'text', key: 'name', autoComplete: 'name', required: true },
  { id: 'reg-email', label: 'Email', type: 'email', key: 'email', autoComplete: 'email', required: true },
  { id: 'reg-phone', label: 'Mobile (optional)', type: 'tel', key: 'phone', autoComplete: 'tel', inputMode: 'numeric', maxLength: 10 },
  { id: 'reg-password', label: 'Password', type: 'password', key: 'password', autoComplete: 'new-password', required: true, hint: '8 or more characters, with a capital letter, a number and a symbol.' },
];

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const next = safeRedirect(params.get('redirect'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Use at least 8 characters for the password');
    if (!/[A-Z]/.test(form.password)) return toast.error('Add a capital letter to the password');
    if (!/[0-9]/.test(form.password)) return toast.error('Add a number to the password');
    if (!/[^A-Za-z0-9]/.test(form.password)) return toast.error('Add a symbol, like ! or #, to the password');
    if (form.phone && !/^\d{10}$/.test(form.phone)) return toast.error('Mobile number should be 10 digits');
    setLoading(true);
    try {
      const { data } = await register(form);
      setUser(data.user);
      toast.success('Welcome to Spraykart');
      router.push(next);
    } catch (err) {
      toast.error(err?.error || "We couldn't create the account. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create an account" lede="Track orders, keep a list of saved bottles and check out faster.">
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
        {FIELDS.map(({ id, label, key, hint, ...rest }) => (
          <label key={id} className="h-field">
            <span>{label}</span>
            <input id={id} className="input" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} aria-describedby={hint ? `${id}-hint` : undefined} {...rest} />
            {hint && <small id={`${id}-hint`} className="t-small t-mute-3">{hint}</small>}
          </label>
        ))}
        <button type="submit" disabled={loading} className="h-btn h-btn--block">{loading ? <><Spinner size="sm" /> Creating account</> : 'Create account'}</button>
      </form>
      <p className="t-small t-mute" style={{ borderTop: '1px solid var(--line)', paddingTop: 22 }}>
        Already have an account? <Link href={next !== '/' ? `/login?redirect=${encodeURIComponent(next)}` : '/login'} className="h-textlink" style={{ color: 'var(--ink)' }}>Sign in</Link>
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={null}><RegisterForm /></Suspense>;
}
