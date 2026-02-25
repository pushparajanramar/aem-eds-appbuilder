# UX Solution Design Runbook

This runbook guides the UX Consultant (and the broader team) through the UX Solution Design workstream for the AEM EDS + App Builder programme. It covers the design process from brand alignment through to handover of production-ready design assets.

---

## Table of Contents

1. [UX Design Process](#1-ux-design-process)
2. [Design System & Tokens](#2-design-system--tokens)
3. [Page Templates](#3-page-templates)
4. [Block Design](#4-block-design)
5. [XD / Figma Toolkit](#5-xd--figma-toolkit)
6. [Responsive Design](#6-responsive-design)
7. [Accessibility](#7-accessibility)
8. [Design Handover](#8-design-handover)
9. [Design Review & Approval](#9-design-review--approval)

---

## 1. UX Design Process

### 1.1 Phases

```
Discovery
    │
    ├─1. Brand Alignment ──────────────────► Global design tokens (colours, fonts, spacing)
    │
    ├─2. Information Architecture ─────────► Sitemap + content hierarchy
    │
    ├─3. Wireframing ──────────────────────► Low-fidelity layouts per page type
    │
    ├─4. Visual Design ────────────────────► High-fidelity XD / Figma comps
    │
    ├─5. Prototype ────────────────────────► Interactive XD / Figma prototype for UAT
    │
    └─6. Handover ─────────────────────────► CSS design tokens + annotated spec → Tech/Dev
```

### 1.2 Responsibilities

| Activity | Owner | Reviewed by |
|---|---|---|
| Brand alignment | UX Consultant | Quick Service Restaurant brand team |
| Wireframes | UX Consultant | Functional Lead + Quick Service Restaurant Content Lead |
| Visual designs | UX Consultant | Quick Service Restaurant brand team + Client Partner |
| Prototype | UX Consultant | UAT participants |
| CSS implementation | AEM Consultant (Tech/Dev) | UX Consultant |

---

## 2. Design System & Tokens

### 2.1 Design Tokens in EDS

Design tokens are implemented as CSS custom properties in `apps/eds-*/styles/`. There is a shared baseline for all markets, with market-specific overrides where needed.

**File structure:**

```
apps/eds-<market>/styles/
├── styles.css          # Global CSS (imports tokens, typography, layout)
├── lazy-styles.css     # Non-critical CSS loaded after LCP
└── fonts.css           # Font declarations
```

### 2.2 Core Design Tokens

Define the following token categories for all three markets:

#### Colour tokens

```css
:root {
  /* Brand colours */
  --color-brand-primary:    #00704A;  /* Quick Service Restaurant green */
  --color-brand-secondary:  #1E3932;  /* Dark green */
  --color-brand-accent:     #CBA258;  /* Gold */

  /* Neutral palette */
  --color-neutral-100: #F2F0EB;
  --color-neutral-200: #E3E0D8;
  --color-neutral-900: #1E1E1E;

  /* Semantic colours */
  --color-text-primary:     var(--color-neutral-900);
  --color-text-inverse:     #FFFFFF;
  --color-background:       #FFFFFF;
  --color-surface:          var(--color-neutral-100);
}
```

#### Typography tokens

```css
:root {
  /* Font families */
  --font-family-heading: 'SoDo Sans', sans-serif;
  --font-family-body:    'SoDo Sans', sans-serif;

  /* Font sizes */
  --font-size-xs:   0.75rem;   /* 12px */
  --font-size-sm:   0.875rem;  /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg:   1.25rem;   /* 20px */
  --font-size-xl:   1.5rem;    /* 24px */
  --font-size-2xl:  2rem;      /* 32px */
  --font-size-3xl:  2.5rem;    /* 40px */

  /* Font weights */
  --font-weight-regular:   400;
  --font-weight-semibold:  600;
  --font-weight-bold:      700;
}
```

#### Spacing tokens

```css
:root {
  --space-1:   0.25rem;   /*  4 px */
  --space-2:   0.5rem;    /*  8 px */
  --space-3:   0.75rem;   /* 12 px */
  --space-4:   1rem;      /* 16 px */
  --space-6:   1.5rem;    /* 24 px */
  --space-8:   2rem;      /* 32 px */
  --space-12:  3rem;      /* 48 px */
  --space-16:  4rem;      /* 64 px */
}
```

#### Border and shadow tokens

```css
:root {
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   16px;
  --radius-full: 9999px;

  --shadow-sm:   0 1px 3px rgba(0,0,0,.08);
  --shadow-md:   0 4px 12px rgba(0,0,0,.12);
  --shadow-lg:   0 8px 24px rgba(0,0,0,.16);
}
```

### 2.3 Market-Specific Overrides

Market overrides are scoped to a market data attribute added to the `<body>` element:

```css
/* JP market — larger base font for legibility with Japanese characters */
[data-market='jp'] {
  --font-size-base: 1.0625rem;  /* 17 px */
}
```

---

## 3. Page Templates

### 3.1 Template Inventory

| Template | Markets | Primary blocks |
|---|---|---|
| Home page | US, UK, JP | `promotion-banner`, `menu-item`, `store-locator` |
| Menu page | US, UK, JP | `menu-item` (grid), `product-detail` |
| Rewards page | US, UK | `promotion-banner` (rewards variant) |
| Store locator | US, UK, JP | Store map embed + `store-locator` |
| Campaign landing page | US, UK, JP | `promotion-banner`, custom blocks |

### 3.2 Grid System

EDS uses a 12-column CSS grid. Design all page templates on a 12-column grid with the following gutters:

| Breakpoint | Width | Column count | Gutter |
|---|---|---|---|
| Mobile (default) | < 600 px | 4 | 16 px |
| Tablet | 600–1024 px | 8 | 24 px |
| Desktop | > 1024 px | 12 | 32 px |
| Wide | > 1280 px | 12 | 40 px (max content width: 1280 px) |

---

## 4. Block Design

### 4.1 Block Design Specifications

Each block must have a complete design specification before development begins:

| Block | Desktop layout | Mobile layout | Interactive states |
|---|---|---|---|
| `promotion-banner` | Full-width image + text overlay | Stacked image + text | Hover on CTA button |
| `menu-item` | 3-column card grid | 1-column card list | Hover state, skeleton loader |
| `product-detail` | 2-column (image left, customiser right) | 1-column stacked | Size/milk/syrup selectors, Add to order button |

### 4.2 Block Design Checklist

For each block, the design must include:

- [ ] Desktop layout at 1280 px viewport width
- [ ] Tablet layout at 768 px
- [ ] Mobile layout at 375 px
- [ ] Empty/skeleton loading state
- [ ] Error state (when App Builder action fails)
- [ ] All interactive states (hover, focus, active, disabled)
- [ ] Dark mode variant (if required by Quick Service Restaurant brand)
- [ ] Market-specific variants (e.g., JP currency display, RTL if needed)

---

## 5. XD / Figma Toolkit

### 5.1 Toolkit Structure

The design toolkit (maintained in Adobe XD or Figma) is organised as follows:

```
Quick Service Restaurant EDS Design System
├── 🎨 Foundations
│   ├── Colours
│   ├── Typography
│   ├── Spacing
│   ├── Icons
│   └── Imagery guidelines
│
├── 🧩 Components
│   ├── Buttons (primary, secondary, ghost, icon)
│   ├── Form elements (input, select, checkbox)
│   ├── Cards (menu item, store card, reward card)
│   ├── Navigation (header, mobile menu)
│   └── Banners (promotion, alert, notification)
│
├── 📄 Block Templates
│   ├── promotion-banner (3 variants)
│   ├── menu-item (grid + list)
│   └── product-detail
│
├── 📱 Page Templates
│   ├── Home (US / UK / JP)
│   ├── Menu
│   ├── Rewards
│   └── Store locator
│
└── 🌐 Market Variants
    ├── US
    ├── UK
    └── JP
```

### 5.2 Sharing Designs

1. Share the XD / Figma project link with all team members.
2. Use **comment mode** for review feedback — do not edit the working file directly.
3. Version designs using named frames (`v1.0`, `v1.1`) or Figma version history.
4. Export a **PDF spec document** for stakeholders who do not have XD / Figma access.

---

## 6. Responsive Design

### 6.1 Breakpoint Strategy

EDS applies CSS without a build step. Define responsive styles in block CSS files using native CSS media queries:

```css
/* blocks/menu-item/menu-item.css */
.menu-item-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
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
```

### 6.2 Image Responsive Design

EDS automatically provides responsive images. Use the standard EDS picture element pattern:

```html
<picture>
  <source media="(min-width: 1024px)" srcset="image-1200w.webp">
  <source media="(min-width: 600px)"  srcset="image-800w.webp">
  <img src="image-400w.webp" alt="Caramel Macchiato" loading="lazy" width="400" height="300">
</picture>
```

---

## 7. Accessibility

### 7.1 WCAG 2.1 AA Requirements

All designs and implementations must meet WCAG 2.1 AA:

| Requirement | Criterion | How to meet |
|---|---|---|
| Colour contrast | 1.4.3 | Minimum 4.5:1 ratio for normal text; 3:1 for large text. Verify with Stark (Figma plugin) |
| Focus indicators | 2.4.7 | All interactive elements must have visible focus rings |
| Images | 1.1.1 | All `<img>` elements must have descriptive `alt` text |
| Keyboard navigation | 2.1.1 | All interactive elements reachable by keyboard |
| ARIA | 4.1.2 | Use semantic HTML first; add ARIA only where necessary |
| Language of page | 3.1.1 | Set `lang` attribute on `<html>` per market (`en-US`, `en-GB`, `ja`) |

### 7.2 Accessibility Testing Tools

- **axe DevTools** (browser extension) — automated accessibility scanning
- **Lighthouse** — built into Chrome DevTools; accessibility audit
- **NVDA / JAWS** (Windows) or **VoiceOver** (macOS/iOS) — screen-reader testing
- **Stark** (Figma plugin) — colour contrast checker in design

---

## 8. Design Handover

### 8.1 Handover Package

When designs are approved, the UX Consultant prepares a handover package for the Tech/Dev team:

| Asset | Format | Location |
|---|---|---|
| High-fidelity designs | XD / Figma link | Shared design tool |
| Design token definitions | CSS file | `apps/eds-*/styles/styles.css` (PR) |
| Icon set | SVG sprite | `apps/eds-*/icons/` |
| Block design specs | Annotated XD / Figma frames | Shared design tool |
| Motion / animation spec | Notes in Figma | Shared design tool |

### 8.2 Handover Meeting

A 1-hour design handover meeting is conducted per block with:

- UX Consultant (presenting)
- AEM Consultant (Tech/Dev) (receiving)
- AEM Technical Architect (architecture alignment)

The Tech/Dev team can raise questions or request design clarification within **48 hours** of the meeting. All requests are resolved before coding begins.

---

## 9. Design Review & Approval

### 9.1 Review Cadence

| Review | Timing | Attendees | Format |
|---|---|---|---|
| Wireframe review | End of wireframe phase | Functional Lead + Quick Service Restaurant Content Lead | Remote walkthrough |
| Visual design review | After high-fidelity comps | Quick Service Restaurant brand team + Client Partner | Remote walkthrough |
| Prototype review (UAT) | Before go-live | Quick Service Restaurant content teams | In-person or remote |
| Post-implementation review | After first sprint | UX Consultant + Tech/Dev | Design QA session |

### 9.2 Approval Sign-off

- Visual designs approved by **Quick Service Restaurant brand team** (written confirmation required).
- Accessibility review approved by **UX Consultant** (axe DevTools scan with 0 errors).
- Responsive design QA approved by **Tech/Dev** on real devices (iOS Safari, Android Chrome, desktop Chrome/Firefox/Edge).
