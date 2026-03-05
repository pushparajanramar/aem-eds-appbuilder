# ADR 012 — Fastly Compute Edge Functions for Dynamic Block Providers

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-03-05 |
| **Proposer** | AEM Technical Architect |
| **Approver** | AEM Technical Architect |

---

## Context

The programme originally adopted **Adobe App Builder (I/O Runtime)** as the serverless back-end for dynamic EDS block providers (see [ADR 001](001-aem-eds-app-builder-solution-architecture.md) and [ADR 002](002-byom-pattern-for-app-builder-actions.md)). The programme also uses **Fastly** as the CDN in front of AEM EDS for device detection and URL routing (see [ADR 006](006-fastly-cdn-device-detection-and-routing.md)).

Over time the following operational concerns emerged with the App Builder deployment:

- **Cold-start latency** — Adobe I/O Runtime actions that are invoked infrequently (e.g. `rewards-provider`, `user-provider`) can exhibit 500–800 ms cold-start delays, degrading Core Web Vitals for authenticated users.
- **Two runtime environments** — The VCL-based Fastly service and the I/O Runtime–based App Builder service are separate deployments that must be kept in sync. Adding a new provider requires changes in both systems.
- **Vendor lock-in** — App Builder actions depend on Adobe I/O Runtime infrastructure, the `aio` CLI, and Adobe Developer Console credentials, increasing operational complexity.

**Fastly Compute** (WebAssembly-based edge compute) addresses all three concerns: it runs inside the same Fastly service that already handles device detection and URL routing, eliminating cold starts, unifying the runtime environment, and removing the dependency on I/O Runtime.

Two options were evaluated:

| Option | Cold start | Unified runtime | Vendor dependency |
|---|---|---|---|
| **Adobe App Builder (I/O Runtime)** | 500–800 ms for cold invocations | Separate from Fastly VCL | Adobe Developer Console + `aio` CLI |
| **Fastly Compute (JavaScript/Wasm)** | None (always-warm edge) | Same Fastly service as VCL | Fastly CLI + API token only |

---

## Decision

Implement a **Fastly Compute** edge service (`fastly-compute/`) that ports all eight dynamic block providers from App Builder to Fastly's JavaScript Compute SDK, running at the CDN edge.

### Service architecture

```
Fastly CDN
  ├─ VCL (device detection + URL routing)        ← fastly/vcl/
  └─ Compute (dynamic block providers)            ← fastly-compute/src/
       ├─ GET  /menu-provider      → text/html EDS menu-item block markup
       ├─ GET  /store-provider     → text/html EDS store-locator block markup
       ├─ GET  /rewards-provider   → text/html EDS rewards block markup (auth required)
       ├─ GET  /user-provider      → text/html EDS user-profile block markup (auth required)
       ├─ *    /bff-proxy          → application/json BFF proxy (auth required)
       ├─ GET  /device-provider    → text/html meta snippet or application/json layout hints
       ├─ POST /webhook            → EDS Admin API cache purge / reindex
       └─ POST /sitemap-generator  → sitemap.xml generation and CDN push
```

### Repository layout

```
fastly-compute/
├── src/
│   ├── index.js               # Entry point — path-based router, CORS, error handling
│   ├── handlers/              # One handler module per provider (mirrors app-builder/actions/)
│   │   ├── menu-provider.js
│   │   ├── store-provider.js
│   │   ├── rewards-provider.js
│   │   ├── user-provider.js
│   │   ├── bff-proxy.js
│   │   ├── device-provider.js
│   │   ├── webhook.js
│   │   └── sitemap-generator.js
│   └── shared/                # Shared utilities (mirrors app-builder/actions/shared/)
│       ├── market-config.js   # EDS host + locale + timezone per market
│       ├── url-utils.js       # Safe URL helpers + Dynamic Media URL builders
│       ├── device-utils.js    # Device type detection and layout configuration
│       ├── html-utils.js      # HTML escaping utility
│       └── datalog.js         # Structured request/error audit logging
├── __tests__/                 # Jest unit tests (ESM, --experimental-vm-modules)
├── fastly.toml                # Fastly service configuration
├── jest.config.js
└── package.json
```

### Key design decisions

