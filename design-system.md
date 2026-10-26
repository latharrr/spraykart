# Spraykart design system

Source of truth for every storefront page. Benchmarked against Rahasya (see the design-loop `bar.md`). Admin is out of scope.

## Colour
| token | value | use |
|---|---|---|
| `--ink` | `#000000` | text on paper, dark sections, primary button fill |
| `--paper` | `#FFFFFF` | page background, text on ink |
| `--line` | `rgba(0,0,0,.14)` on paper / `rgba(255,255,255,.22)` on ink | 1px hairlines, input borders |
| `--mute` | `rgba(0,0,0,.55)` on paper / `rgba(255,255,255,.65)` on ink | secondary text, struck MRP |
| `--signal` | `#8A1C1C` | errors and out-of-stock only. Never decorative. |

No other colours. No cream, beige, gold, green, blue or gradients. Colour comes from photography.

## Type
Two families, loaded with `next/font/google`:
- **Display:** Cormorant (`--font-display`), weight 400 only, sentence case, `letter-spacing: -0.01em`, line-height 1.05.
- **Text:** Instrument Sans (`--font-text`), weight 400 (500 only for prices).

| role | family | desktop / mobile | case | tracking |
|---|---|---|---|---|
| display-xl (hero, section titles on photos) | display | 56 / 40px | sentence | -0.01em |
| display-l (PDP name, page titles) | display | 48 / 34px | sentence | -0.01em |
| display-s (sub-heads, card titles in editorial rows) | display | 20 / 20px | sentence | 0 |
| body | text | 13 / 13px, lh 1.6 | sentence | 0 |
| label (nav, buttons, eyebrows, accordion heads, grid names) | text | 12 / 11px | UPPERCASE | 0.12em |
| micro (legal, helper) | text | 11px | sentence | 0.02em |

Nothing between 14px and 20px, and nothing between 20px and 34px. Never bold the display face.

## Space and grid
- 4px base; steps: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Page gutter: 48px desktop, 20px mobile. Max content width 1440px. Full-bleed imagery ignores the gutter.
- Section rhythm: 96px between text-led sections (64px on mobile); photo sections butt directly against each other with no gap.

## Shape and depth
- `border-radius: 0` everywhere (images, buttons, inputs, modals, drawers, toasts).
- No box-shadows. Elevation is a 1px `--line` or an ink/paper inversion.

## Controls
- **Button primary:** 40px tall, ink fill, paper label (label style), 0 radius, full width in forms and PDP. Hover: paper fill, ink label, 1px ink border, 200ms.
- **Button secondary:** 40px, transparent, 1px ink border, ink label.
- **Text link CTA:** label style followed by " →", 1px underline offset 4px on hover. Use this on photos.
- **Input:** 44px, 1px `--line` bottom border only (forms) or a full hairline box (search, coupon), 13px text, label-style placeholder.
- **Size selector:** hairline boxes 40px tall with label text; selected = ink fill.
- **Accordion:** 1px `--line` top and bottom, label-style head, chevron 12px, body text 13px.
- Icons: lucide at 16px, stroke 1.25, ink. Utilities in the header use words (SEARCH, ACCOUNT, BAG (2)), not icons, on desktop. Icons are allowed on mobile.

## Commerce patterns (Spraykart-specific, in the bar's language)
- **Price:** `₹22,000` in text 13px weight 500. MRP sits beside it as `MRP ₹28,000` in `--mute` with line-through. No "% off" chips or coloured savings.
- **Trust** (authentic, GST invoice, batch-verified): one label-style line, e.g. `100% AUTHENTIC · GST INVOICE · BATCH VERIFIED`. Never icon grids or badges.
- **Reviews:** a text line, `4.8 / 5 — 12 REVIEWS`. No star rows in grids.
- **WhatsApp help:** a text link in the header or footer and the PDP ("ASK AN ADVISOR ON WHATSAPP"). If floating, a 40px ink square with a white glyph. Never the green pill.
- **Product card:** image 4:5 on paper with no frame. Below it: brand in label style with `--mute`, name in label style ink, then price on the right of the name row. Hover shows the second image (existing behaviour).
- **Announcement bar:** ink strip, 32px, label text, static or slow marquee.

## Motion
- 200ms ease-out for hover and state changes; 600ms ease-out fade+8px rise for section reveals. Nothing bounces, and nothing animates under 150ms. Respect `prefers-reduced-motion`.
