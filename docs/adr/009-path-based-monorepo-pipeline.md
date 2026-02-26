# ADR 009 — Path-Based Monorepo Pipeline Strategy

| Field | Value |
|---|---|
| **Status** | Superseded by [ADR 010](010-folder-based-monorepo-pipeline.md) |
| **Date** | 2026-02-26 |
| **Updated** | 2026-02-26 |
| **Supersedes** | [ADR 007](007-github-actions-cicd-pipeline.md) (single-workflow approach) |
| **Proposer** | AEM Technical Architect |
| **Approver** | AEM Technical Architect |

---

## Context

The repository manages three distinct sub-applications with very different deployment requirements:

| Sub-App | Technology | Deployment Target |
|---|---|---|
| **AEM Edge Delivery Services (EDS)** | Vanilla JS/CSS + Svelte Web Components | AEM Code Sync (automatic) + GitHub Actions (Svelte compilation) |
| **App Builder Actions** | Serverless Node.js (Adobe I/O Runtime) | `aio app deploy` via GitHub Actions |
| **App Builder Web UI** | React SPA (Adobe Spectrum) | `aio app deploy` via GitHub Actions (served from Adobe CDN) |

The previous single-workflow approach ([ADR 007](007-github-actions-cicd-pipeline.md)) triggered **all** jobs on every push to `main`, regardless of which files changed. This caused unnecessary deployments — for example, changing a CSS colour in an EDS market would trigger an App Builder redeploy and an AEM backend Cloud Manager build.

A fourth concern — the **AEM backend** (Maven modules deployed via Cloud Manager) — was added in [ADR 008](008-cloud-manager-aem-backend-pipeline.md) and also benefits from path-based triggering.

---

## Decision

Replace the single monolithic `deploy.yml` with a **path-based selective deployment** architecture using separate GitHub Actions workflows:

### Workflow Architecture

| Workflow | File | Trigger | Paths | Purpose |
|---|---|---|---|---|
| **PR Validation** | `pr-validation.yml` | `pull_request` → `main` | All paths | Lint, test, type-check, and build-validate all sub-apps |
| **App Builder Deploy** | `app-builder-deploy.yml` | `push` → `main` | `app-builder/actions/**`, `app-builder/web-src/**`, `app-builder/app.config.yaml` | Deploy actions + web UI to I/O Runtime |
| **EDS Deploy** | `eds-deploy.yml` | `push` → `main` | `packages/eds-components/**`, `apps/**/blocks/**` | Compile Svelte WCs → publish to EDS markets |
| **AEM Backend Deploy** | `aem-backend-deploy.yml` | `push` → `main` | `core/**`, `ui.apps/**`, `ui.config/**`, `ui.content/**`, `all/**`, `dispatcher/**`, `pom.xml` | Maven build → trigger Cloud Manager |
| **Branch Cleanup** | `delete-merged-branches.yml` | `pull_request` closed | — | Auto-delete merged PR branches |

### Deployment strategy per sub-app

#### A. AEM Edge Delivery Services — Zero-Config Sync + Svelte Compilation

EDS vanilla JS, CSS, and block code (`apps/eds-*/blocks/`, `apps/eds-*/scripts/`, `apps/eds-*/styles/`) deploys automatically via the **AEM Code Sync** GitHub App. No CI/CD build step is needed for these files — any push to `main` is instantly detected by the AEM sidekick.

Svelte Web Components (`packages/eds-components/`) require compilation via Vite. The `eds-deploy.yml` workflow handles this: it builds the WC bundles, copies them to each market's `blocks/` directory, and publishes to the AEM EDS Admin API.

#### B. App Builder — AIO CLI Deployment

App Builder actions (`app-builder/actions/`) and the web UI (`app-builder/web-src/`) are deployed using `aio app deploy` in the `app-builder-deploy.yml` workflow. This workflow only triggers when files inside `app-builder/` change, preventing unnecessary deploys when EDS or AEM backend code is modified.

#### C. AEM Backend — Cloud Manager Pipeline

AEM backend Maven modules are built and verified in `aem-backend-deploy.yml`, which then triggers the Cloud Manager production pipeline via the Cloud Manager API. This workflow only triggers when Java/Maven files change.

### Environment strategy

| Branch | GitHub Environment | App Builder Workspace | Purpose |
|---|---|---|---|
| `main` | `production` | Production | Live traffic |
| feature branches | — (PR validation only) | — | Development |

### Critical path protection

A `CODEOWNERS` file ensures that changes to critical paths require review from designated owners:

- `app-builder/actions/shared/` — Technical Architect
- `apps/*/config/` — Technical Architect + Lead Dev
- `.github/workflows/` — Platform Engineers
- `pom.xml`, `core/`, `dispatcher/` — Technical Architect

---

## Consequences

### Positive

- **Selective deployment** — Only the affected sub-app is deployed when code changes, reducing CI minutes and eliminating unnecessary production deployments.
- **Faster feedback** — Each workflow is smaller and runs faster than the previous monolithic pipeline.
- **Independent failure domains** — A failure in the AEM backend build does not block EDS or App Builder deployment.
- **AEM Code Sync integration** — Vanilla EDS files deploy automatically without any CI/CD overhead.
- **Clear ownership** — `CODEOWNERS` enforces review requirements per sub-app.

### Negative / Trade-offs

- **Multiple workflow files** — Five YAML files instead of one; changes to shared CI patterns (e.g. Node.js version) must be updated in multiple places.
- **Path filter complexity** — Path-based triggers require careful configuration; a file that affects multiple sub-apps (e.g. a shared utility) may need to be listed in multiple workflow `paths` filters.
- **No cross-workflow orchestration** — GitHub Actions does not natively support dependencies between workflows; each workflow runs independently.

### Follow-on actions

- Add `workflow_run` triggers to create cross-workflow status checks on the PR (e.g. require `pr-validation` to pass before merge).
- Implement App Builder workspace-based environment promotion (Stage → Production) using GitHub Environments.
- Add `aio app test` to the PR validation workflow for App Builder integration tests.
- Evaluate reusable workflows (`workflow_call`) to share common steps (Node.js setup, caching) across workflow files.
