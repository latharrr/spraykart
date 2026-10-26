'use client';
import { useState } from 'react';

export default function FooterNewsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done | error

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setState('sending');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };

  if (state === 'done') {
    return <p className="t-small" style={{ marginTop: 22, color: 'var(--on-ink-2)' }}>Thank you. New arrivals will reach {email}.</p>;
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 28 }}>
      <label htmlFor="ft-email" className="t-small" style={{ color: 'var(--on-ink-2)' }}>New arrivals and restocks, once a month.</label>
      <div className="h-foot__news">
        <input id="ft-email" type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending' : 'Subscribe'}</button>
      </div>
      {state === 'error' && <p className="t-small" role="alert" style={{ marginTop: 8, color: 'var(--bone)' }}>That didn&apos;t go through. Check the address and try again.</p>}
    </form>
  );
}
