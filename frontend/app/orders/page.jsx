'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { getMyOrders } from '@/lib/api';
import { useFetch } from '@/lib/hooks/useFetch';
import { OrderStatusBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import Link from 'next/link';

export default function OrdersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: orders, loading, error, refetch } = useFetch(getMyOrders);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !user) router.push('/login');
  }, [user, router, mounted]);

  if (!mounted || !user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">My Orders</h1>

      {loading ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <tbody>{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</tbody>
          </table>
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !orders?.length ? (
        <EmptyState
          icon="bag"
          title="No orders yet"
          description="You haven't placed any orders. Start shopping!"
          actionLabel="Shop now"
          actionHref="/products"
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <table className="w-full hidden md:table">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-th">Order ID</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Items</th>
                  <th className="table-th">Total</th>
                  <th className="table-th">Status</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="table-td font-mono text-xs text-gray-500">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="table-td text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="table-td">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 && 's'}</td>
                    <td className="table-td font-semibold">
                      ₹{parseFloat(order.final_price).toLocaleString('en-IN')}
                    </td>
                    <td className="table-td">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="table-td">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-sm font-medium text-black hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {orders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="block p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-gray-500">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">₹{parseFloat(order.final_price).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{order.items?.length || 0} item{(order.items?.length || 0) !== 1 && 's'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">View →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
