# Implementation Runbook

This runbook guides the delivery team through the Implementation phase of the AEM EDS + App Builder programme, from environment setup through to code complete and UAT sign-off.

---

## Table of Contents

1. [Implementation Overview](#1-implementation-overview)
2. [Environment Setup](#2-environment-setup)
3. [Sprint Structure](#3-sprint-structure)
   - [3.1 Sprint 1 — Foundation](#31-sprint-1--foundation)
   - [3.2 Sprint 2 — Blocks & Actions](#32-sprint-2--blocks--actions)
     - [3.2.1 EDS Block Implementation](#321-eds-block-implementation)
     - [3.2.2 AA / AT / Launch Automation](#322-aa--at--launch-automation)
   - [3.3 Sprint 3 — Content & Integration](#33-sprint-3--content--integration)
   - [3.4 Sprint 4 — UAT & Hardening](#34-sprint-4--uat--hardening)
4. [App Builder Action Development](#4-app-builder-action-development)
5. [Svelte Web Components](#5-svelte-web-components)
6. [CI/CD Pipeline](#6-cicd-pipeline)
7. [Testing Strategy](#7-testing-strategy)
8. [Definition of Done](#8-definition-of-done)

---

## 1. Implementation Overview

### 1.1 Inputs

Before Implementation begins, the following Discovery outputs must be signed off:

- Approved block definitions (`component-models.json` per market)
- Approved UX designs (high-fidelity XD / Figma comps)
- Approved Analytics BRD (event taxonomy, AA report suite config)
- Approved optimisation baseline and test hypothesis backlog
- Architecture Decision Records (ADRs) in `docs/adr/`
- Groomed and estimated sprint backlog in Jira / ADO

### 1.2 Implementation Duration

Typical implementation runs for **4 × 2-week sprints (8 weeks)**:

| Sprint | Focus | Output |
|---|---|---|
| Sprint 1 (Weeks 1–2) | Foundation — environment, CI/CD, scaffold | Working CI/CD pipeline; Dev environment live |
| Sprint 2 (Weeks 3–4) | Blocks, App Builder actions, Launch tagging | All blocks and actions functional in Dev |
| Sprint 3 (Weeks 5–6) | Content creation, translations, integration testing | Market content live in Dev; analytics validated |
| Sprint 4 (Weeks 7–8) | UAT, performance hardening, go-live preparation | UAT sign-off; go-live checklist complete |

---

## 2. Environment Setup

### 2.1 AEM Author

Refer to [AEM Configuration Guide](aem-configuration-guide.md) for end-to-end AEM environment setup, including:

- AEM Archetype generation and deployment (§1)
- Cloud Manager program and pipeline setup (§3–§4)
- SSO configuration (§5)
- Users and permissions (§6)

### 2.2 Adobe App Builder

```bash
# 1. Install the Adobe I/O CLI
npm install -g @adobe/aio-cli

# 2. Authenticate
aio auth login

# 3. Select the Quick Service Restaurant project and workspace
aio console project select
aio console workspace select

# 4. Install dependencies
cd app-builder
npm ci

# 5. Verify the local dev server (requires app-builder/.env)
aio app run
```

Create `app-builder/.env` (never commit):

```
AIO_IMS_CONTEXT_CONFIG=<base64-encoded IMS context JSON>
AIO_PROJECT_ID=<your-project-id>
AIO_WORKSPACE_ID=<your-workspace-id>
```

### 2.3 EDS Sites

Each market EDS site is served locally using the AEM EDS CLI:

```bash
# Install AEM CLI
npm install -g @adobe/aem-cli

# Start local dev proxy for the US market
cd apps/eds-us
aem up
```

The local proxy mirrors the EDS CDN, picks up code changes to blocks and scripts instantly, and fetches content from the configured AEM Author or Google Drive / SharePoint mount point.

### 2.4 GitHub Repository Setup

Confirm the following repository settings before sprint 1 begins:

- [ ] Branch protection on `main`: require PR, require status checks (lint, build-components)
- [ ] GitHub secrets configured (see [README §GitHub Secrets](../README.md#github-secrets))
- [ ] `AIO_IMS_CONTEXT_CONFIG`, `AIO_PROJECT_ID`, `AIO_WORKSPACE_ID`, `EDS_TOKEN` all set
- [ ] Dependabot alerts enabled
- [ ] CodeQL code scanning enabled

---

## 3. Sprint Structure

### 3.1 Sprint 1 — Foundation

**Goal:** The CI/CD pipeline is running; all three markets are accessible in the Dev environment; the App Builder workspace is provisioned.

| Story | Owner | Acceptance criteria |
|---|---|---|
| Scaffold EDS sites for US, UK, JP | Tech/Dev | `apps/eds-us/`, `apps/eds-uk/`, `apps/eds-jp/` present with standard file structure |
| Configure `site-config.json` per market | Tech/Dev | Overlay routes point to App Builder Dev workspace URLs |
| Set up `market-config.js` | Tech/Dev | All three markets return correct EDS host, locale and currency |
| Create CI/CD pipeline (`deploy.yml`) | Tech/Dev + Platform Eng | Pipeline runs lint → unit tests → svelte-check → build-aem → build-components → deploy on push to `main` |
| Set up App Builder workspace (Dev) | Tech/Dev | `aio app deploy` succeeds; action endpoints return 200 |
| Configure Cloud Manager pipeline | Platform Eng | Full-stack pipeline `qsr-production-deploy` created; `.cloudmanager/maven/settings.xml` committed |
| Configure GitHub secrets | Platform Eng | All secrets set (App Builder, EDS, Cloud Manager); CI/CD pipeline deploys successfully |
| Create base block scaffolding | Tech/Dev | `promotion-banner`, `menu-item`, `product-detail` block folders present |

### 3.2 Sprint 2 — Blocks & Actions

**Goal:** All three blocks are functional and styled; App Builder actions return correct HTML; analytics tagging is configured in Launch Dev environment.

#### 3.2.1 EDS Block Implementation

Refer to [Front-End Styling Runbook](front-end-styling-runbook.md) for block styling guidance.

| Block | Files | Owner |
|---|---|---|
| `promotion-banner` | `blocks/promotion-banner/promotion-banner.js`, `promotion-banner.css` | Tech/Dev |
| `menu-item` | `blocks/menu-item/menu-item.js`, `menu-item.css`, `qsr-menu-card.js` (WC) | Tech/Dev |
| `product-detail` | `blocks/product-detail/product-detail.js`, `product-detail.css`, `qsr-product-customizer.js` (WC) | Tech/Dev |

Each block JS file follows the EDS block convention:

```js
// blocks/promotion-banner/promotion-banner.js
export default function decorate(block) {
  // Transform the block HTML delivered by EDS into the desired markup
}
```

#### 3.2.2 AA / AT / Launch Automation

This section covers the implementation of Adobe Analytics (AA), Adobe Target (AT) and AEP Tags (Adobe Launch) on the EDS sites.

##### Prerequisites

- Adobe Analytics report suites provisioned (see [Analytics Discovery Template §4](analytics-discovery-template.md#4-adobe-analytics-report-suite-configuration))
- Adobe Launch property created (see [Analytics Discovery Template §5](analytics-discovery-template.md#5-adobe-launch-property-plan))
- Adobe Target workspace created (see [Optimisation Runbook — Chapter 2](optimization-runbook.md#chapter-2-adobe-target-setup))

##### Step 1: Add the Launch embed code to EDS scripts

Add the Launch embed code loader to `apps/eds-<market>/scripts/launch.js`:

```js
// scripts/launch.js
const isDev = window.location.hostname.includes('.aem.page')
  || window.location.hostname === 'localhost';

const launchSrc = isDev
  ? 'https://assets.adobedtm.com/<org>/<property>/launch-<dev-hash>.js'
  : 'https://assets.adobedtm.com/<org>/<property>/launch-<prod-hash>.min.js';

(function (src) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}(launchSrc));
```

Load `launch.js` from `apps/eds-<market>/scripts/aem.js`:

```js
import { loadScript } from './aem.js';
loadScript('/scripts/launch.js');
```

##### Step 2: Initialise the data layer

Add data layer initialisation to `apps/eds-<market>/scripts/aem.js` (or a dedicated `scripts/datalayer.js`):

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

##### Step 3: Configure Adobe Launch rules

Create the following rules in the Launch property (one per event):

| Rule name | Event trigger | Actions |
|---|---|---|
| All Pages — Page View | Library Loaded | Set AA variables (`s.pageName`, `eVar1`); Send beacon |
| Menu Item — View | Custom event: `menu_view` | Set `event10`, `eVar5`; Send beacon |
| Menu Item — Click | Custom event: `menu_click` | Set `event11`, products; Send beacon |
| Product — View | Custom event: `product_view` | Set `event20`, products; Send beacon |
| Product — Add to Order | Custom event: `add_to_order` | Set `event22`, products; Send beacon |
| Promotion — View | Custom event: `promotion_view` | Set `event30`; Send beacon |
| Promotion — Click | Custom event: `promotion_click` | Set `event31`; Send beacon |
| Store — Search | Custom event: `store_search` | Set `event40`, `eVar20`; Send beacon |
| Store — Select | Custom event: `store_select` | Set `event41`; Send beacon |
| Target — Fire Global Mbox | DOM Ready | Load Target; Fire global mbox |

For rule conditions, use a consent check (see [Analytics Discovery Template §8](analytics-discovery-template.md#8-privacy--consent-requirements)).

##### Step 4: Push events from block JS

In each block's JavaScript, push to the data layer at the appropriate interaction point:

```js
// blocks/menu-item/menu-item.js  — click tracking
block.addEventListener('click', (e) => {
  const card = e.target.closest('.menu-card');
  if (!card) return;
  window.adobeDataLayer.push({
    event: 'menu_click',
    eventInfo: {
      market:    window.siteConfig?.market,
      itemId:    card.dataset.itemId,
      itemTitle: card.dataset.title,
      category:  card.dataset.category,
      price:     parseFloat(card.dataset.price),
    },
  });
});
```

##### Step 5: Validate

1. Deploy the Launch Development library.
2. Open an EDS Dev preview URL (`*.aem.page`) with the Adobe Experience Platform Debugger extension active.
3. Verify:
   - AA page view beacon fires on every page load.
   - `eVar1` contains the correct market value.
   - Event beacons fire on user interactions.
   - No AA beacons fire before consent is granted (UK/JP).

See the full validation checklist in [Analytics Discovery Template §9](analytics-discovery-template.md#9-validation-plan).

### 3.3 Sprint 3 — Content & Integration

**Goal:** Quick Service Restaurant content team has authored and published all required pages in all three markets; query indexes are populated; end-to-end overlay routes are verified.

| Story | Owner | Acceptance criteria |
|---|---|---|
| Menu content authored (US) | Quick Service Restaurant Content + Functional Lead | `/menu/query-index.json` returns ≥ 20 items |
| Store content authored (US) | Quick Service Restaurant Content | `/stores/query-index.json` returns ≥ 10 stores |
| Rewards content authored (US) | Quick Service Restaurant Content | `/rewards/query-index.json` returns ≥ 5 items |
| UK and JP content authored | Quick Service Restaurant Content | Query indexes populated for UK and JP |
| App Builder actions tested end-to-end | Tech/Dev | All three overlay routes return correct HTML in Dev |
| Webhook tested end-to-end | Tech/Dev | AEM Author publish fires webhook; EDS cache purge verified |
| Analytics tagging validated | Analytics Consultant | All events fire correctly per AA BRD |

### 3.4 Sprint 4 — UAT & Hardening

**Goal:** UAT is complete; performance targets met; go-live checklist ready for sign-off.

| Story | Owner | Acceptance criteria |
|---|---|---|
| UAT facilitated (US market) | Functional Lead | All acceptance criteria met; sign-off obtained from Quick Service Restaurant Content Lead |
| UAT facilitated (UK market) | Functional Lead | Same as US |
| UAT facilitated (JP market) | Functional Lead | Same as US; JP character rendering verified |
| Lighthouse performance audit | Tech/Dev | LCP < 2.5 s, CLS < 0.1 on all page types and markets |
| Accessibility audit | Tech/Dev / UX Consultant | axe DevTools: 0 critical / serious errors |
| Security review | Tech Architect | No high/critical CodeQL or Dependabot alerts |
| Go-live checklist prepared | Project Manager | [Go-Live Checklist](go-live-checklist.md) fully completed |

---

## 4. App Builder Action Development

All App Builder actions are in `app-builder/actions/`. The development workflow:

```bash
cd app-builder
npm ci
npm run lint     # ESLint
npm test         # Jest unit tests
aio app run      # Local dev server with hot reload
```

### 4.1 Action Contract

See [`README.md` — App Builder Actions Reference](../README.md#app-builder-actions-reference) for the full action API specification.

### 4.2 Adding a New Action

1. Create a folder: `app-builder/actions/<action-name>/`.
2. Add `index.js` with the action handler.
3. Register the action in `app-builder/app.config.yaml` under the `qsr` package.
4. Add unit tests in `app-builder/actions/<action-name>/index.test.js`.
5. Update the relevant market's `site-config.json` overlay entry.

### 4.3 Shared Utilities

| Utility | File | Purpose |
|---|---|---|
| Market config | `actions/shared/market-config.js` | EDS host, locale, currency per market |
| URL helpers | `actions/shared/url-utils.js` | Safe URL construction (prevent injection) |

Changes to shared utilities require regression testing across **all four actions**.

---

## 5. Svelte Web Components

The full reference for the Svelte Web Component library is in the **[Svelte Web Components Guide](svelte-web-components-guide.md)**. That guide covers:

- The complete inventory of all 22 components and their block mappings (§2)
- The four authoring rules: `<svelte:options customElement>`, lowercase props, `CustomEvent` with `composed: true`, and Shadow DOM token copying (§3)
- Shared utilities: `api.js`, `auth.js`, `image-utils.js` (§4)
- The Vite build configuration: entry points, output path resolution, why ES modules (§5)
- The IntersectionObserver lazy-loading pattern used by every EDS block (§6)
- Step-by-step instructions for adding a new Web Component (§8)

**Key build commands:**

```bash
cd packages/eds-components
npm ci
npm run dev    # Vite watch mode — rebuilds on file save, outputs to apps/eds-us/blocks/
npm run build  # One-off production build
npm run check  # svelte-check type checking
npm run lint   # ESLint on Svelte sources
```

Bundles are written **directly** to `apps/eds-us/blocks/<block-name>/qsr-<name>.js`. The CI/CD pipeline copies them to `eds-uk` and `eds-jp` automatically (see §6 and `.github/workflows/deploy.yml`).

During development, copy manually:

```bash
cp apps/eds-us/blocks/menu-item/qsr-menu-card.js          apps/eds-uk/blocks/menu-item/
cp apps/eds-us/blocks/menu-item/qsr-menu-card.js          apps/eds-jp/blocks/menu-item/
cp apps/eds-us/blocks/product-detail/qsr-product-customizer.js apps/eds-uk/blocks/product-detail/
cp apps/eds-us/blocks/product-detail/qsr-product-customizer.js apps/eds-jp/blocks/product-detail/
```

---

## 6. CI/CD Pipeline

The project uses a **path-based monorepo pipeline** strategy (see [ADR 009](adr/009-path-based-monorepo-pipeline.md)). Separate workflows trigger only when files in specific directories change:

| Workflow | File | Trigger Path | Purpose |
|---|---|---|---|
| PR Validation | `pr-validation.yml` | All paths (PRs only) | Lint, test, type-check, build-validate |
| App Builder Deploy | `app-builder-deploy.yml` | `app-builder/**` | Deploy actions + web UI to I/O Runtime |
| EDS Deploy | `eds-deploy.yml` | `packages/eds-components/**`, `apps/**/blocks/**` | Compile Svelte WCs → publish to EDS markets |
| AEM Backend Deploy | `aem-backend-deploy.yml` | `core/**`, `ui.apps/**`, `dispatcher/**`, `pom.xml` | Maven build → trigger Cloud Manager |

Vanilla EDS files (`apps/*/blocks/`, `apps/*/scripts/`, `apps/*/styles/`) sync automatically via the **AEM Code Sync** GitHub App — no CI/CD build step is needed.

See [README §Deployment Guide](../README.md#deployment-guide) for manual deployment steps and the full pipeline architecture table.

---

## 7. Testing Strategy

| Test type | Tool | When |
|---|---|---|
| Unit tests (App Builder) | Jest | On every PR (`npm test`) |
| Unit tests (AEM Backend) | JUnit 5 + AEM Mocks | On every PR (`mvn clean verify`) |
| Linting | ESLint + svelte-check | On every PR |
| Code quality | SonarQube (Cloud Manager) | On every Cloud Manager build |
| End-to-end (App Builder) | `aio app run` + manual | Sprint 2 and 3 |
| Analytics validation | Experience Platform Debugger | Sprint 3 |
| Performance audit | Lighthouse | Sprint 4 |
| Accessibility audit | axe DevTools | Sprint 4 |
| UAT | Manual (Quick Service Restaurant content teams) | Sprint 4 |

---

## 8. Definition of Done

A story is **Done** when:

- [ ] Code passes ESLint (`npm run lint`) with 0 errors
- [ ] Code passes `svelte-check` with 0 errors (for Svelte components)
- [ ] All unit tests pass (`npm test`)
- [ ] Feature reviewed in Dev environment by Functional Lead
- [ ] Acceptance criteria confirmed by Functional Lead
- [ ] PR reviewed and approved by AEM Technical Architect
- [ ] CI/CD pipeline passes (lint → build → deploy)
- [ ] No high/critical security alerts introduced
