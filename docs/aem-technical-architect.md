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
    ├─ user-provider    → text/html EDS block markup (IMS-gated)
    ├─ bff-proxy        → application/json BFF module proxy (IMS-gated)
    ├─ device-provider  → text/html meta snippet or application/json layout hints
    ├─ sitemap-generator → application/json sitemap build + push result (IMS-gated)
    └─ webhook          → triggers EDS Admin API cache purge / reindex
            │
            ▼
Fastly CDN
    │  (device detection via VCL — sets X-Device-Type header)
    │  (URL routing — subdomain redirect / subdirectory rewrite)
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
| `user-provider` | **Yes** (IMS bearer) | 60 s | `text/html` user-profile block markup |
| `bff-proxy` | **Yes** (IMS bearer) | 60 s | `application/json` proxied BFF response |
| `device-provider` | No | 0 s (Vary: X-Device-Type) | `text/html` meta snippet or `application/json` layout hints |
| `sitemap-generator` | **Yes** (IMS bearer) | — | `application/json` `{ result, market, edsHost, pageCount, pushed, sitemapUrl }` |
| `webhook` | **Yes** (IMS bearer) | — | `application/json` purge result |

### Shared Utilities

```
app-builder/actions/shared/
├── market-config.js   # EDS host + locale + timezone per market (us / uk / jp)
├── url-utils.js       # Safe URL construction helpers + Dynamic Media URL builders
├── device-utils.js    # Device type detection and layout configuration
└── datalog.js         # Structured request audit logging (JSON lines)
```

These are the only files shared across all actions. Changes here require cross-action regression testing.

### Svelte Web Components

Shared components live in `packages/eds-components/src/components/` and are bundled by Vite into market-specific artifacts. See [Svelte Web Components Guide](svelte-web-components-guide.md) for the full reference.

| Component | Custom element | EDS block directory | Auth required? |
|---|---|---|---|
| `qsr-accordion.svelte` | `<qsr-accordion>` | `accordion/` | No |
| `qsr-breadcrumbs.svelte` | `<qsr-breadcrumbs>` | `breadcrumbs/` | No |
| `qsr-cards.svelte` | `<qsr-cards>` | `cards/` | No |
| `qsr-carousel.svelte` | `<qsr-carousel>` | `carousel/` | No |
| `qsr-columns.svelte` | `<qsr-columns>` | `columns/` | No |
| `qsr-embed.svelte` | `<qsr-embed>` | `embed/` | No |
| `qsr-footer.svelte` | `<qsr-footer>` | `footer/` | No |
| `qsr-form.svelte` | `<qsr-form>` | `form/` | No |
| `qsr-fragment.svelte` | `<qsr-fragment>` | `fragment/` | No |
| `qsr-header.svelte` | `<qsr-header>` | `header/` | No |
| `qsr-hero.svelte` | `<qsr-hero>` | `hero/` | No |
| `qsr-menu-card.svelte` | `<qsr-menu-card>` | `menu-item/` | No |
| `qsr-modal.svelte` | `<qsr-modal>` | `modal/` | No |
| `qsr-product-customizer.svelte` | `<qsr-product-customizer>` | `product-detail/` | No |
| `qsr-quote.svelte` | `<qsr-quote>` | `quote/` | No |
| `qsr-rewards-feed.svelte` | `<qsr-rewards-feed>` | `rewards-feed/` | **Yes** |
| `qsr-search.svelte` | `<qsr-search>` | `search/` | No |
| `qsr-store-locator.svelte` | `<qsr-store-locator>` | `store-locator/` | No |
| `qsr-table.svelte` | `<qsr-table>` | `table/` | No |
| `qsr-tabs.svelte` | `<qsr-tabs>` | `tabs/` | No |
| `qsr-user-profile.svelte` | `<qsr-user-profile>` | `user-profile/` | **Yes** |
| `qsr-video.svelte` | `<qsr-video>` | `video/` | No |

Build output is copied to `apps/eds-*/blocks/` during the CI/CD pipeline.

### Fastly CDN

Fastly sits in front of the EDS origin and provides device detection and URL routing via VCL:

| File | Purpose |
|---|---|
| `fastly/vcl/device-detection.vcl` | Normalises the User-Agent into a compact `X-Device-Type` token (`mobile`, `tablet`, `desktop`, `kiosk`, `digital-menu-board`, `headless`) and sets the `Vary: X-Device-Type` response header |
| `fastly/vcl/url-routing.vcl` | Implements subdomain redirect (Pattern B) and subdirectory rewrite (Pattern C) based on `X-Device-Type` |

The `X-Device-Type` header is forwarded to App Builder actions; the `device-provider` action reads it to return device-appropriate HTML or JSON layout hints.

---

## CI/CD Pipeline

The project uses a **folder-based monorepo pipeline** strategy (see [ADR 010](adr/010-folder-based-monorepo-pipeline.md)). Each sub-application lives in its own top-level folder, and separate workflows trigger only when files in that folder change:

