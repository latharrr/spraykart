export default function TermsPage() {
  const updated = 'April 21, 2025';
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 8 }}>Legal</p>
      <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 40, fontWeight: 400, color: '#0c0c0c', letterSpacing: '-0.01em', marginBottom: 8 }}>Terms & Conditions</h1>
      <p style={{ fontSize: 13, color: '#a0a0a0', marginBottom: 48 }}>Last updated: {updated}</p>

      {[
        {
          title: '1. Acceptance of Terms',
          body: 'By accessing or using the Spraykart website and placing orders, you agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree, please do not use our services.',
        },
        {
          title: '2. Products & Authenticity',
          body: 'All fragrances sold on Spraykart are 100% authentic. We source directly from authorised distributors. Product images are representative; actual bottle design may vary slightly by batch. Prices are inclusive of applicable GST unless stated otherwise.',
        },
        {
          title: '3. Account Responsibility',
          body: 'You are responsible for maintaining the confidentiality of your account credentials. You agree not to share your login with others. We reserve the right to suspend accounts found engaging in fraudulent activity.',
        },
        {
          title: '4. Ordering & Payment',
          body: 'Orders are confirmed only upon successful payment via Razorpay. We accept all major credit/debit cards, UPI, net banking, and wallets. Prices are in Indian Rupees (INR). We reserve the right to cancel orders if stock becomes unavailable, with a full refund.',
        },
        {
          title: '5. Shipping',
          body: 'We ship pan-India. Orders are dispatched within 1–2 business days. Estimated delivery is 3–7 business days depending on your location. Free shipping on orders above ₹999. A flat ₹49 shipping charge applies below ₹999. We are not responsible for delays caused by courier partners or natural events.',
        },
        {
          title: '6. Returns & Refunds',
          body: 'Please refer to our Refund Policy for complete details. In general: opened/used products cannot be returned unless defective. Damaged or wrong products must be reported within 48 hours of delivery with photographic evidence.',
        },
        {
          title: '7. Intellectual Property',
          body: 'All content on this website — including logos, product images, text, and design — is the property of Spraykart and is protected under Indian copyright law. Unauthorised reproduction is prohibited.',
        },
        {
          title: '8. Limitation of Liability',
          body: 'Spraykart\'s liability for any claim arising out of the use of this website or purchase of products is limited to the value of the order placed. We are not liable for indirect, incidental, or consequential damages.',
        },
        {
          title: '9. Governing Law',
          body: 'These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in [Your City], India.',
        },
        {
          title: '10. Contact',
          body: 'For any queries: support@spraykart.in\nSpaykart, [Registered Address], India',
        },
      ].map(({ title, body }) => (
        <div key={title} style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0c0c0c', marginBottom: 10 }}>{title}</h2>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8 }}>{body}</p>
        </div>
      ))}
    </div>
  );
}
