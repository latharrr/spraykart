import { Cormorant, Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import './globals.css';

// ─── Fonts loaded server-side — ZERO render-blocking, ZERO layout shift ───────
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
  preload: true,
  fallback: ['Georgia', 'serif'],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Spraykart — Luxury Fragrances at Accessible Prices', template: '%s | Spraykart' },
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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <head>
        {/* DNS prefetch for external domains used at runtime */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://checkout.razorpay.com" crossOrigin="anonymous" />
        {/*
          Preload hero images before React hydrates.
          Desktop image preloaded on md+ screens, mobile on smaller screens.
          fetchpriority=high tells browser: load this before anything else.
        */}
        <link
          rel="preload"
          as="image"
          href="/hero-desktop.jpeg"
          media="(min-width: 768px)"
          // @ts-ignore — fetchpriority is valid HTML but not in TS types yet
          fetchpriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/hero-mobile.png"
          media="(max-width: 767px)"
          fetchpriority="high"
        />
      </head>
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
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
