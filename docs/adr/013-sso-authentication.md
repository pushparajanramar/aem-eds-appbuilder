# ADR 013 — SSO Authentication for AEM EDS

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-03-05 |
| **Proposer** | AEM Technical Architect |
| **Approver** | AEM Technical Architect |

---

## Context

The Quick Service Restaurant EDS sites require controlled access to authenticated sections — the rewards catalogue (`/rewards`), user account pages (`/account`), and any market where the entire site is behind a corporate identity provider.

Several distinct authentication needs exist within the programme:

1. **AEM Author access** — AEM Author (Universal Editor) is already protected by Adobe IMS via Adobe Identity Management. This is outside the scope of this ADR.
2. **App Builder secured actions** — The `rewards-provider`, `user-provider` and `bff-proxy` App Builder actions use `require-adobe-auth: true` to enforce IMS bearer token validation at the I/O Runtime gateway level (see [ADR 004](004-ims-authentication-for-secured-actions.md)).
3. **EDS site end-user SSO** — The EDS sites themselves may require that _visitors_ (end-users browsing `main--qsr-us--org.aem.live`) are authenticated before they can view protected pages. This is the scenario addressed by this ADR.

Two distinct identity provider contexts were identified:

| Scenario | Identity Provider | User population |
|---|---|---|
| **Consumer-facing SSO** (US, UK) | Adobe IMS (`ims`) | Registered QSR loyalty members |
| **Corporate / employee portal** (JP, intranet) | Azure AD / Microsoft Entra ID (`azure`) | Corporate employees or franchise staff |

Three SSO implementation options were evaluated:

| Option | Description | Complexity |
|---|---|---|
| **Adobe IMS SDK only** | Use `@adobe/aio-lib-ims` exclusively; works for loyalty members but does not support corporate Azure AD | Low — but covers only one IDP |
| **Custom OAuth 2.0 middleware** | Server-side token validation in each Fastly Compute handler | Medium — duplicates security logic across handlers; requires session infrastructure |
| **Client-side PKCE plugin (`scripts/sso.js`)** | A lightweight EDS script module that implements OAuth 2.0 Authorization Code + PKCE entirely in the browser; reads IDP config from `site-config.json` | Low–Medium — no server-side session; works with any OAuth 2.0–compliant IDP |

---

## Decision

Implement a **client-side OAuth 2.0 PKCE SSO plugin** (`apps/eds-{market}/scripts/sso.js`) that:

1. Reads SSO configuration from `/config/site-config.json` under the `"sso"` key.
2. Supports two providers: **Adobe IMS** (`"provider": "ims"`) and **Azure AD / Entra ID** (`"provider": "azure"`).
3. Uses the **Authorization Code flow with PKCE** (RFC 7636) — no client secret is stored client-side.
4. Enforces authentication on every protected page load via `initSSO()`.
5. Supports a configurable **public path allow-list** so marketing pages (home, menu, stores) remain accessible without login.
6. Implements **single logout (SLO)** — clearing the local token and redirecting the browser to the IDP's logout endpoint so the IDP session is also terminated.

### Configuration (per market)

SSO is configured in `apps/eds-{market}/config/site-config.json` under the `"sso"` key:

```json
{
  "sso": {
    "enabled": true,
    "provider": "azure",
    "logLevel": "info",
    "publicPaths": ["/", "/login", "/callback", "/logout", "/menu", "/stores"],
    "callbackPath": "/callback",
    "logoutPath": "/logout",
    "azure": {
      "tenantId": "{AZURE_TENANT_ID}",
      "clientId": "{AZURE_CLIENT_ID}",
      "redirectUri": "https://main--qsr-us--org.aem.live/callback",
      "scope": "openid profile email",
      "postLogoutRedirectUri": "https://main--qsr-us--org.aem.live"
    },
    "ims": {
      "clientId": "{IMS_CLIENT_ID}",
      "redirectUri": "https://main--qsr-us--org.aem.live/callback",
      "scope": "openid,AdobeID,read_organizations",
      "postLogoutRedirectUri": "https://main--qsr-us--org.aem.live"
    }
  }
}
```

SSO is **disabled by default** (`"enabled": false`). It is enabled per market by setting `"enabled": true` and populating the relevant provider block.

### SSO Plugin Architecture

```
Browser (EDS page)
    │
    ├─ scripts/sso.js  ← initSSO() called on each page load
    │       │
    │       ├─ loadSSOConfig() → fetches /config/site-config.json
    │       │
    │       ├─ SSOPlugin.init()
    │       │   ├─ /callback path → handleCallback() [exchange code for token]
    │       │   ├─ /logout path  → logout()          [clear token + IDP SLO]
    │       │   ├─ public path   → no-op
    │       │   └─ protected path, no token → redirectToLogin() [PKCE flow]
    │       │
    │       └─ sessionStorage
    │           ├─ sso_access_token
    │           ├─ sso_token_expires
    │           ├─ sso_code_verifier   (PKCE — cleared after callback)
    │           ├─ sso_state           (CSRF protection — cleared after callback)
    │           └─ sso_return_url      (redirect target — cleared after callback)
    │
    ├─ Azure AD / Entra ID      (provider = 'azure')
    │   ├─ Authorization endpoint: https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize
    │   ├─ Token endpoint:         https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
    │   └─ Logout endpoint:        https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/logout
    │
    └─ Adobe IMS                 (provider = 'ims')
        ├─ Authorization endpoint: https://ims-na1.adobelogin.com/ims/authorize/v2
        ├─ Token endpoint:         https://ims-na1.adobelogin.com/ims/token/v3
        └─ Logout endpoint:        https://ims-na1.adobelogin.com/ims/logout/v1
```

