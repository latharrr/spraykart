'use client';
import { useState, useCallback, Fragment } from 'react';
import { adminGetOrders, adminUpdateOrder, adminRefundOrder } from '@/lib/api';
import { useFetch } from '@/lib/hooks/useFetch';
import Spinner from '@/components/ui/Spinner';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

// ─── WhatsApp deep-link builder ───────────────────────────────────────────────
function whatsappLink(phone, order) {
  if (!phone) return null;
  const clean = phone.replace(/\D/g, '');
  const number = clean.startsWith('91') ? clean : `91${clean}`;
  const msg = encodeURIComponent(
    `Hi ${order.customer_name || 'there'}, this is Spraykart! 🎉\n\n` +
    `Your order #${order.id.slice(0, 8).toUpperCase()} ` +
    `(₹${parseFloat(order.final_price).toLocaleString('en-IN')}) ` +
    `is currently *${order.status.toUpperCase()}*.\n\n` +
    `Thank you for shopping with us! 🛍️`
  );
  return `https://wa.me/${number}?text=${msg}`;
}

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
    const amountInput = window.prompt('Refund amount in rupees. Leave blank to refund the remaining amount.');
    if (amountInput === null) return;
    const payload = {};
    if (amountInput.trim()) {
      const rupees = Number(amountInput);
      if (!Number.isFinite(rupees) || rupees <= 0) {
        toast.error('Enter a valid refund amount');
        return;
      }
      payload.amount = Math.round(rupees * 100);
    }
    setUpdatingId(orderId);
    try {
      await adminRefundOrder(orderId, payload);
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
    if (order.payment_method === 'cod') return { label: 'COD', color: 'orange' };
    if (order.razorpay_payment_id) return { label: 'Paid', color: 'green' };
    return { label: 'Pending', color: 'orange' };
  };

  const getFulfillmentStatus = (status) => {
    if (status === 'delivered') return { label: 'Fulfilled', color: 'green' };
    if (status === 'shipped') return { label: 'Shipped', color: 'blue' };
    if (status === 'cancelled') return { label: 'Cancelled', color: 'red' };
    if (status === 'confirmed') return { label: 'Confirmed', color: 'blue' };
    return { label: 'Unfulfilled', color: 'yellow' };
  };

  const StatusBadge = ({ label, color }) => {
    const styles = {
      gray:   'bg-[#f3f4f6] text-[#4b5563]',
      green:  'bg-[#dcfce7] text-[#166534]',
      blue:   'bg-[#dbeafe] text-[#1e40af]',
      orange: 'bg-[#ffedd5] text-[#9a3412]',
      yellow: 'bg-[#fef08a] text-[#854d0e]',
      red:    'bg-[#fee2e2] text-[#991b1b]',
    };
    const dotStyles = {
      gray: 'bg-[#9ca3af]', green: 'bg-[#22c55e]', blue: 'bg-[#3b82f6]',
      orange: 'bg-[#ea580c]', yellow: 'bg-[#eab308]', red: 'bg-[#ef4444]',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-md whitespace-nowrap ${styles[color] || styles.gray}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[color] || dotStyles.gray}`} />
        {label}
      </span>
    );
  };

  const getFulfillBy = (createdAt) => {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 2);
    const now = new Date();
    if (now > date) {
      const diffDays = Math.ceil((now - date) / 86400000);
      return <span className="text-[#dc2626] font-medium">{diffDays}d overdue</span>;
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">Orders</h1>
        <div className="flex items-center gap-2">
          {/* Status filter tabs */}
          {['', ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition ${
                statusFilter === s
                  ? 'bg-black text-white'
                  : 'bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">

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
            <table className="w-full whitespace-nowrap text-[13px]">
              <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Order</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Fulfill by</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#4b5563]">Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Payment</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Items</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {orders.map((order) => {
                  const payment = getPaymentStatus(order);
                  const fulfillment = getFulfillmentStatus(order.status);
                  const itemCount = order.items?.length || 0;
                  // Customer contact — prefer shipping_address snapshot, fallback to user record
                  const addr = typeof order.shipping_address === 'string'
                    ? JSON.parse(order.shipping_address)
                    : (order.shipping_address || {});
                  const phone = addr.phone || '';
                  const email = addr.email || order.customer_email || '';
                  const customerName = addr.name || order.customer_name || '—';
                  const waLink = whatsappLink(phone, { ...order, customer_name: customerName });

                  return (
                    <Fragment key={order.id}>
                      <tr className="hover:bg-[#f9fafb] transition-colors group">
                        {/* Order ID */}
                        <td className="px-4 py-3 font-semibold text-[#1a1a1a]">
                          <button
                            onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                            className="hover:underline flex items-center gap-1"
                          >
                            #{order.id.slice(0, 6).toUpperCase()}
                            {expandedId === order.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </td>
                        {/* Date */}
                        <td className="px-4 py-3 text-[#4b5563]">
                          {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          <span className="text-[11px] text-[#9ca3af] block">
                            {new Date(order.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </td>
                        {/* Customer name */}
                        <td className="px-4 py-3 text-[#1a1a1a] font-medium">{customerName}</td>
                        {/* Phone + WhatsApp */}
                        <td className="px-4 py-3">
                          {phone ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[#4b5563] font-mono text-[12px]">{phone}</span>
                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Message on WhatsApp"
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: 28, height: 28, borderRadius: 6,
                                    background: '#25d366', color: '#fff',
                                    flexShrink: 0,
                                  }}
                                >
                                  {/* WhatsApp icon SVG */}
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#d1d5db] text-[12px]">—</span>
                          )}
                        </td>
                        {/* Email */}
                        <td className="px-4 py-3 text-[#4b5563] text-[12px] max-w-[160px] truncate">
                          {email || <span className="text-[#d1d5db]">—</span>}
                        </td>
                        {/* Fulfill by */}
                        <td className="px-4 py-3 text-[#4b5563]">{getFulfillBy(order.created_at)}</td>
                        {/* Total */}
                        <td className="px-4 py-3 text-right text-[#1a1a1a] font-semibold">
                          ₹{parseFloat(order.final_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        {/* Payment */}
                        <td className="px-4 py-3"><StatusBadge {...payment} /></td>
                        {/* Fulfillment status + quick update */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <StatusBadge {...fulfillment} />
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
                        {/* Items */}
                        <td className="px-4 py-3 text-[#4b5563]">{itemCount} item{itemCount !== 1 && 's'}</td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                            className="text-[12px] font-medium text-[#3b82f6] hover:underline"
                          >
                            {expandedId === order.id ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>

                      {/* ── Expanded order details ────────────────────────────── */}
                      {expandedId === order.id && (
                        <tr className="bg-[#f9fafb]">
                          <td colSpan={11} className="px-8 py-5 border-b border-[#e5e7eb]">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                              {/* Customer card */}
                              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                                <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#9ca3af] mb-3">Customer Details</p>
                                <div className="space-y-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-[#0c0c0c] text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                                      {customerName[0]?.toUpperCase() || '?'}
                                    </div>
                                    <span className="text-[14px] font-semibold text-[#1a1a1a]">{customerName}</span>
                                  </div>
                                  {email && (
                                    <a href={`mailto:${email}`} className="flex items-center gap-2 text-[13px] text-[#4b5563] hover:text-[#1a1a1a]">
                                      <Mail size={13} /> {email}
                                    </a>
                                  )}
                                  {phone && (
                                    <div className="flex items-center gap-2">
                                      <a href={`tel:${phone}`} className="flex items-center gap-2 text-[13px] text-[#4b5563] hover:text-[#1a1a1a]">
                                        <Phone size={13} /> {phone}
                                      </a>
                                      {waLink && (
                                        <a
                                          href={waLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold"
                                          style={{ background: '#25d366', color: '#fff' }}
                                        >
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                          </svg>
                                          WhatsApp
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Shipping address */}
                              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                                <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#9ca3af] mb-3">Shipping Address</p>
                                {addr.line1 ? (
                                  <div className="flex items-start gap-2 text-[13px] text-[#4b5563]">
                                    <MapPin size={13} className="mt-0.5 shrink-0 text-[#9ca3af]" />
                                    <div>
                                      <p>{addr.line1}</p>
                                      {addr.line2 && <p>{addr.line2}</p>}
                                      <p>{addr.city}, {addr.state}</p>
                                      <p>PIN: {addr.pincode}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[#d1d5db] text-[13px]">No address saved</p>
                                )}
                              </div>

                              {/* Order items */}
                              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                                <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#9ca3af] mb-3">Order Items</p>
                                <div className="space-y-2">
                                  {(order.items || []).filter(Boolean).map((item) => (
                                    <div key={item.id} className="flex justify-between text-[13px]">
                                      <span className="text-[#1a1a1a] truncate mr-2">{item.name} <span className="text-[#9ca3af]">×{item.quantity}</span></span>
                                      <span className="font-medium shrink-0">₹{parseFloat(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                    </div>
                                  ))}
                                  {order.discount > 0 && (
                                    <div className="flex justify-between text-[13px] text-green-600 border-t border-[#f3f4f6] pt-2">
                                      <span>Discount</span>
                                      <span>−₹{parseFloat(order.discount).toLocaleString('en-IN')}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-[13px] font-bold text-[#1a1a1a] border-t border-[#e5e7eb] pt-2">
                                    <span>Total</span>
                                    <span>₹{parseFloat(order.final_price).toLocaleString('en-IN')}</span>
                                  </div>
                                </div>

                                {order.status === 'cancelled' && order.razorpay_payment_id && (
                                  <button
                                    onClick={() => handleRefund(order.id)}
                                    disabled={updatingId === order.id}
                                    className="mt-3 w-full py-2 bg-black text-white text-[12px] font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                                  >
                                    {updatingId === order.id ? 'Processing...' : 'Issue Refund via Razorpay'}
                                  </button>
                                )}
                              </div>
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

        {/* Pagination */}
        <div className="border-t border-[#e5e7eb] px-4 py-3 flex items-center justify-center bg-white">
          {pages > 1 && (
            <div className="flex gap-1">
              {[...Array(pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded text-[13px] font-medium transition ${
                    page === i + 1 ? 'bg-[#1a1a1a] text-white' : 'text-[#4b5563] hover:bg-[#f3f4f6]'
                  }`}
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
