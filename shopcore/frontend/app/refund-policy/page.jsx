export default function RefundPolicyPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 8 }}>Legal</p>
      <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 40, fontWeight: 400, color: '#0c0c0c', letterSpacing: '-0.01em', marginBottom: 8 }}>Return & Refund Policy</h1>
      <p style={{ fontSize: 13, color: '#a0a0a0', marginBottom: 48 }}>Last updated: April 21, 2025</p>

      <div style={{ background: '#f7f7f5', border: '1px solid #e8e8e8', padding: '20px 24px', marginBottom: 40, borderLeft: '3px solid #0c0c0c' }}>
        <p style={{ fontSize: 14, color: '#0c0c0c', fontWeight: 600, margin: 0 }}>We want you to love your purchase.</p>
        <p style={{ fontSize: 14, color: '#555', margin: '8px 0 0', lineHeight: 1.7 }}>If something isn't right, we'll make it right. Contact us within 48 hours of delivery.</p>
      </div>

      {[
        {
          title: '✅ Eligible for Return / Refund',
          items: [
            'Product received is damaged or broken',
            'Wrong product shipped',
            'Product is counterfeit (we guarantee authenticity, but if you suspect otherwise)',
            'Product is significantly different from the description',
          ],
        },
        {
          title: '❌ Not Eligible for Return',
          items: [
            'Opened, used, or sprayed products (due to hygiene reasons)',
            'Products with broken seals (unless damaged in transit)',
            'Returns after 48 hours of delivery for damaged/wrong items',
            'Change of mind after delivery',
            'Products gifted or personalised',
          ],
        },
      ].map(({ title, items }) => (
        <div key={title} style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0c0c0c', marginBottom: 12 }}>{title}</h2>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {items.map((item) => (
              <li key={item} style={{ fontSize: 14, color: '#555', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
            ))}
          </ul>
        </div>
      ))}

      {[
        {
          title: 'How to Initiate a Return',
          body: `1. Email support@spraykart.in within 48 hours of delivery\n2. Include your Order ID, a description of the issue, and clear photographs\n3. Our team will review and respond within 24 business hours\n4. If approved, we'll arrange a reverse pickup at no cost to you`,
        },
        {
          title: 'Refund Timeline',
          body: `Once the returned product is received and inspected:\n• Online payments (Razorpay): Refund processed within 5–7 business days to the original payment method\n• Bank transfer: 3–5 business days after initiation\nYou will receive an email confirmation when your refund is processed.`,
        },
        {
          title: 'Order Cancellations',
          body: `Orders can be cancelled before they are dispatched. Once dispatched, cancellation is not possible — please wait for delivery and then initiate a return if needed.\n\nTo cancel an order: Go to My Orders → Select the order → Cancel (if available)`,
        },
        {
          title: 'Contact Us',
          body: `Email: support@spraykart.in\nPhone: [Your Phone Number]\nHours: Monday–Saturday, 10am–6pm IST`,
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
