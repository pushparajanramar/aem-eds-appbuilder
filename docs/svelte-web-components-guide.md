# Svelte Web Components Guide

This guide covers every Svelte Web Component in the `packages/eds-components` library: the authoring rules that govern their structure, the Vite build pipeline that compiles them to standalone ES-module bundles, and the exact mechanism by which EDS blocks lazy-load those bundles at runtime.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Component Inventory and Block Mapping](#2-component-inventory-and-block-mapping)
3. [Authoring Rules](#3-authoring-rules)
   - [3.1 Custom Element Declaration](#31-custom-element-declaration)
   - [3.2 Props Must Be Lowercase](#32-props-must-be-lowercase)
   - [3.3 Inter-component Communication via CustomEvent](#33-inter-component-communication-via-customevent)
   - [3.4 Shadow DOM Token Copying](#34-shadow-dom-token-copying)
4. [Shared Utilities](#4-shared-utilities)
   - [4.1 api.js — Typed Fetch Helpers](#41-apijs--typed-fetch-helpers)
   - [4.2 auth.js — IMS Token Store](#42-authjs--ims-token-store)
   - [4.3 image-utils.js — Dynamic Media URL Builders](#43-image-utilsjs--dynamic-media-url-builders)
5. [Vite Build Configuration](#5-vite-build-configuration)
   - [5.1 Entry Points and Output Paths](#51-entry-points-and-output-paths)
   - [5.2 Build Output Structure](#52-build-output-structure)
   - [5.3 Why IIFE/ES Modules (not SSR)](#53-why-iiifees-modules-not-ssr)
6. [How EDS Blocks Load Web Components](#6-how-eds-blocks-load-web-components)
   - [6.1 The Block–WC Contract](#61-the-blockwc-contract)
   - [6.2 IntersectionObserver Lazy-Loading Pattern](#62-intersectionobserver-lazy-loading-pattern)
   - [6.3 Attribute Passing](#63-attribute-passing)
7. [Local Development Workflow](#7-local-development-workflow)
8. [Adding a New Web Component](#8-adding-a-new-web-component)
9. [CI/CD Pipeline Integration](#9-cicd-pipeline-integration)
10. [Testing and Quality Gates](#10-testing-and-quality-gates)
11. [Accessibility Requirements](#11-accessibility-requirements)

---

## 1. Overview

The `packages/eds-components` library contains all Svelte Web Components used by the Quick Service Restaurant EDS sites. Each component is compiled to a **self-contained ES-module bundle** using Vite and `@sveltejs/vite-plugin-svelte` with `customElement: true`. The bundles are written directly into the relevant block directories under `apps/eds-us/blocks/`, and copied to `eds-uk` and `eds-jp` by the CI/CD pipeline.

```
packages/eds-components/
└── src/
    ├── components/           ← Svelte source files
    │   ├── qsr-hero.svelte
    │   ├── qsr-menu-card.svelte
    │   └── … (22 components total)
    └── utils/
        ├── api.js            ← BFF fetch helpers
        ├── auth.js           ← IMS token store (in-memory only)
        └── image-utils.js    ← Adobe Dynamic Media URL helpers
```

The build is a **one-way process**: edit `.svelte` source → run `npm run build` → bundles appear in `apps/eds-*/blocks/`. EDS blocks pick up the bundle via a dynamic `import()` at scroll-intersection time.

---

## 2. Component Inventory and Block Mapping

The table below lists every Svelte Web Component, the custom element tag it registers, the EDS block directory it is built into, and whether it requires Adobe IMS authentication.

| Svelte file | Custom element tag | EDS block directory | Fetches data? | Auth required? |
|---|---|---|---|---|
| `qsr-accordion.svelte` | `<qsr-accordion>` | `accordion/` | No | No |
| `qsr-breadcrumbs.svelte` | `<qsr-breadcrumbs>` | `breadcrumbs/` | No | No |
| `qsr-cards.svelte` | `<qsr-cards>` | `cards/` | No | No |
| `qsr-carousel.svelte` | `<qsr-carousel>` | `carousel/` | No | No |
| `qsr-columns.svelte` | `<qsr-columns>` | `columns/` | No | No |
| `qsr-embed.svelte` | `<qsr-embed>` | `embed/` | No | No |
| `qsr-footer.svelte` | `<qsr-footer>` | `footer/` | No | No |
| `qsr-form.svelte` | `<qsr-form>` | `form/` | No | No |
| `qsr-fragment.svelte` | `<qsr-fragment>` | `fragment/` | No | No |
| `qsr-header.svelte` | `<qsr-header>` | `header/` | No | No |
| `qsr-hero.svelte` | `<qsr-hero>` | `hero/` | No | No |
| `qsr-menu-card.svelte` | `<qsr-menu-card>` | `menu-item/` | Yes — `/bff/ordering` | No |
| `qsr-modal.svelte` | `<qsr-modal>` | `modal/` | No | No |
| `qsr-product-customizer.svelte` | `<qsr-product-customizer>` | `product-detail/` | Yes — `/bff/ordering` | No |
| `qsr-quote.svelte` | `<qsr-quote>` | `quote/` | No | No |
| `qsr-rewards-feed.svelte` | `<qsr-rewards-feed>` | `rewards-feed/` | Yes — `/bff/proxy/stream` | **Yes** |
| `qsr-search.svelte` | `<qsr-search>` | `search/` | No | No |
| `qsr-store-locator.svelte` | `<qsr-store-locator>` | `store-locator/` | Yes — `/bff/locations` | No |
| `qsr-table.svelte` | `<qsr-table>` | `table/` | No | No |
| `qsr-tabs.svelte` | `<qsr-tabs>` | `tabs/` | No | No |
| `qsr-user-profile.svelte` | `<qsr-user-profile>` | `user-profile/` | Yes — `/bff/proxy/orchestra` | **Yes** |
| `qsr-video.svelte` | `<qsr-video>` | `video/` | No | No |

> **22 components** total. The three components that ship in `vite.config.js` entry map (`qsr-product-customizer`, `qsr-menu-card`, plus all others with implicit 1:1 mapping) are all built automatically — no manual entry is needed when the Svelte file name matches the block directory name via `blockMap`.

---

## 3. Authoring Rules

These four rules are enforced during code review and must be followed for every new or modified component.

### 3.1 Custom Element Declaration

Every Svelte file **must** open with `<svelte:options customElement="qsr-<name>" />`. This instructs the Svelte compiler to emit a Custom Elements v1 class rather than a standard Svelte component class.

```svelte
<!-- ✅ Correct — file: qsr-hero.svelte -->
<svelte:options customElement="qsr-hero" />

<!-- ❌ Missing — will compile as a plain Svelte component, not a Web Component -->
```

The tag name **must** start with `qsr-` and must match the entry key in `vite.config.js` exactly so that the Vite output path resolution works correctly.

### 3.2 Props Must Be Lowercase

HTML attribute names are case-insensitive. When the browser sets attributes on a Custom Element, `itemId` arrives as `itemid`. All exported Svelte props must therefore be **all-lowercase**:

```svelte
<!-- ✅ Correct -->
<script>
  export let itemid = '';
  export let market = 'us';
  export let devicetype = 'desktop';
</script>

<!-- ❌ Incorrect — camelCase props will never receive attribute values from the browser -->
<script>
  export let itemId = '';
  export let deviceType = 'desktop';
</script>
```

When the EDS block JS creates the element and sets properties programmatically, use the lowercase attribute name:

```js
// ✅ Correct (in the EDS block .js file)
const wc = Object.assign(document.createElement('qsr-menu-card'), {
  itemid: itemId,
  market,
  category,
});

// Or via setAttribute:
wc.setAttribute('devicetype', document.documentElement.dataset.device || 'desktop');
```

### 3.3 Inter-component Communication via CustomEvent

Web Components are isolated inside Shadow DOM. To communicate with parent pages or sibling components, dispatch a `CustomEvent` with `bubbles: true` and `composed: true`. The `composed: true` flag allows the event to cross Shadow DOM boundaries.

```svelte
<script>
  function handleCustomize() {
    dispatchEvent(
      new CustomEvent('qsr:customize', {
        detail: { itemid, market, category },
        bubbles: true,
        composed: true,  // ← required for cross-shadow-boundary propagation
      }),
    );
  }
</script>
```

Naming convention: `qsr:<component>:<action>` — e.g., `qsr:menu-card:customize`, `qsr:accordion:toggle`, `qsr:sign-out`.

The EDS block JS (or `scripts/aem.js`) listens at the document level:

```js
document.addEventListener('qsr:add-to-cart', (e) => {
  const { productid, size, milk, extras, price } = e.detail;
  // Update cart state, push analytics event, etc.
});
```

### 3.4 Shadow DOM Token Copying

CSS custom properties defined on `:root` in `styles/styles.css` are **not inherited** into Shadow DOM. Each component must declare the tokens it uses directly in its `:host` block. Copy only the tokens the component actually references.

```svelte
<style>
  /* ✅ Declare tokens inside :host so Shadow DOM can reference them */
  :host {
    --color-green-primary: #00704a;
    --color-green-dark:    #1e3932;
    --color-white:         #ffffff;
    --font-family-sans:    'SoDo Sans', 'Helvetica Neue', Arial, sans-serif;
    --radius-pill:         999px;
    --space-4:             1rem;
    --transition-fast:     150ms ease;
    display: block;                /* Required — custom elements are inline by default */
    font-family: var(--font-family-sans);
    container-type: inline-size;  /* Enables @container queries for responsive layout */
  }

  /* ❌ Do NOT use var(--color-green-primary) here without declaring it in :host first */
</style>
```

Always set `display: block` on `:host`. Custom elements are `display: inline` by default, which breaks most layout expectations.

---

## 4. Shared Utilities

Three utility modules in `packages/eds-components/src/utils/` are shared across all components.

### 4.1 `api.js` — Typed Fetch Helpers

`api.js` provides one typed fetch function per BFF endpoint. All requests route through `apiFetch()`, which attaches the IMS bearer token from `auth.js` (when present) and throws on non-2xx responses.

```
BFF Base URLs:
  us → https://www.qsr.com
  uk → https://www.qsr.co.uk
  jp → https://www.qsr.co.jp
```

| Export | Endpoint called | Auth |
|---|---|---|
| `fetchProduct(productId, market)` | `GET /bff/ordering/{id}/product` | Optional |
| `fetchMenuItem(itemId, market, category)` | `GET /bff/ordering/{id}/{category}` | Optional |
| `fetchNearbyStores({ lat, lng, place, market, radius })` | `GET /bff/locations?…` | Optional |
| `fetchRewards(market)` | `GET /bff/proxy/rewards` | Required |
| `fetchUserProfile(market)` | `POST /bff/proxy/orchestra/get-user` | Required |
| `fetchStreamItems(market, limit)` | `GET /bff/proxy/stream/v1/me/streamItems` | Required |

For components that call auth-required endpoints (`qsr-rewards-feed`, `qsr-user-profile`), always check `isAuthenticated()` before calling the API and render a sign-in prompt if the user is not authenticated.

```svelte
<script>
  import { isAuthenticated } from '../utils/auth.js';
  import { fetchRewards } from '../utils/api.js';
  import { onMount } from 'svelte';

  let rewards = [];
  let error = null;

  onMount(async () => {
    if (!isAuthenticated()) {
      error = 'Please sign in to view your rewards.';
      return;
    }
    rewards = await fetchRewards(market);
  });
</script>
```

### 4.2 `auth.js` — IMS Token Store

`auth.js` provides a module-scoped in-memory token store. Tokens are **never** written to `localStorage` or `sessionStorage`. The token is set by the IMS login callback in the page scripts (`scripts/aem.js` or a dedicated `scripts/auth.js`).

| Export | Description |
|---|---|
| `setAccessToken(token, expiresIn)` | Store a token with TTL (default 3600 s) |
| `getAccessToken()` | Return the token, or `null` if absent or expired |
| `clearAccessToken()` | Remove the token (sign-out) |
| `isAuthenticated()` | Return `true` when a valid unexpired token is present |

```js
// In the page scripts (scripts/auth.js):
import { setAccessToken, clearAccessToken } from '../../packages/eds-components/src/utils/auth.js';

window.adobeIMS.on('signin', ({ access_token, expires_in }) => {
  setAccessToken(access_token, expires_in);
});

window.adobeIMS.on('signout', () => {
  clearAccessToken();
});
```

### 4.3 `image-utils.js` — Dynamic Media URL Builders

`image-utils.js` constructs Adobe Dynamic Media (Scene7) image URLs with device-appropriate renditions. It is used by every component that renders an image.

| Export | Returns | Notes |
|---|---|---|
| `buildDynamicMediaUrl(url, width, options)` | `string` | Appends `wid`, `fmt`, `qlt` params |
| `buildDynamicMediaSrcset(url, width, format)` | `string` | 1× and 2× descriptor srcset |
| `getImageWidthForDevice(deviceType)` | `number` | Lookup from `DEVICE_IMAGE_WIDTHS` |

Device-to-pixel-width mapping:

| Device type | 1× width | 2× width |
|---|---|---|
| `mobile` | 400 px | 800 px |
| `tablet` | 600 px | 1200 px |
| `desktop` | 800 px | 1600 px |
| `kiosk` | 600 px | 1200 px |
| `digital-menu-board` | 800 px | 1600 px |

Usage pattern inside a component:

```svelte
<script>
  import {
    buildDynamicMediaUrl,
    buildDynamicMediaSrcset,
    getImageWidthForDevice,
  } from '../utils/image-utils.js';

  export let imageurl = '';
  export let devicetype = 'desktop';

  $: imageWidth = getImageWidthForDevice(devicetype);
</script>

<picture>
  <source type="image/webp" srcset={buildDynamicMediaSrcset(imageurl, imageWidth)} />
  <img
    src={buildDynamicMediaUrl(imageurl, imageWidth, { format: 'jpeg' })}
    alt="…"
    loading="lazy"
    width={imageWidth}
  />
</picture>
```

---

## 5. Vite Build Configuration

The build is configured in `packages/eds-components/vite.config.js`.

### 5.1 Entry Points and Output Paths

Vite builds each `.svelte` file as a separate ES-module entry. The `entryFileNames` function maps each entry key to an output path of the form `{block-directory}/{entry-key}.js`:

```js
// vite.config.js (excerpt)
const blockMap = {
  'qsr-product-customizer': 'product-detail',  // special mapping
  'qsr-menu-card':          'menu-item',        // special mapping
  'qsr-accordion':          'accordion',        // 1:1 (key = block dir)
  'qsr-hero':               'hero',
  // … all other WCs follow the same 1:1 pattern
};

entryFileNames: (chunk) => {
  const blockDir = blockMap[chunk.name] || chunk.name;
  return `${blockDir}/${chunk.name}.js`;
}
```

This means:
- `qsr-hero` → `hero/qsr-hero.js`
- `qsr-menu-card` → `menu-item/qsr-menu-card.js`
- `qsr-product-customizer` → `product-detail/qsr-product-customizer.js`

The two special-cased entries (`qsr-product-customizer` → `product-detail`, `qsr-menu-card` → `menu-item`) exist because the Svelte component name differs from its host block directory name. All other components follow the default 1:1 pattern — the entry key is both the custom element tag suffix and the block directory name.

### 5.2 Build Output Structure

The Vite `outDir` is set to `../../apps/eds-us/blocks`. After `npm run build` completes, the output looks like this:

```
apps/eds-us/blocks/
├── accordion/
│   └── qsr-accordion.js
├── breadcrumbs/
│   └── qsr-breadcrumbs.js
├── hero/
│   ├── hero.js           ← EDS block JS (hand-authored, not generated)
│   ├── hero.css          ← EDS block CSS (hand-authored, not generated)
│   └── qsr-hero.js       ← ← ← Vite output ← ← ←
├── menu-item/
│   ├── menu-item.js      ← EDS block JS
│   ├── menu-item.css     ← EDS block CSS
│   └── qsr-menu-card.js  ← ← ← Vite output ← ← ←
├── product-detail/
│   ├── product-detail.js
│   ├── product-detail.css
│   └── qsr-product-customizer.js
└── … (one sub-directory per block)
```

`emptyOutDir: false` prevents Vite from wiping hand-authored block `.js` and `.css` files on each build.

### 5.3 Why IIFE/ES Modules (not SSR)

The bundles are formatted as `es` (ES modules). This means:

- They can be loaded via `import()` natively in modern browsers without a build step on the consumer side.
- They run as a side effect on `import` — the Custom Element is registered in `customElements` when the module executes.
- Code-splitting is **disabled** (`inlineDynamicImports: false`, `manualChunks: undefined`) because each bundle is a self-contained unit fetched only once per page that uses the block.

---

## 6. How EDS Blocks Load Web Components

EDS blocks are plain JavaScript files (`decorate(block)` function). They interact with Web Components in two phases: **annotation** (Universal Editor) and **lazy hydration** (IntersectionObserver).

### 6.1 The Block–WC Contract

Each EDS block that uses a Web Component:

1. Reads block configuration from the EDS-rendered HTML table via `readBlockConfig(block)`.
2. Annotates the block for Universal Editor in-context editing (UE `data-aue-*` attributes).
3. Replaces itself with the Web Component element when the block enters the viewport.

```
Author creates page in UE
        │
        ▼
AEM publishes HTML to EDS CDN
        │
        ▼
EDS renders the block table as <div class="block-name">…</div>
        │
        ▼
block's decorate(block) runs on page load:
  1. readBlockConfig()      — extract item-id, market, category from block HTML
  2. annotateBlock()        — add UE data-aue-* attributes
  3. annotateField()        — add UE data-aue-prop attributes to child elements
  4. new IntersectionObserver — wait until block is near viewport
        │
        ▼
IntersectionObserver fires when block is within 200 px of viewport:
  1. import('/blocks/menu-item/qsr-menu-card.js')   — dynamic import registers WC
  2. document.createElement('qsr-menu-card')         — create element
  3. assign itemid, market, category props
  4. block.replaceWith(wc)                           — swap block HTML for WC
        │
        ▼
qsr-menu-card onMount() runs:
  1. fetchMenuItem(itemid, market, category)  — BFF API call
  2. Renders card HTML inside Shadow DOM
```

### 6.2 IntersectionObserver Lazy-Loading Pattern

This is the standard pattern used by every block that hosts a Web Component. **Never** use top-level `await import()` or import at the top of the block file — this would block the initial page load for all users even if the block is below the fold.

```js
// blocks/menu-item/menu-item.js
export default async function decorate(block) {
  // 1. Read config and annotate for UE
  const config = readBlockConfig(block);
  annotateBlock(block, { resource: buildAEMUrn(cfPath), type: 'component', model: 'menuitem', label: 'Menu Item' });
  // annotateField(…) calls for each editable field

  const itemId = config['item-id'] || cfPath.split('/').pop();
  const market = config.market || document.documentElement.lang?.substring(0, 2) || 'us';
  const category = config.category || 'drinks';

  // 2. Lazy-load the WC bundle only when needed
  const observer = new IntersectionObserver(
    async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();                             // fire once only

      await import('/blocks/menu-item/qsr-menu-card.js'); // registers <qsr-menu-card>

      const wc = Object.assign(document.createElement('qsr-menu-card'), {
        itemid: itemId,                                  // lowercase prop
        market,
        category,
      });
      block.replaceWith(wc);                             // replace block element
    },
    { rootMargin: '200px' },                             // pre-load 200 px before viewport
  );

  observer.observe(block);
}
```

The `rootMargin: '200px'` pre-loads the bundle and data slightly before the user scrolls to it, eliminating visible loading delays on fast connections.

### 6.3 Attribute Passing

The EDS block sets attributes on the Web Component element before inserting it into the DOM. Since the component's `onMount` lifecycle hook runs after the element is connected, all attribute values are available inside `onMount`:

```js
// Block JS — pass data as HTML attributes (lowercase)
const wc = document.createElement('qsr-hero');
wc.setAttribute('imageurl', imageurl);
wc.setAttribute('imagealt', imagealt);
wc.setAttribute('contenthtml', contenthtml);
wc.setAttribute('devicetype', document.documentElement.dataset.device || 'desktop');
block.replaceWith(wc);
```

```svelte
<!-- Component — receive as lowercase exported props -->
<script>
  export let imageurl = '';
  export let imagealt = '';
  export let contenthtml = '';
  export let devicetype = 'desktop';
  // These are populated before onMount runs
</script>
```

For simple read-only data (image URL, HTML content), use `setAttribute`. For live reactive data (market, device type), both `setAttribute` and `Object.assign` work — prefer `Object.assign` to avoid the string round-trip.

---

## 7. Local Development Workflow

```bash
# Install dependencies
cd packages/eds-components
npm ci

# Watch mode — rebuilds on every .svelte file save
npm run dev

# Type-check all Svelte files
npm run check

# Lint all Svelte files
npm run lint

# One-off production build
npm run build
```

The bundles are written directly to `apps/eds-us/blocks/`. To see changes live:

1. Run `npm run dev` in `packages/eds-components` (terminal 1).
2. Run `aem up` in `apps/eds-us` (terminal 2) — the AEM EDS CLI serves the market site locally.
3. Edit a `.svelte` file — Vite rebuilds, the AEM CLI hot-reloads the block.

> **Note:** Changes to `vite.config.js` or `package.json` require restarting the `dev` watcher.

---

## 8. Adding a New Web Component

Follow these steps to add a new Svelte Web Component that maps to a new or existing EDS block.

### Step 1 — Create the Svelte source file

```bash
touch packages/eds-components/src/components/qsr-<name>.svelte
```

Minimum viable template:

```svelte
<svelte:options customElement="qsr-<name>" />

<script>
  // RULE 3: Props must be lowercase
  export let market = 'us';
</script>

<div class="<name>">
  <slot></slot>
</div>

<style>
  :host {
    /* RULE 4: copy every token used here */
    --color-text-primary: #1e3932;
    --font-family-sans: 'SoDo Sans', 'Helvetica Neue', Arial, sans-serif;
    display: block;
    font-family: var(--font-family-sans);
  }
</style>
```

### Step 2 — Register in `vite.config.js`

Add an entry key under `build.lib.entry`:

```js
'qsr-<name>': resolve(__dirname, 'src/components/qsr-<name>.svelte'),
```

If the block directory name differs from the WC name (`qsr-<name>` → `some-other-block`), add a mapping in `blockMap`:

```js
'qsr-<name>': 'some-other-block',
```

### Step 3 — Create (or update) the EDS block directory

```
apps/eds-us/blocks/<name>/
├── <name>.js    ← decorate() function that lazy-loads the WC
└── <name>.css   ← block-level CSS (grid layout, skeleton state, etc.)
```

`<name>.js` minimum template:

```js
import { readBlockConfig } from '../../scripts/aem.js';
import { annotateBlock, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const cfPath = getCFPath(block);
  annotateBlock(block, { resource: buildAEMUrn(cfPath), type: 'component', model: '<name>', label: '<Label>' });

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/<name>/qsr-<name>.js');
    const wc = Object.assign(document.createElement('qsr-<name>'), {
      market: config.market || 'us',
    });
    block.replaceWith(wc);
  }, { rootMargin: '200px' });

  observer.observe(block);
}
```

### Step 4 — Build and copy

```bash
cd packages/eds-components && npm run build
# The bundle is written to apps/eds-us/blocks/<name>/qsr-<name>.js automatically
```

For UK and JP, copy the bundle manually during development (CI handles this in production):

```bash
cp apps/eds-us/blocks/<name>/qsr-<name>.js apps/eds-uk/blocks/<name>/qsr-<name>.js
cp apps/eds-us/blocks/<name>/qsr-<name>.js apps/eds-jp/blocks/<name>/qsr-<name>.js
```

### Step 5 — Add component model

Register the block in `apps/eds-<market>/component-models.json` so Universal Editor knows the block's editable fields:

```json
{
  "id": "<name>",
  "fields": [
    { "component": "text",  "name": "title",  "label": "Title",  "valueType": "string" },
    { "component": "richtext", "name": "body", "label": "Body", "valueType": "string" }
  ]
}
```

Add to `component-definition.json` so the block appears in the UE block palette, and add to `component-filters.json` if the block should be restricted to specific page templates.

### Step 6 — Add to the CI/CD copy step

In `.github/workflows/deploy.yml`, add the new bundle to the artifact upload and the UK/JP copy steps:

```yaml
# build-components job — upload-artifact step
path: |
  apps/eds-us/blocks/product-detail/qsr-product-customizer.js
  apps/eds-us/blocks/menu-item/qsr-menu-card.js
  apps/eds-us/blocks/<name>/qsr-<name>.js   # ← add this

# deploy-eds-uk job — copy step
cp apps/eds-us/blocks/<name>/qsr-<name>.js \
   apps/eds-uk/blocks/<name>/qsr-<name>.js

# deploy-eds-jp job — copy step
cp apps/eds-us/blocks/<name>/qsr-<name>.js \
   apps/eds-jp/blocks/<name>/qsr-<name>.js
```

---

## 9. CI/CD Pipeline Integration

The build is part of the `build-components` job in `.github/workflows/deploy.yml`:

```
push to main
    │
    ▼
[lint]                    ESLint on app-builder actions
    │
    ▼
[build-components]
    ├── npm ci            Install deps in packages/eds-components
    ├── npm run build     Vite build — outputs to apps/eds-us/blocks/
    └── upload-artifact   Saves qsr-product-customizer.js and qsr-menu-card.js
            │
            ├── [deploy-eds-us]
            │     download-artifact → apps/eds-us/blocks/
            │     curl POST admin.hlx.page/publish/org/qsr-us/main/*
            │
            ├── [deploy-eds-uk]
            │     download-artifact → apps/eds-us/blocks/
            │     cp bundles → apps/eds-uk/blocks/
            │     curl POST admin.hlx.page/publish/org/qsr-uk/main/*
            │
            └── [deploy-eds-jp]
                  download-artifact → apps/eds-us/blocks/
                  cp bundles → apps/eds-jp/blocks/
                  curl POST admin.hlx.page/publish/org/qsr-jp/main/*
```

Key points:
- The build runs on **every** PR (not just pushes to `main`) to catch compile errors early.
- Deployment to EDS only runs on `push` to `main`.
- App Builder deployment runs in parallel with `build-components` (both depend on `lint`).
- The three market deploy jobs run in parallel once `build-components` succeeds.

---

## 10. Testing and Quality Gates

| Check | Command | When required |
|---|---|---|
| Type checking | `npm run check` (svelte-check) | Before raising a PR |
| Linting | `npm run lint` (ESLint + eslint-plugin-svelte) | Before raising a PR |
| Build succeeds | `npm run build` | CI runs on every PR |
| App Builder unit tests | `cd app-builder && npm test` | Before raising a PR |

There are no dedicated browser-based tests for the Svelte components in this repository. Manual verification in the AEM EDS local dev proxy (`aem up`) is the primary quality gate for component behaviour.

When adding a new component that makes API calls, write a **stub test** in `app-builder/__tests__/` for the App Builder action that drives the same BFF endpoint — this ensures the API contract is regression-tested even without browser tests.

---

## 11. Accessibility Requirements

All Svelte Web Components must meet **WCAG 2.1 AA**:

- **Keyboard navigation**: All interactive elements (`<button>`, `<input>`, `<a>`) must be reachable and operable by keyboard alone.
- **Focus styles**: Use `focus-visible` with a `3px solid #005fcc` outline at `2px` offset as the minimum focus indicator (matching the design system).
- **ARIA**: Use `role`, `aria-label`, `aria-expanded`, `aria-controls`, and `aria-busy` where semantic HTML alone is insufficient.
- **Loading states**: Use `role="status"` and `aria-busy="true"` on skeleton/loading containers.
- **Error states**: Use `role="alert"` on error containers so screen readers announce them immediately.
- **Images**: Every `<img>` must have a non-empty, descriptive `alt` attribute.
- **Colour contrast**: Ensure a minimum 4.5:1 contrast ratio for normal text and 3:1 for large text, using the design token colour values.

Example pattern from `qsr-menu-card.svelte`:

```svelte
{#if isLoading}
  <div class="card card--loading" role="status" aria-busy="true">
    <!-- skeleton shimmer -->
  </div>
{:else if error}
  <div class="card card--error" role="alert">
    <p>{error}</p>
  </div>
{:else if item}
  <article class="card">
    <img src={…} alt={item.name} loading="lazy" width={imageWidth} />
    <button class="card__btn-customize"
      on:click={handleCustomize}
      aria-label="Customize {item.name}">
      Customize
    </button>
  </article>
{/if}
```
