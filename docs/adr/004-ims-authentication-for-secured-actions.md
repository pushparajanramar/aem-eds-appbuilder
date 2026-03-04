# ADR 004 — Adobe IMS Authentication for Secured Actions

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2025-01-15 |
| **Proposer** | AEM Technical Architect |
| **Approver** | AEM Technical Architect |

---

## Context

Three App Builder actions handle personally identifiable or commercially sensitive data:

- `rewards-provider` — returns the personalised rewards catalogue for the authenticated user.
- `user-provider` — returns the authenticated user's profile and account summary.
- `bff-proxy` — proxies requests to internal Back-End for Frontend (BFF) modules that are not intended to be publicly accessible.

Access to these actions must be restricted to authenticated users. The programme already uses Adobe IMS (Identity Management System) for AEM Author SSO and Adobe Developer Console access, making it the natural identity provider for action authentication.

Two authentication options were evaluated:

1. **Adobe App Builder built-in auth (`require-adobe-auth: true`)** — The I/O Runtime gateway validates the `Authorization: Bearer <IMS_TOKEN>` header before the action is invoked. Zero custom middleware required.
2. **Custom JWT / API-key authentication** — A custom token-validation middleware in each action. Allows non-IMS clients but introduces key management overhead and duplicates security logic.

---

## Decision

Use **Adobe IMS bearer token authentication** enforced by the App Builder gateway (`require-adobe-auth: true` in `app.config.yaml`) for the `rewards-provider`, `user-provider` and `bff-proxy` actions.

```yaml
# app-builder/app.config.yaml (excerpt)
actions:
  rewards-provider:
    function: actions/rewards-provider/index.js
    annotations:
      require-adobe-auth: true
  user-provider:
    function: actions/user-provider/index.js
    annotations:
      require-adobe-auth: true
  bff-proxy:
    function: actions/bff-proxy/index.js
    annotations:
      require-adobe-auth: true
```

The client (EDS block JavaScript) must obtain a valid IMS access token using the `@adobe/aio-lib-ims` SDK or the `auth.js` utility in `packages/eds-components/src/utils/auth.js`, and pass it as `Authorization: Bearer <token>` in every request to a secured overlay URL.

IMS credentials (client ID, client secret, scopes) are stored exclusively in:

- GitHub Secrets (`AIO_IMS_CONTEXT_CONFIG`) for CI/CD deployment.
- `app-builder/.env` for local development (never committed to Git).

---

## Consequences

### Positive

- **Zero custom middleware** — Authentication is enforced at the I/O Runtime gateway layer before any action code runs; no per-action token-validation code required.
- **IMS token lifecycle management** — Token refresh and expiry are handled by the IMS SDK; the action never stores tokens.
- **Unified identity** — The same IMS identity used for AEM Author, Adobe Analytics and Adobe Target is reused for action authentication.
- **Auditability** — IMS token metadata (subject, client ID) is available in the App Builder action context (`params.__ow_user_id`, `params.__ow_user_metadata`) for audit logging via `datalog.js`.

### Negative / Trade-offs

- **IMS dependency** — If the IMS service is unavailable, all secured actions are inaccessible. Mitigated by graceful degradation in EDS block JavaScript (hide the block rather than show an error).
- **Browser IMS token flow** — Obtaining an IMS access token in the browser requires the `@adobe/aio-lib-ims` SDK; this adds approximately 12 kB (gzip) to the block bundle.
- **Non-IMS clients excluded** — Server-to-server integrations that do not have an IMS credential (e.g. third-party analytics tools) cannot call secured actions directly.

### Follow-on actions

- Store IMS credentials in GitHub Secrets and `app-builder/.env` only; add `.env` to `.gitignore`.
- Implement token acquisition and caching in `packages/eds-components/src/utils/auth.js` (in-memory only; never `localStorage`).
- Document the IMS token flow in `docs/aem-technical-architect.md` under Security & Auth.
- Add the `AIO_IMS_CONTEXT_CONFIG` secret to the repository secrets configuration guide (`docs/aem-configuration-guide.md`).
