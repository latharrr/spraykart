import { getBusinessProfile } from '@/lib/business';

export const metadata = {
  title: 'Refund & Cancellation Policy | Spraykart',
  description: 'Refund, return, and cancellation policy for Spraykart orders.',
  alternates: { canonical: '/refund' },
};

export default function RefundPage() {
  const business = getBusinessProfile();
  const sections = [
    ['Eligible for Return / Refund', 'Damaged products, wrong products, missing items, or products materially different from the product description may be eligible for return or refund. Please report issues within 48 hours of delivery with order ID and clear photos or videos.'],
    ['Not Eligible for Return', 'Opened, used, sprayed, tampered, or seal-broken fragrance products are not returnable unless they were delivered damaged or incorrect. Change-of-mind returns are not accepted for hygiene and authenticity-control reasons.'],
    ['Cancellation', 'Orders may be cancelled before dispatch. Once dispatched, cancellation may not be possible. For prepaid orders, refunds are processed to the original payment method after cancellation approval.'],
    ['Refund Timelines', 'Approved online payment refunds are initiated through Razorpay or Paytm and usually reflect within 5-7 business days, subject to bank/payment-provider timelines. COD refunds, if applicable, may require bank account verification.'],
    ['Partial Refunds', 'Partial refunds may be issued for item-level adjustments, damaged partial shipments, or goodwill resolutions. A fully paid online order can be cancelled in admin only after refund records cover the full paid order amount.'],
    ['Contact', `Email: ${business.email}\nPhone: ${business.phone}\nHours: ${business.supportHours}\nGSTIN: ${business.gstin}`],
  ];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 8 }}>Legal</p>
      <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 40, fontWeight: 400, color: '#0c0c0c', marginBottom: 8 }}>Refund & Cancellation Policy</h1>
      <p style={{ fontSize: 13, color: '#a0a0a0', marginBottom: 48 }}>Last updated: May 1, 2026</p>
      {sections.map(([title, body]) => (
        <section key={title} style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0c0c0c', marginBottom: 10 }}>{title}</h2>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{body}</p>
        </section>
      ))}
    </div>
  );
}
