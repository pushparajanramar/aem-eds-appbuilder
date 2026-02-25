# ADR 005 — Svelte Web Components for Shared UI

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2025-01-15 |
| **Proposer** | AEM Technical Architect |
| **Approver** | AEM Technical Architect |

---

## Context

EDS block JavaScript is intentionally minimal — it fetches data and appends DOM nodes. For interactive, stateful UI (e.g. the product customiser with size/milk/syrup selectors, or a menu card with add-to-cart behaviour), vanilla DOM manipulation becomes complex and error-prone.

The programme requires:

- **22 shared UI components** used across all three markets (accordion, breadcrumbs, cards, carousel, footer, header, hero, menu-card, modal, product-customiser, etc.).
- Components must be **distributable as browser-native Custom Elements** so they work inside EDS block HTML without a framework runtime.
- Components must be **independently bundled** (one JS file per component) to allow EDS lazy-loading.
- The build toolchain must produce **ESM bundles** compatible with modern browsers (Chrome 100+, Safari 15+, Firefox 100+).

Three options were considered:

| Option | Bundle size (approx.) | Custom Element support | Developer experience |
|---|---|---|---|
| **Svelte** | ~5–15 kB per component (no runtime) | Native (`customElements.define`) | Declarative templates, scoped CSS, TypeScript |
| **Lit** | ~5 kB base + ~2–5 kB per component | Native | Declarative, good TS support, mature ecosystem |
| **React + react-dom** | ~45 kB base shared | Via `react-to-web-component` wrapper | Very mature, but large runtime overhead per page |

---

## Decision

Use **Svelte** compiled to native Custom Elements (Web Components), bundled with **Vite**, for all shared UI components in `packages/eds-components/`.

```
packages/eds-components/
├── src/
│   ├── components/           # One .svelte file per component
│   └── utils/                # Shared fetch helpers, IMS auth, image utilities
└── vite.config.js            # Multi-entry build; outputs one JS file per component
```

Each `.svelte` file is compiled with `customElement: true` (the `<svelte:options customElement="qsr-*" />` tag), producing a self-contained Custom Element with scoped Shadow DOM styles.

Vite produces a separate JS bundle for each component under `apps/eds-us/blocks/<block-name>/`. The CI/CD pipeline copies the bundles to `eds-uk` and `eds-jp` after building.

---

## Consequences

### Positive

- **Zero runtime overhead** — Svelte compiles to vanilla JS; there is no shared framework runtime bundle. Each component bundle is 5–15 kB (gzip).
- **Scoped styles** — Shadow DOM CSS prevents block styles from leaking into the EDS page global stylesheet.
- **Native lazy-loading** — EDS block JavaScript uses `customElements.whenDefined()` to defer rendering until the component bundle is loaded, maintaining LCP performance.
- **TypeScript + svelte-check** — Strong type safety across the component library without a separate type-declaration step.

### Negative / Trade-offs

- **Shadow DOM isolation** — Global CSS variables (e.g. brand colour tokens) must be exposed as CSS custom properties on `:root` or passed as component attributes; they do not pierce the Shadow DOM automatically.
- **Svelte-specific syntax** — Team members unfamiliar with Svelte require a short ramp-up period (~1–2 days).
- **Build step required** — Changes to components require a Vite build before they are visible in EDS. The CI/CD pipeline handles this automatically, but local development requires running `npm run dev` in `packages/eds-components/`.

### Follow-on actions

- Define and document CSS custom-property naming conventions for brand tokens (colours, typography, spacing) so that Shadow DOM components can consume them.
- Add `svelte-check` and ESLint (`eslint-plugin-svelte`) to the CI/CD lint stage.
- Document the complete component inventory, block-to-component mapping and step-by-step guide for adding a new component in `docs/svelte-web-components-guide.md`.
