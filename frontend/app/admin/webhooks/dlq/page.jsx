'use client';

import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { adminGetWebhookDlq, adminRetryWebhook } from '@/lib/api';
import { useFetch } from '@/lib/hooks/useFetch';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';

export default function WebhookDlqPage() {
  const [provider, setProvider] = useState('');
  const [retrying, setRetrying] = useState(null);
  const fetchDlq = useCallback(
    () => adminGetWebhookDlq({ provider: provider || undefined, limit: 50 }),
    [provider]
  );
  const { data, loading, error, refetch } = useFetch(fetchDlq, [provider]);
  const events = data?.events || [];

  const retry = async (event) => {
    setRetrying(event.id);
    try {
      await adminRetryWebhook(event.id);
      toast.success('Webhook retried');
      refetch();
    } catch (err) {
      toast.error(err?.error || 'Retry failed');
    } finally {
      setRetrying(null);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a1a1a]">Webhook DLQ</h1>
          <p className="text-sm text-gray-500 mt-1">Failed payment webhooks requiring investigation or retry.</p>
        </div>
        <select className="input text-sm max-w-[180px]" value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="">All providers</option>
          <option value="razorpay">Razorpay</option>
          <option value="paytm">Paytm</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">{[...Array(6)].map((_, i) => <div key={i} className="h-12 skeleton rounded" />)}</div>
        ) : error ? (
          <div className="p-8"><ErrorState message={error} onRetry={refetch} /></div>
        ) : events.length === 0 ? (
          <div className="p-8"><EmptyState icon="alert" title="No failed webhooks" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Time', 'Provider', 'Event', 'Retries', 'Last Error', 'Action'].map((head) => (
                    <th key={head} className="px-4 py-3 text-left font-semibold text-gray-600">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {events.map((event) => (
                  <tr key={event.id} className="align-top">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(event.processed_at || event.created_at).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-medium capitalize">{event.provider}</td>
                    <td className="px-4 py-3">
                      <div>{event.event_type || '-'}</div>
                      <div className="font-mono text-xs text-gray-500 max-w-[220px] truncate">{event.event_id}</div>
                    </td>
                    <td className="px-4 py-3">{event.retry_count}</td>
                    <td className="px-4 py-3 max-w-[420px]">
                      <div className="inline-flex items-start gap-2 text-red-700">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <span className="break-words">{event.last_error || 'Unknown error'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => retry(event)}
                        disabled={retrying === event.id}
                        className="btn-secondary text-xs py-2 inline-flex items-center gap-2 min-h-[36px]"
                      >
                        <RefreshCw size={14} className={retrying === event.id ? 'animate-spin' : ''} />
                        Retry
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
