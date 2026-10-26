---
version: 1
slug: "frontend-app-page-jsx"
primary_target: "frontend/app/page.jsx"
related_targets: ["frontend/app/products/page.jsx","frontend/app/products/[slug]/page.jsx","frontend/app/cart/page.jsx","frontend/app/checkout/page.jsx"]
---

# Storefront surface brief

Scope: the whole customer storefront (home, listing, product page, cart, checkout, account, wishlist, auth, finder, info pages). Admin is out of scope.
Mode: Persuade on home and listing; Operate on cart, checkout, account and auth (same world, quieter register).

Audience: aspiring luxury buyers, enthusiasts and gifters, equally (PRODUCT.md). Action: find a scent and add it to the bag. Proof: originals, GST invoice, batch verified, price vs MRP, 7-day returns, free shipping over ₹999; review data only from the DB.

Memorable moment: the bottle shown like a runway look, its name set monumental, with the house's curation (Designer / Niche / Attar) as the department index.

## Direction contract

THESIS: Spraykart is the digital flagship of a fragrance house that happens to stock many houses. Every bottle gets a runway look: full-bleed image, its name monumental. It refuses the Indian perfume-site default of banner carousels, badge-covered grids and green WhatsApp pills.

OWN-WORLD: Bone #F6F4EF ground, paper #EAE8E3 panels, stone #B7B5AE hairline-secondary, ink #0D0D0D, one merlot #5B1F2A accent reserved for the active or committed state. A condensed high-contrast didone in caps for display (Oranienbaum); a Haas-like grotesk for everything else, labels in tracked caps. 0 radius, 1px hairlines, no shadows, no badges, no icons in desktop nav (words: SEARCH, ACCOUNT, BAG (0)).

STORY: The visitor sees one bottle presented like couture and believes this house curates rather than stocks. Price vs MRP, authenticity and delivery facts sit quietly beside every buy action. They move from a look to a department (Designer, Niche, Attar, Gift Sets) to a bottle, read its notes as a typographic pyramid, choose a size drawn at true scale, and add to bag from a drawer.

FIRST VIEWPORT: The hairline nav spans the top: wordmark left, departments centre, SEARCH / ACCOUNT / BAG right. The left 55% holds the featured bottle's name in caps display at about 9vw (two lines, low), with a 13px line under it (house · concentration · size, price with struck MRP) and two actions: ADD TO BAG (ink fill) and the text link VIEW THE BOTTLE. The right 45% is the full-height product image, edge to edge. Under the fold line, the department strip begins: four columns, each an image plus department name and a one-line description, divided by hairlines.

FORM: Luxury fashion-house flagship (challenger luxury-fashion-flagship, chosen by the user over assigned candidate 7 "The Scent Organ"); seed key 80918655.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
