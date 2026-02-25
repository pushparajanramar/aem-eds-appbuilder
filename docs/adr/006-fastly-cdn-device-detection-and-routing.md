# ADR 006 — Fastly CDN for Device Detection and URL Routing

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2025-01-22 |
| **Proposer** | AEM Technical Architect |
| **Approver** | AEM Technical Architect |

---

## Context

QSR digital estate spans multiple device form factors beyond the standard mobile/tablet/desktop triad:

- **Kiosk** — In-store self-order terminals running Chromium in kiosk mode.
- **Digital Menu Board (DMB)** — Large-format screens in-store displaying the menu, running headless Chromium.
- **Headless** — Server-side rendering / scraping clients.

Different form factors require different page layouts and asset variants. Two mechanisms were evaluated for delivering device-appropriate experiences:

1. **Client-side device detection** — JavaScript in the EDS block reads `navigator.userAgent` and applies layout changes post-load. Causes Cumulative Layout Shift (CLS) as the layout shifts after the initial render.
2. **Edge-side device detection (Fastly VCL)** — Fastly VCL normalises the `User-Agent` into a compact `X-Device-Type` token before the request reaches the EDS origin. The correct HTML/assets are served from the first response; no CLS.

The programme already uses Fastly as the CDN in front of AEM EDS for performance and security reasons, making VCL the natural place for device detection logic.

---

## Decision

Implement device detection and URL routing in **Fastly VCL** running in front of the EDS origin.

### VCL files

| File | Purpose |
|---|---|
| `fastly/vcl/device-detection.vcl` | Normalises `User-Agent` into `X-Device-Type` token: `mobile`, `tablet`, `desktop`, `kiosk`, `digital-menu-board`, `headless`. Sets `Vary: X-Device-Type` on responses. |
| `fastly/vcl/url-routing.vcl` | Pattern B (subdomain redirect) and Pattern C (subdirectory rewrite) based on `X-Device-Type`. |

### Device type tokens

| Token | Device class |
|---|---|
| `mobile` | Smartphones |
| `tablet` | Tablets |
| `desktop` | Desktops and laptops |
| `kiosk` | In-store self-order kiosks |
| `digital-menu-board` | Large-format DMB screens |
| `headless` | Server-side / scraping clients |

The `X-Device-Type` header is:

1. Set by Fastly VCL on every inbound request.
2. Forwarded to App Builder actions (available as `params.__ow_headers['x-device-type']` or read via `device-utils.js`).
3. Read by the `device-provider` action to return device-appropriate HTML or JSON layout hints.
4. Used by `fastly/vcl/url-routing.vcl` to redirect kiosk and DMB traffic to the appropriate subdomain or sub-path.

---

## Consequences

### Positive

- **Zero CLS** — Device-specific layout is determined before the first byte is served; no client-side layout shift.
- **Vary-aware caching** — The `Vary: X-Device-Type` response header instructs Fastly to maintain separate cache entries per device type, so mobile users never receive desktop markup.
- **Kiosk and DMB support** — Dedicated token values enable purpose-built layouts for in-store devices without client-side UA sniffing.
- **Action context enrichment** — App Builder actions receive the `X-Device-Type` header without any extra client-side plumbing.

### Negative / Trade-offs

- **Fastly dependency** — Device detection and URL routing are tightly coupled to Fastly VCL. Running the solution without Fastly (e.g. in local development) requires the `deviceType` query-parameter override on the `device-provider` action.
- **VCL maintenance** — Changes to device detection patterns (e.g. adding a new kiosk UA string) require a Fastly VCL deployment, not a Git push. VCL changes must be tested in the Fastly staging service before production promotion.
- **Cache key explosion** — Six device-type variants × three markets = up to 18 distinct cache entries per URL. Monitor Fastly cache hit ratios to ensure adequate cache fill.

### Follow-on actions

- Add local development documentation explaining the `deviceType` query-parameter override for `device-provider`.
- Define a VCL change management process (staging → production promotion with QA sign-off).
- Monitor per-device-type cache hit ratios in the Fastly dashboard; adjust VCL TTLs if fill rates are low.
- Document the `device-utils.js` shared utility in `docs/aem-technical-architect.md`.
