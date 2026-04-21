export default function PrivacyPolicyPage() {
  const updated = 'April 21, 2025';
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 8 }}>Legal</p>
      <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 40, fontWeight: 400, color: '#0c0c0c', letterSpacing: '-0.01em', marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ fontSize: 13, color: '#a0a0a0', marginBottom: 48 }}>Last updated: {updated}</p>

      {[
        {
          title: '1. Information We Collect',
          body: `We collect information you provide directly to us, such as your name, email address, shipping address, and phone number when you create an account or place an order. We also collect payment information (processed securely by Razorpay — we never store your card details). We automatically collect certain technical information including IP address, browser type, and pages visited.`,
        },
        {
          title: '2. How We Use Your Information',
          body: `We use your information to: process and fulfil your orders; send order confirmations and shipping updates; respond to your enquiries; improve our website and services; send promotional communications (only if you have opted in); comply with legal obligations under Indian law.`,
        },
        {
          title: '3. Sharing of Information',
          body: `We do not sell or rent your personal information to third parties. We may share your data with: Razorpay (payment processing); shipping partners (Delhivery, India Post) for order delivery; Supabase (secure database hosting); Vercel (website hosting). All partners are bound by data protection agreements.`,
        },
        {
          title: '4. Data Security',
          body: `We implement industry-standard security measures including SSL/TLS encryption, bcrypt password hashing, and secure httpOnly JWT cookies. Payments are processed by Razorpay under PCI DSS compliance. Despite these measures, no internet transmission is 100% secure.`,
        },
        {
          title: '5. Your Rights',
          body: `Under the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, you have the right to: access your personal data; correct inaccurate data; withdraw consent; request deletion of your data. To exercise these rights, contact us at privacy@spraykart.in.`,
        },
        {
          title: '6. Cookies',
          body: `We use essential cookies for authentication (httpOnly JWT token) and local storage for your cart and wishlist. We do not use third-party advertising cookies. You may disable cookies in your browser settings, but this will affect site functionality.`,
        },
        {
          title: '7. Children\'s Privacy',
          body: `Our services are not directed to persons under 18 years of age. We do not knowingly collect personal information from minors.`,
        },
        {
          title: '8. Changes to This Policy',
          body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by displaying a notice on our website. Continued use of our services after changes constitutes acceptance of the revised policy.`,
        },
        {
          title: '9. Contact Us',
          body: `For privacy-related enquiries: privacy@spraykart.in\nSpaykart, [Registered Address], India`,
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
