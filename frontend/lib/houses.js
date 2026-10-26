// Editorial curation tiers. "Niche" houses are perfumers that work outside the big fashion groups;
// everything else in a fragrance category is "Designer". Attar and Gift Sets are their own departments.
// Edit this list as the catalogue grows; a `tier` column on products would replace it.
export const NICHE_HOUSES = [
  'Creed', 'Tom Ford', 'Maison Margiela', 'Byredo', 'Le Labo', 'Amouage', 'Xerjoff', 'Kilian',
  'Maison Francis Kurkdjian', 'Roja Parfums', 'Initio', 'Parfums de Marly', 'Nishane', 'Diptyque',
  'Frederic Malle', 'Mancera', 'Montale', 'Penhaligon\'s', 'Acqua di Parma', 'Memo Paris', 'Ex Nihilo',
];

export const TIERS = {
  designer: { label: 'Designer', line: 'The fashion houses: Dior, Chanel, YSL, Versace and their icons, as originals.' },
  niche: { label: 'Niche', line: 'Independent perfumers, from Creed and Tom Ford to the names enthusiasts hunt for.' },
};

export function tierOf(product) {
  if (product.category === 'Attar' || product.category === 'Gift Sets') return null;
  return NICHE_HOUSES.some((h) => h.toLowerCase() === String(product.brand || '').toLowerCase()) ? 'niche' : 'designer';
}
