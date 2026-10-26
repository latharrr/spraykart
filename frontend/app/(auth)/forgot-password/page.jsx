'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import AuthShell from '@/components/layout/AuthShell';
import { useAuthStore } from '@/lib/store';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Code sent. Check your email.');
      setStep('otp');
    } catch (err) {
      toast.error(err?.error || "We couldn't send the code. Check the email and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("The two passwords don't match");
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) return toast.error('Password must contain at least one uppercase letter');
    if (!/[0-9]/.test(password)) return toast.error('Password must contain at least one number');
    if (!/[^A-Za-z0-9]/.test(password)) return toast.error('Password must contain at least one special character');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, password });
      useAuthStore.getState().setUser(null);
      toast.success('Password changed. Sign in with the new one.');
      router.push('/login');
    } catch (err) {
      toast.error(err?.error || 'That code is wrong or has expired. Request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === 'email' ? 'Reset password' : 'Enter the code'}
      lede={step === 'email' ? "We'll email you a 6-digit code to set a new password." : <>We sent a code to <b style={{ color: 'var(--ink)', fontWeight: 500 }}>{email}</b>.</>}
    >
      {step === 'email' ? (
        <form onSubmit={handleSendOtp} style={{ display: 'grid', gap: 18 }}>
          <label className="h-field">
            <span>Email</span>
            <input id="forgot-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <button type="submit" disabled={loading} className="h-btn h-btn--block">{loading ? <><Spinner size="sm" /> Sending</> : 'Send code'}</button>
        </form>
      ) : (
        <form onSubmit={handleReset} style={{ display: 'grid', gap: 18 }}>
          <label className="h-field">
            <span>6-digit code</span>
            <input id="reset-otp" className="input tabular" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} inputMode="numeric" maxLength={6} required autoComplete="one-time-code" />
          </label>
          <label className="h-field">
            <span>New password</span>
            <input id="reset-password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" aria-describedby="reset-hint" />
            <small id="reset-hint" className="t-small t-mute-3">8 or more characters, with a capital letter, a number and a symbol.</small>
          </label>
          <label className="h-field">
            <span>Confirm new password</span>
            <input id="reset-confirm" type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
          </label>
          <button type="submit" disabled={loading} className="h-btn h-btn--block">{loading ? <><Spinner size="sm" /> Saving</> : 'Set new password'}</button>
          <button type="button" className="h-link" style={{ justifySelf: 'start' }} onClick={() => setStep('email')}>Use a different email</button>
        </form>
      )}
      <p className="t-small t-mute" style={{ borderTop: '1px solid var(--line)', paddingTop: 22 }}>
        Remembered it? <Link href="/login" className="h-textlink" style={{ color: 'var(--ink)' }}>Sign in</Link>
      </p>
    </AuthShell>
  );
}
