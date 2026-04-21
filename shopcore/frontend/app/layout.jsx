import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import './globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Spraykart — Luxury Fragrances at Accessible Prices', template: '%s | Spraykart' },
  description: 'India\'s most trusted luxury fragrance store. 100% authentic perfumes, attars & gift sets. MCA registered, GST invoiced. Pan-India delivery.',
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontFamily: 'Inter, sans-serif', fontSize: '14px', background: '#fff', color: '#12100c', border: '1px solid #ece8e0' },
            success: { iconTheme: { primary: '#b8922a', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
