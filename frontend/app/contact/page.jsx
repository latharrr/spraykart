export const metadata = {
  title: 'Contact Us | Spraykart',
  description: 'Get in touch with Spraykart. We are here to help with questions about our luxury fragrances, orders, returns, and more.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact Us | Spraykart',
    description: 'Get in touch with Spraykart. We are here to help with your fragrance queries.',
    url: '/contact',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Contact Spraykart' }],
  },
};

import ContactClient from './ContactClient';
import { getBusinessProfile } from '@/lib/business';

export default function ContactPage() {
  return (
    <ContactClient business={getBusinessProfile()} />
  );
}
