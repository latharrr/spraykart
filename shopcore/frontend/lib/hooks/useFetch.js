'use client';
import { useState, useCallback, useEffect } from 'react';

/**
 * Generic data-fetching hook with loading, error, and refetch support.
 *
 * @param {() => Promise<any>} fetchFn  - Async function that returns the axios response
 * @param {any[]} deps                  - Dependencies array (like useEffect)
 * @param {object} options
 * @param {boolean} options.immediate   - If false, don't fetch on mount (manual trigger only)
 */
export function useFetch(fetchFn, deps = [], options = {}) {
  const { immediate = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      setData(res.data);
    } catch (err) {
      const msg =
        (typeof err === 'string' ? err : null) ||
        (typeof err?.error === 'string' ? err.error : null) ||
        (typeof err?.message === 'string' ? err.message : null) ||
        'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) load();
  }, [load, immediate]);

  return { data, loading, error, refetch: load };
}
