# ADR 007 — GitHub Actions CI/CD Pipeline

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2025-01-22 |
| **Updated** | 2026-02-26 |
| **Proposer** | AEM Technical Architect |
| **Approver** | AEM Technical Architect |

---

## Context

The programme requires an automated pipeline that:

1. Validates code quality (linting, type checking, unit tests) on every pull request.
2. Builds the Svelte web-component bundles and copies them to the per-market EDS site directories.
3. Builds and verifies AEM backend Maven modules (core, ui.apps, ui.config, ui.content, all, dispatcher).
4. Deploys App Builder actions to the Adobe I/O Runtime production workspace on merge to `main`.
5. Triggers the Cloud Manager pipeline for AEM backend deployment on merge to `main`.
6. Publishes EDS site content to `admin.hlx.page` for all three markets on merge to `main`.
7. Supports selective per-market redeployment via manual workflow dispatch.

The repository is hosted on GitHub; GitHub Actions is the natural CI/CD platform, requiring no additional tooling or credentials outside the existing GitHub and Adobe ecosystem.

---

## Decision

Implement a single **GitHub Actions** workflow at `.github/workflows/deploy.yml` with the following staged job graph:

```
push to main (or PR)
    │
    ▼
[lint]  ──────────────────────────────────────────►  ESLint + unit tests + svelte-check
    │
    ├──► [build-aem]  ───────────────────────────►  Maven build & verify (Java 11)
    │         │
    │         └──► [deploy-aem-backend]  ────────►  Trigger Cloud Manager pipeline (main only)
    │
    ├──► [build-components]  ──────────────────────►  Vite build of Svelte WCs → upload artifact
    │         │
    │         ├──► [deploy-eds-us]   ──────────────►  Download artifact → publish to admin.hlx.page (US)
    │         ├──► [deploy-eds-uk]   ──────────────►  Download artifact → publish to admin.hlx.page (UK)
    │         └──► [deploy-eds-jp]   ──────────────►  Download artifact → publish to admin.hlx.page (JP)
    │
    └──► [deploy-app-builder]  ────────────────────►  aio app deploy (main branch only)
```

### Runtime versions

| Tool | Version |
|---|---|
| Node.js | 20 |
| Java | 11 |
| Maven | 3.x (wrapper) |

### Branch strategy

| Branch | Trigger | Jobs run |
|---|---|---|
| `main` | `push` | All jobs (lint, build-aem, build-components, deploy-aem-backend, deploy-eds-*, deploy-app-builder) |
| `feature/*` | `pull_request` | lint, build-aem, build-components only (no deploy) |
| `release/*` | `pull_request` | lint, build-aem, build-components only (no deploy) |

### GitHub Secrets

The following repository secrets must be configured before the pipeline can deploy:

| Secret | Used by |
|---|---|
| `AIO_IMS_CONTEXT_CONFIG` | `deploy-app-builder` — base64-encoded IMS context JSON for `aio app deploy` |
| `AIO_PROJECT_ID` | `deploy-app-builder` — Adobe Developer Console project ID |
| `AIO_WORKSPACE_ID` | `deploy-app-builder` — Adobe Developer Console workspace ID |
| `EDS_TOKEN` | `deploy-eds-*` — Bearer token for AEM EDS Admin API (`admin.hlx.page`) |
| `CM_PROGRAM_ID` | `deploy-aem-backend` — Cloud Manager program ID |
| `CM_API_KEY` | `deploy-aem-backend` — Cloud Manager API key |
| `CM_ORG_ID` | `deploy-aem-backend` — Adobe IMS org ID for Cloud Manager |
| `CM_TECHNICAL_ACCOUNT_ID` | `deploy-aem-backend` — technical account ID |
| `CM_IMS_TOKEN` | `deploy-aem-backend` — IMS bearer token for Cloud Manager API |
| `CM_PIPELINE_ID` | `deploy-aem-backend` — Cloud Manager pipeline ID to trigger |

### Manual workflow dispatch

A `workflow_dispatch` trigger with a `market` input (`us` | `uk` | `jp` | `all`) allows selective per-market redeployment from the GitHub Actions UI without requiring a code push.

---

## Consequences

### Positive

- **Single pipeline definition** — One YAML file governs the entire delivery process; changes are version-controlled alongside the code.
- **Parallel market deployments** — The three `deploy-eds-*` jobs run in parallel after `build-components`, minimising total pipeline duration.
- **Secrets isolation** — Adobe credentials are stored in GitHub Secrets and injected as environment variables only for the jobs that need them; they are never available to PR builds from forks.
- **Artifact reuse** — The Svelte component bundle is built once in `build-components` and downloaded by each market's deploy job, avoiding duplicate Vite builds.
- **AEM backend validation** — Maven build and unit tests run on every PR, preventing broken AEM code from reaching Cloud Manager.

### Negative / Trade-offs

- **GitHub dependency** — The pipeline is tightly coupled to GitHub Actions. Migrating to a different CI/CD platform (e.g. Jenkins, GitLab CI) would require rewriting the workflow YAML.
- **Adobe CLI version pinning** — The `aio` CLI must be kept up to date; a major version bump may break the `deploy-app-builder` job. Pin the CLI version in the workflow and update it deliberately.
- **No staging environment** — The current pipeline deploys directly to production App Builder and EDS. A future enhancement should add a staging workspace (`aio console workspace select staging`) and a manual approval gate before the production deploy.
- **Cloud Manager API token management** — The IMS token (`CM_IMS_TOKEN`) must be refreshed periodically; an expired token will cause the `deploy-aem-backend` job to fail silently or with an auth error.

### Follow-on actions

- Add `npm audit` to the `lint` job.
- Configure branch protection rules: require the `lint` job to pass before merging to `main`.
- Add a `workflow_dispatch` input for the `market` parameter to enable selective redeployment.
- Evaluate adding a staging App Builder workspace and a manual approval gate for production deploys.
- Document the secrets configuration in `docs/aem-configuration-guide.md`.
- Implement Cloud Manager IMS token refresh automation.
