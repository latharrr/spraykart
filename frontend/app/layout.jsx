import { Oranienbaum, Schibsted_Grotesk } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CookieBanner from '@/components/layout/CookieBanner';
import ExitIntentPopup from '@/components/ExitIntentPopup';
import { SITE_URL } from '@/lib/env';
import './globals.css';

const display = Oranienbaum({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
  fallback: ['Didot', 'Georgia', 'serif'],
});

const text = Schibsted_Grotesk({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-text',
  display: 'swap',
  fallback: ['Helvetica Neue', 'Arial', 'sans-serif'],
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Spraykart — Original Designer & Niche Perfumes and Attars in India', template: '%s | Spraykart' },
  description: 'Designer and niche perfumes and Indian attars, every bottle an original with a GST invoice. Try most as a 10 ml decant. Free delivery above ₹999 across India.',
  keywords: ['luxury perfumes India', 'buy authentic perfumes online', 'attar', 'niche fragrances', 'Spraykart', 'buy perfumes online India', 'perfume shop India'],
  authors: [{ name: 'Spraykart' }],
  creator: 'Spraykart',
  publisher: 'Spraykart',
  openGraph: {
    type: 'website',
    siteName: 'Spraykart',
    locale: 'en_IN',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Spraykart' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@spraykart',
    creator: '@spraykart',
    images: ['/og-image.jpg'],
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#F6F4EF',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`}>
      <head>
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
      </head>
      <body>
        <a href="#main" className="h-skip">Skip to content</a>
        <Navbar />
        <main id="main" className="h-main">{children}</main>
        <Footer />
        <CookieBanner />
        <ExitIntentPopup />
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'var(--font-text), system-ui, sans-serif',
              fontSize: '13px',
              letterSpacing: '0.01em',
              background: '#0D0D0D',
              color: '#F6F4EF',
              borderRadius: 0,
              padding: '12px 18px',
              boxShadow: 'none',
            },
            success: { iconTheme: { primary: '#F6F4EF', secondary: '#0D0D0D' } },
            error: { iconTheme: { primary: '#F6F4EF', secondary: '#5B1F2A' } },
          }}
        />
      </body>
    </html>
  );
}
