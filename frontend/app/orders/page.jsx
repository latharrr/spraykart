'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { getMyOrders } from '@/lib/api';
import { useFetch } from '@/lib/hooks/useFetch';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import Link from 'next/link';
import { Package, ChevronDown, ChevronUp, MapPin, Check, Clock } from 'lucide-react';

// ─── Order status pipeline (Myntra-style) ─────────────────────────────────────
const STATUS_STEPS = [
  { key: 'pending',   label: 'Order Placed',    desc: 'Your order has been received' },
  { key: 'confirmed', label: 'Confirmed',        desc: 'Order confirmed by Spraykart' },
  { key: 'shipped',   label: 'Shipped',          desc: 'On its way to you' },
  { key: 'delivered', label: 'Delivered',        desc: 'Package delivered successfully' },
];

const STATUS_ORDER = ['pending', 'confirmed', 'shipped', 'delivered'];

function getStepIndex(status) {
  if (status === 'cancelled') return -1;
  return STATUS_ORDER.indexOf(status);
}

// Estimate delivery date: +5 business days from order date
function estimatedDelivery(createdAt) {
  const date = new Date(createdAt);
  let added = 0;
  while (added < 5) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) added++;
  }
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    pending:   { bg: '#fef3c7', color: '#92400e', label: 'Order Placed' },
    confirmed: { bg: '#dbeafe', color: '#1e40af', label: 'Confirmed' },
    shipped:   { bg: '#ede9fe', color: '#5b21b6', label: 'Shipped' },
    delivered: { bg: '#dcfce7', color: '#166534', label: 'Delivered' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 100,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

// ─── Myntra-style tracking timeline ──────────────────────────────────────────
function TrackingTimeline({ order }) {
  const currentIdx = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  if (isCancelled) {
    return (
      <div style={{
        padding: '20px 24px',
        background: '#fff5f5',
        border: '1px solid #fecaca',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 20 }}>❌</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>Order Cancelled</p>
          <p style={{ fontSize: 12, color: '#dc2626', marginTop: 2 }}>
            {order.razorpay_payment_id
              ? 'Refund will be processed within 5–7 business days.'
              : 'This order was cancelled before payment.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Estimated delivery banner */}
      {order.status !== 'delivered' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', background: '#f0fdf4',
          border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 24,
        }}>
          <Clock size={14} color="#16a34a" />
          <p style={{ fontSize: 13, color: '#166534' }}>
            <strong>Estimated Delivery:</strong> {estimatedDelivery(order.created_at)}
          </p>
        </div>
      )}

      {/* Steps */}
      <div style={{ position: 'relative' }}>
        {STATUS_STEPS.map((step, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={step.key} style={{ display: 'flex', gap: 16, position: 'relative' }}>
              {/* Line connector */}
              {idx < STATUS_STEPS.length - 1 && (
                <div style={{
                  position: 'absolute', left: 14, top: 30,
                  width: 2, height: 'calc(100% - 10px)',
                  background: isDone ? '#0c0c0c' : '#e5e7eb',
                  transition: 'background 0.3s',
                }} />
              )}

              {/* Circle */}
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isDone ? '#0c0c0c' : '#f3f4f6',
                border: `2px solid ${isDone ? '#0c0c0c' : '#e5e7eb'}`,
                transition: 'all 0.3s',
                zIndex: 1, position: 'relative',
                boxShadow: isCurrent ? '0 0 0 4px rgba(0,0,0,0.08)' : 'none',
              }}>
                {isDone ? (
                  <Check size={13} color="#fff" strokeWidth={3} />
                ) : (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d1d5db' }} />
                )}
              </div>

              {/* Label */}
              <div style={{ paddingBottom: idx < STATUS_STEPS.length - 1 ? 32 : 0 }}>
                <p style={{
                  fontSize: 13, fontWeight: isCurrent ? 700 : isDone ? 600 : 400,
                  color: isDone ? '#0c0c0c' : '#9ca3af',
                  lineHeight: 1.4,
                }}>
                  {step.label}
                  {isCurrent && (
                    <span style={{
                      marginLeft: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: '#6366f1',
                      background: '#eef2ff', padding: '2px 6px', borderRadius: 4,
                    }}>
                      Current
                    </span>
                  )}
                </p>
                <p style={{ fontSize: 12, color: isDone ? '#6b7280' : '#d1d5db', marginTop: 2 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Individual expanded order card ──────────────────────────────────────────
function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const addr = (() => {
    try {
      return typeof order.shipping_address === 'string'
        ? JSON.parse(order.shipping_address)
        : order.shipping_address || {};
    } catch { return {}; }
  })();

  const itemCount = order.items?.filter(Boolean).length || 0;

  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 12,
      overflow: 'hidden', background: '#fff',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      marginBottom: 16,
      transition: 'box-shadow 0.15s',
    }}>
      {/* ── Card header ───────────────────────────────────────────────── */}
      <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* Order icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Package size={20} color="#374151" />
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', fontFamily: 'monospace' }}>
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
            <StatusPill status={order.status} />
            {order.payment_method === 'cod' && (
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#fef9c3', color: '#854d0e', fontWeight: 600 }}>
                COD
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#6b7280' }}>
            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}{itemCount} item{itemCount !== 1 && 's'}
            {' · '}
            <strong style={{ color: '#1a1a1a' }}>₹{parseFloat(order.final_price).toLocaleString('en-IN')}</strong>
          </p>
        </div>

        {/* Track button */}
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8,
            border: '1px solid #e5e7eb', background: '#fff',
            fontSize: 12, fontWeight: 600, color: '#374151',
            cursor: 'pointer', flexShrink: 0,
            transition: 'background 0.1s',
          }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Hide' : 'Track Order'}
        </button>
      </div>

      {/* ── Expanded content ──────────────────────────────────────────── */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f3f4f6' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 0,
          }}>
            {/* Tracking timeline */}
            <div style={{ padding: '24px 24px', borderRight: '1px solid #f3f4f6' }}>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#9ca3af', marginBottom: 20,
              }}>
                Order Tracking
              </p>
              <TrackingTimeline order={order} />
            </div>

            {/* Right: Items + Delivery address */}
            <div style={{ padding: '24px 24px' }}>
              {/* Items */}
              <div style={{ marginBottom: 24 }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: '#9ca3af', marginBottom: 14,
                }}>
                  Items Ordered
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(order.items || []).filter(Boolean).map((item) => (
                    <div key={item.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      padding: '10px 12px', background: '#f9fafb', borderRadius: 8,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.3 }}>{item.name}</p>
                        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Qty: {item.quantity}</p>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', flexShrink: 0, marginLeft: 12 }}>
                        ₹{parseFloat(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Price summary */}
                <div style={{ marginTop: 12, padding: '10px 12px', background: '#f9fafb', borderRadius: 8 }}>
                  {order.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16a34a', marginBottom: 4 }}>
                      <span>Discount</span>
                      <span>−₹{parseFloat(order.discount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
                    <span>Total Paid</span>
                    <span>₹{parseFloat(order.final_price).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Delivery address */}
              {addr.line1 && (
                <div>
                  <p style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: '#9ca3af', marginBottom: 10,
                  }}>
                    Delivery Address
                  </p>
                  <div style={{
                    display: 'flex', gap: 8,
                    padding: '12px 14px', background: '#f9fafb', borderRadius: 8,
                  }}>
                    <MapPin size={14} color="#9ca3af" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
                      {addr.name && <p style={{ fontWeight: 600, color: '#1a1a1a' }}>{addr.name}</p>}
                      <p>{addr.line1}</p>
                      {addr.line2 && <p>{addr.line2}</p>}
                      <p>{addr.city}, {addr.state} – {addr.pincode}</p>
                      {addr.phone && <p style={{ marginTop: 4, color: '#6b7280' }}>📱 {addr.phone}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
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
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 16px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>My Orders</h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>Track and manage all your Spraykart orders</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
              height: 96, borderRadius: 12, border: '1px solid #e5e7eb',
              background: '#f9fafb', animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
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
        <div>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