### Module exports

`scripts/sso.js` exports the following public API:

| Export | Type | Description |
|---|---|---|
| `SSOPlugin` | class | Main SSO plugin — construct with SSO config, call `init()` |
| `SSOLogger` | class | Structured logger with configurable level (debug/info/warn/error) |
| `generateRandomString(length)` | function | Cryptographically random string for PKCE verifier / state |
| `generateCodeChallenge(verifier)` | async function | PKCE S256 code challenge derivation |
| `loadSSOConfig()` | async function | Fetches SSO config from `/config/site-config.json` |
| `initSSO()` | async function | Self-executing entry point — loads config, runs SSO check |

### Token storage

Access tokens are stored in **`sessionStorage`** (not `localStorage`). This is standard practice for OAuth 2.0 PKCE flows in browser clients (RFC 7636):

- Tokens survive page navigation within the same tab but are discarded when the tab closes.
- `sessionStorage` is scoped per origin and tab — tokens cannot be read by third-party scripts on other origins.
- PKCE verifier and state parameters are written during login initiation and removed immediately after a successful callback exchange.

### Public path allow-listing

Pages listed in `publicPaths` are accessible without authentication. The default allow-list covers:

```json
["/", "/login", "/callback", "/logout", "/menu", "/stores"]
```

Operators can extend this list in `site-config.json` to accommodate campaign landing pages or other public content without deploying code changes.

### Market provider assignments

| Market | Default provider | Rationale |
|---|---|---|
| US | `azure` | Loyalty member SSO via corporate Entra ID |
| UK | `azure` | Loyalty member SSO via corporate Entra ID |
| JP | `ims` | Adobe IMS for franchise/employee intranet portal |

Provider selection is fully configuration-driven — changing `"provider"` in `site-config.json` switches the IDP without any code change.

### Relationship to App Builder / Fastly Compute auth

The SSO plugin (`scripts/sso.js`) handles **page-level access control** (who can _view_ a page). It is distinct from the action-level authentication enforced by `require-adobe-auth: true` on App Builder actions or the bearer-token validation performed by Fastly Compute handlers for `rewards-provider`, `user-provider` and `bff-proxy`.

After SSO login, the access token stored in `sessionStorage` is forwarded as `Authorization: Bearer <token>` when the EDS block JavaScript calls secured overlay endpoints.

### DA plugin

An extended version of the SSO plugin lives at `tools/sso-plugin/sso-plugin.js` for use within the DA (Document Authoring) authoring environment. It shares the same PKCE core logic but adapts to the DA plugin message-passing API.

---

## Consequences

### Positive

- **Provider-agnostic** — Supporting both Azure AD and Adobe IMS in a single module covers all three markets without per-market forks.
- **No server-side session** — The PKCE flow is entirely client-side; no session store, cookie management or server-side token introspection infrastructure is required.
- **Configuration-driven** — SSO behaviour (enabled/disabled, provider, public paths, redirect URIs) is controlled entirely through `site-config.json`. No code deploy is needed to enable or disable SSO for a market.
- **CSRF protection** — A cryptographically random `state` parameter is validated on the OAuth callback to prevent cross-site request forgery attacks.
- **Single logout** — The `logout()` method clears the local token _and_ redirects to the IDP logout endpoint, terminating the IDP session and preventing token reuse from other tabs.
- **Structured logging** — The configurable `logLevel` allows verbose debug output in development and silent operation in production.

### Negative / Trade-offs

- **sessionStorage lifetime** — Tokens are lost when the tab closes. Users must re-authenticate when they open a new tab to a protected page. This is intentional for security but may affect UX for loyalty members who expect persistent login.
- **Client-side PKCE only** — The current implementation does not support refresh token rotation. When the access token expires (default 1 hour), the user is silently redirected to the IDP login page.
- **No server-side validation** — The EDS page trusts the token stored in `sessionStorage`. For the highest-security scenarios, token introspection should be added to the Fastly Compute handlers (future enhancement).
- **Single active IDP per market** — Only one provider can be active at a time per market. Markets that require both IMS and Azure AD simultaneously (e.g. a hybrid loyalty + franchise portal) would require a separate market configuration.

### Follow-on actions

- Enable SSO per market by setting `"enabled": true` in the relevant `config/site-config.json` once IDP app registrations are complete.
- Register the `redirectUri` (`/callback`) and `postLogoutRedirectUri` in the Azure AD / IMS Developer Console application for each market.
- Add integration tests for the PKCE callback flow and state-mismatch CSRF detection in `apps/eds-us/__tests__/sso.test.js`.
- Consider adding refresh token support or silent re-authentication via the IDP's `prompt=none` parameter for markets where persistent login is required.
- Document the DA plugin SSO integration in `tools/sso-plugin/README.md`.
