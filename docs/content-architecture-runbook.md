# Content Architecture Runbook

This runbook guides the team through setting up and managing the content architecture for the AEM EDS + App Builder programme. It covers content model implementation, authoring conventions, content creation workflows and the organisation of content across all three markets (US, UK, JP).

---

## Table of Contents

1. [Content Architecture Overview](#1-content-architecture-overview)
2. [Content Model Implementation](#2-content-model-implementation)
3. [Authoring Conventions](#3-authoring-conventions)
4. [Content Creation Workflow](#4-content-creation-workflow)
5. [Content Organisation per Market](#5-content-organisation-per-market)
6. [Query Index Configuration](#6-query-index-configuration)
7. [Translation and Localisation](#7-translation-and-localisation)
8. [Content Governance](#8-content-governance)

---

## 1. Content Architecture Overview

### 1.1 Content Types

This project uses three primary content types, each with its own authoring tool and delivery mechanism:

| Content type | Authoring tool | Storage | Delivered by |
|---|---|---|---|
| Pages | Universal Editor | AEM Author → EDS Git cache | EDS CDN (direct HTML render) |
| Content Fragments | AEM CF Editor | AEM DAM (`/content/dam/<market>/fragments/`) | App Builder provider actions (via query index) |
| DAM Assets | Asset Upload / Renditions | AEM DAM (`/content/dam/<market>/`) | AEM delivery CDN |

### 1.2 Architecture Diagram

```
AEM Author
├── Pages (Universal Editor)
│     │  publish → AEM webhook → App Builder webhook action
│     │  └─► EDS Admin API  →  EDS CDN (direct HTML)
│
├── Content Fragments
│     │  publish → AEM webhook → App Builder webhook action
│     │  └─► EDS query-index reindex  →  App Builder provider actions read fresh data
│
└── DAM Assets
      │  publish → AEM webhook → App Builder webhook action
      └─► EDS cache purge  →  AEM asset delivery CDN
```

---

## 2. Content Model Implementation

### 2.1 Component Model Files

Content models are defined in three JSON files per market:

| File | Purpose |
|---|---|
| `component-models.json` | Field schemas for each block — consumed by Universal Editor |
| `component-definition.json` | Registers blocks as components in the Universal Editor component palette |
| `component-filters.json` | Controls which blocks can be placed inside which containers |

All three files must be consistent — a block defined in `component-models.json` must also appear in `component-definition.json` and be permitted in at least one container in `component-filters.json`.

### 2.2 `component-models.json` Structure

```json
{
  "definitions": [
    {
      "title": "Promotion Banner",
      "id": "promotion",
      "fields": [
        { "component": "text",      "name": "title",       "label": "Title",       "required": true },
        { "component": "richtext",  "name": "description", "label": "Description" },
        { "component": "reference", "name": "image",       "label": "Image",       "required": true },
        { "component": "text",      "name": "ctaLabel",    "label": "CTA Label" },
        { "component": "text",      "name": "ctaUrl",      "label": "CTA URL" },
        {
          "component": "select",
          "name": "variant",
          "label": "Variant",
          "options": [
            { "name": "Default", "value": "default" },
            { "name": "Rewards", "value": "rewards" }
          ]
        }
      ]
    },
    {
      "title": "Menu Item",
      "id": "menuitem",
      "fields": [
        { "component": "text",      "name": "title",       "label": "Title",    "required": true },
        { "component": "text",      "name": "description", "label": "Description" },
        { "component": "reference", "name": "image",       "label": "Image",    "required": true },
        { "component": "text",      "name": "price",       "label": "Price",    "required": true },
        { "component": "text",      "name": "itemId",      "label": "Item ID",  "required": true },
        {
          "component": "select",
          "name": "category",
          "label": "Category",
          "required": true,
          "options": [
            { "name": "Drinks",       "value": "drinks" },
            { "name": "Food",         "value": "food" },
            { "name": "Merchandise",  "value": "merchandise" }
          ]
        }
      ]
    },
    {
      "title": "Product Detail",
      "id": "product-detail",
      "fields": [
        { "component": "text",      "name": "title",       "label": "Title",    "required": true },
        { "component": "richtext",  "name": "description", "label": "Description" },
        { "component": "reference", "name": "image",       "label": "Image",    "required": true },
        { "component": "text",      "name": "price",       "label": "Base Price", "required": true },
        { "component": "text",      "name": "itemId",      "label": "Item ID",  "required": true }
      ]
    }
  ]
}
```

### 2.3 `component-definition.json` Structure

```json
{
  "groups": [
    {
      "title": "Quick Service Restaurant Blocks",
      "id": "qsr",
      "components": [
        {
          "title": "Promotion Banner",
          "id": "promotion",
          "plugins": {
            "xwalk": {
              "page": {
                "resourceType": "core/franklin/components/block/v1/block",
                "template": {
                  "name": "Promotion Banner",
                  "model": "promotion"
                }
              }
            }
          }
        },
        {
          "title": "Menu Item",
          "id": "menuitem",
          "plugins": {
            "xwalk": {
              "page": {
                "resourceType": "core/franklin/components/block/v1/block",
                "template": {
                  "name": "Menu Item",
                  "model": "menuitem"
                }
              }
            }
          }
        },
        {
          "title": "Product Detail",
          "id": "product-detail",
          "plugins": {
            "xwalk": {
              "page": {
                "resourceType": "core/franklin/components/block/v1/block",
                "template": {
                  "name": "Product Detail",
                  "model": "product-detail"
                }
              }
            }
          }
        }
      ]
    }
  ]
}
```

---

## 3. Authoring Conventions

### 3.1 Page Creation

1. In AEM Author, navigate to **Sites → `<market>` site**.
2. Click **Create → Page** and select the appropriate page template.
3. Enter the page title — this becomes the URL slug (converted to lowercase, spaces replaced with hyphens).
4. Open the page in the **Universal Editor** (click the edit pencil icon).
5. Add blocks by clicking the **Add** button in the UE component palette.

### 3.2 Block Authoring Rules

| Rule | Rationale |
|---|---|
| One `promotion-banner` per page (maximum 2) | Performance — large images are render-blocking |
| `menu-item` blocks must have a valid `itemId` | Required by `menu-provider` App Builder action |
| `product-detail` blocks must be on their own page | One product per product detail page |
| Do not leave `price` fields blank | Displayed directly to users; a missing price appears as empty text |
| Use DAM asset paths for images (not external URLs) | Ensures AEM delivery CDN caching and DAM lifecycle management |

### 3.3 Metadata Authoring

Every page must have a **Metadata** block (or AEM page properties) containing:

| Field | Required | Example |
|---|---|---|
| Title | Yes | `Quick Service Restaurant Menu — US` |
| Description | Yes | `Explore our full drinks and food menu...` |
| Image | No | `/content/dam/us/images/promotions/menu-hero.jpg` |
| Locale | Yes | `en-US` |
| Market | Yes | `us` |

---

## 4. Content Creation Workflow

### 4.1 Standard Workflow (Universal Editor)

```
Author creates/edits page in Universal Editor
    │
    ▼
Author previews on *.aem.page (preview)
    │  (review by Functional Lead / Quick Service Restaurant Content Lead if required)
    ▼
Author publishes page in AEM Author
    │
    ▼  (automatic)
AEM fires publish webhook event
    │
    ▼
App Builder webhook action receives event
    │
    ├── Calls EDS Admin API → POST /publish/{org}/{site}/main/{path}
    │
    └── If content fragment: calls EDS Admin API → POST /index/{org}/{site}/main/{path}
            │
            ▼
Content live on *.aem.live within ~30 seconds
```

### 4.2 Bulk Content Publishing

For initial site launch or large content migrations:

```bash
# Bulk publish all pages for the US market
curl -X POST \
  -H "Authorization: Bearer $EDS_TOKEN" \
  "https://admin.hlx.page/publish/org/qsr-us/main/*"

# Bulk index all content fragments for the US market
curl -X POST \
  -H "Authorization: Bearer $EDS_TOKEN" \
  "https://admin.hlx.page/index/org/qsr-us/main/*"
```

Replace `qsr-us` with `qsr-uk` or `qsr-jp` for other markets.

### 4.3 Emergency Unpublish / Rollback

To unpublish a page or content fragment immediately:

1. In AEM Author, navigate to the page or fragment.
2. Select **Manage Publication → Unpublish**.
3. AEM fires an `unpublish` webhook event → App Builder webhook action calls the EDS Admin API `DELETE /cache` endpoint.

For a complete page rollback:

```bash
# Unpublish a single page
curl -X DELETE \
  -H "Authorization: Bearer $EDS_TOKEN" \
  "https://admin.hlx.page/publish/org/qsr-us/main/menu"
```

---

## 5. Content Organisation per Market

### 5.1 AEM Site Structure

```
/content/
├── qsr-us/
│   ├── en/
│   │   ├── home          (home page)
│   │   ├── menu/         (menu listing + product detail pages)
│   │   ├── stores/       (store locator)
│   │   └── rewards/      (rewards page — auth-gated)
│   └── jcr:content       (site properties)
├── qsr-uk/
│   └── en/
│       ├── home
│       ├── menu/
│       └── stores/
└── qsr-jp/
    └── ja/
        ├── home
        ├── menu/
        └── stores/
```

### 5.2 DAM Structure

```
/content/dam/
├── us/
│   ├── images/
│   │   ├── menu/          # Menu item product images
│   │   ├── promotions/    # Promotion banner images
│   │   └── rewards/       # Rewards imagery
│   ├── documents/         # PDFs, brand guides
│   └── fragments/
│       ├── menu/          # Menu item Content Fragments
│       ├── stores/        # Store Content Fragments
│       └── rewards/       # Reward Content Fragments
├── uk/
│   └── images/
│       ├── menu/
│       └── promotions/
└── jp/
    └── images/
        ├── menu/
        └── promotions/
```

### 5.3 Sitemap per Market

Each market's `sitemap.json` must be kept up to date:

```json
{
  "total": 3,
  "offset": 0,
  "limit": 256,
  "data": [
    { "path": "/",        "title": "Home",         "lastModified": "2025-01-01" },
    { "path": "/menu",    "title": "Menu",          "lastModified": "2025-01-01" },
    { "path": "/stores",  "title": "Store Locator", "lastModified": "2025-01-01" },
    { "path": "/rewards", "title": "Rewards",       "lastModified": "2025-01-01" }
  ]
}
```

---

## 6. Query Index Configuration

Query indexes are defined in `apps/eds-<market>/config/index-config.yaml` and determine which page / fragment properties are surfaced in the EDS query index endpoint.

```yaml
# apps/eds-us/config/index-config.yaml
indices:
  menu-index:
    include:
      - /menu/**
    exclude: []
    properties:
      title:        { select: "main h1" }
      image:        { select: "main img", attribute: "src" }
      description:  { select: ".menu-item-description" }
      price:        { select: "[data-price]", attribute: "data-price" }
      category:     { select: "[data-category]", attribute: "data-category" }
      itemId:       { select: "[data-item-id]", attribute: "data-item-id" }
      lastModified: { attribute: "last-modified" }

  store-index:
    include:
      - /stores/**
    properties:
      title:   { select: "main h1" }
      address: { select: ".store-address" }
      city:    { select: ".store-city" }
      state:   { select: ".store-state" }
      zip:     { select: ".store-zip" }
      phone:   { select: ".store-phone" }
      hours:   { select: ".store-hours" }
      lat:     { select: "[data-lat]", attribute: "data-lat" }
      lng:     { select: "[data-lng]", attribute: "data-lng" }

  rewards-index:
    include:
      - /rewards/**
    properties:
      title:       { select: "main h1" }
      description: { select: ".rewards-description" }
      stars:       { select: "[data-stars]", attribute: "data-stars" }
      image:       { select: "main img", attribute: "src" }
```

---

## 7. Translation and Localisation

See [Content Supply Chain — Translations](content-supply-chain.md#translations) for the full translation workflow.

### 7.1 Market Content Independence

Each market's EDS site is an isolated unit. Content is **not shared** between markets:

- `apps/eds-us/` → serves US content at `main--qsr-us--org.aem.live`
- `apps/eds-uk/` → serves UK content at `main--qsr-uk--org.aem.live`
- `apps/eds-jp/` → serves JP content at `main--qsr-jp--org.aem.live`

### 7.2 JP-Specific Requirements

- All page content must be in Japanese (`ja-JP`).
- Product names may appear in both Japanese and the original English romanisation.
- Prices are displayed in JPY with no decimal places (e.g., ¥550).
- Menu images may differ from US/UK (localised product photography).

---

## 8. Content Governance

### 8.1 Content Roles and Responsibilities

| Role | Responsibility |
|---|---|
| AEM Consultant (Functional) | Content model governance; approves changes to `component-models.json` |
| Quick Service Restaurant Content Lead | Day-to-day content authoring and publishing |
| Quick Service Restaurant Digital Marketing Lead | Campaign content and promotion scheduling |
| AEM Technical Architect | Approves changes to query index configuration and sitemap |

### 8.2 Content Change Process

1. Content authors raise a request in the project management tool if new page types, fields or taxonomy values are needed.
2. The Functional Lead assesses the impact on `component-models.json` and the block library.
3. If code changes are required, a story is added to the sprint backlog.
4. The Technical Architect reviews and approves changes to shared configuration.
5. Changes are deployed via CI/CD pipeline before content authors begin using the new capability.

### 8.3 Content Freshness

| Content type | Expected update frequency | Cache TTL |
|---|---|---|
| Menu items | Weekly | 300 s (see `menu-provider` in `site-config.json`) |
| Store details | Monthly | 600 s (see `store-provider` in `site-config.json`) |
| Rewards | Daily | 120 s (see `rewards-provider` in `site-config.json`) |
| Promotion banners | Per campaign (daily–weekly) | CDN purged on publish via webhook |

Cache TTL values are configured in each market's `apps/eds-<market>/config/site-config.json` overlay entries.