| Workflow | File | Trigger folder | Purpose |
|---|---|---|---|
| **PR Validation** | [`pr-validation.yml`](../.github/workflows/pr-validation.yml) | All folders | Lint, test, type-check, build-validate all sub-apps |
| **App Builder Deploy** | [`app-builder-deploy.yml`](../.github/workflows/app-builder-deploy.yml) | `app-builder/` | Deploy actions + web UI to I/O Runtime |
| **EDS Deploy** | [`eds-deploy.yml`](../.github/workflows/eds-deploy.yml) | `packages/eds-components/`, `apps/**/blocks/` | Compile Svelte WCs → publish to EDS markets |
| **AEM Backend Deploy** | [`aem-backend-deploy.yml`](../.github/workflows/aem-backend-deploy.yml) | `aem-backend/` | Maven build → trigger Cloud Manager |
| **Branch Cleanup** | [`delete-merged-branches.yml`](../.github/workflows/delete-merged-branches.yml) | PR closed | Auto-delete merged PR branches |

```
PR opened / push to main
    │
    ▼
[pr-validation]  ──────────────────────────────►  ESLint + unit tests + svelte-check + Maven verify
    │                                              (runs on every PR across all sub-apps)
    │
push to main (folder-filtered)
    │
    ├──► [app-builder-deploy]  ─────────────────►  aio app deploy (app-builder/ changed)
    │
    ├──► [eds-deploy]  ─────────────────────────►  Vite build → copy bundles → publish to admin.hlx.page
    │         (packages/eds-components/ or apps/**/blocks/ changed)
    │
    └──► [aem-backend-deploy]  ─────────────────►  mvn verify → trigger Cloud Manager pipeline
              (aem-backend/ changed)
```

### GitHub Secrets

| Secret | Description |
|---|---|
| `AIO_IMS_CONTEXT_CONFIG` | Base64-encoded IMS context JSON for App Builder deployment |
| `AIO_PROJECT_ID` | Adobe Developer Console project ID |
| `AIO_WORKSPACE_ID` | Adobe Developer Console workspace ID |
| `EDS_TOKEN` | Bearer token for the AEM EDS Admin API |
| `CM_PROGRAM_ID` | Cloud Manager program ID |
| `CM_API_KEY` | Cloud Manager API key |
| `CM_ORG_ID` | Adobe IMS organisation ID for Cloud Manager |
| `CM_TECHNICAL_ACCOUNT_ID` | Technical account ID for Cloud Manager API |
| `CM_IMS_TOKEN` | IMS bearer token for Cloud Manager API calls |
| `CM_PIPELINE_ID` | Cloud Manager pipeline ID to trigger |

---

## Architecture Decision Log

Maintain architecture decisions as ADR (Architecture Decision Record) markdown files in `docs/adr/` using the format `NNN-short-title.md`. The Technical Architect is the approver for all ADRs.

See the **[ADR index](adr/README.md)** for all current decisions.

| # | Title | Status |
|---|---|---|
| [001](adr/001-aem-eds-app-builder-solution-architecture.md) | AEM EDS + App Builder Solution Architecture | Accepted |
| [002](adr/002-byom-pattern-for-app-builder-actions.md) | BYOM Pattern for App Builder Actions | Accepted |
| [003](adr/003-multi-market-single-repository.md) | Multi-Market Single-Repository Structure | Accepted |
| [004](adr/004-ims-authentication-for-secured-actions.md) | Adobe IMS Authentication for Secured Actions | Accepted |
| [005](adr/005-svelte-web-components-for-shared-ui.md) | Svelte Web Components for Shared UI | Accepted |
| [006](adr/006-fastly-cdn-device-detection-and-routing.md) | Fastly CDN for Device Detection and URL Routing | Accepted |
| [007](adr/007-github-actions-cicd-pipeline.md) | GitHub Actions CI/CD Pipeline | Superseded by 009 |
| [008](adr/008-cloud-manager-aem-backend-pipeline.md) | Cloud Manager Pipeline for AEM Backend Deployment | Accepted |
| [009](adr/009-path-based-monorepo-pipeline.md) | Path-Based Monorepo Pipeline Strategy | Superseded by 010 |
| [010](adr/010-folder-based-monorepo-pipeline.md) | Folder-Based Monorepo Pipeline Strategy | Accepted |

---

## Onboarding Checklist

- [ ] GitHub repository access (admin or write)
- [ ] Adobe Developer Console project access (admin)
- [ ] Local `aio` CLI authenticated (`aio auth login`)
- [ ] `.env` file created in `app-builder/` with IMS credentials (never commit)
- [ ] All three markets verified in local development (`aem up`)
- [ ] Familiarity with [AEM EDS developer documentation](https://www.aem.live/developer/tutorial)
- [ ] Adobe App Builder [getting-started guide](https://developer.adobe.com/app-builder/docs/getting_started/) reviewed
