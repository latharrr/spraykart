'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'sk_exit_popup_seen';

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState(null);
  const [error, setError] = useState('');

  const dismiss = useCallback(() => {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  }, []);

  useEffect(() => {
    try { if (localStorage.getItem(STORAGE_KEY)) return; } catch {}

    let triggered = false;
    const handler = (e) => {
      if (triggered) return;
      if (e.clientY <= 10) {
        triggered = true;
        setVisible(true);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handler);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handler);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'exit_intent' }),
      });
      const data = await res.json();
      if (res.ok) {
        setCode(data.code);
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div style={{ background: '#ffffff', maxWidth: 480, width: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* Close */}
        <button onClick={dismiss} aria-label="Close" style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#a0a0a0', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}>
          <X size={16} />
        </button>

        {/* Top dark band */}
        <div style={{ background: '#0c0c0c', padding: '32px 36px 28px' }}>
          <p style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
            Wait — before you go
          </p>
          <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 36, fontWeight: 300, color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            ₹300 off your<br /><em style={{ fontStyle: 'italic' }}>first order</em>
          </h2>
        </div>

        {/* Bottom form */}
        <div style={{ padding: '28px 36px 32px' }}>
          {!code ? (
            <>
              <p style={{ fontSize: 13, color: '#737373', marginBottom: 20, lineHeight: 1.6 }}>
                Enter your email and we&apos;ll send your exclusive discount code instantly.
              </p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '13px 16px', border: '1px solid #e8e8e8', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.target.style.borderColor = '#0c0c0c'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8e8e8'; }}
                />
                {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
                <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 24px', background: '#0c0c0c', color: '#ffffff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Sending…' : <>Claim ₹300 Off <ArrowRight size={13} /></>}
                </button>
              </form>
              <p style={{ fontSize: 10, color: '#c0c0c0', marginTop: 12, textAlign: 'center' }}>
                No spam. Unsubscribe anytime. Valid on first order above ₹999.
              </p>
            </>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <p style={{ fontSize: 13, color: '#737373', marginBottom: 20 }}>Your exclusive code:</p>
              <div style={{ background: '#f9f9f7', border: '1px dashed #c8c8c8', padding: '18px 24px', marginBottom: 20, display: 'inline-block', minWidth: 200 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, letterSpacing: '0.12em', color: '#0c0c0c' }}>{code}</span>
              </div>
              <p style={{ fontSize: 12, color: '#737373', marginBottom: 20 }}>Applied at checkout. Valid on first order above ₹999.</p>
              <button onClick={dismiss} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: '#0c0c0c', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Shop Now <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
