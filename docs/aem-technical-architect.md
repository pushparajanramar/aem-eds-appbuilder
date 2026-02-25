# AEM Technical Architect

## Role Overview

The AEM Technical Architect owns the end-to-end technical design of the AEM Edge Delivery Services (EDS) + Adobe App Builder solution. They establish standards, govern implementation quality and make key technology decisions that ensure performance, scalability and maintainability across all three markets (US, UK, JP).

---

## Responsibilities

| Area | Description |
|---|---|
| **Solution Architecture** | Design and document the overall system: EDS sites, App Builder actions, IMS authentication, CI/CD pipeline |
| **Technical Standards** | Define coding conventions, branching strategy, component design patterns and security baselines |
| **Performance Governance** | Set and monitor Core Web Vitals targets; review blocks and actions for performance regressions |
| **Security & Auth** | Govern IMS token flow for the rewards-provider action; review secrets management (GitHub Secrets) |
| **Integration Design** | Design overlay routes and App Builder action contracts (request/response schemas) |
| **Code Review** | Conduct architecture-level pull-request reviews; approve changes to shared infrastructure |
| **Roadmap Input** | Advise on platform capabilities, Adobe release cycle impacts and emerging EDS patterns |

---

## System Architecture

```
AEM Author
    │  (webhook on publish / unpublish / delete)
    ▼
Adobe App Builder (Adobe I/O Runtime)
    ├─ menu-provider    → text/html EDS block markup
    ├─ store-provider   → text/html EDS block markup
    ├─ rewards-provider → text/html EDS block markup (IMS-gated)
    └─ webhook          → triggers EDS Admin API cache purge / reindex
            │
            ▼
AEM Edge Delivery Services (aem.live)
    ├─ apps/eds-us   (main--qsr-us--org.aem.live)
    ├─ apps/eds-uk   (main--qsr-uk--org.aem.live)
    └─ apps/eds-jp   (main--qsr-jp--org.aem.live)
```

### App Builder Actions

All actions are declared under the `qsr` package in [`app-builder/app.config.yaml`](../app-builder/app.config.yaml):

| Action | Auth Required | Cache TTL | Returns |
|---|---|---|---|
| `menu-provider` | No | 300 s | `text/html` menu-item block markup |
| `store-provider` | No | 600 s | `text/html` store-locator block markup |
| `rewards-provider` | **Yes** (IMS bearer) | 120 s | `text/html` promotion-banner block markup |
| `webhook` | **Yes** | — | `application/json` purge result |

### Shared Utilities

```
app-builder/actions/shared/
├── market-config.js   # EDS host + locale per market (us / uk / jp)
└── url-utils.js       # Safe URL construction helpers
```

These are the only files shared across all actions. Changes here require cross-action regression testing.

### Svelte Web Components

Shared components live in `packages/eds-components/src/components/` and are bundled by Vite into market-specific artifacts:

| Component | Purpose |
|---|---|
| `qsr-menu-card.svelte` | Menu item card displayed by the `menu-item` block |
| `qsr-product-customizer.svelte` | Size/milk/syrup customiser in the `product-detail` block |

Build output is copied to `apps/eds-*/blocks/` during the CI/CD pipeline.

---

## CI/CD Pipeline

Defined in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml):

```
push to main
    │
    ▼
[lint]  ──────────────────────────────────────────►  ESLint on app-builder actions
    │
    ├──► [build-components]  ──────────────────────►  Vite build of Svelte WCs → artifact
    │         │
    │         ├──► [deploy-eds-us]   ──────────────►  Publish to admin.hlx.page (US)
    │         ├──► [deploy-eds-uk]   ──────────────►  Publish to admin.hlx.page (UK)
    │         └──► [deploy-eds-jp]   ──────────────►  Publish to admin.hlx.page (JP)
    │
    └──► [deploy-app-builder]  ────────────────────►  aio app deploy (main branch only)
```

### GitHub Secrets

| Secret | Description |
|---|---|
| `AIO_IMS_CONTEXT_CONFIG` | Base64-encoded IMS context JSON for App Builder deployment |
| `AIO_PROJECT_ID` | Adobe Developer Console project ID |
| `AIO_WORKSPACE_ID` | Adobe Developer Console workspace ID |
| `EDS_TOKEN` | Bearer token for the AEM EDS Admin API |

---

## Architecture Decision Log

Maintain architecture decisions as ADR (Architecture Decision Record) markdown files in `docs/adr/` using the format `NNN-short-title.md`. The Technical Architect is the approver for all ADRs.

---

## Onboarding Checklist

- [ ] GitHub repository access (admin or write)
- [ ] Adobe Developer Console project access (admin)
- [ ] Local `aio` CLI authenticated (`aio auth login`)
- [ ] `.env` file created in `app-builder/` with IMS credentials (never commit)
- [ ] All three markets verified in local development (`aem up`)
- [ ] Familiarity with [AEM EDS developer documentation](https://www.aem.live/developer/tutorial)
- [ ] Adobe App Builder [getting-started guide](https://developer.adobe.com/app-builder/docs/getting_started/) reviewed
