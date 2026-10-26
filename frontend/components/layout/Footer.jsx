import Link from 'next/link';
import FooterNewsletter from '@/components/layout/FooterNewsletter';

const columns = [
  {
    title: 'Shop',
    links: [
      { label: 'All fragrances', href: '/products' },
      { label: 'Men', href: '/products?category=Men' },
      { label: 'Women', href: '/products?category=Women' },
      { label: 'Unisex', href: '/products?category=Unisex' },
      { label: 'Attar', href: '/products?category=Attar' },
      { label: 'Gift sets', href: '/products?category=Gift+Sets' },
    ],
  },
  {
    title: 'Discover',
    links: [
      { label: 'Fragrance finder', href: '/fragrance-finder' },
      { label: 'Spraykart Machine', href: '/machine' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' },
      { label: 'WhatsApp an advisor', href: 'https://wa.me/917217816676?text=Hi%2C%20I%20need%20help%20choosing%20a%20fragrance%20at%20Spraykart' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Orders and tracking', href: '/orders' },
      { label: 'Saved', href: '/wishlist' },
      { label: 'Profile', href: '/account' },
      { label: 'Sign in', href: '/login' },
    ],
  },
  {
    title: 'Care',
    links: [
      { label: 'Shipping', href: '/shipping' },
      { label: 'Returns and refunds', href: '/refund' },
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="h-foot on-ink">
      <div className="h-wrap">
        <div className="h-foot__top">
          <div className="h-foot__brand">
            <p className="t-display t-m" style={{ maxWidth: '12ch' }}>Designer, niche and attar. One house.</p>
            <FooterNewsletter />
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3>{col.title}</h3>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith('http')
                      ? <a href={l.href} target="_blank" rel="noopener noreferrer" className="h-foot__a">{l.label}</a>
                      : <Link href={l.href} className="h-foot__a">{l.label}</Link>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <p className="h-foot__word" aria-hidden="true">Spraykart</p>
      <div className="h-wrap">
        <div className="h-foot__base">
          <span>© {new Date().getFullYear()} Spraykart · Delivered across India</span>
          <span style={{ display: 'flex', gap: 24 }}>
            <a href="https://www.instagram.com/spraykart" target="_blank" rel="noopener noreferrer" className="h-foot__a" style={{ fontSize: 12 }}>Instagram</a>
            <a href="mailto:support@spraykart.in" className="h-foot__a" style={{ fontSize: 12 }}>support@spraykart.in</a>
            <span>Payments by Razorpay</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
