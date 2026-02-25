# ADR 001 — AEM EDS + App Builder Solution Architecture

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2025-01-01 |
| **Proposer** | AEM Technical Architect |
| **Approver** | AEM Technical Architect |

---

## Context

The Quick Service Restaurant (QSR) client required a multi-market web presence (US, UK, JP) with:

- **Sub-second page loads** to support high-traffic menu and promotion pages.
- **Content authored** by non-technical marketing teams without developer involvement.
- **Dynamic, personalised content** (menu items, store locations, rewards) served from upstream APIs.
- **Rapid rollout** across three markets with a shared back-end.

Traditional AEM Sites (JSP/HTL rendering) introduces JVM cold-start latency and significant infrastructure cost. A pure static-site approach (e.g. Next.js + CDN) cannot satisfy the AEM Author requirement for structured content management and the Adobe IMS–gated rewards experience.

---

## Decision

Adopt **AEM Edge Delivery Services (EDS)** as the delivery platform with **Adobe App Builder (I/O Runtime)** serverless actions as the dynamic back-end.

- AEM Author (Universal Editor) is the content management system.
- A publish webhook from AEM Author triggers EDS cache purge/reindex via the `webhook` App Builder action.
- EDS serves static, CDN-cached HTML from Git.
- Dynamic content sections (menu, stores, rewards, account) are loaded as EDS overlay blocks, each backed by a dedicated App Builder action.

The resulting system is:

```
AEM Author
    │  (publish / unpublish / delete webhook)
    ▼
Adobe App Builder (I/O Runtime)
    ├─ menu-provider    → text/html EDS block markup
    ├─ store-provider   → text/html EDS block markup
    ├─ rewards-provider → text/html EDS block markup (IMS-gated)
    ├─ user-provider    → text/html EDS block markup (IMS-gated)
    ├─ bff-proxy        → application/json BFF proxy (IMS-gated)
    ├─ device-provider  → text/html meta / application/json layout hints
    └─ webhook          → EDS Admin API cache purge / reindex
            │
            ▼
AEM Edge Delivery Services (aem.live)
    ├─ apps/eds-us   (main--qsr-us--org.aem.live)
    ├─ apps/eds-uk   (main--qsr-uk--org.aem.live)
    └─ apps/eds-jp   (main--qsr-jp--org.aem.live)
```

---

## Consequences

### Positive

- **Performance** — Static HTML served from the CDN edge achieves Core Web Vitals targets (LCP < 2.5 s, CLS < 0.1, FID < 100 ms) without JVM warm-up.
- **Authoring simplicity** — Marketing teams use Universal Editor; no developer involvement for content updates.
- **Serverless cost model** — App Builder actions scale to zero; no always-on servers for dynamic content.
- **Adobe ecosystem integration** — Native IMS, Adobe Analytics, Adobe Target and AEP Tags integration without custom middleware.

### Negative / Trade-offs

- **App Builder cold starts** — Infrequently accessed actions (e.g. `rewards-provider`) may exhibit 500–800 ms cold-start latency; mitigated by configuring appropriate cache TTLs.
- **EDS overlay pattern complexity** — Developers must understand the EDS block overlay contract (see ADR 002).
- **Limited SSR** — Complex server-side rendering logic is not supported; all personalisation is client-side or via BYOM overlays.

### Follow-on actions

- Document the BYOM action contract in [ADR 002](002-byom-pattern-for-app-builder-actions.md).
- Configure cache TTLs per action in `app-builder/app.config.yaml`.
- Set Core Web Vitals budgets in the CI/CD pipeline (see [ADR 007](007-github-actions-cicd-pipeline.md)).
