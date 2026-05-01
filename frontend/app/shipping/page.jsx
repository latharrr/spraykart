import { getBusinessProfile, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE, formatInr } from '@/lib/business';

export const metadata = {
  title: 'Shipping Policy | Spraykart',
  description: 'Shipping timelines, charges, and delivery policy for Spraykart.',
  alternates: { canonical: '/shipping' },
};

export default function ShippingPage() {
  const business = getBusinessProfile();
  const highlights = [
    ['Pan-India Delivery', 'Delivery to serviceable Indian PIN codes.'],
    ['Dispatch', 'Usually dispatched within 1-2 business days.'],
    ['Delivery', 'Metro: 2-4 business days; tier 2/3: 3-5; remote areas: 5-7.'],
    ['Free Shipping', `Free above ${formatInr(FREE_SHIPPING_THRESHOLD)}; otherwise ${formatInr(STANDARD_SHIPPING_FEE)} flat.`],
  ];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 8 }}>Legal</p>
      <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 40, fontWeight: 400, color: '#0c0c0c', marginBottom: 8 }}>Shipping Policy</h1>
      <p style={{ fontSize: 13, color: '#a0a0a0', marginBottom: 48 }}>Last updated: May 1, 2026</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 44 }}>
        {highlights.map(([title, body]) => (
          <div key={title} style={{ background: '#f7f7f5', border: '1px solid #e8e8e8', padding: 18 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0c0c0c', marginBottom: 6 }}>{title}</h2>
            <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7 }}>{body}</p>
          </div>
        ))}
      </div>

      {[
        ['Shipping Charges', `Orders above ${formatInr(FREE_SHIPPING_THRESHOLD)} ship free. Orders below that threshold are charged ${formatInr(STANDARD_SHIPPING_FEE)} at checkout.`],
        ['Tracking', 'A tracking link is shared by email once the order is dispatched. Tracking may take a few hours to activate after handover to the courier.'],
        ['Incorrect Address / RTO', 'If a package is returned due to incorrect address, recipient unavailable, or refused delivery, re-shipping charges may apply. Refunds, if any, may exclude forward and reverse shipping costs.'],
        ['Delays', 'Delivery timelines are estimates and may vary because of courier delays, public holidays, weather, regulatory checks, or remote-area connectivity.'],
        ['Contact', `For shipping queries: ${business.email}\nPhone: ${business.phone}\nHours: ${business.supportHours}`],
      ].map(([title, body]) => (
        <section key={title} style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0c0c0c', marginBottom: 10 }}>{title}</h2>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{body}</p>
        </section>
      ))}
    </div>
  );
}
