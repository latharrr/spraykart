'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

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
      toast.success('OTP sent! Check your email.');
      setStep('otp');
    } catch (err) {
      toast.error(err?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, password });
      toast.success('Password reset! Please log in.');
      router.push('/login');
    } catch (err) {
      toast.error(err?.error || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const panelStyle = {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#fafaf8', padding: '40px 20px',
  };
  const cardStyle = {
    width: '100%', maxWidth: 400,
    background: '#fff', border: '1px solid #e8e8e8', padding: '40px',
  };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 500,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#737373', marginBottom: 8,
  };

  return (
    <div style={panelStyle}>
      <div style={cardStyle}>
        <Link href="/" style={{ textDecoration: 'none', display: 'block', marginBottom: 32 }}>
          <span style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 22, fontWeight: 500, color: '#0c0c0c' }}>
            Spray<em style={{ fontStyle: 'italic', fontWeight: 300 }}>kart</em>
          </span>
        </Link>

        <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 8 }}>
          {step === 'email' ? 'Account Recovery' : 'Set New Password'}
        </p>
        <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 28, fontWeight: 400, color: '#0c0c0c', marginBottom: 28, letterSpacing: '-0.01em' }}>
          {step === 'email' ? 'Forgot your password?' : 'Reset password'}
        </h1>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label htmlFor="forgot-email" style={labelStyle}>Email address</label>
              <input
                id="forgot-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '13px', fontSize: 11, letterSpacing: '0.1em', marginTop: 4 }}>
              {loading ? <><Spinner size="sm" /> Sending...</> : 'Send OTP'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 13, color: '#737373' }}>
              Remember it?{' '}
              <Link href="/login" style={{ color: '#0c0c0c', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Sign in
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#f7f7f5', border: '1px solid #e8e8e8', padding: '12px 16px', fontSize: 13, color: '#737373' }}>
              OTP sent to <strong style={{ color: '#0c0c0c' }}>{email}</strong>
            </div>
            <div>
              <label htmlFor="reset-otp" style={labelStyle}>6-digit OTP</label>
              <input
                id="reset-otp"
                type="text"
                className="input"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                inputMode="numeric"
                required
              />
            </div>
            <div>
              <label htmlFor="reset-password" style={labelStyle}>New password</label>
              <input
                id="reset-password"
                type="password"
                className="input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="reset-confirm" style={labelStyle}>Confirm password</label>
              <input
                id="reset-confirm"
                type="password"
                className="input"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '13px', fontSize: 11, letterSpacing: '0.1em', marginTop: 4 }}>
              {loading ? <><Spinner size="sm" /> Resetting...</> : 'Reset Password'}
            </button>
            <button type="button" onClick={() => setStep('email')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#737373', textDecoration: 'underline' }}>
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
