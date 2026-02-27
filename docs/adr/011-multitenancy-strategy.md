# ADR 011 — Multitenancy Strategy (AEM Backend + EDS + Svelte Frontend)

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-02-27 |
| **Proposer** | AEM Technical Architect |
| **Approver** | AEM Technical Architect |

---

## Context

The programme serves three markets — United States (`us`), United Kingdom (`uk`) and Japan (`jp`) — from a single monorepo (see [ADR 003](003-multi-market-single-repository.md)). Each market has its own locale, currency, timezone, regulatory requirements and brand styling, yet all markets share the same codebase, component library and serverless actions.

A clear multitenancy strategy is required so that:

- **AEM authors** can manage content for each market independently without risk of cross-market side-effects.
- **EDS sites** serve market-specific content and configuration while sharing common block code.
- **Svelte web components** render correctly for any market without per-market forks of the component source.
- **App Builder actions** resolve the correct back-end data sources and locale settings per market from a single deployment.

Two broad approaches were considered:

1. **Infrastructure-level isolation** — Deploy separate AEM instances, separate App Builder workspaces and separate EDS repositories per market. This provides strong isolation but triples infrastructure cost, duplicates shared code, and makes cross-market changes slow and error-prone.

2. **Configuration-driven tenancy within a shared platform** — Use a single AEM as a Cloud Service instance, a single App Builder workspace and a single monorepo. Market isolation is achieved through content trees, site configurations, runtime parameters and build-time configuration overlays. This keeps shared code in one place and isolates market-specific concerns via convention and configuration.

---

## Decision

Adopt **configuration-driven multitenancy** across all layers of the stack. Each layer isolates market-specific behaviour through its own tenancy mechanism while sharing a single codebase and deployment infrastructure.

### 1. AEM Backend (Content & Authoring)

AEM as a Cloud Service hosts content for all markets under a single programme. Tenant isolation is achieved through the AEM content hierarchy and OSGi configuration run modes.

#### Content tree separation

```
/content
├── qsr-us/          # US market content root
│   ├── en/          # English (US) language root
│   └── ...
├── qsr-uk/          # UK market content root
│   ├── en/          # English (GB) language root
│   └── ...
└── qsr-jp/          # JP market content root
    ├── ja/          # Japanese language root
    └── ...
```

Each market has its own site root under `/content`, its own editable templates under `/conf/qsr-{market}` and its own DAM folder under `/content/dam/qsr-{market}`. This prevents content bleed between markets and allows independent publishing workflows.

#### Configuration run modes

OSGi configurations in `ui.config/` use AEM run-mode directories to supply market-specific values (e.g. external API endpoints, feature flags) without code changes:

```
ui.config/src/main/content/jcr_root/apps/qsr/osgiconfig/
├── config/                             # Shared (all environments)
├── config.author/                      # Author-tier only
├── config.publish/                     # Publish-tier only
├── config.prod/                        # Production environment
├── config.prod.publish/                # Production + Publish
└── ...
```

Market-specific values that vary by environment (e.g. BFF base URLs per market) are injected via Cloud Manager environment variables (`QSR_US_BFF_BASE`, `QSR_UK_BFF_BASE`, `QSR_JP_BFF_BASE`) and consumed by OSGi configurations or Sling Context-Aware Configuration.

#### Dispatcher isolation

Dispatcher configuration in `aem-backend/dispatcher/` uses virtual-host rules to route requests to the correct market content tree based on the incoming domain (e.g. `www.qsr.com` → `/content/qsr-us`, `www.qsr.co.uk` → `/content/qsr-uk`, `www.qsr.co.jp` → `/content/qsr-jp`).

#### Permissions

AEM user groups are scoped per market (`qsr-us-authors`, `qsr-uk-authors`, `qsr-jp-authors`). Each group has write access only to its own `/content/qsr-{market}` and `/content/dam/qsr-{market}` trees, enforced via ACLs in `ui.content/`. A cross-market `qsr-global-admins` group retains access to all markets.

### 2. EDS Frontend (Edge Delivery Services)

Each market has its own EDS site directory under `apps/` (see [ADR 003](003-multi-market-single-repository.md)):

```
apps/
├── eds-us/
│   ├── config/
│   │   └── site-config.json    # market: "us", locale: "en-US", currency: "USD"
│   ├── blocks/                 # Shared blocks (copied from packages/eds-components at build time)
│   ├── scripts/                # EDS runtime scripts
│   └── styles/                 # Market-specific CSS custom properties (brand tokens)
├── eds-uk/
│   ├── config/
│   │   └── site-config.json    # market: "uk", locale: "en-GB", currency: "GBP"
│   └── ...
└── eds-jp/
    ├── config/
    │   └── site-config.json    # market: "jp", locale: "ja-JP", currency: "JPY"
    └── ...
```

#### Tenancy mechanism

