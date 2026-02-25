# Universal Editor Content Authoring Guide

This guide explains how to use the **AEM Universal Editor (UE)** to create and manage pages for all three QSR markets (US, UK, JP), add components and images from AEM Assets, and keep each market's `sitemap.json` up to date.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Accessing the Universal Editor](#3-accessing-the-universal-editor)
4. [Creating Pages per Sitemap](#4-creating-pages-per-sitemap)
   - [4.1 Sitemap Page Structure](#41-sitemap-page-structure)
   - [4.2 Creating a New Page](#42-creating-a-new-page)
   - [4.3 Page Templates and Allowed Components](#43-page-templates-and-allowed-components)
5. [Adding Components in Universal Editor](#5-adding-components-in-universal-editor)
   - [5.1 Component Palette](#51-component-palette)
   - [5.2 Promotion Banner](#52-promotion-banner)
   - [5.3 Menu Item](#53-menu-item)
   - [5.4 Product Detail](#54-product-detail)
   - [5.5 Store Locator](#55-store-locator)
   - [5.6 Rewards Feed](#56-rewards-feed)
   - [5.7 User Profile](#57-user-profile)
6. [Adding Images from AEM Assets](#6-adding-images-from-aem-assets)
   - [6.1 DAM Folder Structure](#61-dam-folder-structure)
   - [6.2 Inserting an Image via Universal Editor](#62-inserting-an-image-via-universal-editor)
   - [6.3 Image Authoring Rules](#63-image-authoring-rules)
7. [Generating and Maintaining the Sitemap](#7-generating-and-maintaining-the-sitemap)
   - [7.1 sitemap.json Structure](#71-sitemapjson-structure)
   - [7.2 Updating the Sitemap After Creating a Page](#72-updating-the-sitemap-after-creating-a-page)
   - [7.3 Sitemap Entries per Market](#73-sitemap-entries-per-market)
   - [7.4 Automated Sitemap Reindex](#74-automated-sitemap-reindex)
8. [Previewing Content](#8-previewing-content)
9. [Publishing Content](#9-publishing-content)
   - [9.1 Publishing a Single Page](#91-publishing-a-single-page)
   - [9.2 Bulk Publishing](#92-bulk-publishing)
   - [9.3 Unpublishing / Rollback](#93-unpublishing--rollback)
10. [Authoring Conventions and Governance](#10-authoring-conventions-and-governance)

---

## 1. Overview

The **Universal Editor** is the WYSIWYG authoring interface for pages in this project. Authors edit pages directly on a live preview URL and save changes back to AEM Author, where they are then published to the Edge Delivery Services (EDS) CDN via the App Builder webhook.

```
Author opens page in Universal Editor (*.aem.page preview URL)
    │
    │  edits components in-context (text, images, block options)
    ▼
Author saves → AEM Author stores content
    │
    │  Author clicks Publish
    ▼
AEM fires publish event → App Builder webhook action
    │
    ▼
EDS Admin API publishes page → live on *.aem.live within ~30 s
```

**Key files referenced in this guide:**

| File | Location | Purpose |
|---|---|---|
| `component-models.json` | `apps/eds-<market>/` | Field schemas for each block |
| `component-definition.json` | `apps/eds-<market>/` | Registers blocks in the UE palette |
| `component-filters.json` | `apps/eds-<market>/` | Controls which blocks are allowed per page template |
| `sitemap.json` | `apps/eds-<market>/` | Sitemap entries served by EDS |
| `ue/instrumentation.js` | `apps/eds-<market>/ue/` | UE data-attribute helpers used by block scripts |

---

## 2. Prerequisites

Before authoring content you need:

| Requirement | Detail |
|---|---|
| AEM Author access | `content-authors` group membership (see [AEM Configuration Guide §6.2](aem-configuration-guide.md#62-aem-cloud-service-user-roles)) |
| Adobe IMS account | Federated SSO or Adobe ID with access to the QSR AEM programme |
| Universal Editor extension | Install the [Universal Editor Chrome extension](https://experienceleague.adobe.com/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/introduction.html) (if not already embedded in AEM) |
| DAM permissions | `dam-users` group membership to browse and select assets |
| EDS preview URL | `https://main--qsr-<market>--org.aem.page` (replace `<market>` with `us`, `uk`, or `jp`) |

---

## 3. Accessing the Universal Editor

1. Log in to **AEM Author** at your Cloud Manager Author URL.
2. Navigate to **Sites → `<market>` site** (e.g., `qsr-us → en`).
3. Select the page you want to edit and click the **Edit** (pencil) icon, or click **Open in Universal Editor** from the page actions toolbar.
4. The Universal Editor opens the page in a new browser tab at the preview URL:
   - US: `https://main--qsr-us--org.aem.page/<path>`
   - UK: `https://main--qsr-uk--org.aem.page/<path>`
   - JP: `https://main--qsr-jp--org.aem.page/<path>`
5. The **Properties Rail** appears on the right. The **Component Palette** (add button `+`) is in the top toolbar.

> **Note:** The preview URL uses the `*.aem.page` domain (not `*.aem.live`). Content on `*.aem.page` is not publicly accessible — it is only visible to authenticated authors. The live public URL is `*.aem.live`.

---

## 4. Creating Pages per Sitemap

### 4.1 Sitemap Page Structure

Each market's `sitemap.json` defines the full set of pages that should exist. Use this as your authoring checklist when building out a new market or adding pages for a campaign.

| Market | Sitemap file | AEM site root | EDS live URL base |
|---|---|---|---|
| US | `apps/eds-us/sitemap.json` | `/content/qsr-us/en/` | `https://main--qsr-us--org.aem.live` |
| UK | `apps/eds-uk/sitemap.json` | `/content/qsr-uk/en/` | `https://main--qsr-uk--org.aem.live` |
| JP | `apps/eds-jp/sitemap.json` | `/content/qsr-jp/ja/` | `https://main--qsr-jp--org.aem.live` |

The default sitemap includes these top-level paths — every path listed here must have a corresponding page in AEM Author:

| Path | Page Type | Template | Required blocks |
|---|---|---|---|
| `/` | Home / Landing page | `landing-page` | `promotion-banner`, `menu-item`, `store-locator` |
| `/menu` | Menu listing | `menu-page` | `menu-item`, `promotion-banner` |
| `/menu/<item-id>` | Product detail | `product-page` | `product-detail`, `menu-item` |
| `/stores` | Store locator | `stores-page` | `store-locator` |
| `/rewards` | Rewards (auth-gated) | `main` | `rewards-feed`, `promotion-banner` |
| `/account` | User account (auth-gated) | `account-page` | `user-profile`, `rewards-feed` |

### 4.2 Creating a New Page

1. In AEM Author, navigate to **Sites → `<market>` site → `<locale>` folder** (e.g., `/content/qsr-us/en/`).
2. Click **Create → Page**.
3. In the **Create Page** wizard:
   - **Template:** select the appropriate template (see table above — templates correspond to the `component-filters.json` container IDs).
   - **Title:** enter a descriptive title (e.g., `Grande Latte`). AEM converts this to a URL-safe slug automatically (lowercase, spaces → hyphens).
   - **Name:** optionally override the URL slug. Must be lowercase with no spaces or special characters.
4. Click **Create**. AEM creates the page under the current folder.
5. Select the new page and click the **Edit** (pencil) icon to open it in the Universal Editor.
6. Add the required blocks for the page template (see [Section 5](#5-adding-components-in-universal-editor)).
7. Fill in page metadata:
   - Open **Page Properties** (the ℹ icon in the UE toolbar or via Sites → Page Properties).
   - Set **Title**, **Description**, **Locale**, and **Market** (see [content-architecture-runbook.md §3.3](content-architecture-runbook.md#33-metadata-authoring)).

> **Product detail pages:** Each product detail page lives under `/menu/<item-id>`. Create one page per product and set the `product-id` field in the `Product Detail` block to the matching upstream product API ID.

### 4.3 Page Templates and Allowed Components

The `component-filters.json` file controls which blocks can be placed on each page type. Authors will only see relevant blocks in the component palette:

| `component-filters.json` container | Allowed blocks | Typical page path |
|---|---|---|
| `main` | All blocks | `/rewards`, general pages |
| `landing-page` | `promotion-banner`, `menu-item`, `store-locator` | `/` |
| `product-page` | `product-detail`, `menu-item` | `/menu/<item-id>` |
| `menu-page` | `menu-item`, `promotion-banner` | `/menu` |
| `account-page` | `user-profile`, `rewards-feed` | `/account` |
| `stores-page` | `store-locator` | `/stores` |

If a block does not appear in the palette for a given page, check that the `component-filters.json` for that market includes it under the correct container ID.

---

## 5. Adding Components in Universal Editor

### 5.1 Component Palette

1. With a page open in Universal Editor, click the **`+` (Add)** button in the top toolbar, or click the inline **`+`** that appears between blocks when hovering.
2. The **Component Palette** opens on the right. Only blocks permitted for the current page template are shown (controlled by `component-filters.json`).
3. Click a component name to insert it at the selected position.
4. The block appears in the page canvas. Click it to select it — the **Properties Rail** on the right shows the editable fields.

### 5.2 Promotion Banner

The `Promotion Banner` block (`model: promotion`) renders a full-width hero or campaign banner.

| Field | Required | Description |
|---|---|---|
| **Headline** | Yes | Primary banner text, displayed as `<h1>` or `<h2>` |
| **Description** | No | Rich-text supporting bold, italic, and links |
| **Banner Image** | Yes | AEM Assets image path (see [Section 6](#6-adding-images-from-aem-assets)) |
| **CTA Link** | No | Internal page path (e.g., `/menu`) or external URL |
| **CTA Button Text** | No | Button label (e.g., `View Menu`) |

**Authoring rule:** A maximum of two `Promotion Banner` blocks per page. Large banner images are render-blocking — use optimised assets from the DAM (see [Section 6.3](#63-image-authoring-rules)).

### 5.3 Menu Item

The `Menu Item` block (`model: menuitem`) displays a single menu product card. Multiple `Menu Item` blocks on the same page form a grid.

| Field | Required | Description |
|---|---|---|
| **Item Name** | Yes | Product display name |
| **Description** | No | Short product description (rich-text) |
| **Product Image** | Yes | AEM Assets image path |
| **Price** | Yes | Display price string (e.g., `$4.99`, `£3.50`, `¥550`) |
| **Item ID** | Yes | Upstream product API identifier — must match `menu-provider` data |
| **Category** | Yes | `drinks`, `food`, or `merchandise` |

**Authoring rule:** `Item ID` must match the product ID used by the `menu-provider` App Builder action. An incorrect ID results in a blank product detail page at runtime.

### 5.4 Product Detail

The `Product Detail` block (`model: product-detail`) renders a full product page with customisation options via the `qsr-product-customizer` Svelte web component.

| Field | Required | Description |
|---|---|---|
| **Product ID** | Yes | Upstream product API identifier |
| **Market** | Yes | `us`, `uk`, or `jp` — controls currency and locale formatting |

> Only one `Product Detail` block per page. Place it on a dedicated `/menu/<item-id>` page.

### 5.5 Store Locator

The `Store Locator` block (`model: store-locator`) renders the store search UI backed by the `store-provider` App Builder action.

| Field | Required | Description |
|---|---|---|
| **Market** | Yes | `us`, `uk`, or `jp` — filters stores for the correct market |
| **Search Radius (km)** | No | Default search radius; leave blank to use the action default (50 km) |

### 5.6 Rewards Feed

The `Rewards Feed` block (`model: rewards-feed`) renders the authenticated rewards catalog. The block is only visible after IMS sign-in.

| Field | Required | Description |
|---|---|---|
| **Market** | Yes | `us`, `uk`, or `jp` |
| **Max Items** | No | Maximum number of reward items to display (default: all) |

### 5.7 User Profile

The `User Profile` block (`model: user-profile`) renders the authenticated user's profile information.

| Field | Required | Description |
|---|---|---|
| **Market** | Yes | `us`, `uk`, or `jp` |

---

## 6. Adding Images from AEM Assets

### 6.1 DAM Folder Structure

All images used in EDS pages must be stored in AEM DAM and referenced by their DAM path. Do **not** use external image URLs.

```
/content/dam/
├── us/
│   └── images/
│       ├── menu/          # Menu item product images (e.g., grande-latte.jpg)
│       ├── promotions/    # Promotion banner images (e.g., menu-hero.jpg)
│       └── rewards/       # Rewards imagery
├── uk/
│   └── images/
│       ├── menu/
│       └── promotions/
└── jp/
    └── images/
        ├── menu/
        └── promotions/
```

Upload new assets via **AEM Author → Assets → Files → `<market>/images/<category>/`** before authoring pages that reference them.

### 6.2 Inserting an Image via Universal Editor

1. Click the image field in the **Properties Rail** (e.g., **Banner Image** for a Promotion Banner block, or **Product Image** for a Menu Item block).
2. An **Asset Picker** dialog opens. It shows the DAM folder tree on the left and a thumbnail grid on the right.
3. Navigate to the correct market and category folder:
   - US menu images: `/content/dam/us/images/menu/`
   - US promotion images: `/content/dam/us/images/promotions/`
   - UK/JP: equivalent paths under `/content/dam/uk/` or `/content/dam/jp/`
4. Click the asset thumbnail to select it. Click **Confirm** (or **Select**).
5. The DAM path (e.g., `/content/dam/us/images/menu/grande-latte.jpg`) is written into the `media` field.
6. The image renders in the Universal Editor canvas immediately.

> **Tip:** You can also type a DAM path directly into the image field if you know the exact path.

### 6.3 Image Authoring Rules

| Rule | Rationale |
|---|---|
| Use DAM asset paths (not external URLs) | Ensures AEM delivery CDN caching and DAM lifecycle management |
| Maximum image dimensions: 2400 × 2400 px | Prevents oversized downloads that harm Core Web Vitals |
| Use JPEG for photographs, PNG/SVG for UI graphics | Reduces file size; JPEG is automatically served as WebP via AEM delivery |
| Use the market-specific DAM folder | Ensures correct localised imagery is served (e.g., JP products look different from US) |
| Promotional banner images must be at least 1200 × 630 px | Required for correct Open Graph preview card rendering |
| All images must have an `alt` text rendition set in DAM | Accessibility (WCAG 2.1 AA) |

---

## 7. Generating and Maintaining the Sitemap

### 7.1 sitemap.json Structure

Each market's `sitemap.json` (located at `apps/eds-<market>/sitemap.json`) is the source of truth for the EDS sitemap. It is served at `https://main--qsr-<market>--org.aem.live/sitemap.json` and consumed by search engines.

```json
{
  "version": "1.0",
  "siteMap": [
    {
      "loc": "https://www.qsr.com/",
      "changefreq": "daily",
      "priority": "1.0"
    }
  ],
  "include": [
    "/",
    "/menu/**",
    "/stores/**",
    "/rewards/**"
  ],
  "exclude": [
    "/drafts/**",
    "/tools/**",
    "/**?*"
  ]
}
```

| Field | Purpose |
|---|---|
| `siteMap` | Array of explicit sitemap entries with `loc`, `changefreq`, and `priority` |
| `include` | Glob patterns — EDS crawls all published pages matching these paths and adds them to the XML sitemap automatically |
| `exclude` | Glob patterns — pages matching these paths are never added to the sitemap |

EDS generates the `/sitemap.xml` automatically from the combination of `include`/`exclude` glob patterns and the explicit `siteMap` entries. You do not need to list every individual page in `siteMap` — use `include` globs instead.

### 7.2 Updating the Sitemap After Creating a Page

When you **create a new top-level section** (e.g., a new `/promotions` section), update `sitemap.json` as follows:

1. Open `apps/eds-<market>/sitemap.json` in a text editor or via the AEM Source View.
2. Add a new glob pattern to the `include` array:
   ```json
   "/promotions/**"
   ```
3. Optionally add an explicit entry to `siteMap` if you want to control `changefreq` and `priority`:
   ```json
   {
     "loc": "https://www.qsr.com/promotions",
     "changefreq": "weekly",
     "priority": "0.8"
   }
   ```
4. Commit the change and push to the `main` branch. The CI/CD pipeline automatically publishes the updated `sitemap.json` to EDS.
5. To trigger an immediate refresh without waiting for CI/CD:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer $EDS_TOKEN" \
     "https://admin.hlx.page/publish/org/qsr-us/main/sitemap.json"
   ```

When you **create individual product detail pages** (`/menu/<item-id>`), no sitemap update is needed — the `/menu/**` glob in `include` automatically picks them up.

### 7.3 Sitemap Entries per Market

Recommended `include` globs and `exclude` patterns per market:

**US (`apps/eds-us/sitemap.json`)**

```json
{
  "version": "1.0",
  "siteMap": [
    { "loc": "https://www.qsr.com/",        "changefreq": "daily",   "priority": "1.0" },
    { "loc": "https://www.qsr.com/menu",    "changefreq": "weekly",  "priority": "0.9" },
    { "loc": "https://www.qsr.com/stores",  "changefreq": "monthly", "priority": "0.8" },
    { "loc": "https://www.qsr.com/rewards", "changefreq": "daily",   "priority": "0.7" }
  ],
  "include": [
    "/",
    "/menu/**",
    "/stores/**",
    "/rewards/**"
  ],
  "exclude": [
    "/drafts/**",
    "/tools/**",
    "/account/**",
    "/**?*"
  ]
}
```

> `/account/**` is excluded because it is auth-gated and must not be indexed by search engines.

**UK (`apps/eds-uk/sitemap.json`)** — same structure, replace `https://www.qsr.com` with the UK domain.

**JP (`apps/eds-jp/sitemap.json`)** — same structure with the JP domain; all `loc` values must use the `ja-JP` locale path prefix if applicable (e.g., `https://www.qsr.co.jp/ja/`).

### 7.4 Automated Sitemap Reindex

The EDS `query-index` automatically re-crawls pages matching the `include` globs whenever the App Builder webhook action fires for a publish event. No manual sitemap regeneration step is required for standard page publishes.

To force a full sitemap reindex for a market:

```bash
# Re-index all pages in the US market
curl -X POST \
  -H "Authorization: Bearer $EDS_TOKEN" \
  "https://admin.hlx.page/index/org/qsr-us/main/*"
```

---

## 8. Previewing Content

Before publishing, always preview your changes on the `*.aem.page` preview URL.

1. In AEM Author, navigate to the page.
2. Click **Quick Publish** dropdown → **Manage Publication → Preview**.
3. Open the preview URL in a browser:
   - `https://main--qsr-us--org.aem.page/<path>` (US)
   - `https://main--qsr-uk--org.aem.page/<path>` (UK)
   - `https://main--qsr-jp--org.aem.page/<path>` (JP)
4. Verify:
   - All blocks render correctly.
   - Images load from the AEM delivery CDN (URL should contain `delivery.adobe.com` or the AEM host).
   - The page title and metadata are correct.
   - On mobile: resize the browser or use Chrome DevTools Device Emulator to check responsive layout.
5. Share the `*.aem.page` URL with the Functional Lead or Quick Service Restaurant Content Lead for review before publishing to production.

---

## 9. Publishing Content

### 9.1 Publishing a Single Page

**Via AEM Author (recommended):**

1. In AEM Author, select the page.
2. Click **Quick Publish**, or go to **Manage Publication → Publish**.
3. AEM fires a publish event to the App Builder `webhook` action, which calls the EDS Admin API automatically.
4. The page goes live on `*.aem.live` within approximately 30 seconds.

**Via the EDS Admin API (manual override):**

```bash
curl -X POST \
  -H "Authorization: Bearer $EDS_TOKEN" \
  "https://admin.hlx.page/publish/org/qsr-us/main/menu/grande-latte"
```

### 9.2 Bulk Publishing

To publish all pages for a market at once (e.g., at initial launch or after a large content migration):

```bash
# Publish all pages — US
curl -X POST \
  -H "Authorization: Bearer $EDS_TOKEN" \
  "https://admin.hlx.page/publish/org/qsr-us/main/*"

# Publish all pages — UK
curl -X POST \
  -H "Authorization: Bearer $EDS_TOKEN" \
  "https://admin.hlx.page/publish/org/qsr-uk/main/*"

# Publish all pages — JP
curl -X POST \
  -H "Authorization: Bearer $EDS_TOKEN" \
  "https://admin.hlx.page/publish/org/qsr-jp/main/*"
```

### 9.3 Unpublishing / Rollback

To remove a page from the live site immediately:

1. In AEM Author, navigate to the page.
2. Click **Manage Publication → Unpublish**.
3. AEM fires an `unpublish` event → App Builder webhook → EDS cache invalidation.

For an emergency unpublish via the Admin API:

```bash
curl -X DELETE \
  -H "Authorization: Bearer $EDS_TOKEN" \
  "https://admin.hlx.page/publish/org/qsr-us/main/menu/grande-latte"
```

---

## 10. Authoring Conventions and Governance

### Content Roles

| Role | Responsibility |
|---|---|
| Quick Service Restaurant Content Lead | Day-to-day page creation, block authoring, publishing |
| Quick Service Restaurant Digital Marketing Lead | Campaign banners, promotion scheduling |
| AEM Consultant (Functional) | Approves new component types; reviews `component-models.json` changes |
| AEM Technical Architect | Approves `sitemap.json` changes and query-index updates |

### Authoring Checklist (per page)

- [ ] Page created under the correct market and locale folder
- [ ] Correct page template selected
- [ ] All required blocks added (see [Section 4.1](#41-sitemap-page-structure))
- [ ] All required block fields filled (no blank mandatory fields)
- [ ] Images sourced from DAM (not external URLs) in the correct market folder
- [ ] Page title, description, locale, and market set in page properties
- [ ] Metadata block added with `Title`, `Description`, and `Locale`
- [ ] Page previewed on `*.aem.page` and reviewed
- [ ] `sitemap.json` updated if a new top-level section was created
- [ ] Page published via AEM Author or EDS Admin API
- [ ] Live URL (`*.aem.live`) verified in browser

### Block Authoring Rules Quick Reference

| Rule | Applies to |
|---|---|
| Maximum 2 `Promotion Banner` blocks per page | `promotion-banner` |
| `Item ID` must match upstream product API | `menu-item`, `product-detail` |
| One `Product Detail` block per page, on its own dedicated page | `product-detail` |
| `price` field must not be blank | `menu-item` |
| Image fields must use DAM paths, not external URLs | all blocks with image fields |
| Auth-gated pages (`/account`, `/rewards`) must not be included in `sitemap.json` `include` globs | `sitemap.json` |
| JP prices must be formatted without decimal places (e.g., `¥550`) | `menu-item` (JP market) |
