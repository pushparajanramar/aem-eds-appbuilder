# ADR 002 — BYOM Pattern for App Builder Actions

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2025-01-08 |
| **Proposer** | AEM Technical Architect |
| **Approver** | AEM Technical Architect |

---

## Context

AEM EDS serves static HTML from Git. Dynamic content (menu items, store locations, rewards, user profile) must be loaded at runtime from upstream APIs. EDS supports an **overlay** mechanism — a block can declare a `provider` URL from which it fetches its markup.

Two patterns exist for supplying dynamic EDS block content:

1. **Client-side fetch** — The EDS block JavaScript calls the upstream API directly from the browser.
2. **BYOM (Bring Your Own Markup)** — The EDS block's `provider` URL resolves to an App Builder action that fetches the upstream API, transforms the data and returns ready-to-render `text/html` EDS block markup.

Client-side fetch exposes upstream API credentials and structure to the browser, and complicates server-side caching. It also requires each market's EDS block JavaScript to contain API-fetch and HTML-rendering logic, violating the separation of concerns.

---

## Decision

Adopt the **BYOM pattern** for all dynamic content blocks: every App Builder action returns `text/html` EDS block markup (or `application/json` for layout hints in the `device-provider`). The EDS block JavaScript does nothing more than declare the `provider` URL in `config/site-config.json`.

### Action contract

| Property | Requirement |
|---|---|
| HTTP method | `GET` (read actions), `POST` (webhook, bff-proxy) |
| Response Content-Type | `text/html` (block markup) or `application/json` |
| HTML root element | A single `<div class="block-name">` wrapping `<div>` rows |
| Cache-Control | Set by the action via `Cache-Control: public, max-age={TTL}` |
| Error response | HTTP 4xx/5xx with `Content-Type: application/json` `{ error: string }` |

### Action inventory and cache TTLs

| Action | Auth | Cache TTL | Returns |
|---|---|---|---|
| `menu-provider` | None | 300 s | `text/html` menu-item block markup |
| `store-provider` | None | 600 s | `text/html` store-locator block markup |
| `rewards-provider` | IMS bearer | 120 s | `text/html` promotion-banner block markup |
| `user-provider` | IMS bearer | 60 s | `text/html` user-profile block markup |
| `bff-proxy` | IMS bearer | 60 s | `application/json` proxied BFF response |
| `device-provider` | None | 0 s (Vary: X-Device-Type) | `text/html` meta snippet or `application/json` layout hints |
| `webhook` | IMS bearer | — | `application/json` purge result |

---

## Consequences

### Positive

- **Security** — Upstream API credentials and URLs remain server-side inside App Builder actions; never exposed to the browser.
- **CDN cacheability** — `text/html` responses are cached at the EDS CDN edge using the configured `Cache-Control` TTL, reducing action invocations and latency for subsequent requests.
- **Separation of concerns** — EDS block JavaScript is kept minimal (declare provider URL); all data-fetching and rendering logic lives in the App Builder action.
- **Market abstraction** — A single action serves all three markets by accepting a `market` query parameter and looking up market-specific configuration from `app-builder/actions/shared/market-config.js`.

### Negative / Trade-offs

- **Markup coupling** — The HTML structure returned by an action must match the CSS class names expected by the corresponding EDS block JavaScript. Changes to block markup require coordinated action + block updates.
- **Cold-start penalty** — See [ADR 001](001-aem-eds-app-builder-solution-architecture.md#consequences) for cold-start mitigation.

### Follow-on actions

- Define and maintain the HTML structure for each block in the action source code (inline JSDoc comment).
- Implement integration tests that validate the returned HTML structure against the expected block schema.
- Document `market-config.js` changes in the shared utilities section of `aem-technical-architect.md`.