- **`site-config.json`** — Each market declares its `market`, `locale`, `currency`, `timezone` and `edsHost`. EDS runtime scripts read this configuration at page load and pass the `market` value to all App Builder action calls.
- **Shared blocks** — Block JavaScript and CSS are identical across markets. The CI/CD pipeline compiles Svelte components once (see [ADR 005](005-svelte-web-components-for-shared-ui.md)) and copies the output to each market's `blocks/` directory.
- **Market-specific styles** — Each market's `styles/` directory defines CSS custom properties (e.g. `--brand-primary`, `--font-family-body`) that override shared defaults, allowing brand differentiation without duplicating component code.
- **Separate EDS hosts** — Each market publishes to its own EDS origin (`main--qsr-{market}--org.aem.live`), providing independent cache purge, preview and live URLs.

#### Adding a new market

To onboard a new market (e.g. `au` for Australia):

1. Create `apps/eds-au/` by copying the structure from an existing market directory.
2. Update `config/site-config.json` with AU-specific values.
3. Add AU-specific CSS custom properties in `styles/`.
4. Add the market entry to `app-builder/actions/shared/market-config.js`.
5. Create the AEM content tree `/content/qsr-au` and corresponding `/conf` and `/content/dam` nodes.
6. Add the EDS deploy job for the new market in the CI/CD workflow.

### 3. Svelte Web Components (Shared Component Library)

The shared component library in `packages/eds-components/` is **market-agnostic by design** (see [ADR 005](005-svelte-web-components-for-shared-ui.md)). Multitenancy support is achieved through props and configuration, not per-market source code.

#### Tenancy mechanism

- **`market` prop** — Every component that fetches data accepts an optional `market` attribute (defaults to `us`). The component passes this value to the shared API utility which resolves the correct BFF base URL from the market configuration map.
- **CSS custom properties** — Components consume brand tokens (colours, typography, spacing) from CSS custom properties defined on `:root` or the host element. Market-specific brand themes are applied by the EDS market site's `styles/` directory, piercing the Shadow DOM via inherited custom properties.
- **Locale-aware formatting** — Components use the `Intl` API with the market's locale for date, number and currency formatting. The locale is read from `site-config.json` at runtime and passed as a prop.
- **No market-specific branches** — There are no `if (market === 'jp')` branches in component code. Market differences are expressed entirely through configuration, props and CSS custom properties.

#### BFF routing

The shared API utility in `packages/eds-components/src/utils/` maps the `market` parameter to the correct regional BFF domain:

| Market | BFF Base URL |
|---|---|
| `us` | `https://bff.qsr.com` |
| `uk` | `https://bff.qsr.co.uk` |
| `jp` | `https://bff.qsr.co.jp` |

### 4. App Builder Actions (Serverless Backend)

App Builder actions are deployed once and serve all markets (see [ADR 002](002-byom-pattern-for-app-builder-actions.md)). Multitenancy is achieved via the `market` query parameter and a centralised configuration module.

#### Tenancy mechanism

- **`market-config.js`** — A single configuration module maps each market identifier to its `edsHost`, `locale`, `currency`, `timezone` and upstream API base URLs. Every action calls `getMarketConfig(market)` to resolve the correct settings.
- **`market` query parameter** — All action endpoints accept `?market=us|uk|jp`. The parameter defaults to `us` when omitted.
- **Shared action code** — Actions contain no market-specific logic. Data fetching, HTML rendering and caching behaviour are identical across markets; only the resolved configuration values differ.

---

## Consequences

### Positive

- **Single codebase, multiple markets** — All shared code (actions, Svelte components, block JavaScript) is maintained once. Market-specific concerns are isolated to configuration files and content trees.
- **Low onboarding cost for new markets** — Adding a market requires creating a new EDS directory, AEM content tree and `market-config.js` entry. No new code branches, repositories or deployments are needed.
- **Independent content workflows** — AEM authors for each market work within their own content tree with scoped permissions. Publishing in one market does not affect others.
- **Consistent user experience** — Shared components guarantee feature parity across markets. Brand differentiation is achieved through CSS custom properties, not code forks.
- **Simplified infrastructure** — A single AEM instance, a single App Builder workspace and a single monorepo reduce operational overhead compared to per-market infrastructure.

### Negative / Trade-offs

- **Shared instance risk** — A misconfiguration in shared code (e.g. `market-config.js`) or a bad AEM deployment can affect all markets simultaneously. Mitigated by per-market CI/CD deploy jobs and staged rollout (US → UK → JP).
- **Content tree discipline** — Authors must be trained to work within their market's content tree. ACLs enforce this at the platform level, but human error in template or component configuration can still reference the wrong market's assets. Mitigated by per-market user groups and content policy constraints.
- **CSS custom-property contract** — Adding a new brand token requires updating all market `styles/` directories. A missing token in one market causes a silent fallback to the browser default. Mitigated by a CI/CD lint step that validates all markets define the same set of required custom properties.
- **Market parameter trust** — The `market` query parameter is supplied by the client. A malformed or incorrect value falls back to the `us` default. For actions that return sensitive data (e.g. `rewards-provider`), the market is also validated against the IMS token's organisation scope.

### Follow-on actions

- Document the complete list of per-market CSS custom properties and add a CI/CD lint step to validate consistency across all market `styles/` directories.
- Add integration tests that exercise each App Builder action with all three market values to ensure `market-config.js` entries are correct and complete.
- Create an AEM content policy document describing the per-market content tree structure, DAM folder conventions and author group permissions.
- Document the step-by-step process for onboarding a new market in `docs/new-market-onboarding.md`.
