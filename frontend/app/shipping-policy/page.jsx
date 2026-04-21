export default function ShippingPolicyPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 8 }}>Legal</p>
      <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 40, fontWeight: 400, color: '#0c0c0c', letterSpacing: '-0.01em', marginBottom: 8 }}>Shipping Policy</h1>
      <p style={{ fontSize: 13, color: '#a0a0a0', marginBottom: 48 }}>Last updated: April 21, 2025</p>

      {/* Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }}>
        {[
          { icon: '🚚', title: 'Pan-India Delivery', body: 'We deliver to every PIN code in India' },
          { icon: '🆓', title: 'Free Shipping', body: 'On all orders above ₹999' },
          { icon: '📦', title: '1–2 Day Dispatch', body: 'Orders dispatched within 1–2 business days' },
          { icon: '⏱️', title: '3–7 Day Delivery', body: 'Estimated delivery after dispatch' },
        ].map(({ icon, title, body }) => (
          <div key={title} style={{ background: '#f7f7f5', padding: '20px', border: '1px solid #e8e8e8' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0c0c0c', marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 12, color: '#737373' }}>{body}</div>
          </div>
        ))}
      </div>

      {[
        {
          title: 'Shipping Charges',
          body: `• Orders above ₹999 — FREE shipping\n• Orders below ₹999 — ₹49 flat shipping charge\n\nShipping charges are calculated at checkout and shown before payment.`,
        },
        {
          title: 'Dispatch Time',
          body: `All orders are processed and dispatched within 1–2 business days (Monday to Saturday, excluding public holidays). You will receive a shipping confirmation email with a tracking number once dispatched.`,
        },
        {
          title: 'Delivery Time',
          body: `Estimated delivery after dispatch:\n• Metro cities (Mumbai, Delhi, Bangalore, Chennai, etc.): 2–4 business days\n• Tier 2 cities: 3–5 business days\n• Remote and rural areas: 5–7 business days\n\nThese are estimates. Actual delivery may vary due to courier delays, public holidays, or natural events.`,
        },
        {
          title: 'Courier Partners',
          body: `We work with leading courier partners including Delhivery, Bluedart, and India Post to ensure safe and timely delivery. Fragile items (glass bottles) are packed with extra protective material.`,
        },
        {
          title: 'Tracking Your Order',
          body: `Once your order is dispatched, you will receive:\n1. An email with your tracking number and courier name\n2. You can also track your order from My Account → My Orders`,
        },
        {
          title: 'Undelivered / Returned Packages',
          body: `If a package is returned to us due to an incorrect address, recipient unavailable, or refused delivery:\n• We will contact you to arrange re-delivery (additional shipping charges may apply)\n• If re-delivery is not possible, a refund (minus shipping charges) will be issued`,
        },
        {
          title: 'Contact',
          body: `For shipping queries: support@spraykart.in\nPhone: [Your Phone Number] (Mon–Sat, 10am–6pm IST)`,
        },
      ].map(({ title, body }) => (
        <div key={title} style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0c0c0c', marginBottom: 10 }}>{title}</h2>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{body}</p>
        </div>
      ))}
    </div>
  );
}
