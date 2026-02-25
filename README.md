# aem-eds-appbuilder

Multi-market Adobe Experience Manager Edge Delivery Services (AEM EDS) project with Adobe App Builder serverless back-end actions for Quick Service Restaurant (US, UK, JP).

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Project Lifecycle](#project-lifecycle)
- [Role Documents](#role-documents)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
  - [App Builder Actions](#app-builder-actions)
  - [Svelte Web Components](#svelte-web-components)
- [Configuration](#configuration)
  - [Market Configuration](#market-configuration)
  - [Site Configuration](#site-configuration)
  - [GitHub Secrets](#github-secrets)
- [App Builder Actions Reference](#app-builder-actions-reference)
- [Content Supply Chain](docs/content-supply-chain.md)
- [Deployment Guide](#deployment-guide)
  - [CI/CD Pipeline (Recommended)](#cicd-pipeline-recommended)
  - [Manual Deployment — App Builder](#manual-deployment--app-builder)
  - [Manual Deployment — EDS Sites](#manual-deployment--eds-sites)
- [Process Documents](#process-documents)

---

## Project Overview

This repository contains all assets for a multi-market AEM EDS implementation backed by Adobe App Builder serverless actions (BYOM — Bring Your Own Markup).

**Markets supported:** United States (`us`), United Kingdom (`uk`), Japan (`jp`)

Key capabilities:

| Capability | Description |
|---|---|
| **Menu Provider** | Fetches menu items from the upstream product API and returns EDS-compatible HTML block markup |
| **Store Provider** | Fetches store locations and returns EDS-compatible HTML block markup |
| **Rewards Provider** | Fetches the rewards catalog (requires Adobe IMS authentication) |
| **Webhook** | Listens for AEM Author publish / unpublish / delete events and triggers EDS cache invalidation |
| **Svelte Web Components** | Shared `qsr-menu-card` and `qsr-product-customizer` web components bundled per market |

---

## Architecture

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

App Builder actions are invoked by EDS overlay routes defined in each market's `site-config.json`.

---

## Repository Structure

```
aem-eds-appbuilder/
├── app-builder/                   # Adobe App Builder application
│   ├── app.config.yaml            # Action declarations (package: qsr)
│   ├── package.json
│   └── actions/
│       ├── menu-provider/         # BYOM action — /menu overlay
│       ├── store-provider/        # BYOM action — /stores overlay
│       ├── rewards-provider/      # BYOM action — /rewards overlay (auth required)
│       ├── webhook/               # AEM Author webhook handler
│       └── shared/
│           ├── market-config.js   # EDS host + locale per market
│           └── url-utils.js       # Safe URL helpers
│
├── apps/                          # EDS site configurations (one per market)
│   ├── eds-us/
│   │   ├── blocks/                # EDS blocks (menu-item, product-detail, promotion-banner)
│   │   ├── config/
│   │   │   ├── site-config.json   # Overlay route → App Builder URL mappings
│   │   │   └── index-config.yaml  # EDS query index definitions
│   │   ├── scripts/aem.js         # EDS core runtime script
│   │   ├── styles/                # Global CSS
│   │   ├── ue/                    # Universal Editor configuration
│   │   ├── component-definition.json
│   │   ├── component-filters.json
│   │   ├── component-models.json
│   │   └── sitemap.json
│   ├── eds-uk/                    # Same structure as eds-us
│   └── eds-jp/                    # Same structure as eds-us
│
├── packages/
│   └── eds-components/            # Shared Svelte Web Components library
│       ├── src/
│       │   ├── components/
│       │   │   ├── qsr-menu-card.svelte
│       │   │   └── qsr-product-customizer.svelte
│       │   └── utils/
│       │       ├── api.js
│       │       └── auth.js
│       ├── vite.config.js
│       └── package.json
│
└── .github/
    └── workflows/
        └── deploy.yml             # CI/CD — lint → build WCs → deploy
```

---

## Project Lifecycle

The full engagement follows five phases. Each phase has a dedicated runbook and set of reference documents in the [`docs/`](docs/) directory:

| #  | Phase          | Activity                                      | Reference Document                                                                                                |
|----|----------------|-----------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| 01 | Kickoff        | Read the Digital Foundation Blueprint Runbook | [Blueprint Runbook](docs/blueprint-runbook.md)                                                                   |
| 02 | Kickoff        | Create the Kickoff Deck                       | [Kick-off Deck Template](docs/kickoff-deck-template.md)                                                          |
| 03 | Discovery      | Follow the Discovery Runbook                  | [Discovery Runbook](docs/discovery-runbook.md)                                                                   |
| 04 | Discovery      | Perform UX Solution Design                    | [UX Solution Design Runbook](docs/ux-solution-design-runbook.md)                                                 |
| 05 | Discovery      | Perform Content Architecture Discovery        | [AEM Sites Discovery Checklist](docs/aem-sites-discovery-checklist.md)                                           |
| 06 | Discovery      | Perform Analytics Discovery                   | [Analytics Discovery Template](docs/analytics-discovery-template.md)                                             |
| 07 | Discovery      | Perform Optimisation Discovery                | [Optimisation Runbook — Chapter 1](docs/optimization-runbook.md#chapter-1-optimisation-discovery)                |
| 08 | Implementation | Follow the Implementation Runbook             | [Implementation Runbook](docs/implementation-runbook.md)                                                         |
| 09 | Implementation | Configure AEM Code & Environment              | [AEM Configuration Guide](docs/aem-configuration-guide.md)                                                       |
| 10 | Implementation | AA / AT / Launch Automation                   | [Implementation Runbook §3.2.2](docs/implementation-runbook.md#322-aa--at--launch-automation)                    |
| 11 | Implementation | Style the Templates / Components              | [Front-End (Site Styling) Runbook](docs/front-end-styling-runbook.md)                                            |
| 12 | Implementation | Create site content                           | [Content Architecture Runbook](docs/content-architecture-runbook.md)                                             |
| 13 | Go-Live        | Perform Go-Live Check                         | [Go-Live Checklist](docs/go-live-checklist.md)                                                                   |
| 14 | Go-Live        | Cutover / Launch Site                         | [Go-Live Runbook](docs/go-live-runbook.md)                                                                       |
| 15 | Optimisation   | Configure Audiences                           | [Optimisation Runbook — Chapter 3](docs/optimization-runbook.md#chapter-3-audience-configuration)                |
| 16 | Optimisation   | Plan & Execute Tests                          | [Optimisation Runbook — Chapter 4](docs/optimization-runbook.md#chapter-4-planning--executing-tests)             |
| 17 | Optimisation   | Optimise Tests                                | [Optimisation Runbook — Chapter 5](docs/optimization-runbook.md#chapter-5-optimising-tests)                      |

---

## Role Documents

Role-specific onboarding and reference documents are located in the [`docs/`](docs/) directory:

| Role | Document |
|---|---|
| Client Partner | [`docs/client-partner.md`](docs/client-partner.md) |
| AEM Consultant (Functional) / Project Lead | [`docs/aem-consultant-functional-project-lead.md`](docs/aem-consultant-functional-project-lead.md) |
| AEM Technical Architect | [`docs/aem-technical-architect.md`](docs/aem-technical-architect.md) |
| Project Manager | [`docs/project-manager.md`](docs/project-manager.md) |
| AEM Consultant (Tech/Dev) / UX Consultant | [`docs/aem-consultant-tech-dev-ux-consultant.md`](docs/aem-consultant-tech-dev-ux-consultant.md) |
| Analytics Consultant | [`docs/analytics-consultant.md`](docs/analytics-consultant.md) |

---

## Process Documents

| Document | Description |
|---|---|
| [AEM Configuration Guide](docs/aem-configuration-guide.md) | End-to-end AEM ecosystem configuration (Archetype, Cloud Manager, SSO, security, Launch) |
| [Go-Live Checklist](docs/golive-checklist.md) | Pre-production sign-off checklist covering Development, QA, Sysadmin & Business |

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18.x | Runtime for actions and build tools |
| [npm](https://www.npmjs.com/) | 9+ | Package manager |
| [Adobe I/O CLI](https://developer.adobe.com/app-builder/docs/getting_started/) | latest | Deploy App Builder actions (`aio` command) |
| Adobe Developer Console project | — | IMS credentials for App Builder deployment |
| AEM EDS access | — | `EDS_TOKEN` for publishing to `admin.hlx.page` |

Install the Adobe I/O CLI globally:

```bash
npm install -g @adobe/aio-cli
```

---

## Local Development

### App Builder Actions

```bash
# 1. Install dependencies
cd app-builder
npm ci

# 2. Lint actions
npm run lint

# 3. Run unit tests
npm test

# 4. Run locally with the Adobe I/O CLI (requires .env with IMS credentials)
aio app run
```

Create a `.env` file in `app-builder/` (never commit this file — it is in `.gitignore`):

```
AIO_IMS_CONTEXT_CONFIG=<base64-encoded IMS context JSON>
AIO_PROJECT_ID=<your-project-id>
AIO_WORKSPACE_ID=<your-workspace-id>
```

### Svelte Web Components

```bash
# 1. Install dependencies
cd packages/eds-components
npm ci

# 2. Build once
npm run build

# 3. Watch mode (rebuilds on file changes)
npm run dev

# 4. Type-check with svelte-check
npm run check

# 5. Lint Svelte sources
npm run lint
```

Built bundles are written to `packages/eds-components/dist/` and referenced by the EDS blocks inside `apps/eds-*/blocks/`.

---

## Configuration

### Market Configuration

Market-specific EDS hosts and locales are defined in [`app-builder/actions/shared/market-config.js`](app-builder/actions/shared/market-config.js):

| Market | EDS Host | Locale | Currency |
|---|---|---|---|
| `us` | `main--qsr-us--org.aem.live` | `en-US` | USD |
| `uk` | `main--qsr-uk--org.aem.live` | `en-GB` | GBP |
| `jp` | `main--qsr-jp--org.aem.live` | `ja-JP` | JPY |

### Site Configuration

Each market has a `config/site-config.json` that maps overlay routes to App Builder action URLs. Replace `{app-builder-host}` with the actual App Builder host after deployment, and `{IMS_CLIENT_ID}` with your IMS client ID:

```json
{
  "version": "1.0",
  "siteId": "qsr-us",
  "overlays": {
    "/menu":    { "provider": "menu-provider",    "url": "https://{app-builder-host}/api/v1/web/qsr/menu-provider", "cacheTtl": 300 },
    "/stores":  { "provider": "store-provider",   "url": "https://{app-builder-host}/api/v1/web/qsr/store-provider", "cacheTtl": 600 },
    "/rewards": { "provider": "rewards-provider", "url": "https://{app-builder-host}/api/v1/web/qsr/rewards-provider", "cacheTtl": 120 }
  },
  "auth": { "clientId": "{IMS_CLIENT_ID}", "scope": "openid,AdobeID,read_organizations" },
  "market": "us",
  "edsHost": "main--qsr-us--org.aem.live"
}
```

### GitHub Secrets

The following repository secrets must be set before the CI/CD pipeline can deploy:

| Secret | Description |
|---|---|
| `AIO_IMS_CONTEXT_CONFIG` | Base64-encoded Adobe IMS context JSON for `aio app deploy` |
| `AIO_PROJECT_ID` | Adobe Developer Console project ID |
| `AIO_WORKSPACE_ID` | Adobe Developer Console workspace ID |
| `EDS_TOKEN` | Bearer token for the AEM EDS Admin API (`admin.hlx.page`) |

---

## App Builder Actions Reference

All actions live under the `qsr` package as declared in [`app-builder/app.config.yaml`](app-builder/app.config.yaml).

### `menu-provider`

| Property | Value |
|---|---|
| Endpoint | `GET /api/v1/web/qsr/menu-provider` |
| Auth | None (`require-adobe-auth: false`) |
| Params | `market` (default `us`), `category` (default `drinks`), `LOG_LEVEL` |
| Returns | `text/html` — EDS `menu-grid` / `menu-item` block markup |

### `store-provider`

| Property | Value |
|---|---|
| Endpoint | `GET /api/v1/web/qsr/store-provider` |
| Auth | None (`require-adobe-auth: false`) |
| Params | `market` (default `us`), `city` (optional filter), `LOG_LEVEL` |
| Returns | `text/html` — EDS `stores-list` / `store-locator` block markup |

### `rewards-provider`

| Property | Value |
|---|---|
| Endpoint | `GET /api/v1/web/qsr/rewards-provider` |
| Auth | **Required** (`require-adobe-auth: true`) — Adobe IMS bearer token |
| Params | `market` (default `us`), `LOG_LEVEL` |
| Returns | `text/html` — EDS `rewards-list` / `promotion-banner` block markup |

### `webhook`

| Property | Value |
|---|---|
| Endpoint | `POST /api/v1/web/qsr/webhook` |
| Auth | **Required** (`require-adobe-auth: true`) |
| Params | `market` (default `us`), `path` (required), `event` (`publish` \| `unpublish` \| `delete`), `LOG_LEVEL` |
| Returns | `application/json` — `{ result: 'ok', event, path, market, edsHost }` |

---

## Deployment Guide

### CI/CD Pipeline (Recommended)

The [`deploy.yml`](.github/workflows/deploy.yml) workflow runs automatically on every push to `main` and on pull requests.

**Pipeline stages:**

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

To trigger a deployment for a single market via the GitHub UI, use **Actions → Deploy EDS Sites & App Builder → Run workflow** and set the `market` input to `us`, `uk`, or `jp`.

### Manual Deployment — App Builder

```bash
# 1. Authenticate with Adobe I/O
aio auth login

# 2. Select your project and workspace
aio console project select
aio console workspace select

# 3. Install dependencies
cd app-builder
npm ci

# 4. Deploy all actions
npm run deploy
# equivalent to: aio app deploy

# 5. Undeploy (if needed)
npm run undeploy
```

After deployment the CLI prints the live action URLs. Update each market's `config/site-config.json` overlay URLs with the printed `{app-builder-host}`.

### Manual Deployment — EDS Sites

EDS sites are published through the [AEM Admin API](https://www.aem.live/docs/admin.html). Use your `EDS_TOKEN` to publish content:

```bash
# Publish all pages for a market (replace <market> with us / uk / jp)
curl -X POST \
  -H "Authorization: Bearer <EDS_TOKEN>" \
  "https://admin.hlx.page/publish/org/qsr-<market>/main/*"

# Publish a single path
curl -X POST \
  -H "Authorization: Bearer <EDS_TOKEN>" \
  "https://admin.hlx.page/publish/org/qsr-us/main/menu"
```

Build the Svelte Web Component bundles before publishing if you have changed components:

```bash
cd packages/eds-components
npm ci
npm run build

# Copy bundles to each market's blocks directories
cp dist/qsr-product-customizer.js ../../apps/eds-us/blocks/product-detail/
cp dist/qsr-menu-card.js          ../../apps/eds-us/blocks/menu-item/
```
