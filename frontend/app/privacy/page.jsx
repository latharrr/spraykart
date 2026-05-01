import { getBusinessProfile } from '@/lib/business';

export const metadata = {
  title: 'Privacy Policy | Spraykart',
  description: 'Privacy Policy for Spraykart, including DPDP Act 2023 compliance information.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  const business = getBusinessProfile();
  const sections = [
    ['1. Scope', `This Privacy Policy explains how ${business.legalName} ("Spraykart", "we", "us") collects, uses, stores, shares, and protects personal data when you use our website, create an account, contact us, or place an order.`],
    ['2. Information We Collect', 'We collect account details, contact information, shipping addresses, order details, customer support messages, device/browser data, IP address, and payment identifiers returned by Razorpay or Paytm. We do not store card numbers, CVV, UPI PINs, or net-banking credentials.'],
    ['3. How We Use Data', 'We use personal data to create and secure accounts, process orders, deliver products, send transactional emails, prevent fraud, comply with tax and legal obligations, provide customer support, and improve the website.'],
    ['4. DPDP Act 2023 Compliance', 'We process digital personal data in accordance with applicable Indian privacy law, including the Digital Personal Data Protection Act, 2023. We use consent where required, provide clear purpose notices, collect only necessary data, protect data with reasonable security practices, and honour valid correction, access, withdrawal, and deletion requests subject to legal retention obligations.'],
    ['5. Cookies and Consent', 'Essential cookies are used for authentication, cart/session security, and checkout reliability. Non-essential analytics or marketing technologies, if added in the future, must not load until you provide consent through the cookie banner. You may accept, reject, or manage consent choices.'],
    ['6. Sharing', 'We share data only with service providers needed to run the store, including payment gateways, email service providers, hosting/monitoring providers, courier partners, and tax/accounting systems. We do not sell customer personal data.'],
    ['7. Retention', 'We retain order, invoice, payment, and tax records for the period required under Indian law. Account and support data is retained only as long as needed for the purposes described above or as required by law.'],
    ['8. Your Rights', `You may request access, correction, withdrawal of consent, or deletion by contacting ${business.email}. We may need to verify your identity before acting on requests.`],
    ['9. Grievance Contact', `${business.legalName}\n${business.address}\nEmail: ${business.email}\nPhone: ${business.phone}\nGSTIN: ${business.gstin}`],
  ];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 8 }}>Legal</p>
      <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 40, fontWeight: 400, color: '#0c0c0c', marginBottom: 8 }}>Privacy Policy</h1>
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
