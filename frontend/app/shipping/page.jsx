import { getBusinessProfile, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE, formatInr } from '@/lib/business';

export const metadata = {
  title: 'Shipping Policy',
  description: 'Shipping timelines, charges, and delivery policy for Spraykart. Free shipping above ₹999. Pan-India delivery in 3–7 business days.',
  alternates: { canonical: '/shipping' },
  openGraph: { title: 'Shipping Policy | Spraykart', url: '/shipping', type: 'website', images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Spraykart' }] },
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
      <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 40, fontWeight: 400, color: '#0D0D0D', marginBottom: 8 }}>Shipping Policy</h1>
      <p style={{ fontSize: 13, color: '#6E6B64', marginBottom: 48 }}>Last updated: May 1, 2026</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 44 }}>
        {highlights.map(([title, body]) => (
          <div key={title} style={{ background: '#EAE8E3', border: '1px solid #E2DFD8', padding: 18 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0D0D0D', marginBottom: 6 }}>{title}</h2>
            <p style={{ fontSize: 12, color: '#55534D', lineHeight: 1.7 }}>{body}</p>
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
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0D0D0D', marginBottom: 10 }}>{title}</h2>
          <p style={{ fontSize: 14, color: '#55534D', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{body}</p>
        </section>
      ))}
    </div>
  );
}
