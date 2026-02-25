# Analytics Discovery Template

This document is completed during the **Analytics Discovery** workstream. It captures the measurement framework, KPIs, event taxonomy, Adobe Analytics report suite configuration and Adobe Analytics Business Requirements Document (BRD) for the AEM EDS + App Builder programme across all three markets (US, UK, JP).

---

## Table of Contents

1. [Business Objectives & KPIs](#1-business-objectives--kpis)
2. [Measurement Framework](#2-measurement-framework)
3. [Event Taxonomy](#3-event-taxonomy)
4. [Adobe Analytics Report Suite Configuration](#4-adobe-analytics-report-suite-configuration)
5. [Adobe Launch Property Plan](#5-adobe-launch-property-plan)
6. [Data Layer Schema](#6-data-layer-schema)
7. [AA Business Requirements Document (BRD)](#7-aa-business-requirements-document-brd)
8. [Privacy & Consent Requirements](#8-privacy--consent-requirements)
9. [Validation Plan](#9-validation-plan)
10. [Sign-off](#10-sign-off)

---

## 1. Business Objectives & KPIs

### 1.1 Business Objectives

| # | Objective | Measurement |
|---|---|---|
| 1 | Increase digital menu engagement | Menu item click rate |
| 2 | Drive rewards programme sign-ups and redemptions | Rewards page conversion rate |
| 3 | Improve store visit intent | Store locator search-to-direction rate |
| 4 | Optimise content performance | Content engagement rate per page |
| 5 | Ensure site performance meets CWV targets | LCP, CLS, FID |

### 1.2 KPI Definitions

| KPI | Definition | Target | Measurement frequency |
|---|---|---|---|
| Menu item click rate | Clicks on menu items / menu page views | > 15 % | Weekly |
| Rewards conversion rate | Rewards redemptions / authenticated rewards page views | > 5 % | Weekly |
| Store direction rate | "Get directions" clicks / store search results | > 20 % | Weekly |
| Page bounce rate | Single-page sessions / total sessions | < 40 % | Weekly |
| LCP | P75 Largest Contentful Paint | < 2.5 s | Weekly (CrUX) |

---

## 2. Measurement Framework

### 2.1 Measurement Model

```
User Journey Event
    │
    ▼
JavaScript data layer push (window.adobeDataLayer)
    │
    ▼
Adobe Launch rule fires
    │
    ├──► Adobe Analytics beacon (AppMeasurement / Web SDK)
    └──► Adobe Target notification (for personalised experiences)
```

### 2.2 Tracking Coverage by Page Type

| Page type | Events tracked |
|---|---|
| All pages | Page view, scroll depth (25/50/75/100 %), time on page |
| Menu listing | Menu view, menu item click |
| Product detail | Product view, customisation change, add to order |
| Rewards page | Rewards view, promotion view, promotion click, authentication event |
| Store locator | Store search, store result view, store select, get directions |
| Campaign page | Promotion view, promotion CTA click |

---

## 3. Event Taxonomy

### 3.1 Standard Events

| Event name | Trigger | Data layer properties | AA event |
|---|---|---|---|
| `page_view` | Page load complete | `market`, `pageType`, `pageName`, `locale` | Page view |
| `menu_view` | `menu-item` block enters viewport | `market`, `category`, `itemId`, `itemTitle` | `event10` |
| `menu_click` | User clicks a menu item | `market`, `category`, `itemId`, `itemTitle`, `price` | `event11` |
| `product_view` | `product-detail` block renders | `market`, `itemId`, `itemTitle`, `price` | `event20` |
| `customisation_change` | Size/milk/syrup selection changed | `market`, `itemId`, `customisationType`, `value` | `event21` |
| `add_to_order` | Add to order button clicked | `market`, `itemId`, `itemTitle`, `price`, `customisations` | `event22` |
| `promotion_view` | Promotion banner enters viewport | `market`, `promotionId`, `stars`, `title` | `event30` |
| `promotion_click` | CTA on promotion banner clicked | `market`, `promotionId`, `stars`, `title` | `event31` |
| `store_search` | Store search submitted | `market`, `city`, `resultsCount` | `event40` |
| `store_select` | Store selected from results | `market`, `storeId`, `city`, `state` | `event41` |
| `get_directions` | Get directions clicked | `market`, `storeId` | `event42` |
| `rewards_view` | Rewards page loaded (authenticated) | `market`, `loyaltyTier` | `event50` |
| `consent_update` | User updates consent preferences | `consentState` | — |

### 3.2 Variable Mapping

| Data layer property | AA variable | Notes |
|---|---|---|
| `market` | `eVar1` | Persists for visit |
| `pageType` | `eVar2` | Hit |
| `pageName` | `s.pageName` | Hit |
| `itemId` | `s.products` (productID) | Hit |
| `category` | `eVar5` | Hit |
| `price` | `s.products` (price) | Hit |
| `loyaltyTier` | `eVar10` | Session |
| `promotionId` | `eVar15` | Hit |
| `city` | `eVar20` | Hit |
| `customisationType` | `eVar25` | Hit |

---

## 4. Adobe Analytics Report Suite Configuration

### 4.1 Report Suite IDs

| Market | Dev/QA suite | Production suite |
|---|---|---|
| US | `qsr-us-dev` | `qsr-us-prod` |
| UK | `qsr-uk-dev` | `qsr-uk-prod` |
| JP | `qsr-jp-dev` | `qsr-jp-prod` |

### 4.2 Report Suite Settings

| Setting | Value |
|---|---|
| Base currency | USD (US), GBP (UK), JPY (JP) |
| Time zone | US: America/Chicago; UK: Europe/London; JP: Asia/Tokyo |
| Default page | `home` |
| IP exclusions | Adobe office IPs, Quick Service Restaurant HQ IPs, agency IPs |
| Bot filtering | Enabled (IAB list + custom rules) |
| Character set | UTF-8 (all markets) |

### 4.3 Custom Events Configuration

| Event | Name | Type |
|---|---|---|
| `event10` | Menu Item View | Counter |
| `event11` | Menu Item Click | Counter |
| `event20` | Product View | Counter |
| `event21` | Customisation Change | Counter |
| `event22` | Add to Order | Counter |
| `event30` | Promotion View | Counter |
| `event31` | Promotion Click | Counter |
| `event40` | Store Search | Counter |
| `event41` | Store Select | Counter |
| `event42` | Get Directions | Counter |
| `event50` | Rewards Page View (Auth) | Counter |

### 4.4 eVar Configuration

| eVar | Name | Expiration | Allocation |
|---|---|---|---|
| `eVar1` | Market | Visit | Most recent |
| `eVar2` | Page Type | Hit | Most recent |
| `eVar5` | Menu Category | Hit | Most recent |
| `eVar10` | Loyalty Tier | Session | Most recent |
| `eVar15` | Promotion ID | Hit | Most recent |
| `eVar20` | Store Search City | Hit | Most recent |
| `eVar25` | Customisation Type | Hit | Most recent |

---

## 5. Adobe Launch Property Plan

### 5.1 Property Structure

| Property | Markets covered | Notes |
|---|---|---|
| `Quick Service Restaurant EDS — Global` | US, UK, JP | Single property with market-scoped rules |

> Alternatively, create one property per market if market-specific configurations are extensive.

### 5.2 Extensions Required

| Extension | Version | Purpose |
|---|---|---|
| Adobe Analytics | Latest | Core AA tracking |
| Adobe Target v2 | Latest | A/B testing, personalisation |
| Adobe Experience Cloud ID Service | Latest | ECID / visitor ID |
| AEP Web SDK (optional) | Latest | If migrating to Experience Platform |
| Adobe Privacy | Latest | GDPR / CCPA / APPI consent |
| Core | Latest | Custom code, data elements, rules |

### 5.3 Environment Embed Codes

| Environment | Embed code hash | Used on |
|---|---|---|
| Development | (generated by Launch) | Feature branches, `*.aem.page` |
| Staging | (generated by Launch) | Release candidate testing |
| Production | (generated by Launch) | `*.aem.live` |

---

## 6. Data Layer Schema

The AEP data layer object pushed to `window.adobeDataLayer` for each event:

```json
{
  "event": "<event_name>",
  "eventInfo": {
    "market":    "us",
    "pageType":  "menu",
    "pageName":  "/menu",
    "locale":    "en-US",
    "itemId":    "drink-123",
    "itemTitle": "Caramel Macchiato",
    "price":     5.95,
    "category":  "drinks",
    "currency":  "USD"
  },
  "user": {
    "authState":    "authenticated",
    "loyaltyTier":  "gold"
  },
  "consent": {
    "analyticsConsent": true,
    "targetConsent":    true
  }
}
```

### 6.1 Data Layer Initialisation

Each EDS market site initialises the data layer in `scripts/aem.js` (or a dedicated `scripts/datalayer.js`):

```js
window.adobeDataLayer = window.adobeDataLayer || [];
window.adobeDataLayer.push({
  event: 'page_view',
  eventInfo: {
    market:   window.siteConfig?.market || 'us',
    pageType: document.body.dataset.pageType || 'generic',
    pageName: window.location.pathname,
    locale:   document.documentElement.lang,
  },
});
```

---

## 7. AA Business Requirements Document (BRD)

The BRD is a separate document produced by the Analytics Consultant for each market. It contains:

| Section | Content |
|---|---|
| Executive summary | Programme overview and measurement objectives |
| Report suite configuration | eVars, events, props, classifications |
| Tracking specification | Page-by-page event mapping table |
| Data layer specification | JSON schema and push locations |
| Launch rules | Rule name, trigger, conditions, actions |
| Test plan | Validation steps per event |
| Privacy and consent | Per-market legal requirements |

> The BRD template is maintained in the project shared drive. A separate BRD is produced for each market (US, UK, JP).

---

## 8. Privacy & Consent Requirements

| Market | Regulation | Requirement |
|---|---|---|
| US | CCPA | Opt-out mechanism on all pages; "Do Not Sell My Personal Information" link in footer |
| UK | GDPR / PECR | Explicit opt-in consent before any analytics or targeting cookies are set |
| JP | APPI | Consent banner in Japanese; data processing disclosure |

### 8.1 Consent Management Implementation

1. Implement a **Consent Management Platform (CMP)** (e.g., OneTrust) on all EDS sites.
2. Use the **Adobe Privacy extension** in Launch to gate analytics and Target based on consent state.
3. Push consent state to the data layer on each consent change:

```js
window.adobeDataLayer.push({
  event: 'consent_update',
  consent: {
    analyticsConsent: true,  // set by CMP callback
    targetConsent:    true,
  },
});
```

4. Gate all AA and Target Launch rules behind a consent condition:

```
Condition: Custom Code
return window.__adobePrivacy?.hasOptedInToAll() === true;
```

---

## 9. Validation Plan

### 9.1 Validation Tools

- **Adobe Experience Platform Debugger** (Chrome extension) — inspect AA beacons, Target requests, Launch rules
- **Charles Proxy / Fiddler** — inspect raw network requests
- **Adobe Analytics Real-Time report** — verify events firing in near real-time

### 9.2 Validation Checklist

| Event | Validated on | Validated by | Status |
|---|---|---|---|
| `page_view` fires on every page | Dev | Analytics Consultant | ☐ |
| `menu_click` fires on menu item click | Dev | Analytics Consultant | ☐ |
| `product_view` fires on product detail load | Dev | Analytics Consultant | ☐ |
| `store_search` fires on store search submit | Dev | Analytics Consultant | ☐ |
| `promotion_view` fires on banner impression | Dev | Analytics Consultant | ☐ |
| Consent gate blocks AA before opt-in | Dev | Analytics Consultant | ☐ |
| AA beacons contain correct `eVar1` (market) | Dev | Analytics Consultant | ☐ |
| AA report suite receives data (UK = `qsr-uk-prod`) | Production | Analytics Consultant | ☐ |

---

## 10. Sign-off

| Item | Owner | Status |
|---|---|---|
| KPIs agreed | Analytics Consultant + Quick Service Restaurant Digital Marketing | ☐ Approved |
| Event taxonomy agreed | Analytics Consultant | ☐ Approved |
| BRD completed (US) | Analytics Consultant | ☐ Approved |
| BRD completed (UK) | Analytics Consultant | ☐ Approved |
| BRD completed (JP) | Analytics Consultant | ☐ Approved |
| Report suite configuration confirmed | Analytics Consultant | ☐ Approved |
| Privacy requirements confirmed | Analytics Consultant + Legal | ☐ Approved |

**Sign-off confirmed by:**

- [ ] Quick Service Restaurant Analytics team: _______________________
- [ ] Analytics Consultant: _______________________
- [ ] Date: _______________________
