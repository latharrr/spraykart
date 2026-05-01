'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  const [eventId, setEventId] = useState('');

  useEffect(() => {
    if (error) {
      import('@sentry/nextjs')
        .then((Sentry) => setEventId(Sentry.captureException(error)))
        .catch(() => setEventId(error.digest || ''));
    }
  }, [error]);

  const displayId = eventId || error?.digest;

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#faf9f7', color: '#0c0c0c', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <section style={{ maxWidth: 720, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 999, background: '#0c0c0c', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={24} />
            </div>
            <p style={{ margin: '32px 0 12px', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#737373' }}>Application Error</p>
            <h1 style={{ margin: 0, fontFamily: 'Cormorant, Georgia, serif', fontSize: 'clamp(42px, 8vw, 72px)', fontWeight: 500, lineHeight: 1 }}>
              Spraykart needs a reload.
            </h1>
            <p style={{ margin: '22px auto 0', maxWidth: 520, color: '#737373', lineHeight: 1.7 }}>
              A layout-level error interrupted the page. Retry once; support can use the event ID if it repeats.
            </p>
            {displayId && (
              <p style={{ display: 'inline-flex', marginTop: 22, maxWidth: '100%', padding: '8px 12px', background: '#fff', border: '1px solid #e8e8e8', fontFamily: 'monospace', fontSize: 12, overflowWrap: 'anywhere' }}>
                Sentry event: {displayId}
              </p>
            )}
            <div style={{ marginTop: 32 }}>
              <button
                type="button"
                onClick={reset}
                style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 28px', border: 0, background: '#0c0c0c', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11, cursor: 'pointer' }}
              >
                <RotateCcw size={14} /> Retry
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
