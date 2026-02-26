# ADR 008 — Cloud Manager Pipeline for AEM Backend Deployment

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-02-26 |
| **Proposer** | AEM Technical Architect |
| **Approver** | AEM Technical Architect |

---

## Context

The project now includes AEM backend modules (`core`, `ui.apps`, `ui.config`, `ui.content`, `all`, `dispatcher`) based on AEM Archetype 56, grouped under the `aem-backend/` directory. These modules contain OSGi bundles, content packages, run-mode configurations, and Dispatcher rules that must be deployed to AEMaaCS environments (Dev, Stage, Production) via Adobe Cloud Manager.

The existing GitHub Actions pipeline (see [ADR 007](007-github-actions-cicd-pipeline.md)) handles EDS + App Builder deployment but does not cover AEM backend packaging and deployment. Cloud Manager is the required deployment vehicle for AEMaaCS and enforces quality gates (code coverage, SonarQube, Lighthouse).

---

## Decision

Adopt **Adobe Cloud Manager** as the deployment pipeline for AEM backend modules, triggered from the GitHub Actions workflow after the Maven build succeeds.

### Key elements

1. An `aem-backend/.cloudmanager/maven/settings.xml` file provides Maven repository configuration for Cloud Manager builds.
2. The GitHub Actions `build-aem` job runs `mvn clean verify` to validate the build on every PR.
3. The GitHub Actions `deploy-aem-backend` job triggers the Cloud Manager production pipeline via the Cloud Manager API on merge to `main`.
4. Cloud Manager executes its own build, runs quality gates (JaCoCo, SonarQube, Lighthouse), and deploys to Dev → Stage → Production with a manual approval gate before Production.

### Pipeline configuration

| Pipeline | Type | Trigger | Target |
|---|---|---|---|
| `qsr-production-deploy` | Full Stack | Cloud Manager API (from GitHub Actions) | Dev → Stage → Production |
| `qsr-frontend-deploy` | Front-End | Manual (optional) | Front-end assets only |

### GitHub Secrets for Cloud Manager API

| Secret | Used by |
|---|---|
| `CM_PROGRAM_ID` | Cloud Manager program ID |
| `CM_API_KEY` | Cloud Manager API key |
| `CM_ORG_ID` | Adobe IMS org ID |
| `CM_TECHNICAL_ACCOUNT_ID` | Technical account ID |
| `CM_IMS_TOKEN` | IMS bearer token for API calls |
| `CM_PIPELINE_ID` | Pipeline ID to trigger |

---

## Consequences

### Positive

- **AEM quality gates** — AEM backend code (OSGi bundles, content packages, Dispatcher config) goes through the same quality gates as any AEMaaCS project.
- **Fail-fast** — Maven build on every PR catches compilation and test failures before code reaches Cloud Manager.
- **Manual approval gate** — Manual approval gate before Production prevents accidental deployments.
- **Enforced code quality** — Cloud Manager quality gates (SonarQube, JaCoCo) enforce minimum code quality standards.

### Negative / Trade-offs

- **Dual pipeline complexity** — The full deployment now spans both GitHub Actions and Cloud Manager, requiring coordination.
- **IMS token refresh** — Cloud Manager IMS token must be refreshed periodically (OAuth Server-to-Server credentials are recommended).
- **Build latency** — Cloud Manager build is not instantaneous (5–15 min) and runs independently of the GitHub Actions workflow.

### Follow-on actions

- Automate IMS token refresh using OAuth Server-to-Server credentials in Adobe Developer Console.
- Add Cloud Manager deployment status check back to GitHub Actions (poll API or use webhooks).
- Configure non-production pipelines for Dev and Stage environments.
- Document rollback procedure for failed Cloud Manager deployments in the go-live runbook.
