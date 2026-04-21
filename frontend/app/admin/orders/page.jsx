'use client';
import { useState, useCallback } from 'react';
import { adminGetOrders, adminUpdateOrder } from '@/lib/api';
import { useFetch } from '@/lib/hooks/useFetch';
import { OrderStatusBadge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp } from 'lucide-react';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(
    () => adminGetOrders({ status: statusFilter || undefined, page, limit: 20 }),
    [statusFilter, page]
  );
  const { data, loading, error, refetch } = useFetch(fetchOrders, [statusFilter, page]);

  const orders = data?.orders || [];
  const pages = data?.pages || 1;

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await adminUpdateOrder(orderId, { status: newStatus });
      toast.success(`Order updated to ${newStatus}`);
      refetch();
    } catch (err) {
      toast.error(err?.error || 'Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center gap-2">
          {['', ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`text-sm px-3 py-1.5 rounded-full border transition capitalize ${
                statusFilter === s ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card p-6 space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton rounded-lg" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : orders.length === 0 ? (
        <EmptyState icon="bag" title="No orders found" description={statusFilter ? `No ${statusFilter} orders` : 'No orders yet'} />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-th"></th>
                    <th className="table-th">Order ID</th>
                    <th className="table-th">Customer</th>
                    <th className="table-th">Date</th>
                    <th className="table-th">Total</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <>
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="table-td w-8">
                          <button
                            onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700"
                          >
                            {expandedId === order.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                        <td className="table-td font-mono text-xs text-gray-500">#{order.id.slice(0, 8).toUpperCase()}</td>
                        <td className="table-td">
                          <p className="font-medium text-sm text-gray-800">{order.customer_name}</p>
                          <p className="text-xs text-gray-400">{order.customer_email}</p>
                        </td>
                        <td className="table-td text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="table-td font-semibold">₹{parseFloat(order.final_price).toLocaleString('en-IN')}</td>
                        <td className="table-td"><OrderStatusBadge status={order.status} /></td>
                        <td className="table-td">
                          {updatingId === order.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <select
                              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-black/20"
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            >
                              {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                          )}
                        </td>
                      </tr>

                      {/* Expanded order items */}
                      {expandedId === order.id && (
                        <tr key={`${order.id}-detail`}>
                          <td colSpan={7} className="px-4 pb-4 bg-gray-50">
                            <div className="rounded-xl border border-gray-200 overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-white">
                                  <tr>
                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Item</th>
                                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500">Qty</th>
                                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Price</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {(order.items || []).filter(Boolean).map((item) => (
                                    <tr key={item.id}>
                                      <td className="px-4 py-2.5 text-gray-700">{item.name}</td>
                                      <td className="px-4 py-2.5 text-center text-gray-500">{item.quantity}</td>
                                      <td className="px-4 py-2.5 text-right font-medium">₹{parseFloat(item.price * item.quantity).toLocaleString('en-IN')}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-white border-t border-gray-100">
                                  <tr>
                                    <td colSpan={2} className="px-4 py-2.5 text-sm font-semibold text-gray-700">Total</td>
                                    <td className="px-4 py-2.5 text-right font-bold">₹{parseFloat(order.final_price).toLocaleString('en-IN')}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                            {order.shipping_address && (
                              <p className="text-xs text-gray-500 mt-2 px-1">
                                📍 {order.shipping_address.line1}, {order.shipping_address.city}, {order.shipping_address.state} — {order.shipping_address.pincode}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex gap-2 mt-6 justify-center">
              {[...Array(pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition ${page === i + 1 ? 'bg-black text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
