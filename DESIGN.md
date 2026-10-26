---
name: Spraykart
description: The digital flagship of a fragrance house that stocks many houses.
colors:
  bone: "#F6F4EF"
  paper: "#EAE8E3"
  stone: "#B7B5AE"
  ink: "#0D0D0D"
  ink-2: "#55534D"
  ink-3: "#6E6B64"
  line: "rgba(13, 13, 13, 0.14)"
  line-strong: "rgba(13, 13, 13, 0.32)"
  on-ink-2: "rgba(246, 244, 239, 0.72)"
  line-on-ink: "rgba(246, 244, 239, 0.2)"
  merlot: "#5B1F2A"
  merlot-deep: "#3B141B"
typography:
  display-hero:
    fontFamily: "Oranienbaum, Didot, Bodoni 72, Georgia, serif"
    fontSize: "clamp(64px, 10.6vw, 196px)"
    fontWeight: 400
    lineHeight: 0.86
    letterSpacing: "-0.01em"
  display-xl:
    fontFamily: "Oranienbaum, Didot, Bodoni 72, Georgia, serif"
    fontSize: "clamp(48px, 6.4vw, 112px)"
    fontWeight: 400
    lineHeight: 0.86
    letterSpacing: "-0.01em"
  display-product:
    fontFamily: "Oranienbaum, Didot, Bodoni 72, Georgia, serif"
    fontSize: "clamp(48px, 5.4vw, 96px)"
    fontWeight: 400
    lineHeight: 0.86
    letterSpacing: "-0.01em"
  display-l:
    fontFamily: "Oranienbaum, Didot, Bodoni 72, Georgia, serif"
    fontSize: "clamp(40px, 4.6vw, 80px)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "-0.01em"
  display-m:
    fontFamily: "Oranienbaum, Didot, Bodoni 72, Georgia, serif"
    fontSize: "clamp(30px, 3vw, 48px)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.01em"
  display-s:
    fontFamily: "Oranienbaum, Didot, Bodoni 72, Georgia, serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1.05
  body:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
    fontFeature: "'ss01' on"
  text:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "'ss01' on"
  small:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.16em"
  label-l:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.14em"
  button:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.16em"
rounded:
  none: "0px"
spacing:
  gutter: "48px"
  gutter-mobile: "20px"
  section: "clamp(72px, 9vw, 144px)"
  nav-height: "72px"
  nav-height-mobile: "60px"
  bar-height: "34px"
  bar-height-mobile: "30px"
  container-max: "1680px"
  grid-row-gap: "56px"
  grid-column-gap: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 32px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.merlot}"
    textColor: "{colors.bone}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 32px"
    height: "52px"
  button-ghost-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
  button-light:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 32px"
    height: "52px"
  button-light-hover:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
  button-shared-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
    typography: "{typography.label-l}"
    rounded: "{rounded.none}"
    padding: "0 28px"
    height: "48px"
  button-shared-primary-hover:
    backgroundColor: "{colors.merlot}"
  button-shared-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label-l}"
    rounded: "{rounded.none}"
    padding: "0 28px"
    height: "48px"
  button-shared-danger:
    backgroundColor: "{colors.merlot}"
    textColor: "{colors.bone}"
    typography: "{typography.label-l}"
    rounded: "{rounded.none}"
    padding: "0 28px"
    height: "48px"
  button-shared-danger-hover:
    backgroundColor: "{colors.merlot-deep}"
  text-link:
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    padding: "6px 0"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.text}"
    rounded: "{rounded.none}"
    padding: "12px 14px"
    height: "48px"
  input-focus:
    backgroundColor: "{colors.paper}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "40px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
  size-tile-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.merlot}"
    rounded: "{rounded.none}"
    padding: "18px 10px 14px"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.none}"
  product-card-media:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.none}"
  announcement-bar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink-2}"
    typography: "{typography.label}"
    height: "34px"
  nav:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
    height: "72px"
  drawer:
    backgroundColor: "{colors.bone}"
    width: "min(420px, 92vw)"
  order-summary:
    backgroundColor: "{colors.paper}"
    padding: "32px"
  footer:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
    typography: "{typography.small}"
    rounded: "{rounded.none}"
    padding: "12px 18px"
