import { getBusinessProfile, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE, formatInr } from '@/lib/business';

export const metadata = {
  title: 'Terms & Conditions | Spraykart',
  description: 'Terms and conditions for shopping on Spraykart.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  const business = getBusinessProfile();
  const sections = [
    ['1. Acceptance of Terms', 'By accessing Spraykart, creating an account, or placing an order, you agree to these Terms & Conditions, the Privacy Policy, Refund & Cancellation Policy, and Shipping Policy.'],
    ['2. Products & Authenticity', 'Products are intended to be authentic and sourced from authorised or verified supply channels. Product images are representative; bottle design, packaging, and batch details may vary. Prices are inclusive of applicable GST unless stated otherwise.'],
    ['3. Account Responsibility', 'You are responsible for keeping your login credentials confidential and for activity under your account. We may suspend accounts involved in fraudulent, abusive, or unlawful activity.'],
    ['4. Ordering & Payment', 'Orders are confirmed on successful online payment through Razorpay or Paytm, or on acceptance of Cash on Delivery where available. Prices are in Indian Rupees. We may cancel orders if stock becomes unavailable, with a refund for any amount paid.'],
    ['5. Shipping', `Orders are usually dispatched within 1-2 business days. Estimated delivery is 3-7 business days depending on location. Free shipping applies above ${formatInr(FREE_SHIPPING_THRESHOLD)}; a flat ${formatInr(STANDARD_SHIPPING_FEE)} charge applies below that threshold.`],
    ['6. Returns & Refunds', 'Opened or used fragrance products are not returnable unless damaged or incorrect. Damaged, missing, or wrong products must be reported within 48 hours of delivery with clear evidence. See the Refund & Cancellation Policy for details.'],
    ['7. Intellectual Property', 'All website content, branding, layout, product copy, and imagery owned by Spraykart or its licensors is protected by applicable intellectual property laws and may not be copied without permission.'],
    ['8. Limitation of Liability', "Spraykart's liability for a purchase is limited to the order value paid by the customer, to the maximum extent permitted by law. We are not liable for indirect, incidental, or consequential loss."],
    ['9. Governing Law', `These Terms are governed by Indian law. Disputes are subject to competent courts in the state where ${business.legalName} is registered, unless applicable law requires otherwise.`],
    ['10. Contact', `For queries:\n${business.legalName}\n${business.address}\nEmail: ${business.email}\nPhone: ${business.phone}\nGSTIN: ${business.gstin}`],
  ];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 8 }}>Legal</p>
      <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 40, fontWeight: 400, color: '#0c0c0c', marginBottom: 8 }}>Terms & Conditions</h1>
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
