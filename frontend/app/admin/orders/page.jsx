'use client';
import { useState, useCallback, Fragment } from 'react';
import { adminGetOrders, adminUpdateOrder, adminRefundOrder } from '@/lib/api';
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

  const handleRefund = async (orderId) => {
    setUpdatingId(orderId);
    try {
      await adminRefundOrder(orderId);
      toast.success('Refund processed successfully');
      refetch();
    } catch (err) {
      toast.error(err?.error || 'Failed to process refund');
    } finally {
      setUpdatingId(null);
    }
  };

  const getPaymentStatus = (order) => {
    if (order.status === 'cancelled') return { label: 'Refunded', color: 'gray' };
    if (order.payment_method === 'razorpay') return { label: 'Paid', color: 'gray' };
    if (order.status === 'delivered') return { label: 'Paid', color: 'gray' };
    return { label: 'Payment pending', color: 'orange' };
  };

  const getFulfillmentStatus = (status) => {
    if (status === 'delivered') return { label: 'Fulfilled', color: 'gray' };
    if (status === 'shipped') return { label: 'Shipped', color: 'gray' };
    if (status === 'cancelled') return { label: 'Cancelled', color: 'gray' };
    return { label: 'Unfulfilled', color: 'yellow' };
  };

  const StatusBadge = ({ label, color }) => {
    const colorStyles = {
      gray: 'bg-[#f3f4f6] text-[#4b5563]',
      grayDot: 'bg-[#6b7280]',
      orange: 'bg-[#ffedd5] text-[#9a3412]',
      orangeDot: 'bg-[#ea580c]',
      yellow: 'bg-[#fef08a] text-[#854d0e]',
      yellowDot: 'bg-[#eab308]',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[13px] font-medium rounded-md whitespace-nowrap ${colorStyles[color]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${colorStyles[`${color}Dot`]}`} />
        {label}
      </span>
    );
  };

  const getFulfillBy = (createdAt) => {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 2); // Assume 2 days to fulfill
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (now > date) {
      return <span className="text-[#dc2626] font-medium">{diffDays} days ago</span>;
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">Orders</h1>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        {/* Filters bar */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-[#e5e7eb] bg-white">
          <div className="flex items-center gap-4 border-r border-[#e5e7eb] pr-4">
            <button className="text-[14px] font-medium text-[#1a1a1a] flex items-center gap-1">All <ChevronDown size={14} /></button>
          </div>
          <div className="flex-1 flex items-center gap-2 text-[#6b7280]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Search and filter" className="bg-transparent border-none focus:outline-none text-[14px] w-full text-[#1a1a1a]" />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[...Array(8)].map((_, i) => <div key={i} className="h-10 skeleton rounded" />)}
          </div>
        ) : error ? (
          <div className="p-8"><ErrorState message={error} onRetry={refetch} /></div>
        ) : orders.length === 0 ? (
          <div className="p-8"><EmptyState icon="bag" title="No orders found" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-[14px]">
              <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-[#4b5563] w-10">
                    <input type="checkbox" className="rounded border-gray-300 text-black focus:ring-black" />
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-[#4b5563]">Order</th>
                  <th className="px-4 py-2.5 text-left font-medium text-[#4b5563]">Date ↓</th>
                  <th className="px-4 py-2.5 text-left font-medium text-[#4b5563]">Customer</th>
                  <th className="px-4 py-2.5 text-left font-medium text-[#4b5563]">Fulfill by</th>
                  <th className="px-4 py-2.5 text-left font-medium text-[#4b5563]">Channel</th>
                  <th className="px-4 py-2.5 text-right font-medium text-[#4b5563]">Total</th>
                  <th className="px-4 py-2.5 text-left font-medium text-[#4b5563]">Payment status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-[#4b5563]">Fulfillment status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-[#4b5563]">Items</th>
                  <th className="px-4 py-2.5 text-left font-medium text-[#4b5563]">Delivery method</th>
                  <th className="px-4 py-2.5 text-left font-medium text-[#4b5563]">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {orders.map((order) => {
                  const payment = getPaymentStatus(order);
                  const fulfillment = getFulfillmentStatus(order.status);
                  const itemCount = order.items?.length || 0;
                  
                  return (
                    <Fragment key={order.id}>
                      <tr className="hover:bg-[#f9fafb] transition-colors cursor-pointer group">
                      <td className="px-4 py-3">
                        <input type="checkbox" className="rounded border-gray-300 text-black focus:ring-black" />
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#1a1a1a]">
                        <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="hover:underline">
                          #{order.id.slice(0, 4).toUpperCase()}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[#4b5563]">
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at {new Date(order.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-[#1a1a1a]">{order.customer_name}</td>
                      <td className="px-4 py-3 text-[#4b5563]">{getFulfillBy(order.created_at)}</td>
                      <td className="px-4 py-3 text-[#4b5563]">Online Store</td>
                      <td className="px-4 py-3 text-right text-[#1a1a1a]">₹{parseFloat(order.final_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3"><StatusBadge {...payment} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge {...fulfillment} />
                          {/* Dropdown for quick update visible on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <select
                              className="text-xs border border-gray-200 rounded px-1 py-1 bg-white"
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#4b5563]">{itemCount} item{itemCount !== 1 && 's'}</td>
                      <td className="px-4 py-3 text-[#4b5563]">Standard</td>
                      <td className="px-4 py-3 text-[#4b5563]"></td>
                    </tr>
                      
                      {/* Expanded details */}
                      {expandedId === order.id && (
                        <tr className="bg-[#f9fafb]">
                          <td colSpan={12} className="px-12 py-4 border-b border-[#e5e7eb]">
                            <div className="bg-white rounded-lg border border-[#e5e7eb] p-4">
                              <h4 className="font-semibold text-[#1a1a1a] mb-3">Order Details</h4>
                              <table className="w-full text-sm mb-4">
                                <thead>
                                  <tr className="text-[#6b7280] border-b border-[#e5e7eb]">
                                    <th className="text-left pb-2 font-medium">Item</th>
                                    <th className="text-center pb-2 font-medium">Qty</th>
                                    <th className="text-right pb-2 font-medium">Price</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(order.items || []).filter(Boolean).map((item) => (
                                    <tr key={item.id} className="border-b border-gray-50">
                                      <td className="py-2 text-[#1a1a1a]">{item.name}</td>
                                      <td className="py-2 text-center text-[#4b5563]">{item.quantity}</td>
                                      <td className="py-2 text-right text-[#1a1a1a]">₹{parseFloat(item.price * item.quantity).toLocaleString('en-IN')}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {order.shipping_address && (
                                <div className="text-sm text-[#4b5563] mb-4">
                                  <p className="font-medium text-[#1a1a1a] mb-1">Shipping Address</p>
                                  <p>{order.shipping_address.line1}</p>
                                  <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}</p>
                                </div>
                              )}
                              {order.status === 'cancelled' && order.razorpay_payment_id && (
                                <div className="flex justify-end pt-3 border-t border-[#e5e7eb]">
                                  <button
                                    onClick={() => handleRefund(order.id)}
                                    disabled={updatingId === order.id}
                                    className="px-4 py-2 bg-black text-white text-sm font-medium rounded shadow-sm hover:bg-gray-800 disabled:opacity-50"
                                  >
                                    {updatingId === order.id ? 'Processing...' : 'Issue Refund via Razorpay'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        <div className="border-t border-[#e5e7eb] px-4 py-3 flex items-center justify-center bg-white">
          {pages > 1 && (
            <div className="flex gap-1">
              {[...Array(pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded text-[14px] font-medium transition ${page === i + 1 ? 'bg-[#f3f4f6] text-[#1a1a1a]' : 'text-[#4b5563] hover:bg-[#f9fafb]'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
