'use client';
import { useEffect, useState } from 'react';
import { adminGetAnalytics } from '@/lib/api';
import { ShoppingBag, Users, TrendingUp, Package, ArrowUpRight, Clock } from 'lucide-react';
import { OrderStatusBadge } from '@/components/ui/Badge';
import ErrorState from '@/components/ui/ErrorState';
import Link from 'next/link';

function StatCard({ label, value, sub, icon: Icon, color, href }) {
  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-black mt-4 transition">
          View all <ArrowUpRight size={12} />
        </Link>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminGetAnalytics()
      .then((res) => setData(res.data))
      .catch((err) => setError(err?.error || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 skeleton rounded w-1/2 mb-3" />
              <div className="h-8 skeleton rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;

  const stats = [
    {
      label: 'Total Revenue',
      value: `₹${parseFloat(data.revenue.total).toLocaleString('en-IN')}`,
      sub: `₹${parseFloat(data.revenue.last_7d).toLocaleString('en-IN')} last 7 days`,
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600',
      href: '/admin/orders',
    },
    {
      label: 'Total Orders',
      value: data.orders.total,
      sub: `${data.orders.pending} pending`,
      icon: ShoppingBag,
      color: 'bg-blue-100 text-blue-600',
      href: '/admin/orders',
    },
    {
      label: 'Customers',
      value: data.users.total,
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
      href: '/admin/users',
    },
    {
      label: '30d Revenue',
      value: `₹${parseFloat(data.revenue.last_30d).toLocaleString('en-IN')}`,
      icon: Package,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  const statusColors = {
    pending: 'bg-yellow-400',
    confirmed: 'bg-blue-400',
    shipped: 'bg-indigo-400',
    delivered: 'bg-green-400',
    cancelled: 'bg-red-400',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-400">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order status breakdown */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Order Status</h2>
          <div className="space-y-3">
            {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => {
              const count = parseInt(data.orders[s] || 0);
              const total = parseInt(data.orders.total) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={s}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm capitalize text-gray-600">{s}</span>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${statusColors[s]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Top Products (30d)</h2>
          {data.top_products.length === 0 ? (
            <p className="text-sm text-gray-400">No sales data yet</p>
          ) : (
            <div className="space-y-4">
              {data.top_products.map((p, i) => (
                <div key={p.slug} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-gray-100 text-xs font-bold text-gray-500 flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.units_sold} units</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 shrink-0">
                    ₹{parseFloat(p.revenue).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-gray-500 hover:text-black transition">View all →</Link>
          </div>
          <div className="space-y-3">
            {data.recent_orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{order.customer}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <Clock size={10} />
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">₹{parseFloat(order.final_price).toLocaleString('en-IN')}</p>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
