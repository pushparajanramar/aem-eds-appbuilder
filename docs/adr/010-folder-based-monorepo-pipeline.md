# ADR 010 — Folder-Based Monorepo Pipeline Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-02-26 |
| **Supersedes** | [ADR 009](009-path-based-monorepo-pipeline.md) (path-based pipeline) |
| **Proposer** | AEM Technical Architect |
| **Approver** | AEM Technical Architect |

---

## Context

[ADR 009](009-path-based-monorepo-pipeline.md) introduced path-based selective deployment using separate GitHub Actions workflows. While the workflows themselves worked well, the repository structure still scattered AEM backend modules (`core/`, `ui.apps/`, `ui.config/`, `ui.content/`, `all/`, `dispatcher/`, `pom.xml`, `.cloudmanager/`) across the repository root. This made the monorepo harder to navigate and required listing multiple individual paths in workflow triggers and `CODEOWNERS`.

A **folder-based** organisation groups each sub-application under a single top-level directory, mirroring the logical ownership and deployment boundaries:

| Sub-App | Root Folder |
|---|---|
| **AEM Backend** | `aem-backend/` |
| **App Builder** | `app-builder/` |
| **EDS Market Sites** | `apps/` |
| **Svelte Web Components** | `packages/eds-components/` |
| **Fastly CDN** | `fastly/` |
| **Documentation** | `docs/` |

---

## Decision

Refactor the repository from a path-based layout to a **folder-based layout** where every sub-application resides under a clearly named top-level directory.

### Key change: AEM Backend consolidation

Move all AEM backend Maven modules, the reactor POM, and Cloud Manager configuration into a single `aem-backend/` directory:

```
aem-backend/
├── pom.xml                  # Maven reactor POM
├── core/                    # OSGi bundle
├── ui.apps/                 # /apps overlay
├── ui.content/              # /content + /conf structures
├── ui.config/               # OSGi run-mode configurations
├── all/                     # Aggregator content package
├── dispatcher/              # Dispatcher configuration
└── .cloudmanager/
    └── maven/
        └── settings.xml     # Cloud Manager Maven settings
```

### Updated repository layout

```
aem-eds-appbuilder/
├── aem-backend/             # AEM backend (Maven reactor + all modules)
├── app-builder/             # Adobe App Builder (actions + web-src)
├── apps/                    # EDS market sites (eds-us, eds-uk, eds-jp)
├── packages/                # Shared packages (eds-components)
├── fastly/                  # Fastly CDN VCL configuration
├── tests/                   # Integration tests
├── docs/                    # Documentation and ADRs
├── .github/workflows/       # CI/CD pipelines
└── CODEOWNERS               # Review requirements
```

### Updated workflow architecture

| Workflow | File | Trigger | Folder | Purpose |
|---|---|---|---|---|
| **PR Validation** | `pr-validation.yml` | `pull_request` → `main` | All folders | Lint, test, type-check, and build-validate all sub-apps |
| **App Builder Deploy** | `app-builder-deploy.yml` | `push` → `main` | `app-builder/` | Deploy actions + web UI to I/O Runtime |
| **EDS Deploy** | `eds-deploy.yml` | `push` → `main` | `packages/eds-components/`, `apps/**/blocks/` | Compile Svelte WCs → publish to EDS markets |
| **AEM Backend Deploy** | `aem-backend-deploy.yml` | `push` → `main` | `aem-backend/` | Maven build → trigger Cloud Manager |
| **Branch Cleanup** | `delete-merged-branches.yml` | `pull_request` closed | — | Auto-delete merged PR branches |

The AEM backend workflow trigger is simplified from listing six individual paths (`core/**`, `ui.apps/**`, `ui.config/**`, `ui.content/**`, `all/**`, `dispatcher/**`, `pom.xml`) to a single folder trigger: `aem-backend/**`.

### Updated critical path protection

```
# CODEOWNERS
aem-backend/                            @pushparajanramar
app-builder/actions/shared/             @pushparajanramar
apps/*/config/                          @pushparajanramar
.github/workflows/                      @pushparajanramar
docs/adr/                               @pushparajanramar
```

### Cloud Manager configuration

Cloud Manager should be configured to use `aem-backend/` as the build root directory. The `.cloudmanager/maven/settings.xml` has been moved to `aem-backend/.cloudmanager/maven/settings.xml`. The GitHub Actions workflow runs `mvn clean verify` with `working-directory: aem-backend`.

---

## Consequences

### Positive

- **Cleaner root directory** — The repository root contains only top-level folders, each representing a distinct sub-application. No loose Maven modules scattered at the root.
- **Simpler workflow triggers** — The AEM backend workflow trigger is a single `aem-backend/**` path instead of six separate path entries.
- **Simpler CODEOWNERS** — A single `aem-backend/` entry replaces six individual module entries.
- **Consistent structure** — Every sub-application follows the same pattern: one top-level folder, one deployment workflow.
- **Easier onboarding** — New team members can immediately understand the project structure by looking at top-level directories.

### Negative / Trade-offs

- **Cloud Manager reconfiguration** — Cloud Manager pipelines must be updated to point to `aem-backend/` as the build root instead of the repository root.
- **Broader trigger scope** — The `aem-backend/**` trigger is broader than the previous per-module triggers; a documentation change inside `aem-backend/` could trigger a build. This is an acceptable trade-off for simplicity.

### Follow-on actions

- Update Cloud Manager pipeline configuration to use `aem-backend/` as the build root directory.
- Verify that all CI/CD workflows pass with the new folder structure.
