'use client';
import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Generic data-fetching hook with:
 * - AbortController to cancel in-flight requests on unmount / dep change
 * - Stale-while-revalidate pattern (keeps previous data visible during refetch)
 * - Normalised error strings (never objects → avoids React child #31)
 */
export function useFetch(fetchFn, deps = [], options = {}) {
  const { immediate = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    // Cancel any in-flight request from a previous call
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetchFn();
      if (controller.signal.aborted) return; // component unmounted — discard
      setData(res.data);
    } catch (err) {
      if (controller.signal.aborted) return;
      const msg =
        (typeof err === 'string' ? err : null) ||
        (typeof err?.error === 'string' ? err.error : null) ||
        (typeof err?.message === 'string' ? err.message : null) ||
        'Something went wrong';
      setError(msg);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) load();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [load, immediate]);

  return { data, loading, error, refetch: load };
}
