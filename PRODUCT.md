# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
A general storefront serving three groups equally (confirmed 2026-10-26):
- **Aspiring luxury buyers:** buying their first designer bottle, price-aware, afraid of fakes.
- **Fragrance enthusiasts:** know notes and houses, try widely through decants, want depth and niche picks.
- **Gifters:** buying for weddings, birthdays and festivals, who need guidance, gift sets and fast delivery.

All three shop mostly on mobile in India and pay with UPI, cards or COD.

## Product Purpose
Spraykart sells authentic designer and niche perfumes and Indian attars online across India. Success means a visitor finds a scent they trust is real, at a price they understand, and checks out without leaving to verify anything elsewhere.

## Positioning
**Curation under one roof:** a considered edit spanning designer houses (Dior, Chanel, Creed, Tom Ford, Maison Margiela), niche, and traditional Indian attars, which most Indian retailers keep in separate worlds. Authenticity (invoice-backed, batch-code verified originals) and below-MRP pricing are the floor that makes the curation credible, not the headline.

## Operating Context
- Categories: Men, Women, Unisex, Attar, Gift Sets. Products carry brand, scent family, top, heart and base notes, longevity, sillage, season and occasion.
- Sizes: full bottles plus 10 ml decants on many products, and a 6 × 5 ml Discovery Set.
- Discovery tools: Fragrance Finder (5-question quiz) and WhatsApp advisor chat.
- Spraykart Machine: an in-person spray/try vending machine, marked "Launching soon".
- Payments: Razorpay, Paytm, COD. Free shipping above ₹999. 7-day returns. Coupons. GST invoices are generated per order.
- Accounts: orders, wishlist, addresses. An admin panel exists (out of scope for storefront design).

## Capabilities and Constraints
- Next.js 14 App Router, Tailwind, Postgres, Cloudinary images, Vercel deploy. Stack is fixed.
- Product imagery is whatever the catalogue holds (mixed brand and retailer shots, uneven backgrounds). Design must hold up with imperfect product photos.
- Homepage hero image is admin-uploadable (`homepage_assets`).
- No image generation available in this environment.

## Brand Commitments
- Name and wordmark: "Spraykart".
- Prices are shown as price with struck MRP. No red or loud "% off" badges (confirmed 2026-10-26).

## Evidence on Hand
- Real: product catalogue fields, policies (shipping, refund, privacy, terms), FAQs and testimonials managed in admin.
- Not on hand: brand photography, press, verified customer counts or ratings. Do not invent "10,000+ customers", review averages or press logos. Show review data only from the database.

## Product Principles
1. **Curate, don't stock.** Every surface should feel edited: fewer, better-explained choices over endless grids.
2. **Proof before persuasion.** Authenticity, price vs MRP, delivery, returns and invoice facts sit where the decision happens, stated plainly.
3. **Make scent legible.** Notes, family, longevity and occasion are the language customers use to choose without smelling; they are first-class content, not tabs.
4. **Lower the risk of a blind buy.** Decants, the discovery set, the Finder and WhatsApp advice are paths to a confident purchase, not side features.
5. **Mobile first, India first.** ₹ formatting, COD/UPI, WhatsApp and fast-loading pages on mid-range phones.

## Accessibility & Inclusion
WCAG 2.2 AA contrast and keyboard access across the storefront; respect `prefers-reduced-motion`.
