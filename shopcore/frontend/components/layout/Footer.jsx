import Link from 'next/link';
import { Instagram, Twitter, Facebook, Mail } from 'lucide-react';

const footerLinks = {
  Shop: [
    { label: 'All Fragrances',     href: '/products' },
    { label: "Men's Fragrances",   href: '/products?category=Men' },
    { label: "Women's Fragrances", href: '/products?category=Women' },
    { label: 'Attar & Unisex',     href: '/products?category=Attar' },
    { label: 'Gift Sets',          href: '/products?category=Gift+Sets' },
  ],
  Account: [
    { label: 'My Orders',  href: '/orders' },
    { label: 'Track Order',href: '/orders' },
    { label: 'My Account', href: '/account' },
    { label: 'Sign In',    href: '/login' },
  ],
  Support: [
    { label: 'Contact Us',       href: '/contact' },
    { label: 'Privacy Policy',   href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Refund Policy',    href: '/refund-policy' },
    { label: 'Shipping Policy',  href: '/shipping-policy' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-black text-neutral-400">
      <style>{`
        .ftr-link  { color:#737373; font-size:13px; text-decoration:none; transition:color .15s; }
        .ftr-link:hover { color:#fff; }
        .ftr-social{ display:flex; width:34px; height:34px; align-items:center; justify-content:center; border:1px solid #262626; border-radius:2px; color:#737373; transition:all .15s; }
        .ftr-social:hover{ border-color:#fff; color:#fff; }
      `}</style>

      <div className="max-w-7xl mx-auto px-5 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-baseline gap-0 mb-4">
              <span className="text-xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.02em' }}>
                Spray<em className="font-normal">kart</em>
              </span>
            </Link>
            <p className="text-[13px] text-neutral-500 max-w-xs leading-relaxed mb-2">
              India&apos;s most trusted luxury fragrance platform. 100% authentic perfumes, attars &amp; niche fragrances.
            </p>
            <p className="text-[11px] text-neutral-700 mb-6 tracking-wide">
              स्प्रेकार्ट · ஸ்ப்ரேகார்ட் · స్ప్రేకార్ట్ · স্প্রেকার্ট · સ્પ્રేકાર્ટ
            </p>
            <div className="flex gap-2">
              {[
                { Icon: Instagram, href: '#', label: 'Instagram' },
                { Icon: Twitter,   href: '#', label: 'Twitter' },
                { Icon: Facebook,  href: '#', label: 'Facebook' },
                { Icon: Mail,      href: 'mailto:support@spraykart.in', label: 'Email' },
              ].map(({ Icon, href, label }) => (
                <a key={label} href={href} aria-label={label} className="ftr-social">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-white text-xs font-semibold tracking-[0.1em] uppercase mb-4">{section}</h3>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="ftr-link">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-white/8 mt-14 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-700 flex flex-wrap gap-3">
            <span>© {new Date().getFullYear()} Spraykart</span>
            <span>·</span>
            <span>MCA Registered</span>
            <span>·</span>
            <span>Govt. of India Recognized Startup</span>
          </p>
          <p className="text-xs text-neutral-700 flex items-center gap-2">
            Payments secured by <span className="text-neutral-500 font-medium">Razorpay</span>
            &nbsp;·&nbsp;GST Invoice with every order
          </p>
        </div>
      </div>
    </footer>
  );
}
