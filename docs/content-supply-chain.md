# Content Supply Chain

This document describes how content is created, managed, and delivered across the three Quick Service Restaurant markets (US, UK, JP) using Adobe Experience Manager (AEM) and Edge Delivery Services (EDS).

---

## Table of Contents

- [Content Types](#content-types)
  - [Pages](#pages)
  - [Content Fragments](#content-fragments)
  - [DAM Assets](#dam-assets)
- [Metadata and Taxonomy](#metadata-and-taxonomy)
- [Translations](#translations)
- [Content Supply Chain Flow](#content-supply-chain-flow)
  - [Pages Flow](#pages-flow)
  - [Content Fragments Flow](#content-fragments-flow)
  - [DAM Assets Flow](#dam-assets-flow)
  - [Metadata and Taxonomy Flow](#metadata-and-taxonomy-flow)
  - [Translation Flow](#translation-flow)

---

## Content Types

### Pages

Pages are the primary delivery unit in Edge Delivery Services. Each market (`eds-us`, `eds-uk`, `eds-jp`) maintains its own page tree in AEM Author and maps to an independent EDS site:

| Market | EDS Site ID | Live host |
|--------|-------------|-----------|
| US | `qsr-us` | `main--qsr-us--org.aem.live` |
| UK | `qsr-uk` | `main--qsr-uk--org.aem.live` |
| JP | `qsr-jp` | `main--qsr-jp--org.aem.live` |

#### Page structure

Pages are composed of **EDS blocks** defined in each market's `apps/eds-<market>/blocks/` directory. Three first-party block types are registered for all markets:

| Block | Purpose | Component model |
|-------|---------|-----------------|
| `promotion-banner` | Full-width promotional hero | `promotion` |
| `product-detail` | Individual product detail view | `product-detail` |
| `menu-item` | Menu card (drink / food / merchandise) | `menuitem` |

Block schemas are declared in [`component-models.json`](../apps/eds-us/component-models.json) and registered for the Universal Editor in [`component-definition.json`](../apps/eds-us/component-definition.json) and [`component-filters.json`](../apps/eds-us/component-filters.json).

#### Page authoring

Authors create and edit pages using the **Universal Editor** (xwalk). On save, AEM Author fires a webhook that triggers an EDS cache invalidation via the `webhook` App Builder action:

```
Author saves / publishes page
  └─► AEM webhook event (publish | unpublish | delete)
        └─► App Builder webhook action
              └─► EDS Admin API  POST /publish/{org}/{site}/main/<path>
```

#### Query indexes

EDS query indexes (defined in `apps/eds-<market>/config/index-config.yaml`) automatically index page properties so that the App Builder provider actions can query them at runtime:

- **`menu-index`** — title, image, description, price, category, itemId, lastModified
- **`store-index`** — title, address, city, state, zip, phone, hours, lat, lng, lastModified
- **`rewards-index`** — title, description, stars, image, lastModified

---

### Content Fragments

Content Fragments (CFs) provide structured, reusable content that is decoupled from any specific page layout. In this project they are used for:

| Fragment type | Usage |
|---------------|-------|
| **Menu items** | Individual drink / food / merchandise entries authored once and reused across pages |
| **Store details** | Store name, address, and hours shared between the store-locator page and the App Builder `store-provider` action |
| **Rewards** | Loyalty reward descriptions and star costs reused by the `rewards-provider` action |

#### Authoring Content Fragments

1. Authors open **AEM Author → Assets → Content Fragments**.
2. Fragments are organised under `/content/dam/<market>/fragments/` (e.g., `/content/dam/us/fragments/menu/`).
3. Each CF model mirrors the corresponding component model (see `component-models.json`).
4. On publish, the AEM webhook notifies App Builder which calls the EDS Admin API to reindex the affected path.

#### Consuming Content Fragments in App Builder actions

Provider actions (`menu-provider`, `store-provider`, `rewards-provider`) fetch the live EDS query index endpoint to resolve published fragment data at request time:

```
EDS request for /menu
  └─► menu-provider App Builder action
        └─► Queries EDS query index (/menu/query-index.json)
              └─► Returns rendered text/html block markup to EDS
```

---

### DAM Assets

Digital assets (images, videos, PDFs) are stored in the AEM Digital Asset Management (DAM) repository under `/content/dam/<market>/`.

#### Asset organisation

```
/content/dam/
├── us/
│   ├── images/
│   │   ├── menu/          # Product images referenced by menu-item blocks
│   │   ├── promotions/    # Banner images for promotion-banner blocks
│   │   └── rewards/       # Reward imagery for rewards-provider
│   └── documents/         # PDFs, brand guides
├── uk/
│   └── images/
└── jp/
    └── images/
```

#### Asset delivery

EDS fetches assets directly from AEM's CDN-enabled asset delivery layer (`delivery-p<program>-e<env>.adobeaemcloud.com`). Component model fields of type `media` (e.g., `bannerImage` in `promotion`, `image` in `menuitem`) store the DAM asset path, which EDS resolves to a fully qualified delivery URL at render time.

#### Asset lifecycle

| Event | Trigger | EDS action |
|-------|---------|------------|
| Asset published | AEM replication | Webhook → EDS cache purge for pages referencing the asset |
| Asset updated (rendition) | DAM workflow | Webhook → EDS cache purge |
| Asset unpublished / deleted | AEM replication | Webhook → EDS `DELETE /cache` for affected paths |

---

## Metadata and Taxonomy

### Page metadata

Every EDS page carries a metadata block that is automatically indexed by EDS. Standard metadata fields used across all markets:

| Field | Description | Example |
|-------|-------------|---------|
| `title` | Page / document title | `"Quick Service Restaurant Menu — US"` |
| `description` | SEO meta description | `"Explore our full menu..."` |
| `image` | Open Graph / social sharing image | DAM asset path |
| `lastModified` | ISO-8601 timestamp, set by EDS on publish | `"2025-06-01T10:00:00Z"` |
| `locale` | BCP-47 locale code | `"en-US"`, `"en-GB"`, `"ja-JP"` |
| `market` | Market identifier | `"us"`, `"uk"`, `"jp"` |

Market-specific locales are configured in [`app-builder/actions/shared/market-config.js`](../app-builder/actions/shared/market-config.js):

```js
// market-config.js
{
  us: { locale: 'en-US', currency: 'USD', edsHost: 'main--qsr-us--org.aem.live' },
  uk: { locale: 'en-GB', currency: 'GBP', edsHost: 'main--qsr-uk--org.aem.live' },
  jp: { locale: 'ja-JP', currency: 'JPY', edsHost: 'main--qsr-jp--org.aem.live' },
}
```

### Taxonomy

Taxonomy terms are used to classify and filter content across markets.

#### Menu categories

Menu items use a controlled vocabulary defined in the `menuitem` component model:

| Category value | Display label |
|----------------|---------------|
| `drinks` | Drinks |
| `food` | Food |
| `merchandise` | Merchandise |

#### Market taxonomy

The `market` field on every content item (`us` / `uk` / `jp`) ensures that provider actions only surface market-appropriate content. The `menu-provider` and `store-provider` actions accept `market` as a query parameter and filter the EDS index accordingly.

#### Taxonomy governance

- New taxonomy values must be added to the relevant `component-models.json` `options` array.
- Taxonomy changes are versioned through Git and require a new deployment to take effect.
- Content Fragments inherit the same taxonomy options via shared CF models in AEM.

---

## Translations

The project supports three languages across its three markets. Translation is managed at two levels: **page / block content** and **Content Fragments**.

### Locale configuration

| Market | Language | BCP-47 locale | Currency |
|--------|----------|---------------|----------|
| US | English (US) | `en-US` | USD |
| UK | English (UK) | `en-GB` | GBP |
| JP | Japanese | `ja-JP` | JPY |

### Translation workflow

```
Source content (US/en-US)
  │
  ├─1. Export ──► AEM Translation Job (Translation Connector)
  │                    └─► External TMS (e.g. Lionbridge / GlobalLink)
  │
  ├─2. Translate ──► TMS returns translated XLIFF
  │
  ├─3. Import ──► AEM Author merges translations into target locale tree
  │                    └─► /content/<market>/jp/ or /content/<market>/uk/
  │
  └─4. Publish ──► AEM fires webhook → EDS Admin API indexes translated pages
```

### Market-specific EDS sites as translation units

Each market's EDS site acts as an isolated translation unit. Content is not shared across EDS sites; the App Builder actions always scope their queries to the market supplied by the calling EDS overlay:

```js
// In menu-provider action
const market = params.market || 'us';
const { edsHost, locale } = getMarketConfig(market);
// Fetches: https://<edsHost>/menu/query-index.json
```

### Translated assets

DAM assets are stored in market-specific folders (`/content/dam/us/`, `/content/dam/uk/`, `/content/dam/jp/`) so that localised images (e.g., product photography with Japanese labelling) can be served without affecting other markets. Component model `media` fields reference the market-scoped DAM path directly.

### Translated Content Fragments

Content Fragments support language copies through AEM's built-in **Language Copy** workflow:

1. A source CF is created under `/content/dam/us/fragments/`.
2. The **Language Copy** wizard creates a copy at `/content/dam/jp/fragments/`.
3. Translators update the JP copy in the CF editor or via the TMS XLIFF round-trip.
4. On publish, the webhook triggers reindexing for the JP EDS site only.

---

## Content Supply Chain Flow

The diagram below shows the end-to-end content supply chain, from authoring to delivery, for all content types.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  AUTHORING TIER  (AEM Author — Adobe Experience Cloud)                           │
│                                                                                  │
│  ┌──────────────┐  ┌──────────────────────┐  ┌────────────────┐                 │
│  │    Pages      │  │  Content Fragments    │  │   DAM Assets   │                 │
│  │ (Universal   │  │  (CF Editor / TMS)    │  │ (Asset Upload/ │                 │
│  │  Editor)     │  │                       │  │  Renditions)   │                 │
│  └──────┬───────┘  └──────────┬────────────┘  └───────┬────────┘                 │
│         │                    │                         │                          │
│         └────────────────────┴─────────────────────────┘                          │
│                              │  Publish / Replication                             │
└──────────────────────────────┼────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  INTEGRATION TIER  (Adobe App Builder — Adobe I/O Runtime)                       │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  webhook action                                                              │ │
│  │  Receives AEM publish / unpublish / delete events                           │ │
│  │  Calls  EDS Admin API  →  POST /publish | DELETE /cache                     │ │
│  └───────────────────────────────────┬─────────────────────────────────────────┘ │
│                                      │                                            │
│  ┌──────────────────┐  ┌─────────────┴──────┐  ┌────────────────────────────┐   │
│  │  menu-provider   │  │  store-provider     │  │  rewards-provider          │   │
│  │  GET /menu       │  │  GET /stores        │  │  GET /rewards  (IMS-gated) │   │
│  │  → text/html EDS │  │  → text/html EDS    │  │  → text/html EDS           │   │
│  └──────────────────┘  └────────────────────┘  └────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  DELIVERY TIER  (AEM Edge Delivery Services — aem.live CDN)                      │
│                                                                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐               │
│  │   eds-us        │  │    eds-uk         │  │    eds-jp         │               │
│  │  en-US / USD    │  │   en-GB / GBP     │  │   ja-JP / JPY    │               │
│  │  qsr-us.aem.live│  │ qsr-uk.aem.live  │  │ qsr-jp.aem.live │               │
│  └─────────────────┘  └──────────────────┘  └──────────────────┘               │
│                                                                                  │
│  Each site resolves overlay routes via site-config.json:                         │
│    /menu    →  menu-provider    App Builder action                               │
│    /stores  →  store-provider   App Builder action                               │
│    /rewards →  rewards-provider App Builder action                               │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Pages Flow

1. Author creates or edits a page using the **Universal Editor** on AEM Author.
2. Blocks are composed from registered component definitions (`component-definition.json`).
3. Author clicks **Publish** → AEM fires a `publish` webhook event.
4. The `webhook` App Builder action receives the event and calls the EDS Admin API to publish the page path for the correct market.
5. EDS CDN fetches and caches the rendered page HTML.
6. Subsequent visitor requests are served from the EDS edge cache with sub-100 ms TTFB.

### Content Fragments Flow

1. Author creates a Content Fragment in AEM Author under the appropriate market folder.
2. The CF is published → AEM fires a `publish` webhook event for the fragment path.
3. The `webhook` action triggers EDS reindex for the affected query-index path (e.g., `/menu/query-index.json`).
4. The next call to `menu-provider` (or the relevant provider action) reads the updated index and returns fresh block markup.
5. EDS caches the new response for the configured `cacheTtl` (see `site-config.json`).

### DAM Assets Flow

1. An asset is uploaded or updated in AEM DAM.
2. AEM DAM Asset Rendition workflow processes the asset (resize, crop, optimise).
3. Asset is published to AEM delivery layer.
4. The `webhook` action purges any EDS CDN cache entries for pages that reference the asset path.
5. On the next request, EDS fetches the fresh asset URL from the AEM delivery CDN.

### Metadata and Taxonomy Flow

1. Page or fragment metadata (title, description, locale, market, category) is authored alongside the content.
2. On publish, EDS automatically populates its query index with all metadata properties listed in `index-config.yaml`.
3. App Builder provider actions read this index to filter and sort content by market and taxonomy values.
4. Changes to taxonomy options require a code change to `component-models.json` + Git push, which triggers the CI/CD pipeline (`deploy.yml`) to redeploy.

### Translation Flow

1. Source content (en-US) is authored and published to the US EDS site.
2. AEM's **Translation** project exports pages and/or CFs as XLIFF packages and sends them to the TMS.
3. Translators produce ja-JP (and/or en-GB) XLIFF.
4. Completed translations are imported back into AEM Author into the JP (or UK) content tree.
5. Translated pages/CFs are published → the `webhook` action triggers EDS reindex for the target market's EDS site only (scoped by `market` parameter).
6. The JP (or UK) EDS site now serves the translated content from its own CDN edge nodes.

---

## Summary

| Content type | Authoring tool | Delivery mechanism | Cache invalidation |
|---|---|---|---|
| Pages | Universal Editor | EDS CDN (direct render) | Webhook → EDS Admin API |
| Content Fragments | CF Editor / TMS | App Builder provider → EDS query index | Webhook → EDS reindex |
| DAM Assets | Asset Upload / Rendition workflow | AEM delivery CDN | Webhook → EDS cache purge |
| Metadata | Page / CF metadata fields | EDS query index | Automatic on publish |
| Taxonomy | `component-models.json` options | App Builder filter params | CI/CD redeploy |
| Translations | AEM Translation / TMS | Market-scoped EDS sites | Webhook (per-market) |
