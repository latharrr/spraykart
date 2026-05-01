'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Clock, IndianRupee, RefreshCw, ShoppingBag, TrendingUp } from 'lucide-react';
import { adminGetMetrics } from '@/lib/api';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN');
}

function StatCard({ label, value, sub, icon: Icon, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone] || tones.gray}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function PeriodBlock({ title, data }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Orders" value={formatNumber(data?.orders_count)} icon={ShoppingBag} tone="blue" />
        <StatCard label="Revenue" value={formatCurrency(data?.revenue)} icon={IndianRupee} tone="green" />
        <StatCard label="AOV" value={formatCurrency(data?.aov)} icon={TrendingUp} tone="amber" />
        <StatCard
          label="Conversion"
          value={data?.conversion_rate == null ? 'Not tracked' : `${(data.conversion_rate * 100).toFixed(2)}%`}
          sub="Session tracking is not enabled"
          icon={Activity}
        />
      </div>
    </div>
  );
}

export default function AdminMetricsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await adminGetMetrics();
      setData(res.data);
    } catch (err) {
      setError(err?.error || 'Failed to load metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(() => load({ silent: true }), 60000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-40 skeleton rounded" />
          <div className="h-10 w-28 skeleton rounded" />
        </div>
        <div className="space-y-8">
          {[0, 1].map((section) => (
            <div key={section}>
              <div className="h-5 w-32 skeleton rounded mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((card) => (
                  <div key={card} className="card p-5">
                    <div className="h-3 w-24 skeleton rounded mb-3" />
                    <div className="h-8 w-28 skeleton rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Business Metrics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Refreshes every 60 seconds
            {data?.refreshed_at ? ` | ${new Date(data.refreshed_at).toLocaleTimeString('en-IN')}` : ''}
          </p>
        </div>
        <button
          onClick={() => load({ silent: true })}
          disabled={refreshing}
          className="btn-secondary min-h-[44px] gap-2"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="space-y-8">
        <PeriodBlock title="Today" data={data.today} />
        <PeriodBlock title="7-Day Rolling" data={data.rolling_7d} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <StatCard
            label="Failed Payments Today"
            value={formatNumber(data.failed_payments?.today)}
            sub={`${formatNumber(data.failed_payments?.rolling_7d)} in last 7 days`}
            icon={AlertTriangle}
            tone={data.failed_payments?.today > 0 ? 'red' : 'gray'}
          />
          <StatCard
            label="Webhook DLQ"
            value={formatNumber(data.webhook_dlq_count)}
            sub="Failed webhook events awaiting retry"
            icon={AlertTriangle}
            tone={data.webhook_dlq_count > 0 ? 'red' : 'gray'}
          />
          <StatCard
            label="Abandoned Pending"
            value={formatNumber(data.top_abandoned?.length)}
            sub="Online pending orders older than 30 minutes"
            icon={Clock}
            tone={data.top_abandoned?.length > 0 ? 'amber' : 'gray'}
          />
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Top Abandoned Orders</h2>
            <span className="text-xs text-gray-400">Pending online &gt; 30 min</span>
          </div>

          {data.top_abandoned?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b">
                    <th className="py-3 pr-4">Order</th>
                    <th className="py-3 pr-4">Customer</th>
                    <th className="py-3 pr-4">Gateway</th>
                    <th className="py-3 pr-4">Age</th>
                    <th className="py-3 pr-4 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_abandoned.map((order) => (
                    <tr key={order.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-mono text-xs text-gray-700">{order.id.slice(0, 8)}</td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900">{order.customer_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{order.customer_email || 'No email'}</p>
                      </td>
                      <td className="py-3 pr-4 capitalize text-gray-600">{order.payment_gateway || 'online'}</td>
                      <td className="py-3 pr-4 text-gray-600">{formatNumber(order.age_minutes)} min</td>
                      <td className="py-3 pr-4 text-right font-semibold">{formatCurrency(order.final_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="package"
              title="No abandoned pending orders"
              description="No online orders are stuck in pending for more than 30 minutes."
            />
          )}
        </div>
      </div>
    </div>
  );
}
