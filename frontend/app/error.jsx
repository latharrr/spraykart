'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({ error, reset }) {
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
    <div className="min-h-[72vh] bg-[#faf9f7] flex items-center">
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-[#0c0c0c] text-white flex items-center justify-center">
          <AlertTriangle size={24} />
        </div>
        <p className="section-label mt-8">500</p>
        <h1 className="serif text-5xl md:text-6xl font-medium leading-none text-[#0c0c0c]">
          Something slipped.
        </h1>
        <p className="mt-5 text-sm md:text-base text-[#737373]">
          We could not complete this request. Retry once; if it persists, support can trace it from the event ID below.
        </p>

        {displayId && (
          <p className="mt-5 inline-flex max-w-full px-3 py-2 bg-white border border-[#e8e8e8] text-xs font-mono text-[#3d3d3d] break-all">
            Sentry event: {displayId}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <button type="button" onClick={reset} className="btn-primary min-h-[44px]">
            <RotateCcw size={14} /> Retry
          </button>
          <Link href="/products" className="btn-secondary min-h-[44px]">Browse Products</Link>
        </div>
      </div>
    </div>
  );
}