---

# Design System: Spraykart

## Overview

**Creative North Star: "The Fragrance House Flagship"**

Spraykart is built like the flagship of a fashion house that happens to carry many houses. Every bottle is shown as a runway look: a full-bleed photograph, its name set monumental in condensed didone capitals, and the commercial facts (price, struck MRP, size, delivery) set small and plain beside it. The house's curation, Designer, Niche, Attar and Gifts, is the department index, the way a fashion flagship indexes womenswear and menswear.

The material is paper and ink. A warm bone ground carries everything; a slightly darker paper tone marks a panel or an image well; full ink fields invert the page for the announcement bar, the footer, the attar feature and the testimonials. Structure comes from 1px hairlines, never from boxes, radii or shadows. Density is low on the persuasion surfaces (home, listing, product) and tightens on the operating surfaces (bag, cart, checkout, account, auth) without leaving the world: the same hairlines, the same tracked-caps labels, the same square buttons.

One colour carries intent. Merlot appears only where the visitor has committed or is about to: the hover of a primary action, the selected size, the chosen payment method, the active department underline, the count in the bag, a saved heart. It is never decoration.

**Key Characteristics:**
- Bone ground, ink type, one merlot accent for active and committed state.
- Condensed high-contrast didone (Oranienbaum) in capitals for display; a grotesk (Schibsted Grotesk) for everything else.
- Square everything: 0 radius on buttons, inputs, chips, cards, images, drawers and toasts.
- 1px hairlines as the only structural device; no elevation shadows.
- Words, not icons, in the desktop navigation: SEARCH, SIGN IN / ACCOUNT, SAVED, BAG (n).
- Product photography fills its frame edge to edge on a paper well, so uneven catalogue shots still sit in the world.

## Colors

A warm achromatic paper-and-ink palette with a single deep wine accent.

### Primary
- **Merlot** (`merlot`): the committed-state colour. Primary button hover, selected size tile border and bottle drawing, selected checkout option border, checked radio and checkbox fill, active department underline, bag count, saved heart fill, and the text caret in fields.
- **Deep Merlot** (`merlot-deep`): hover of the destructive shared button only.

### Neutral
- **Bone** (`bone`): the page ground everywhere, and the text colour on ink fields. Also the drawer, sticky nav (at 94% with blur) and mobile buy bar surface.
- **Paper** (`paper`): panels and image wells. Product card media, department and look image wells, the checkout order summary, focused inputs, selected size tile and payment option, hovered menu rows and quantity steps.
- **Stone** (`stone`): scrollbar thumb; the hairline-secondary tone of the world.
- **Ink** (`ink`): all primary text, primary button fill, chip selected fill, inverse fields (announcement bar, footer, attar look, testimonials, auth panel), toasts, focus outline, active pager page.
- **Graphite** (`ink-2`): secondary text on bone (7:1): ledes, muted body, field labels, product facts.
- **Ash** (`ink-3`): tertiary text on bone (4.9:1): house names on cards, MRP, breadcrumbs, note-tier labels, placeholders.
- **Hairline** (`line`): every structural rule: nav bottom, section rules, department dividers, accordion rows, bag lines, checkout steps.
- **Strong Hairline** (`line-strong`): control outlines: inputs, chips, size tiles, quantity steppers, checkout options, underline fields, text-link underlines at rest, the total rule in summaries.
- **Bone Mute** (`on-ink-2`): secondary text on ink fields (announcement bar, footer headings, testimonial captions).
- **Hairline on Ink** (`line-on-ink`): rules inside ink fields.

