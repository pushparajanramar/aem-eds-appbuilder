# Analytics Consultant

## Role Overview

The Analytics Consultant owns the data and measurement strategy for the AEM EDS + App Builder solution. They design the tagging taxonomy, implement data-layer patterns across all three markets (US, UK, JP), validate data quality and provide insight to Starbucks stakeholders on digital-experience performance and loyalty engagement.

---

## Responsibilities

| Area | Description |
|---|---|
| **Measurement Strategy** | Define KPIs and measurement framework aligned to Starbucks business goals |
| **Tag Taxonomy** | Design the event taxonomy (page views, menu interactions, rewards redemptions, store searches) |
| **Data Layer Design** | Specify and implement the JavaScript data-layer schema used by each EDS block |
| **Analytics Implementation** | Configure Adobe Analytics / Adobe Experience Platform Web SDK within EDS block scripts |
| **Validation & QA** | Validate tracking correctness using browser debugger tools and Adobe Experience Platform Debugger |
| **Reporting & Dashboards** | Build Adobe Analytics Workspace reports for content performance, loyalty and conversion |
| **Privacy & Consent** | Ensure tag implementation complies with GDPR (UK), CCPA (US) and local regulations (JP) |

---

## Analytics Architecture

```
User Browser
    │  (page load / interaction events)
    ▼
EDS Block JavaScript
    │  (data layer push)
    ▼
Adobe Launch / Alloy (Web SDK)
    │
    ├──► Adobe Analytics (AppMeasurement / Web SDK)
    └──► Adobe Experience Platform (Real-Time CDP)
```

Data flows from EDS block interactions through the JavaScript data layer into Adobe Launch tags, and onward to Adobe Analytics and Adobe Experience Platform for segmentation and activation.

---

## Key Tracking Points Per Block

### `menu-item` Block

| Event | Trigger | Data |
|---|---|---|
| `menu_view` | Block visible in viewport | `market`, `category`, `itemId`, `itemTitle` |
| `menu_click` | User clicks a menu item | `market`, `category`, `itemId`, `itemTitle`, `price` |

### `product-detail` Block

| Event | Trigger | Data |
|---|---|---|
| `product_view` | Product detail block rendered | `market`, `itemId`, `itemTitle`, `price` |
| `customisation_change` | User changes size/milk/syrup | `market`, `itemId`, `customisationType`, `value` |
| `add_to_order` | User adds product to order | `market`, `itemId`, `itemTitle`, `price`, `customisations` |

### `promotion-banner` Block (Rewards)

| Event | Trigger | Data |
|---|---|---|
| `promotion_view` | Banner visible in viewport | `market`, `promotionId`, `stars`, `title` |
| `promotion_click` | User clicks a promotion | `market`, `promotionId`, `stars`, `title` |

### Store Locator

| Event | Trigger | Data |
|---|---|---|
| `store_search` | User submits a store search | `market`, `city`, `resultsCount` |
| `store_select` | User selects a store from results | `market`, `storeId`, `city`, `state` |

---

## Data Layer Schema

The recommended data-layer object pushed to `window.adobeDataLayer` (AEP Web SDK):

```json
{
  "event": "<event_name>",
  "eventInfo": {
    "market": "us",
    "pageType": "menu",
    "itemId": "drink-123",
    "itemTitle": "Caramel Macchiato",
    "price": 5.95,
    "category": "drinks",
    "currency": "USD"
  },
  "user": {
    "authState": "authenticated",
    "loyaltyTier": "gold"
  }
}
```

Currency and locale values per market are sourced from `app-builder/actions/shared/market-config.js`:

| Market | Locale | Currency |
|---|---|---|
| `us` | `en-US` | USD |
| `uk` | `en-GB` | GBP |
| `jp` | `ja-JP` | JPY |

---

## Query Index Integration

EDS query indices (defined in `apps/eds-<market>/config/index-config.yaml`) expose structured content metadata that can be consumed for analytics reporting and personalisation:

- **`menu-index`** — `title`, `image`, `description`, `price`, `category`, `itemId`, `lastModified`
- **`store-index`** — `title`, `address`, `city`, `state`, `zip`, `phone`, `hours`, `lat`, `lng`, `lastModified`
- **`rewards-index`** — `title`, `description`, `stars`, `image`, `lastModified`

These indices are available at `https://<edsHost>/query-index.json` and can be used to enrich analytics data or populate dashboard lookups.

---

## Privacy & Consent

- **UK** — GDPR compliance required; obtain explicit consent before activating analytics cookies. Use Adobe Launch consent management.
- **US** — CCPA opt-out mechanism must be available on all pages.
- **JP** — Act on Protection of Personal Information (APPI) compliance required; implement consent banner in Japanese.

All consent-state changes must propagate to the data layer:

```js
window.adobeDataLayer.push({ event: 'consent_update', consentState: 'opted-in' });
```

---

## Onboarding Checklist

- [ ] GitHub repository access (read)
- [ ] Adobe Analytics report suite access for all three markets (US, UK, JP)
- [ ] Adobe Experience Platform sandbox access
- [ ] Adobe Launch (Data Collection) property access for all three markets
- [ ] Adobe Experience Platform Debugger browser extension installed
- [ ] Alignment with AEM Consultant (Tech/Dev) on data-layer push locations within block JS
- [ ] Tag taxonomy document reviewed and approved by Starbucks Analytics team
- [ ] Consent management platform (CMP) requirements documented per market
