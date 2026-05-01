'use client';

import { useCallback, useState } from 'react';
import { adminGetAudit } from '@/lib/api';
import { useFetch } from '@/lib/hooks/useFetch';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminAuditPage() {
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const fetchAudit = useCallback(
    () => adminGetAudit({ action: action || undefined, target_type: targetType || undefined, limit: 50 }),
    [action, targetType]
  );
  const { data, loading, error, refetch } = useFetch(fetchAudit, [action, targetType]);
  const events = data?.events || [];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a1a1a]">Admin Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">Security-sensitive admin actions with before/after snapshots.</p>
        </div>
        <div className="flex gap-2">
          <input className="input text-sm" placeholder="Filter action" value={action} onChange={(e) => setAction(e.target.value)} />
          <select className="input text-sm" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
            <option value="">All targets</option>
            {['order', 'refund', 'product', 'user', 'coupon'].map((target) => <option key={target} value={target}>{target}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">{[...Array(8)].map((_, i) => <div key={i} className="h-10 skeleton rounded" />)}</div>
        ) : error ? (
          <div className="p-8"><ErrorState message={error} onRetry={refetch} /></div>
        ) : events.length === 0 ? (
          <div className="p-8"><EmptyState icon="file" title="No audit events found" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Time', 'Admin', 'Action', 'Target', 'IP', 'Before', 'After'].map((head) => (
                    <th key={head} className="px-4 py-3 text-left font-semibold text-gray-600">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {events.map((event) => (
                  <tr key={event.id} className="align-top">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(event.created_at).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">{event.admin_email || event.admin_id || 'unknown'}</td>
                    <td className="px-4 py-3 font-medium">{event.action}</td>
                    <td className="px-4 py-3 font-mono text-xs">{event.target_type}<br />{event.target_id}</td>
                    <td className="px-4 py-3">{event.ip || '-'}</td>
                    <td className="px-4 py-3"><pre className="max-w-[240px] whitespace-pre-wrap text-xs">{JSON.stringify(event.before, null, 2)}</pre></td>
                    <td className="px-4 py-3"><pre className="max-w-[240px] whitespace-pre-wrap text-xs">{JSON.stringify(event.after, null, 2)}</pre></td>
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
