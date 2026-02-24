# Front-End (Site Styling) Runbook

This runbook describes how to style EDS blocks and page templates for the AEM EDS + App Builder programme, covering global CSS architecture, design token usage, block-level styling, Svelte web-component theming and cross-market styling variants.

---

## Table of Contents

1. [CSS Architecture](#1-css-architecture)
2. [Design Tokens](#2-design-tokens)
3. [Block Styling](#3-block-styling)
4. [Svelte Component Theming](#4-svelte-component-theming)
5. [Responsive Design](#5-responsive-design)
6. [Typography](#6-typography)
7. [Icons](#7-icons)
8. [Market-Specific Overrides](#8-market-specific-overrides)
9. [Dark Mode](#9-dark-mode)
10. [Performance Considerations](#10-performance-considerations)
11. [Styling Checklist](#11-styling-checklist)

---

## 1. CSS Architecture

### 1.1 File Structure

EDS loads CSS in two phases to optimise LCP:

```
apps/eds-<market>/styles/
├── styles.css        # Critical CSS — loaded immediately (LCP path)
├── lazy-styles.css   # Non-critical CSS — loaded after LCP
└── fonts.css         # Font face declarations
```

**Loading order in `scripts/aem.js`:**

1. `styles.css` — injected as `<link rel="stylesheet">` in `<head>` during EDS initialisation
2. `lazy-styles.css` — loaded asynchronously after the page is interactive
3. Block CSS — each block's CSS is loaded by EDS when the block is rendered

**Block CSS files:**

```
apps/eds-<market>/blocks/
├── promotion-banner/
│   ├── promotion-banner.js
│   └── promotion-banner.css    # Loaded only when block is on the page
├── menu-item/
│   ├── menu-item.js
│   └── menu-item.css
└── product-detail/
    ├── product-detail.js
    └── product-detail.css
```

### 1.2 CSS Methodology

EDS uses **vanilla CSS** (no preprocessors, no CSS-in-JS). Follow these conventions:

- Use **CSS custom properties** (design tokens) for all colours, spacing and typography.
- Use **BEM-inspired class names** for block elements: `.<block>-<element>`.
- Avoid deeply nested selectors — keep specificity low.
- Prefer **CSS Grid** and **Flexbox** for layout.
- Avoid `!important` except as a last resort for third-party overrides.

---

## 2. Design Tokens

### 2.1 Token Definitions

All design tokens are defined as CSS custom properties in `styles/styles.css`:

```css
/* ==========================================================================
   Design Tokens
   ========================================================================== */

:root {
  /* --- Colour — Brand --- */
  --color-brand-primary:   #00704A;
  --color-brand-secondary: #1E3932;
  --color-brand-accent:    #CBA258;

  /* --- Colour — Neutral --- */
  --color-neutral-50:  #FAFAF8;
  --color-neutral-100: #F2F0EB;
  --color-neutral-200: #E3E0D8;
  --color-neutral-300: #CAC5BA;
  --color-neutral-600: #72706B;
  --color-neutral-900: #1E1E1E;

  /* --- Colour — Semantic --- */
  --color-text-primary:    var(--color-neutral-900);
  --color-text-secondary:  var(--color-neutral-600);
  --color-text-inverse:    #FFFFFF;
  --color-background:      #FFFFFF;
  --color-surface:         var(--color-neutral-50);
  --color-border:          var(--color-neutral-200);

  /* --- Typography --- */
  --font-family-heading: 'SoDo Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --font-family-body:    'SoDo Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;

  --font-size-xs:   .75rem;    /* 12px */
  --font-size-sm:   .875rem;   /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg:   1.25rem;   /* 20px */
  --font-size-xl:   1.5rem;    /* 24px */
  --font-size-2xl:  2rem;      /* 32px */
  --font-size-3xl:  2.5rem;    /* 40px */
  --font-size-4xl:  3rem;      /* 48px */

  --font-weight-regular:  400;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;

  --line-height-tight:  1.2;
  --line-height-normal: 1.5;
  --line-height-loose:  1.75;

  /* --- Spacing --- */
  --space-1:  .25rem;   /*  4 px */
  --space-2:  .5rem;    /*  8 px */
  --space-3:  .75rem;   /* 12 px */
  --space-4:  1rem;     /* 16 px */
  --space-5:  1.25rem;  /* 20 px */
  --space-6:  1.5rem;   /* 24 px */
  --space-8:  2rem;     /* 32 px */
  --space-10: 2.5rem;   /* 40 px */
  --space-12: 3rem;     /* 48 px */
  --space-16: 4rem;     /* 64 px */
  --space-20: 5rem;     /* 80 px */

  /* --- Layout --- */
  --max-content-width: 1280px;
  --section-padding-h: var(--space-6);

  /* --- Border --- */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   16px;
  --radius-full: 9999px;
  --border-width: 1px;

  /* --- Shadow --- */
  --shadow-sm: 0 1px 3px rgba(0 0 0 / .08);
  --shadow-md: 0 4px 12px rgba(0 0 0 / .12);
  --shadow-lg: 0 8px 24px rgba(0 0 0 / .16);

  /* --- Transition --- */
  --transition-fast:   100ms ease;
  --transition-normal: 200ms ease;
  --transition-slow:   300ms ease;
}
```

### 2.2 Using Tokens

Always reference tokens — never hard-code values:

```css
/* ✅ Correct */
.promotion-banner {
  background-color: var(--color-brand-primary);
  padding: var(--space-8) var(--section-padding-h);
}

/* ❌ Incorrect */
.promotion-banner {
  background-color: #00704A;
  padding: 32px 24px;
}
```

---

## 3. Block Styling

### 3.1 `promotion-banner`

```css
/* blocks/promotion-banner/promotion-banner.css */

.promotion-banner {
  position: relative;
  overflow: hidden;
  background-color: var(--color-brand-secondary);
  color: var(--color-text-inverse);
  text-align: center;
  padding: var(--space-16) var(--section-padding-h);
}

.promotion-banner picture {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.promotion-banner picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: .6;
}

.promotion-banner-content {
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
}

.promotion-banner h1,
.promotion-banner h2 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-4);
}

.promotion-banner p {
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-8);
}

.promotion-banner .button {
  display: inline-block;
  background-color: var(--color-text-inverse);
  color: var(--color-brand-primary);
  font-weight: var(--font-weight-bold);
  padding: var(--space-3) var(--space-8);
  border-radius: var(--radius-full);
  text-decoration: none;
  transition: background-color var(--transition-fast);
}

.promotion-banner .button:hover,
.promotion-banner .button:focus-visible {
  background-color: var(--color-neutral-100);
}
```

### 3.2 `menu-item` Grid

```css
/* blocks/menu-item/menu-item.css */

.menu-item-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  list-style: none;
  margin: 0;
  padding: 0;
}

@media (min-width: 600px) {
  .menu-item-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .menu-item-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Skeleton loading state */
.menu-item-skeleton {
  background: linear-gradient(90deg, var(--color-neutral-100) 25%, var(--color-neutral-200) 50%, var(--color-neutral-100) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: var(--radius-md);
  height: 320px;
}

@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 3.3 `product-detail`

```css
/* blocks/product-detail/product-detail.css */

.product-detail {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: var(--space-8) var(--section-padding-h);
}

@media (min-width: 768px) {
  .product-detail {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

.product-detail-image img {
  width: 100%;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.product-detail-info h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-2);
}

.product-detail-price {
  font-size: var(--font-size-xl);
  color: var(--color-brand-primary);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-6);
}
```

---

## 4. Svelte Component Theming

Svelte web components (`sbux-menu-card`, `sbux-product-customizer`) receive design tokens via CSS custom properties on the host element. This allows global token changes to propagate into shadow DOM components.

**In `packages/eds-components/src/components/sbux-menu-card.svelte`:**

```svelte
<style>
  :host {
    display: block;
    font-family: var(--font-family-body, sans-serif);
    --card-radius: var(--radius-md, 8px);
  }

  .card {
    border-radius: var(--card-radius);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    background: var(--color-background, #fff);
    transition: box-shadow var(--transition-normal, 200ms ease);
  }

  .card:hover {
    box-shadow: var(--shadow-md);
  }
</style>
```

Ensure that any token used inside a Svelte component has a sensible fallback value (second argument to `var()`).

---

## 5. Responsive Design

### 5.1 Mobile-First Approach

Write base styles for mobile and add breakpoints for larger screens:

```css
/* Mobile base */
.section {
  padding: var(--space-8) var(--space-4);
}

/* Tablet */
@media (min-width: 600px) {
  .section {
    padding: var(--space-12) var(--space-6);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .section {
    padding: var(--space-16) var(--section-padding-h);
  }
}
```

### 5.2 Content Width

Constrain content width using a utility class:

```css
/* styles/styles.css */
.section > div {
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 0 var(--section-padding-h);
}
```

---

## 6. Typography

### 6.1 Font Loading

Declare fonts in `styles/fonts.css` using `font-display: swap` to prevent FOIT:

```css
@font-face {
  font-family: 'SoDo Sans';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/SoDoSans-Regular.woff2') format('woff2');
}

@font-face {
  font-family: 'SoDo Sans';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/SoDoSans-Bold.woff2') format('woff2');
}
```

### 6.2 Heading Scale

Apply heading styles globally in `styles/styles.css`:

```css
h1 { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); line-height: var(--line-height-tight); }
h2 { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); line-height: var(--line-height-tight); }
h3 { font-size: var(--font-size-xl);  font-weight: var(--font-weight-semibold); }
h4 { font-size: var(--font-size-lg);  font-weight: var(--font-weight-semibold); }
p  { font-size: var(--font-size-base); line-height: var(--line-height-normal); }
```

---

## 7. Icons

Store SVG icons in `apps/eds-<market>/icons/`. EDS automatically inlines SVG icons when referenced with the standard icon pattern in block HTML:

```html
<!-- In block HTML output -->
<span class="icon icon-star"></span>
```

EDS resolves this to `icons/star.svg` and inlines the SVG.

**Icon naming convention:** kebab-case, descriptive noun (`icon-star`, `icon-location`, `icon-cart`).

---

## 8. Market-Specific Overrides

Apply market-specific token overrides by reading the `market` data attribute set on `<body>` during EDS initialisation:

```css
/* styles/styles.css — market-specific token overrides */

/* JP — larger base font for legibility with Japanese characters */
[data-market='jp'] {
  --font-size-base: 1.0625rem;  /* 17 px */
  --line-height-normal: 1.75;
}

/* UK — cookie consent banner offset */
[data-market='uk'] {
  --cookie-banner-offset: 64px;
}
```

Set the `data-market` attribute in `scripts/aem.js`:

```js
document.body.dataset.market = window.siteConfig?.market || 'us';
```

---

## 9. Dark Mode

Dark mode is opt-in and driven by the `prefers-color-scheme` media query. Define dark-mode token overrides:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-background:     #1A1A1A;
    --color-surface:        #252525;
    --color-text-primary:   #F2F0EB;
    --color-text-secondary: #CAC5BA;
    --color-border:         #3A3A3A;
  }
}
```

Dark mode is currently **optional** for this project. Confirm with the Starbucks brand team before enabling.

---

## 10. Performance Considerations

### 10.1 Critical CSS

Keep `styles/styles.css` as small as possible — it is render-blocking. Move non-critical styles (below-the-fold animations, rarely-used utilities) to `lazy-styles.css`.

### 10.2 Avoiding Layout Shift (CLS)

- Always specify `width` and `height` attributes on `<img>` elements.
- Reserve space for fonts with `font-display: swap` and a matching fallback font stack.
- Avoid CSS animations that affect layout properties (`width`, `height`, `top`, `left`). Prefer `transform` and `opacity`.
- Ensure the `promotion-banner` picture element has a defined `aspect-ratio` to prevent layout shift as the image loads:

```css
.promotion-banner picture {
  aspect-ratio: 16 / 7;
}
```

### 10.3 Minimising Unused CSS

EDS loads block CSS only when that block appears on the page. Keep block CSS files scoped to the block's own class names to prevent leaking styles.

---

## 11. Styling Checklist

Complete this checklist for each block before marking the implementation story as Done:

**Design fidelity:**

- [ ] Desktop design (1280 px) matches XD / Figma comp pixel-by-pixel
- [ ] Tablet design (768 px) matches comp
- [ ] Mobile design (375 px) matches comp

**Tokens:**

- [ ] No hard-coded colour, spacing or font values — all use CSS custom properties
- [ ] All tokens defined in `styles/styles.css` (not in block CSS)

**Performance:**

- [ ] All images have `width`, `height`, `loading="lazy"` (except LCP image: `loading="eager"`)
- [ ] No render-blocking CSS added outside `styles/styles.css`
- [ ] Lighthouse CLS score ≤ 0.1

**Accessibility:**

- [ ] Colour contrast ≥ 4.5:1 (verified with browser accessibility tools)
- [ ] All interactive elements have visible `:focus-visible` styles
- [ ] `lang` attribute correct on `<html>` for each market

**Cross-browser:**

- [ ] Tested in Chrome, Firefox, Safari (macOS) and Safari (iOS)
- [ ] No polyfills required for features used
