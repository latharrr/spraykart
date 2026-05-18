export const metadata = {
  title: 'Shop Luxury Perfumes & Attars Online | Spraykart',
  description: 'Browse 100+ authentic luxury perfumes, attars & niche fragrances. Filter by category, price & occasion. Free shipping above ₹999. Pan-India delivery.',
  alternates: { canonical: '/products' },
  openGraph: {
    title: 'Shop Luxury Perfumes & Attars Online | Spraykart',
    description: 'Browse 100+ authentic luxury perfumes, attars & niche fragrances. Filter by category, price & occasion.',
    url: '/products',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Spraykart Fragrance Collection' }],
  },
};

export default function ProductsLayout({ children }) {
  return children;
}
