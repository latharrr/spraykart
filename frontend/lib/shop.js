// Client-safe storefront helpers: one source of truth for prices, sizes and images.

export const FREE_SHIPPING_AT = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || 999);
export const SHIPPING_FEE = Number(process.env.NEXT_PUBLIC_STANDARD_SHIPPING_FEE || 49);
export const WHATSAPP_URL = 'https://wa.me/917217816676?text=Hi%2C%20I%20need%20help%20choosing%20a%20fragrance%20at%20Spraykart';

export function inr(amount) {
  const n = Number(amount || 0);
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: n % 1 ? 2 : 0 })}`;
}

export function unitPrice(product, variant) {
  return (Number(product.price) || 0) + (variant ? Number(variant.price_modifier) || 0 : 0);
}

// MRP follows the same modifier as the price unless the variant carries its own.
export function unitMrp(product, variant) {
  if (variant?.compare_price) return Number(variant.compare_price);
  if (!product.compare_price) return null;
  return Number(product.compare_price) + (variant ? Number(variant.price_modifier) || 0 : 0);
}

// "10 ml decant", "100ml", "50 ML" → 10, 100, 50
export function mlOf(label) {
  const m = String(label || '').match(/(\d+(?:\.\d+)?)\s*ml/i);
  return m ? Number(m[1]) : null;
}

export function perMl(price, ml) {
  if (!ml) return null;
  const v = price / ml;
  return `${inr(v >= 100 ? Math.round(v) : Math.round(v * 10) / 10)} / ml`;
}

const CLOUDINARY_UPLOAD = /\/upload\//;

export function sizedImage(url, width = 800) {
  if (!url) return url;
  if (url.includes('res.cloudinary.com')) return url.replace(CLOUDINARY_UPLOAD, `/upload/f_auto,q_auto,w_${width}/`);
  return url;
}

export function houseOf(product) {
  return product.brand || product.category || 'Spraykart';
}

// Product names in the catalogue often repeat the house ("Tom Ford Oud Wood"); show the rest once the house is printed above.
export function nameWithoutHouse(product) {
  const house = product.brand;
  const name = product.name || '';
  if (house && name.toLowerCase().startsWith(house.toLowerCase() + ' ')) return name.slice(house.length + 1);
  return name;
}