1. **Path-based routing** — A single entry point (`index.js`) dispatches requests to the appropriate handler based on `pathname`. This mirrors the per-action URL structure of App Builder but within a single Fastly Compute service.
2. **Shared utilities parity** — `shared/market-config.js`, `shared/url-utils.js`, `shared/device-utils.js` and `shared/datalog.js` are functionally identical to their App Builder counterparts (`app-builder/actions/shared/`), ensuring consistent behaviour across both runtimes during the transition period.
3. **BYOM contract preserved** — Every handler returns `text/html` EDS block markup or `application/json`, matching the BYOM contract defined in [ADR 002](002-byom-pattern-for-app-builder-actions.md). No changes are required to EDS block JavaScript or `site-config.json` overlay URL paths.
4. **`X-Device-Type` integration** — Handlers read the `X-Device-Type` header set by the Fastly VCL `device-detection.vcl` subroutine (see [ADR 006](006-fastly-cdn-device-detection-and-routing.md)). No client-side device detection is needed.
5. **Content source switching** — Handlers accept `?contentSource=aem|da` to select between AEM as a Cloud Service and DA.live as the content origin, using the same `getMarketConfig()` API as the App Builder implementation.
6. **CORS** — All responses include permissive CORS headers to support DA Library Plugin cross-origin fetch calls from the authoring environment.

### CI/CD pipeline

A dedicated GitHub Actions workflow deploys the Fastly Compute service:

| Workflow | File | Trigger | Purpose |
|---|---|---|---|
| **Fastly Compute Deploy** | `fastly-compute-deploy.yml` | `push` → `main` (paths: `fastly-compute/src/**`, `fastly-compute/fastly.toml`, `fastly-compute/package.json`) | Lint, test, then `fastly compute publish` |

The workflow requires one repository secret:

| Secret | Description |
|---|---|
| `FASTLY_API_TOKEN` | Fastly API token with write access to the `eds-dynamic-blocks` Compute service |

### Relationship to App Builder

The App Builder deployment (`app-builder/`) remains active. Both runtimes implement the same provider contract (BYOM HTML, same query parameters, same `market-config.js` values). The EDS `site-config.json` overlay URLs in each market can be pointed at either the App Builder endpoints or the Fastly Compute endpoints independently, allowing gradual migration or A/B comparison.

---

## Consequences

### Positive

- **Zero cold starts** — Fastly Compute functions are always-warm at the edge; the 500–800 ms I/O Runtime cold-start penalty is eliminated.
- **Unified CDN + compute** — Device detection VCL and provider logic run in the same Fastly service, reducing cross-service latency and simplifying operational monitoring.
- **Simplified deployment** — A single `FASTLY_API_TOKEN` secret and the Fastly CLI (`fastly compute publish`) replace the multi-credential App Builder deployment chain (`AIO_IMS_CONTEXT_CONFIG`, `AIO_PROJECT_ID`, `AIO_WORKSPACE_ID`, `aio` CLI).
- **Consistent implementation** — Shared utilities (`market-config.js`, `url-utils.js`, `device-utils.js`, `datalog.js`) are aligned between the two runtimes, reducing the risk of divergence.
- **Gradual migration** — The App Builder deployment is preserved; teams can migrate providers one at a time by updating the relevant overlay URL in `site-config.json`.

### Negative / Trade-offs

- **Two runtimes to maintain** — Until the App Builder deployment is fully retired, both `app-builder/` and `fastly-compute/` must be kept in sync. Any change to a shared utility or provider contract must be applied in both places.
- **Fastly-only** — The Fastly Compute service requires a Fastly account and cannot be run locally without the Fastly CLI (`fastly compute serve`). Local development without the CLI requires directing `site-config.json` overlay URLs at the App Builder endpoints.
- **JavaScript/Wasm constraints** — Fastly Compute's JavaScript runtime does not support all Node.js APIs. Code that relies on Node.js built-ins (`fs`, `path`, `process.env`) must use Fastly SDK equivalents or environment variable dictionaries.
- **Wasm binary size** — Each build produces a `.wasm` binary. Large dependencies increase binary size and may approach Fastly's service size limits; monitor with each dependency addition.

### Follow-on actions

- Validate all eight providers in the Fastly Compute service against the equivalent App Builder responses using the integration test suite in `tests/`.
- Update each market's `config/site-config.json` overlay URLs to point at the Fastly Compute service endpoints once validation is complete.
- Retire the App Builder deployment and remove `app-builder/` from the CI/CD pipeline once all markets have been migrated.
- Add local development documentation for `fastly compute serve` in the README and role documents.
- Document the step-by-step migration process (per-provider URL swap) in `docs/aem-configuration-guide.md`.