The Tailwind config maps `gray` and `neutral` to a matching bone-to-ink scale (50 #F6F4EF through 950 #0D0D0D) so utility-styled pages land in the same palette. The variables `--black`, `--gray-50` to `--gray-900`, `--font-serif` and `--font-sans` in globals.css are legacy aliases kept for admin and untouched pages; they are not part of the system and new work uses the names above. `--white` is still declared but is not a surface colour of this system.

### Named Rules
**The Committed State Rule.** Merlot marks only what the visitor has chosen or is about to commit to (hover on a buy action, a selected option, the current department, a saved item, the bag count). If nothing is selected or being pressed, there is no merlot on screen.

**The No White Rule.** The lightest surface is bone. Panels step down to paper, never up to white.

**The Struck MRP Rule.** A discount is shown only as the price followed by a small, ash-coloured "MRP" with the old figure struck through. No percentage badges, no red, no sale colour.

## Typography

**Display Font:** Oranienbaum 400 (with Didot, Bodoni 72, Georgia, serif)
**Body Font:** Schibsted Grotesk (with Helvetica Neue, Arial, sans-serif), stylistic set 1 on

**Character:** A condensed, high-contrast didone in capitals does the couture work: product names, section titles, the wordmark and the footer's full-width SPRAYKART. A plain, slightly mechanical grotesk does every piece of commerce and information, with small tracked capitals for labels, navigation and buttons.

### Hierarchy
- **Display Hero** (`display-hero`, uppercase, balanced wrap): the featured bottle's name on the home hero, set in two lines.
- **Display XL** (`display-xl`, uppercase): section titles ("New to the house", "For someone else."), page titles (Checkout), empty-state statements, the auth panel line.
- **Display Product** (`display-product`, uppercase): the product name on the product page, house on one line and name below.
- **Display L / M** (`display-l`, `display-m`, uppercase): auth form titles, department names, checkout step titles, footer brand line, empty bag statement.
- **Display S** (`display-s`, mixed case): the notes pyramid entries (Top, Heart, Base) on the product page; testimonial quotes use the display face at clamp(24px, 2.1vw, 32px).
- **Body** (`body`): ledes and editorial paragraphs, held to 40–52ch.
- **Text** (`text`): the base page size; product card names and prices, input values, summary rows.
- **Small** (`small`): supporting facts, price-line details, notes under controls.
- **Label** (`label`, uppercase, 0.16em): field labels, card house names, note-tier names, meters, announcement bar, nav links (11.5px), footer column heads.
- **Label L** (`label-l`, uppercase, 0.14em): spec lines (house · concentration · size), drawer and summary panel headings, proof titles.

Prices use lining proportional figures; quantities and counters use tabular lining figures.

### Named Rules
**The Capitals Are the Couture Rule.** The display face is always uppercase where it names a bottle, a department or a section, and always weight 400. It has no italic; emphasis inside display text stays roman.

**The Label Is Not a Kicker Rule.** Tracked-caps labels name data and controls (a field, a note tier, a house, a summary panel). They never sit above a display heading as an eyebrow or section tag.

## Layout

A single centred container, max 1680px, with a side gutter of 48px (20px below 768px). Sections breathe with vertical padding of clamp(72px, 9vw, 144px). Full-bleed bands (hero, department strip, look features, footer) break out of the container and are divided by hairlines rather than gaps.

- **Home hero:** two columns, copy left (1fr) and image right (0.82fr), filling the viewport under the nav and bar. The display name overhangs into the image column. Below 1024px the image stacks first at 4:5, max 72svh.
- **Department strip:** four equal columns separated by vertical hairlines, each a 5:4 image well over a name, one line and a text link. Two columns below 1024px; below 600px each becomes a row with a 38% image.
- **Product grid:** four columns with 56px row and 24px column gaps; three below 1200px; two below 768px with 40px and 12px gaps. Cards are 4:5.
- **Look features:** 50/50 image and copy at 92vh, alternating sides; stacked below 1024px.
- **Product page:** gallery 1.15fr, info 1fr; the info column is sticky under the nav. Below 1024px the gallery becomes a horizontal snap scroller at 86% card width and a fixed buy bar slides up once the main buy row scrolls away.
- **Checkout:** 7fr form and 5fr sticky paper summary; steps separated by hairlines; address fields in a two-column grid that drops to one below 600px.
- **Auth:** 50/50, an ink panel stating the house on the left and a form column max 420px on the right; the panel hides below 1024px.
- **Navigation:** a 34px ink announcement bar above a 72px sticky nav (30px and 60px on mobile), laid out as a three-column grid: wordmark, departments, utilities.

Breakpoints in use: 480px, 600px, 768px, 1024px, 1200px.

## Elevation & Depth

Flat. Depth comes from tone (bone, paper, ink fields) and from 1px hairlines, never from drop shadows. Overlays separate by a 40% ink scrim behind a bone drawer, and the sticky nav separates by a hairline and a 10px background blur over 94% bone.

### Shadow Vocabulary
- **Selection ring** (`box-shadow: inset 0 0 0 1px var(--merlot)`): doubles the merlot border of a selected size tile or checkout option to 2px. This is a border, not elevation.
- **Radio dot** (`box-shadow: inset 0 0 0 3px var(--bone)`): insets the merlot fill of a checked radio or checkbox.
- **Caption legibility** (`text-shadow: 0 1px 12px rgba(0,0,0,.35)`): only on bone caption text laid over hero photography.

### Named Rules
**The Hairline Rule.** Anything that needs separating gets a 1px hairline (`line`, or `line-strong` for controls). No outer shadows, no cards lifted off the page.

## Shapes

Every corner is square: buttons, inputs, chips, size tiles, cards, image wells, menus, drawers, toasts, the quantity stepper and the scrollbar thumb. The only circle is the radio input. Image wells clip their photographs (`overflow: hidden`) at fixed ratios: 4:5 for products and the mobile hero, 5:4 for departments. Disclosure uses drawn geometry rather than icon glyphs: the accordion plus is two 1px bars that rotate 45° to a cross when open; the select chevron is a 1.2px stroke.

## Components

### Buttons
Square, tracked, decisive.
- **Shape:** square corners (0px).
- **Primary:** ink fill, bone text, 12px uppercase at 0.16em, 52px tall with 32px side padding; full width in drawers and the checkout summary.
- **Hover / Focus:** fill and border turn merlot over 0.3s on the house ease; focus shows a 1.5px ink outline offset 3px (bone on ink fields). Disabled drops to 45% opacity.
- **Ghost:** transparent with an ink border; hover fills ink with bone text.
- **Light:** for ink fields; bone fill with ink text, hover turns transparent with bone text and border.
- **Shared compact set** (used by admin and a few utility pages): primary, secondary and danger at 48px tall, 28px padding, 0.14em tracking. Danger is merlot, hovering to deep merlot.

### Text Links
- **Action link:** tracked uppercase 12px with a full-width 1px underline drawn as a background; on hover the underline shrinks to 30% and the trailing arrow moves 4px right, over 0.45s. Used beside a primary button ("View the bottle", "All fragrances").
- **Inline link:** body text underlined at 1px, 4px offset, in the strong hairline tone; the underline darkens to ink on hover.

### Chips
- **Style:** 40px tall, 16px padding, 12px at 0.06em, strong-hairline outline, transparent.
- **State:** hover darkens the outline to ink; pressed or applied chips fill ink with bone text. Used for listing filters, applied filters and non-size product options.

### Cards / Containers
- **Product card:** no frame. A 4:5 paper image well, then a meta grid: house in ash tracked caps, name at 14px, price right-aligned, struck MRP beneath in ash. On hover a second image fades in over 0.6s and the image scales to 1.025 over 1.2s. Save sits top-right as a 40px bone square, visible on hover (always on touch); saved fills merlot. Sold out is a bone tag at the bottom-left of the image.
- **Panel (`card`):** paper fill, no border, square.
- **Order summary:** paper panel, 32px padding, sticky in checkout.
- **Internal padding:** 24–32px on department and summary panels; 18–20px on bag lines.

### Inputs / Fields
- **Style:** transparent field, 1px strong-hairline outline, square, 48px tall, 12px 14px padding, ash placeholder, merlot caret. A tracked-caps label sits above at 8px.
- **Focus:** outline turns ink and the field fills paper.
- **Underline fields:** search, coupon and newsletter use a single bottom hairline with an inline tracked-caps action, turning ink on focus.
- **Choice controls:** 16px square checkboxes and round radios, outlined, filling merlot with a bone inset when checked. Checkout payment options are outlined rows that take the merlot selection ring and a paper fill.

### Navigation
- **Announcement bar:** ink, 34px, three proof facts in 11px tracked caps separated by 3px square dots; only the first fact shows on mobile.
- **Nav:** sticky bone bar with blur and a bottom hairline. Wordmark in display caps at 34px left; departments (Designer, Niche, Attar, Gifts, All) centre; utilities (Search, Sign in or Account, Saved, Bag (n)) right, all words in 11.5px tracked caps. Hover draws a 1px underline from the left over 0.4s; the current department keeps a merlot underline; the bag count is merlot.
- **Account menu:** a bone popover with a hairline border, rows in 13px sentence case, paper on hover.
- **Mobile (below 1024px):** departments and word utilities hide; 1.25px-stroke icons for menu, search and bag appear at 44px targets; the wordmark centres at 28px. The menu opens a left drawer listing departments in 40px display caps on hairline rows, with secondary links and sign-in buttons in the foot.

### Bag Drawer
A right-hand bone drawer, min(420px, 92vw), sliding in over 0.5s behind an ink scrim. The head reads BAG (n) in tracked caps; a free-delivery line with a 2px ink progress meter leads the body; each line is an 84px 4:5 thumbnail, house, name, size, a square quantity stepper and a remove label; the foot holds the summary rows, a hairline-ruled total, a full-width primary Checkout and a View full bag link. The empty bag is a display statement, a decant suggestion and two actions.

### Size Tiles
The product page's signature control. Each size is an outlined square tile with the bottle drawn as a line SVG at true relative scale (height grows with the cube root of volume; decants drawn as a slim atomiser), then the size and its price. Selected: merlot border with the selection ring, paper fill and a merlot bottle. Sold out drops to 40% opacity.

### Notes Pyramid
Top, Heart and Base rows on hairlines: the tier in ash tracked caps in a 76px column, the notes in the display face at 26px. On ink fields the same pattern runs as a compact definition list with on-ink hairlines.

### Accordion
Hairline-ruled rows, 56px tall summary in 12px tracked caps, with the drawn plus rotating to a cross over 0.35s.

### Motion
One ease for the house, `cubic-bezier(0.16, 1, 0.3, 1)`. State changes run 0.2–0.3s; underlines and drawers 0.4–0.5s; image hover scales 1.2–1.4s. The home hero reveals once: the image unclips upward from 108% scale over 1.6s, each name line rises from below its mask over 1.1s with a 0.08s stagger, and the facts fade in after 0.35s. All of it is gated on `prefers-reduced-motion: no-preference`, and reduced motion collapses every animation and transition.

## Do's and Don'ts

### Do:
- **Do** set every surface on bone (#F6F4EF) and step panels and image wells down to paper (#EAE8E3).
- **Do** keep merlot (#5B1F2A) for hover on a buy action, selected options, the current department, the bag count and saved state only.
- **Do** set bottle, department and section names in Oranienbaum capitals at weight 400 with line-height 0.86–0.95.
- **Do** separate with 1px hairlines: `line` for structure, `line-strong` for control outlines.
- **Do** keep every corner at 0px; the radio input is the only circle.
- **Do** show price followed by a small ash "MRP" with the old figure struck through.
- **Do** use words in tracked caps for desktop navigation and utilities; use 1.25px-stroke line icons only where a word will not fit (mobile nav targets, close, quantity, save, link arrows, the product fact list).
- **Do** put proof facts (originals with GST invoice, free delivery above ₹999, COD, returns) beside the decision in small graphite text.
- **Do** gate every entrance animation on `prefers-reduced-motion: no-preference` and use the house ease.

### Don't:
- **Don't** use white (#FFFFFF) as a surface; the lightest surface is bone.
- **Don't** add drop shadows or lift cards off the page; the only box-shadows are the inset selection ring and radio dot.
- **Don't** round corners on any button, field, chip, card, image, menu, drawer or toast.
- **Don't** use percentage-off badges, red sale colour or loud discount tags.
- **Don't** place tracked-caps labels, eyebrows or kickers above display headings.
- **Don't** introduce a second accent colour or use merlot as decoration or a section background.
- **Don't** italicise the display face; it has no italic.
- **Don't** reach for the legacy `--gray-*`, `--black`, `--font-serif` or `--font-sans` aliases in new storefront work.
