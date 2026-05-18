import db from '@/lib/db';
import FaqClient from './FaqClient';

export const metadata = {
  title: 'Frequently Asked Questions | Spraykart',
  description: 'Find answers to common questions about Spraykart — shipping, returns, authenticity, payment, and more.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'Frequently Asked Questions | Spraykart',
    description: 'Find answers to common questions about Spraykart — shipping, returns, authenticity, payment, and more.',
    url: '/faq',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Spraykart FAQ' }],
  },
};

export const revalidate = 60; // ISR: revalidate every 60 seconds

async function getFaqs() {
  try {
    const { rows } = await db.query(
      'SELECT id, question, answer, image_url FROM faqs WHERE is_active = true ORDER BY sort_order ASC, created_at ASC'
    );
    return rows;
  } catch {
    return [];
  }
}

export default async function FAQPage() {
  const faqs = await getFaqs();

  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  } : null;

  return (
    <>
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <FaqClient faqs={faqs} />
    </>
  );
}
