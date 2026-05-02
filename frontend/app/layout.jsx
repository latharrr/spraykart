import { Cormorant, Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CookieBanner from '@/components/layout/CookieBanner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

const cormorant = Cormorant({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
  fallback: ['Georgia', 'serif'],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Spraykart - Luxury Fragrances at Accessible Prices', template: '%s | Spraykart' },
  description: "India's most trusted luxury fragrance store. 100% authentic perfumes, attars & gift sets. Pan-India delivery.",
  keywords: ['luxury perfumes India', 'buy authentic perfumes online', 'attar', 'niche fragrances', 'Spraykart'],
  openGraph: {
    type: 'website',
    siteName: 'Spraykart',
    images: [{ url: '/og-image.jpg' }],
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0c0c0c',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <head>
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="preload" as="image" href="/hero-desktop.webp" media="(min-width: 768px)" fetchPriority="high" />
        <link rel="preload" as="image" href="/hero-mobile.webp" media="(max-width: 767px)" fetchPriority="high" />
      </head>
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <CookieBanner />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
              fontSize: '14px',
              background: '#fff',
              color: '#12100c',
              border: '1px solid #ece8e0',
            },
            success: { iconTheme: { primary: '#b8922a', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
