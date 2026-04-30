import db from '@/lib/db';
import FaqClient from './FaqClient';

export const metadata = {
  title: 'Frequently Asked Questions | Spraykart',
  description: 'Find answers to common questions about Spraykart — shipping, returns, authenticity, payment, and more.',
};

export const revalidate = 3600;

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
  return <FaqClient faqs={faqs} />;
}
