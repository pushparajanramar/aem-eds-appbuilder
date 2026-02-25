# AEM Sites Discovery Checklist

This checklist is used during the **Content Architecture Discovery** workstream to ensure that all content types, page templates, block definitions, taxonomy and Universal Editor configurations are fully understood and agreed before Implementation begins.

Complete each section during the corresponding Discovery workshop with the relevant Quick Service Restaurant stakeholders.

---

## Table of Contents

1. [Site & Environment Inventory](#1-site--environment-inventory)
2. [Page Template Inventory](#2-page-template-inventory)
3. [Block Library Definition](#3-block-library-definition)
4. [Content Fragment Models](#4-content-fragment-models)
5. [DAM Asset Organisation](#5-dam-asset-organisation)
6. [Query Index Requirements](#6-query-index-requirements)
7. [Taxonomy & Metadata](#7-taxonomy--metadata)
8. [Universal Editor Configuration](#8-universal-editor-configuration)
9. [Sitemap & URL Structure](#9-sitemap--url-structure)
10. [Authoring Workflow](#10-authoring-workflow)
11. [Sign-off](#11-sign-off)

---

## 1. Site & Environment Inventory

### 1.1 EDS Sites

| Market | EDS Site ID | Live host | Preview host | Status |
|---|---|---|---|---|
| US | `qsr-us` | `main--qsr-us--org.aem.live` | `main--qsr-us--org.aem.page` | ☐ Confirmed |
| UK | `qsr-uk` | `main--qsr-uk--org.aem.live` | `main--qsr-uk--org.aem.page` | ☐ Confirmed |
| JP | `qsr-jp` | `main--qsr-jp--org.aem.live` | `main--qsr-jp--org.aem.page` | ☐ Confirmed |

### 1.2 AEM Author Environments

| Environment | URL | Purpose | Market |
|---|---|---|---|
| Dev | `https://author-p<id>-e<id>.adobeaemcloud.com` | Development and content modelling | All |
| Stage | `https://author-p<id>-e<id>.adobeaemcloud.com` | UAT | All |
| Production | `https://author-p<id>-e<id>.adobeaemcloud.com` | Live authoring | All |

### 1.3 Content Source

| Market | Authoring tool | Mount point |
|---|---|---|
| US | Universal Editor (AEM Author) | `https://author-<prod>.adobeaemcloud.com` |
| UK | Universal Editor (AEM Author) | `https://author-<prod>.adobeaemcloud.com` |
| JP | Universal Editor (AEM Author) | `https://author-<prod>.adobeaemcloud.com` |

**Checklist:**

- [ ] `fstab.yaml` reviewed and confirmed for each EDS site repo
- [ ] AEM Bot installed on all relevant GitHub repositories
- [ ] EDS admin API access verified with `EDS_TOKEN`

---

## 2. Page Template Inventory

For each page type, record the template name, applicable markets and the primary blocks it uses.

| Page Type | US | UK | JP | Primary Blocks | Notes |
|---|---|---|---|---|---|
| Home page | ☐ | ☐ | ☐ | `promotion-banner`, `menu-item` | |
| Menu listing | ☐ | ☐ | ☐ | `menu-item` grid | |
| Product detail | ☐ | ☐ | ☐ | `product-detail` | |
| Rewards page | ☐ | ☐ | ☐ | `promotion-banner` (rewards) | Auth-gated |
| Store locator | ☐ | ☐ | ☐ | Store map + list | |
| Campaign / landing | ☐ | ☐ | ☐ | `promotion-banner`, custom | Per-campaign |
| Error (404) | ☐ | ☐ | ☐ | Static message block | |

**Questions to answer:**

- Are there any page types unique to a single market?
- Do JP pages require right-to-left (RTL) layout support?
- Are there any pages that must be access-controlled (IMS auth)?

---

## 3. Block Library Definition

For each block, define the model fields, variants and market applicability.

### 3.1 `promotion-banner`

| Field | Type | Required | Markets | Notes |
|---|---|---|---|---|
| `title` | text | Yes | US, UK, JP | Headline text |
| `description` | richtext | No | US, UK, JP | Body copy |
| `image` | media | Yes | US, UK, JP | Hero / background image |
| `ctaLabel` | text | No | US, UK, JP | Button label |
| `ctaUrl` | text | No | US, UK, JP | Button destination |
| `variant` | select | No | US, UK | `default` \| `rewards` |

- [ ] Block definition agreed with Quick Service Restaurant Content Lead
- [ ] Market-specific field variations documented

### 3.2 `menu-item`

| Field | Type | Required | Markets | Notes |
|---|---|---|---|---|
| `title` | text | Yes | US, UK, JP | Menu item name |
| `description` | text | No | US, UK, JP | Short description |
| `image` | media | Yes | US, UK, JP | Product image |
| `price` | text | Yes | US, UK, JP | Display price (localised) |
| `category` | select | Yes | US, UK, JP | `drinks` \| `food` \| `merchandise` |
| `itemId` | text | Yes | US, UK, JP | SKU / product ID |

- [ ] Block definition agreed with Quick Service Restaurant Content Lead
- [ ] Price format confirmed per market (USD, GBP, JPY)

### 3.3 `product-detail`

| Field | Type | Required | Markets | Notes |
|---|---|---|---|---|
| `title` | text | Yes | US, UK, JP | Product name |
| `description` | richtext | No | US, UK, JP | Full product description |
| `image` | media | Yes | US, UK, JP | Product image |
| `price` | text | Yes | US, UK, JP | Base price |
| `itemId` | text | Yes | US, UK, JP | SKU |
| `sizes` | multiselect | No | US, UK, JP | Tall, Grande, Venti (+ JP sizes) |
| `milkOptions` | multiselect | No | US, UK, JP | Whole, Oat, Almond, etc. |

- [ ] Block definition agreed
- [ ] JP-specific size/milk options confirmed

### 3.4 Additional Blocks

Document any additional blocks identified during Discovery:

| Block name | Purpose | Markets | Fields |
|---|---|---|---|
| (to be defined) | | | |

---

## 4. Content Fragment Models

### 4.1 Fragment Model Inventory

| Model name | Path in AEM | Fragment type | Used by action |
|---|---|---|---|
| Menu Item | `/conf/qsr/settings/dam/cfm/models/menu-item` | Structured CF | `menu-provider` |
| Store | `/conf/qsr/settings/dam/cfm/models/store` | Structured CF | `store-provider` |
| Reward | `/conf/qsr/settings/dam/cfm/models/reward` | Structured CF | `rewards-provider` |

**Checklist:**

- [ ] CF model field definitions match `component-models.json` field schemas
- [ ] CF models created in AEM Author (Dev environment)
- [ ] CF path structure per market confirmed (`/content/dam/us/fragments/`, etc.)

---

## 5. DAM Asset Organisation

### 5.1 Folder Structure

| Market | DAM root path | Sub-folders |
|---|---|---|
| US | `/content/dam/us/` | `images/menu/`, `images/promotions/`, `images/rewards/`, `documents/` |
| UK | `/content/dam/uk/` | `images/menu/`, `images/promotions/` |
| JP | `/content/dam/jp/` | `images/menu/`, `images/promotions/` |

**Checklist:**

- [ ] DAM folder structure agreed with Quick Service Restaurant Content Lead
- [ ] Asset naming convention agreed (kebab-case, locale prefix if needed)
- [ ] Image rendition sizes agreed (based on EDS block image requirements)
- [ ] DAM asset lifecycle (publish / unpublish / delete webhook) tested

---

## 6. Query Index Requirements

### 6.1 Index Definitions

For each market's `apps/eds-<market>/config/index-config.yaml`, confirm the properties indexed for each path:

| Index name | Path | Properties indexed |
|---|---|---|
| `menu-index` | `/menu` | `title`, `image`, `description`, `price`, `category`, `itemId`, `lastModified` |
| `store-index` | `/stores` | `title`, `address`, `city`, `state`, `zip`, `phone`, `hours`, `lat`, `lng`, `lastModified` |
| `rewards-index` | `/rewards` | `title`, `description`, `stars`, `image`, `lastModified` |

**Checklist:**

- [ ] Index properties confirmed against App Builder action query requirements
- [ ] `index-config.yaml` updated for all three markets
- [ ] Query index endpoint tested: `https://<edsHost>/query-index.json`

---

## 7. Taxonomy & Metadata

### 7.1 Menu Categories

| Value | Display label | Markets |
|---|---|---|
| `drinks` | Drinks | US, UK, JP |
| `food` | Food | US, UK, JP |
| `merchandise` | Merchandise | US, UK |

- [ ] Any JP-specific categories identified?

### 7.2 Page Metadata Fields

| Field | Required | All markets | Notes |
|---|---|---|---|
| `title` | Yes | Yes | SEO page title |
| `description` | Yes | Yes | SEO meta description |
| `image` | No | Yes | Open Graph image |
| `locale` | Yes | Yes | `en-US`, `en-GB`, `ja-JP` |
| `market` | Yes | Yes | `us`, `uk`, `jp` |
| `lastModified` | Auto | Yes | Set by EDS on publish |

### 7.3 Taxonomy Governance

- [ ] Taxonomy options locked in `component-models.json` before sprint 1 starts
- [ ] Process agreed for adding new taxonomy values (code change + Git push + CI/CD redeploy)

---

## 8. Universal Editor Configuration

### 8.1 UE Instrumentation

The Universal Editor instrumentation script is at `apps/eds-<market>/ue/instrumentation.js`. It adds `data-aue-*` attributes to DOM elements so that the Universal Editor can identify editable regions.

**Checklist:**

- [ ] Instrumentation script reviewed for each market
- [ ] All block containers instrumented with `data-aue-resource` and `data-aue-type`
- [ ] All editable fields instrumented with `data-aue-prop` and `data-aue-type`
- [ ] Universal Editor tested end-to-end in Dev environment
- [ ] UE instrumentation reviewed by Functional Lead before UAT

### 8.2 Component Definitions and Filters

| File | Purpose | Confirmed |
|---|---|---|
| `component-definition.json` | Registers block components in the Universal Editor | ☐ |
| `component-filters.json` | Controls where blocks can be placed on a page | ☐ |
| `component-models.json` | Defines field schemas for each block | ☐ |

---

## 9. Sitemap & URL Structure

### 9.1 URL Conventions

| Market | Base URL | Locale path prefix | Notes |
|---|---|---|---|
| US | `main--qsr-us--org.aem.live` | None | `/menu`, `/stores`, `/rewards` |
| UK | `main--qsr-uk--org.aem.live` | None | Same paths as US |
| JP | `main--qsr-jp--org.aem.live` | None | Japanese content at same URL paths |

### 9.2 Sitemap

Confirm the `sitemap.json` for each market covers all required page paths:

- [ ] US `sitemap.json` confirmed
- [ ] UK `sitemap.json` confirmed
- [ ] JP `sitemap.json` confirmed

---

## 10. Authoring Workflow

### 10.1 Publish Flow

| Step | Action | Tool |
|---|---|---|
| 1 | Author creates or edits content | Universal Editor / AEM Author |
| 2 | Author previews changes | AEM preview (`*.aem.page`) |
| 3 | Author publishes page/fragment | AEM Author → Publish |
| 4 | Webhook fires to App Builder | Automatic |
| 5 | EDS Admin API purges CDN cache | Automatic |
| 6 | Visitor sees updated content | `*.aem.live` |

**Checklist:**

- [ ] Authoring workflow demonstrated to Quick Service Restaurant Content Lead
- [ ] Rollback procedure documented (unpublish via AEM Author)
- [ ] Emergency cache purge procedure documented

---

## 11. Sign-off

| Item | Owner | Status |
|---|---|---|
| Page template inventory | Functional Lead | ☐ Approved |
| Block field definitions | Functional Lead | ☐ Approved |
| CF model definitions | Tech Architect | ☐ Approved |
| DAM folder structure | Content Lead | ☐ Approved |
| Query index configuration | Tech/Dev | ☐ Approved |
| Taxonomy and metadata | Functional Lead | ☐ Approved |
| UE instrumentation plan | Tech/Dev | ☐ Approved |
| Sitemap | Functional Lead | ☐ Approved |

**Sign-off confirmed by:**

- [ ] Quick Service Restaurant Content Lead: _______________________
- [ ] AEM Consultant (Functional) / Project Lead: _______________________
- [ ] AEM Technical Architect: _______________________
- [ ] Date: _______________________
