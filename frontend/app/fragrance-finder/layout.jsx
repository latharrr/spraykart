// app/fragrance-finder/layout.jsx
// Server component — provides metadata for the Fragrance Finder page

export const metadata = {
  title: 'Fragrance Finder — Find Your Perfect Scent | Spraykart',
  description: 'Take our 5-question quiz and discover the perfect fragrance for your occasion, mood, and budget. Personalised recommendations from Spraykart.',
  alternates: { canonical: '/fragrance-finder' },
  openGraph: {
    title: 'Fragrance Finder — Find Your Perfect Scent | Spraykart',
    description: 'Take our 5-question quiz and discover the perfect fragrance for your occasion, mood, and budget.',
    url: '/fragrance-finder',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Spraykart Fragrance Finder Quiz' }],
  },
};

export default function FragranceFinderLayout({ children }) {
  return children;
}
