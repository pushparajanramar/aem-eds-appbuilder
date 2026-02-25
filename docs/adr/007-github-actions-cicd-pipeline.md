# ADR 007 — GitHub Actions CI/CD Pipeline

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2025-01-22 |
| **Proposer** | AEM Technical Architect |
| **Approver** | AEM Technical Architect |

---

## Context

The programme requires an automated pipeline that:

1. Validates code quality (linting, type checking, unit tests) on every pull request.
2. Builds the Svelte web-component bundles and copies them to the per-market EDS site directories.
3. Deploys App Builder actions to the Adobe I/O Runtime production workspace on merge to `main`.
4. Publishes EDS site content to `admin.hlx.page` for all three markets on merge to `main`.
5. Supports selective per-market redeployment via manual workflow dispatch.

The repository is hosted on GitHub; GitHub Actions is the natural CI/CD platform, requiring no additional tooling or credentials outside the existing GitHub and Adobe ecosystem.

---

## Decision

Implement a single **GitHub Actions** workflow at `.github/workflows/deploy.yml` with the following staged job graph:

```
push to main (or PR)
    │
    ▼
[lint]  ──────────────────────────────────────────►  ESLint on app-builder/ actions
    │
    ├──► [build-components]  ──────────────────────►  Vite build of Svelte WCs → upload artifact
    │         │
    │         ├──► [deploy-eds-us]   ──────────────►  Download artifact → publish to admin.hlx.page (US)
    │         ├──► [deploy-eds-uk]   ──────────────►  Download artifact → publish to admin.hlx.page (UK)
    │         └──► [deploy-eds-jp]   ──────────────►  Download artifact → publish to admin.hlx.page (JP)
    │
    └──► [deploy-app-builder]  ────────────────────►  aio app deploy (main branch only)
```

### Branch strategy

| Branch | Trigger | Jobs run |
|---|---|---|
| `main` | `push` | All jobs (lint, build, deploy-eds-*, deploy-app-builder) |
| `feature/*` | `pull_request` | lint, build-components only (no deploy) |
| `release/*` | `pull_request` | lint, build-components only (no deploy) |

### GitHub Secrets

The following repository secrets must be configured before the pipeline can deploy:

| Secret | Used by |
|---|---|
| `AIO_IMS_CONTEXT_CONFIG` | `deploy-app-builder` — base64-encoded IMS context JSON for `aio app deploy` |
| `AIO_PROJECT_ID` | `deploy-app-builder` — Adobe Developer Console project ID |
| `AIO_WORKSPACE_ID` | `deploy-app-builder` — Adobe Developer Console workspace ID |
| `EDS_TOKEN` | `deploy-eds-*` — Bearer token for AEM EDS Admin API (`admin.hlx.page`) |

### Manual workflow dispatch

A `workflow_dispatch` trigger with a `market` input (`us` | `uk` | `jp` | `all`) allows selective per-market redeployment from the GitHub Actions UI without requiring a code push.

---

## Consequences

### Positive

- **Single pipeline definition** — One YAML file governs the entire delivery process; changes are version-controlled alongside the code.
- **Parallel market deployments** — The three `deploy-eds-*` jobs run in parallel after `build-components`, minimising total pipeline duration.
- **Secrets isolation** — Adobe credentials are stored in GitHub Secrets and injected as environment variables only for the jobs that need them; they are never available to PR builds from forks.
- **Artifact reuse** — The Svelte component bundle is built once in `build-components` and downloaded by each market's deploy job, avoiding duplicate Vite builds.

### Negative / Trade-offs

- **GitHub dependency** — The pipeline is tightly coupled to GitHub Actions. Migrating to a different CI/CD platform (e.g. Jenkins, GitLab CI) would require rewriting the workflow YAML.
- **Adobe CLI version pinning** — The `aio` CLI must be kept up to date; a major version bump may break the `deploy-app-builder` job. Pin the CLI version in the workflow and update it deliberately.
- **No staging environment** — The current pipeline deploys directly to production App Builder and EDS. A future enhancement should add a staging workspace (`aio console workspace select staging`) and a manual approval gate before the production deploy.

### Follow-on actions

- Add `npm audit` and `svelte-check` steps to the `lint` job.
- Configure branch protection rules: require the `lint` job to pass before merging to `main`.
- Add a `workflow_dispatch` input for the `market` parameter to enable selective redeployment.
- Evaluate adding a staging App Builder workspace and a manual approval gate for production deploys.
- Document the secrets configuration in `docs/aem-configuration-guide.md`.
