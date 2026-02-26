# ADR 003 — Multi-Market Single-Repository Structure

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2025-01-08 |
| **Proposer** | AEM Technical Architect |
| **Approver** | AEM Technical Architect |

---

## Context

The programme covers three markets — United States (`us`), United Kingdom (`uk`) and Japan (`jp`) — each with its own:

- EDS site host (`main--qsr-{market}--org.aem.live`).
- Locale and currency (`en-US` / USD, `en-GB` / GBP, `ja-JP` / JPY).
- Timezone (`America/Los_Angeles`, `Europe/London`, `Asia/Tokyo`).
- Regulatory and content requirements (e.g. GDPR for UK, Japanese character encoding for JP).

Two structural options were considered:

1. **One repository per market** — Isolated change control; easy per-market branching. However, it duplicates shared code (actions, Svelte web components, Fastly VCL), creates three separate CI/CD pipelines to maintain and increases onboarding overhead.

2. **Single repository, per-market sub-directories** — All code in one place; shared utilities updated once; a single CI/CD pipeline deploys to all markets. Requires careful directory structure to isolate market-specific configuration.

---

## Decision

Use a **single monorepo** with per-market EDS site directories under `apps/`:

```
aem-eds-appbuilder/
├── app-builder/              # Shared App Builder actions (serve all markets via ?market= param)
├── apps/
│   ├── eds-us/               # US market EDS site
│   ├── eds-uk/               # UK market EDS site
│   └── eds-jp/               # JP market EDS site
├── core/                     # AEM OSGi bundle — shared Java back-end logic
├── ui.apps/                  # AEM /apps overlay — components, templates
├── ui.content/               # AEM initial /content + /conf structures
├── ui.config/                # AEM OSGi run-mode configurations
├── all/                      # AEM aggregator content package
├── dispatcher/               # AEM Dispatcher configuration
├── packages/
│   └── eds-components/       # Shared Svelte web components (built once, copied per market)
├── fastly/                   # Shared Fastly VCL
├── .cloudmanager/            # Cloud Manager Maven settings
└── docs/                     # Shared runbooks and reference documents
```

Market isolation is achieved through per-market:

- `config/site-config.json` — overlay URL mappings and IMS client ID.
- `config/index-config.yaml` — EDS query index definitions.
- `component-definition.json`, `component-filters.json`, `component-models.json` — Universal Editor block configuration.
- `sitemap.json` — include/exclude patterns for sitemap generation.

App Builder actions are market-agnostic; they accept a `market` query parameter and resolve market-specific values from `app-builder/actions/shared/market-config.js`.

---

## Consequences

### Positive

- **Single source of truth** — One repository, one CI/CD pipeline, one set of shared utilities.
- **Shared components** — Svelte web components built once and copied to each market's `blocks/` during CI/CD.
- **Simplified onboarding** — New team members clone one repository and have visibility of all three markets.
- **Atomic cross-market changes** — A single pull request can update shared utilities and all market configurations together.

### Negative / Trade-offs

- **Blast radius** — A bug in shared code (e.g. `market-config.js`) affects all markets simultaneously. Mitigated by per-market CI/CD deploy jobs that can be selectively re-run.
- **Access control granularity** — GitHub branch protection rules apply to the whole repository. Per-market write access is not enforceable at the file level without additional CODEOWNERS configuration.

### Follow-on actions

- Add a `CODEOWNERS` file at the repository root assigning the Technical Architect as owner of `app-builder/actions/shared/` and all `apps/*/config/` directories.
- Configure per-market deploy jobs in `.github/workflows/eds-deploy.yml` with a `market` input to allow selective market redeployment.
- Document market-specific configuration keys in `app-builder/actions/shared/market-config.js` with inline JSDoc comments.
