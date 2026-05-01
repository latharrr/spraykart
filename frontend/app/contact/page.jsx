export const metadata = {
  title: 'Contact Us | Spraykart',
  description: 'Get in touch with Spraykart for any questions regarding our luxury fragrances.',
  alternates: { canonical: '/contact' },
};

import ContactClient from './ContactClient';
import { getBusinessProfile } from '@/lib/business';

export default function ContactPage() {
  return (
    <ContactClient business={getBusinessProfile()} />
  );
}
