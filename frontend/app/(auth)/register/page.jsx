'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (!/[A-Z]/.test(form.password)) return toast.error('Password must contain at least one uppercase letter');
    if (!/[0-9]/.test(form.password)) return toast.error('Password must contain at least one number');
    if (!/[^A-Za-z0-9]/.test(form.password)) return toast.error('Password must contain at least one special character');
    if (form.phone && !/^\d{10}$/.test(form.phone)) return toast.error('Phone number must be 10 digits');
    setLoading(true);
    try {
      const { data } = await register(form);
      setUser(data.user);
      toast.success('Welcome to Spraykart!');
      router.push('/');
    } catch (err) {
      toast.error(err?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#fafaf8' }}>
      {/* Left panel */}
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
          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 24 }}>Join Spraykart</p>
          <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 48, fontWeight: 300, color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Discover authentic<br />luxury fragrances<br />at your fingertips.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
            {['Free shipping on orders above ₹999', 'GST invoice with every order', '100% authenticity guaranteed'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
                <span style={{ width: 16, height: 1, background: 'rgba(255,255,255,.2)', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.15)', letterSpacing: '0.1em' }}>© {new Date().getFullYear()} Spraykart</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 lg:flex-none lg:w-[480px] flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[380px]">
          <Link href="/" className="lg:hidden" style={{ display: 'inline-block', marginBottom: 32, textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 24, fontWeight: 500, color: '#0c0c0c' }}>
              Spray<em style={{ fontStyle: 'italic', fontWeight: 300 }}>kart</em>
            </span>
          </Link>

          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 12 }}>New account</p>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 36, fontWeight: 400, color: '#0c0c0c', marginBottom: 36, letterSpacing: '-0.01em' }}>
            Create your account
          </h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { id: 'reg-name',     label: 'Full name',               type: 'text',     placeholder: 'Jane Doe',            key: 'name',     autoComplete: 'name',         required: true  },
              { id: 'reg-email',    label: 'Email address',            type: 'email',    placeholder: 'you@example.com',     key: 'email',    autoComplete: 'email',        required: true  },
              { id: 'reg-phone',    label: 'Mobile number (optional)', type: 'tel',      placeholder: '10-digit mobile no.', key: 'phone',    autoComplete: 'tel',          required: false, inputMode: 'numeric', maxLength: 10 },
              { id: 'reg-password', label: 'Password',                 type: 'password', placeholder: 'At least 8 chars',   key: 'password', autoComplete: 'new-password', required: true  },
            ].map(({ id, label, type, placeholder, key, autoComplete, required, inputMode, maxLength }) => (
              <div key={key}>
                <label htmlFor={id} style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#737373', marginBottom: 8 }}>
                  {label}
                </label>
                <input
                  id={id}
                  type={type}
                  placeholder={placeholder}
                  className="input"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required={required}
                  minLength={key === 'password' ? 8 : undefined}
                  maxLength={maxLength}
                  autoComplete={autoComplete}
                  inputMode={inputMode}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', marginTop: 4, fontSize: 11, letterSpacing: '0.1em' }}
            >
              {loading ? <><Spinner size="sm" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid #eeeeee' }}>
            <p style={{ fontSize: 13, color: '#737373', textAlign: 'center' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#0c0c0c', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Sign in
              </Link>
            </p>
          </div>

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
