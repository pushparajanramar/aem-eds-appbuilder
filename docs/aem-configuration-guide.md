# AEM Configuration Guide

This guide covers the end-to-end configuration of the Adobe Experience Manager (AEM) ecosystem used by this multi-market AEM Edge Delivery Services (EDS) + App Builder project.  
Topics are ordered to reflect a typical project set-up sequence.

---

## Table of Contents

1. [AEM Archetype](#1-aem-archetype)
2. [Git Publishing (AEM EDS)](#2-git-publishing-aem-eds)
3. [Cloud Manager Setup](#3-cloud-manager-setup)
4. [Configure Pipelines](#4-configure-pipelines)
5. [Single Sign-On (SSO)](#5-single-sign-on-sso)
6. [Users and Permissions](#6-users-and-permissions)
7. [Cloud Service Security](#7-cloud-service-security)
8. [Adobe Launch with Analytics and Adobe Target](#8-adobe-launch-with-analytics-and-adobe-target)

---

## 1. AEM Archetype

> **Applicability:** AEM Archetype is relevant when you are running an AEM **Sites / Assets as a Cloud Service** (AEMaaCS) Author tier that feeds content into this Edge Delivery Services project.  
> If your team is using **only** AEM EDS (document-based or Universal Editor authoring) without a traditional AEM Author, you can skip this section.

### 1.1 What Is the AEM Archetype?

The [AEM Project Archetype](https://github.com/adobe/aem-project-archetype) is a Maven template that generates a best-practice AEM project skeleton containing:

| Module | Purpose |
|---|---|
| `core` | OSGi bundle — Java back-end logic, models, services |
| `ui.apps` | `/apps` overlay — components, clientlibs, templates |
| `ui.content` | Initial `/content` + `/conf` structures |
| `ui.config` | OSGi run-mode configurations |
| `ui.frontend` | Webpack / Vite front-end build |
| `dispatcher` | Apache / Dispatcher configuration |
| `it.tests` | Integration test module |
| `ui.tests` | Selenium / Cypress UI tests |

### 1.2 Generating the Archetype

**Prerequisites:** Maven 3.8+, Java 11+, an AEMaaCS program provisioned in Cloud Manager.

```bash
mvn -B org.apache.maven.plugins:maven-archetype-plugin:3.2.1:generate \
  -D archetypeGroupId=com.adobe.aem \
  -D archetypeArtifactId=aem-project-archetype \
  -D archetypeVersion=49 \
  -D appTitle="Starbucks AEM" \
  -D appId="sbux" \
  -D groupId="com.starbucks.aem" \
  -D artifactId="sbux-aem" \
  -D version="1.0.0-SNAPSHOT" \
  -D aemVersion="cloud" \
  -D frontendModule="general" \
  -D includeExamples=n
```

Key parameters:

| Parameter | Recommended Value | Description |
|---|---|---|
| `archetypeVersion` | `49` (latest) | AEM Archetype release |
| `aemVersion` | `cloud` | Targets AEMaaCS |
| `frontendModule` | `general` | Vite-based front-end build |
| `includeExamples` | `n` | Omit sample content for production projects |

### 1.3 Building and Installing Locally

```bash
cd sbux-aem
mvn clean install -PautoInstallPackage -Daem.host=localhost -Daem.port=4502
```

### 1.4 Connecting to This EDS Project

Once deployed, configure AEM Author to fire publish/unpublish/delete events to the App Builder **webhook** action:

1. In AEM, open **Tools → Operations → Web Console → OSGi configurations**.
2. Search for `com.day.cq.replication.ReplicationAction` and add the App Builder webhook URL:
   ```
   https://<app-builder-host>/api/v1/web/starbucks/webhook
   ```
3. Set the request header `Authorization: Bearer <IMS_TOKEN>` (the webhook action requires `require-adobe-auth: true`).

---

## 2. Git Publishing (AEM EDS)

AEM Edge Delivery Services uses a **GitHub repository as the content and code source of truth**. Every push to the repository's production branch (commonly `main`) is reflected live on the EDS host within seconds.

### 2.1 How EDS Git Publishing Works

```
Author edits content (Google Drive / SharePoint / Universal Editor)
        │
        ▼
AEM Admin API (admin.hlx.page) previews & publishes content
        │  content stored as Markdown / JSON in Git-backed cache
        ▼
EDS CDN (aem.live) serves the rendered page to visitors
```

Code changes (blocks, scripts, styles) in the GitHub repository are picked up automatically. No build step is required for plain EDS code changes.

### 2.2 Repository Binding

Each EDS site is bound to a GitHub repo and branch via a `fstab.yaml` at the repository root:

```yaml
# fstab.yaml (in the root of each EDS site repo)
mountpoints:
  /:
    url: https://drive.google.com/drive/folders/<folder-id>
    type: google
```

For SharePoint:

```yaml
mountpoints:
  /:
    url: https://<tenant>.sharepoint.com/sites/<site>/Shared%20Documents/<folder>
    type: sharepoint
```

### 2.3 Installing the AEM Bot

The [AEM GitHub App](https://github.com/apps/helix-bot) must be installed on your GitHub organisation and granted access to each EDS site repository.  
Without it, the AEM Admin API cannot sync content from Google Drive / SharePoint.

1. Navigate to **GitHub → Settings → Integrations → GitHub Apps**.
2. Install **AEM Bot** and grant access to the `aem-eds-appbuilder` repository and each EDS market repo (`sbux-us`, `sbux-uk`, `sbux-jp`).

### 2.4 Publishing Content via the Admin API

Content is published using the AEM Admin API. The EDS token (`EDS_TOKEN`) must be stored as a GitHub secret (see [GitHub Secrets](../README.md#github-secrets)).

```bash
# Preview a path before publishing
curl -X POST \
  -H "Authorization: Bearer $EDS_TOKEN" \
  "https://admin.hlx.page/preview/org/sbux-us/main/<path>"

# Publish a single path
curl -X POST \
  -H "Authorization: Bearer $EDS_TOKEN" \
  "https://admin.hlx.page/publish/org/sbux-us/main/<path>"

# Bulk publish all pages (wildcard)
curl -X POST \
  -H "Authorization: Bearer $EDS_TOKEN" \
  "https://admin.hlx.page/publish/org/sbux-us/main/*"
```

Replace `org/sbux-us/main` with `org/sbux-uk/main` or `org/sbux-jp/main` for other markets.

### 2.5 Automated Publishing via the Webhook Action

When AEM Author publishes or unpublishes a page, the App Builder `webhook` action automatically triggers an EDS cache purge:

```
AEM Author  →  POST /api/v1/web/starbucks/webhook
                  { market, path, event: "publish" | "unpublish" | "delete" }
                      │
                      ▼
              EDS Admin API  →  purge / reindex
```

See [`app-builder/actions/webhook/`](../app-builder/actions/webhook/) for implementation details.

### 2.6 Branch Strategy

| Branch | EDS Tier | Purpose |
|---|---|---|
| `main` | Production (`*.aem.live`) | Live content and code |
| `preview` / feature branches | Preview (`*.aem.page`) | Authoring QA |

---

## 3. Cloud Manager Setup

[Adobe Cloud Manager](https://experienceleague.adobe.com/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/introduction-to-cloud-manager.html) is the CI/CD and environment management service for AEMaaCS.

> **Note:** If your project is AEM EDS-only (no AEMaaCS Author/Publish tier), Cloud Manager is not required. This section applies when an AEMaaCS Author instance is part of the architecture (e.g., for content creation feeding into EDS via the webhook).

### 3.1 Prerequisites

- An **Adobe IMS Organisation** with AEM Cloud Service entitlement.
- A **Cloud Manager program** created at [experience.adobe.com/cloud-manager](https://experience.adobe.com/cloud-manager).
- **Business Owner** or **Deployment Manager** Cloud Manager role.

### 3.2 Create a Program

1. Log in to [Cloud Manager](https://experience.adobe.com/cloud-manager).
2. Click **Add Program**.
3. Enter the program name (e.g., `Starbucks AEM`).
4. Select **Set up for Production** (or **Sandbox** for non-production exploration).
5. Choose solutions: **Sites**, **Assets** (as required).
6. Complete the wizard. Cloud Manager provisions Dev, Stage, and Production environments.

### 3.3 Connect Your Git Repository

Cloud Manager has a built-in Git repository. Alternatively, connect an external repository (GitHub, GitLab, Bitbucket):

**Built-in repository:**
```bash
# Retrieve the Cloud Manager Git credentials from the Cloud Manager UI
# Repositories → Manage Repositories → Access Repo Info
git remote add cloudmanager <cloud-manager-git-url>
git push cloudmanager main
```

**External GitHub repository (recommended):**
1. In Cloud Manager, go to **Repositories → Add Repository**.
2. Select **GitHub** and follow the OAuth flow to connect `pushparajanramar/aem-eds-appbuilder`.
3. Cloud Manager installs a GitHub App on the repository and automatically validates pull requests.

### 3.4 Environment Overview

| Environment | Purpose | Branch |
|---|---|---|
| Development | Developer testing, rapid iteration | feature branches |
| Stage | Pre-production QA and performance testing | `release/*` |
| Production | Live traffic | `main` |

### 3.5 Domain and SSL Certificate Setup

1. In Cloud Manager, go to **Environments → \<Environment\> → Domain Settings**.
2. Add custom domains (e.g., `www.starbucks.com`).
3. Upload or provision a TLS/SSL certificate.
4. Configure DNS CNAME records to point to the Cloud Manager CDN endpoint.

---

## 4. Configure Pipelines

Cloud Manager offers two types of pipeline:

| Pipeline Type | Trigger | Purpose |
|---|---|---|
| **Full Stack** | Code push / manual | Build, test, and deploy AEM code to Dev → Stage → Production |
| **Front-End** | Code push / manual | Deploy compiled front-end assets only (faster) |
| **Config** | Manual | Deploy OSGi / Dispatcher configs without a full build |

### 4.1 Full Stack Pipeline

A full-stack pipeline executes: **Build → Unit Tests → Code Quality → Deploy to Dev → Stage Testing → Deploy to Production**.

**Setup steps:**

1. In Cloud Manager, go to **Pipelines → Add Pipeline → Production Pipeline**.
2. **Pipeline name:** `sbux-production-deploy`
3. **Source:**
   - Repository: `aem-eds-appbuilder` (or the Cloud Manager built-in repo)
   - Branch: `main`
4. **Environments:**
   - Dev: automatic deployment on every build
   - Stage: automatic deployment after Dev passes
   - Production: manual approval gate (recommended)
5. **Build Command:** Cloud Manager executes `mvn clean package` by default. For custom Maven settings:
   ```xml
   <!-- .cloudmanager/maven/settings.xml -->
   <settings>
     <profiles>
       <profile>
         <id>cloud-manager</id>
         <repositories>
           <repository>
             <id>adobe-public</id>
             <url>https://repo.adobe.com/nexus/content/groups/public</url>
           </repository>
         </repositories>
       </profile>
     </profiles>
   </settings>
   ```
6. Click **Save**.

### 4.2 Front-End Pipeline (EDS Web Components)

The `packages/eds-components` Svelte build is handled by the GitHub Actions workflow (`deploy.yml`). If you also want Cloud Manager to manage it:

1. Add a **Non-Production Pipeline** in Cloud Manager.
2. Set **Type** to **Front-End**.
3. Point to the branch that contains the compiled Vite output.
4. Specify the artifact path: `packages/eds-components/dist/`.

### 4.3 GitHub Actions Pipeline (This Repository)

This project's primary CI/CD is defined in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

**Pipeline stages:**

```
push to main
    │
    ▼
[lint]               ESLint on app-builder actions + Svelte components
    │
    ├──► [build-components]      Vite build → wc-bundles artifact
    │         │
    │         ├──► [deploy-eds-us]   Publish to admin.hlx.page (US)
    │         ├──► [deploy-eds-uk]   Publish to admin.hlx.page (UK)
    │         └──► [deploy-eds-jp]   Publish to admin.hlx.page (JP)
    │
    └──► [deploy-app-builder]    aio app deploy (main branch only)
```

**Environment protection rules** (configure in GitHub → Settings → Environments → `production`):

| Rule | Recommended Setting |
|---|---|
| Required reviewers | 1 (team lead) |
| Deployment branches | `main` only |
| Wait timer | 0 min (or a brief soak period for production) |

**Required GitHub secrets:**

| Secret | Where to obtain |
|---|---|
| `AIO_IMS_CONTEXT_CONFIG` | Adobe Developer Console → Project → Credentials → Download |
| `AIO_PROJECT_ID` | Adobe Developer Console → Project overview |
| `AIO_WORKSPACE_ID` | Adobe Developer Console → Workspace overview |
| `EDS_TOKEN` | AEM Admin API token from your Adobe account team |

### 4.4 Pipeline Quality Gates

Cloud Manager enforces the following quality gates before promoting to Production:

| Gate | Tool | Threshold (default) |
|---|---|---|
| Code Coverage | JaCoCo | ≥ 50% line coverage |
| Security Rating | SonarQube | A (no blockers) |
| Reliability Rating | SonarQube | A |
| Maintainability Rating | SonarQube | A |
| Performance | Lighthouse | Score ≥ 85 |

Override thresholds in Cloud Manager → Pipeline → **Code Quality Configuration**.

---

## 5. Single Sign-On (SSO)

### 5.1 Adobe IMS SSO (App Builder / AEMaaCS)

All Adobe services (AEM Author, Adobe Developer Console, App Builder) are federated through **Adobe Identity Management System (IMS)**.  
Your corporate IdP (e.g., Azure AD, Okta, PingFederate) can be connected via **SAML 2.0** or **OIDC**.

**High-level flow:**

```
User → Adobe Login Page
         │
         ▼  (SAML / OIDC redirect)
Corporate IdP (Azure AD / Okta)
         │
         ▼  (assertion / id_token)
Adobe IMS → issues Adobe access token
         │
         ▼
AEM Author / Developer Console / App Builder
```

### 5.2 Configuring Federated SSO in Adobe Admin Console

1. Log in to [Adobe Admin Console](https://adminconsole.adobe.com) as **System Administrator**.
2. Navigate to **Settings → Identity → Add Directory**.
3. Choose **Federated ID** (SAML 2.0 or OIDC).
4. Download the Adobe SP metadata (for SAML) and upload it to your IdP.
5. Enter the IdP metadata URL or upload the XML.
6. Map IdP attributes to Adobe attributes:

   | IdP Attribute | Adobe Attribute | Notes |
   |---|---|---|
   | `email` | `email` | Required |
   | `firstName` | `first_name` | |
   | `lastName` | `last_name` | |
   | `groups` | `user_groups` | Used for dynamic group membership |

7. Enable **Auto-Account Creation** if you want new IdP users to be automatically provisioned in Adobe IMS.
8. Click **Test** to validate the SAML assertion before saving.

### 5.3 IMS Authentication in App Builder Actions

The `rewards-provider` and `webhook` actions require a valid Adobe IMS bearer token (`require-adobe-auth: true` in `app.config.yaml`).

The token is obtained by client-side code using the IMS client ID configured in each market's `site-config.json`:

```json
{
  "auth": {
    "clientId": "{IMS_CLIENT_ID}",
    "scope": "openid,AdobeID,read_organizations"
  }
}
```

**Token flow:**

1. The EDS page loads and calls the IMS `/ims/authorize` endpoint.
2. The user authenticates (or the SSO assertion is used silently).
3. The IMS access token is attached as `Authorization: Bearer <token>` to calls to `/rewards` and webhook endpoints.
4. App Builder validates the token via the Adobe IMS `require-adobe-auth` gate.

### 5.4 Service-to-Service Authentication (App Builder ↔ Upstream APIs)

For server-side calls that do not involve a logged-in user, use **OAuth Server-to-Server** credentials:

1. In Adobe Developer Console, go to your project → **Add API** → choose the API.
2. Select **OAuth Server-to-Server** as the credential type.
3. Download the generated credentials and store them as environment variables (never commit):
   ```bash
   # app-builder/.env
   AIO_IMS_CONTEXT_CONFIG=<base64-encoded JSON>
   ```
4. In action code, retrieve the token using the `@adobe/aio-lib-ims` library:
   ```js
   const { context, getToken } = require('@adobe/aio-lib-ims');
   const token = await getToken(context.getCurrent());
   ```

---

## 6. Users and Permissions

### 6.1 Adobe Admin Console — Roles Overview

All user and product profile management is done in [Adobe Admin Console](https://adminconsole.adobe.com).

| Role | Scope | Capabilities |
|---|---|---|
| **System Administrator** | Organisation | Manage identity, add/remove admins |
| **Product Administrator** | AEM / Analytics / Target / etc. | Manage product profiles and users |
| **Developer** | Adobe I/O / App Builder | Create integrations, deploy actions |
| **User** | Product | Access assigned product profiles |

### 6.2 AEM Cloud Service User Roles

Within AEM Author (Cloud Manager → Environments → Manage Users):

| AEM Group | Typical Membership | Permissions |
|---|---|---|
| `administrators` | Platform engineers | Full system access |
| `content-authors` | Copywriters, editors | Create / edit / delete content |
| `dam-users` | Asset managers | Upload and manage DAM assets |
| `workflow-users` | Content reviewers | Participate in approval workflows |
| `replication-agents` | Service accounts | Trigger publish / unpublish |

**Add users via Admin Console:**

1. Admin Console → **Products → AEM as a Cloud Service → \<program\> → \<environment\>**.
2. Click **Add User** and enter the IMS email.
3. Assign the appropriate product profile.

### 6.3 Cloud Manager Roles

Manage in Admin Console → **Products → Cloud Manager**:

| Cloud Manager Role | Permissions |
|---|---|
| **Business Owner** | Create programs, full billing access |
| **Program Manager** | Manage environments and SLAs |
| **Deployment Manager** | Create and run pipelines |
| **Developer** | Access Git, view logs |

### 6.4 Adobe Developer Console — App Builder Permissions

Developers who need to deploy or debug App Builder actions must be granted **Developer** role on the Adobe Developer Console project:

1. Open [developer.adobe.com/console](https://developer.adobe.com/console) → select the `Starbucks AEM` project.
2. Go to **Project overview → Collaborators → Add collaborator**.
3. Enter the developer's IMS email and select role **Developer**.

### 6.5 GitHub Repository Permissions

Follow the principle of least privilege for repository access:

| Team | GitHub Role | Justification |
|---|---|---|
| Platform Engineers | `Admin` | Manage secrets, branch protection, webhooks |
| Senior Developers | `Maintain` | Merge PRs, manage releases |
| Developers | `Write` | Push to feature branches, open PRs |
| QA / Stakeholders | `Read` | View code and Actions logs |

Set branch protection rules for `main` (Settings → Branches → Branch protection rules):

- [x] Require a pull request before merging
- [x] Require status checks to pass (lint, build-components)
- [x] Require branches to be up to date before merging
- [x] Restrict who can push to matching branches: `Platform Engineers` team

---

## 7. Cloud Service Security

### 7.1 Network Security

**AEMaaCS:**
- All ingress traffic flows through the **Adobe CDN / WAF** layer. Direct access to the Author/Publish pods is blocked.
- Enable **Advanced Networking** in Cloud Manager to restrict egress IPs and use a dedicated IP for upstream API calls (e.g., the Starbucks product API).
- Configure an **IP allowlist** for the AEM Author tier:  
  Cloud Manager → Environments → \<Env\> → IP Allow Lists → Add.

**App Builder (Adobe I/O Runtime):**
- Actions run inside Adobe's managed serverless infrastructure (Apache OpenWhisk).
- Actions annotated `require-adobe-auth: true` reject requests without a valid IMS token.
- The `final: true` annotation prevents overriding action parameters at call time, protecting against parameter injection.

### 7.2 Secrets Management

Never commit secrets to source control. Use the following patterns:

| Secret Type | Storage | Access Pattern |
|---|---|---|
| IMS credentials | GitHub Actions secret → env var | CI/CD pipeline only |
| EDS token | GitHub Actions secret → env var | CI/CD pipeline only |
| App Builder env vars | `.env` file (git-ignored) | Local dev only |
| OSGi config secrets | Cloud Manager environment variables | AEMaaCS OSGi containers |

**Cloud Manager environment variables** (OSGi runtime secrets):

1. Cloud Manager → Environments → \<Env\> → **Environment Variables**.
2. Add a variable with **Type: Secret** (masked in UI and logs).
3. Reference in OSGi config:
   ```xml
   <sling:OsgiConfig
     jcr:primaryType="sling:OsgiConfig"
     my.secret.key="$[secret:MY_SECRET_KEY]" />
   ```

### 7.3 Content Security Policy (CSP)

Configure CSP headers in the Dispatcher virtualhost to protect EDS pages:

```apache
# dispatcher/src/conf.d/available_vhosts/sbux-us.vhost
Header always set Content-Security-Policy \
  "default-src 'self'; \
   script-src 'self' 'unsafe-inline' https://assets.adobedtm.com https://cdn.experienceleague.adobe.com; \
   connect-src 'self' https://*.adobedc.net https://*.omtrdc.net https://clientconfig.passport.yammer.com; \
   img-src 'self' data: https://*.aem.live; \
   frame-ancestors 'self' https://experience.adobe.com;"
```

> Allow `https://assets.adobedtm.com` for Adobe Launch (see [Section 8](#8-adobe-launch-with-analytics-and-adobe-target)).

### 7.4 CORS

App Builder actions automatically serve CORS headers for `web: 'yes'` actions. To restrict to known EDS origins, add an `X-Permitted-Cross-Domain-Policies` input or use a custom `OPTIONS` handler:

```js
// actions/shared/cors-headers.js
const ALLOWED_ORIGINS = [
  'https://main--sbux-us--org.aem.live',
  'https://main--sbux-uk--org.aem.live',
  'https://main--sbux-jp--org.aem.live',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  };
}

module.exports = { corsHeaders };
```

### 7.5 Transport Layer Security (TLS)

- All endpoints exposed by AEMaaCS, App Builder, and the EDS CDN are HTTPS-only.
- Minimum TLS version: **1.2**. TLS 1.0 and 1.1 are disabled by the Adobe platform.
- Ensure custom domains use certificates with a minimum of **2048-bit RSA** or **P-256 ECDSA** keys.

### 7.6 Audit Logging

| Service | Log Location | Retention |
|---|---|---|
| AEM Author | Cloud Manager → Environments → Logs (`error.log`, `access.log`) | 7 days (download for long-term) |
| App Builder actions | `aio app logs` / Adobe I/O Runtime console | 7 days |
| Cloud Manager pipeline | Cloud Manager → Activity | 1 year |
| Adobe Admin Console | Admin Console → Logs → Audit Log | 30 days |

---

## 8. Adobe Launch with Analytics and Adobe Target

[Adobe Experience Platform (AEP) Tags](https://experienceleague.adobe.com/docs/experience-platform/tags/home.html) — formerly known as **Adobe Launch** — is the tag management solution used to deploy Analytics and Target on EDS pages.

### 8.1 Architecture Overview

```
EDS Page (aem.live)
    │
    │  <script> embed code from Adobe Launch
    ▼
AEP Tags (Launch) runtime (assets.adobedtm.com)
    ├─ Adobe Analytics extension  →  data collection  →  Adobe Analytics (AA)
    └─ Adobe Target extension     →  personalisation  →  Adobe Target (AT)
```

### 8.2 Create a Launch Property

1. Log in to [experience.adobe.com](https://experience.adobe.com) → **Data Collection**.
2. Click **New Property**.
3. **Name:** `Starbucks EDS — <Market>` (create one property per market for market-specific configurations, or a single property with rule conditions for each market).
4. **Platform:** Web.
5. **Domains:** add all EDS live domains:
   - `main--sbux-us--org.aem.live`
   - `main--sbux-uk--org.aem.live`
   - `main--sbux-jp--org.aem.live`
6. Enable **Sequence Loading** (recommended for performance).

### 8.3 Install the Adobe Analytics Extension

1. In the Launch property, go to **Extensions → Catalog**.
2. Install **Adobe Analytics**.
3. Configure the extension:

   | Setting | Value |
   |---|---|
   | Report Suites (Production) | `sbux-us-prod`, `sbux-uk-prod`, `sbux-jp-prod` |
   | Report Suites (Staging) | `sbux-us-dev` |
   | Tracking Server | `sbux.sc.omtrdc.net` |
   | Use Visitor ID Service | Enabled (ECID) |
   | Character Set | `UTF-8` |

4. Map the **Page Name** variable (`s.pageName`) using a Data Element:
   - Data Element name: `Page Name`
   - Type: **JavaScript Variable** → `window.location.pathname`

### 8.4 Install the Adobe Target Extension

1. In the Launch property, go to **Extensions → Catalog**.
2. Install **Adobe Target v2** (AT.js 2.x).
3. Configure the extension:

   | Setting | Value |
   |---|---|
   | Client Code | `starbucks` (your Target client code) |
   | Organisation ID | Your IMS Org ID |
   | Server Domain | `starbucks.tt.omtrdc.net` |
   | Timeout | `3000` ms |
   | Enable Global Mbox | Enabled |
   | Global Mbox Name | `target-global-mbox` |
   | Enable Device Decisioning | Optional — enabled for on-device A/B tests |

4. Add a **Load Target** action in the **Page Bottom** rule (or use **Library Loaded** for Above-The-Fold personalisation).

### 8.5 Define Data Elements

Data Elements are reusable pieces of data pulled from the page:

| Data Element | Type | Value |
|---|---|---|
| `Page Name` | JavaScript Variable | `window.location.pathname` |
| `Market` | JavaScript Variable | `window.siteConfig.market` |
| `User Authenticated` | JavaScript Variable | `!!window.__IMS_TOKEN` |
| `Product ID` | CSS Selector | `[data-product-id]` → attribute value |
| `Content Group` | Custom Code | derives group from URL path |

### 8.6 Define Rules

**Rule: All Pages — Send Analytics Beacon**

- **Event:** Library Loaded (Page Top)
- **Actions:**
  1. Core → Custom Code: set `s.pageName`, `s.channel`, `s.prop1` (market).
  2. Adobe Analytics → Set Variables (map data elements to Analytics variables).
  3. Adobe Analytics → Send Beacon (`s.t()`).

**Rule: Product Detail View**

- **Event:** DOM Ready
- **Condition:** URL Path contains `/menu` or `/product`
- **Actions:**
  1. Core → Custom Code: set `s.events = 'prodView'`, `s.products`.
  2. Adobe Analytics → Send Beacon.

**Rule: Rewards Page — Authenticated View**

- **Event:** Custom Event `rewards:loaded` (dispatched by `rewards-provider` block)
- **Condition:** Data Element `User Authenticated` equals `true`
- **Actions:**
  1. Adobe Analytics → Set Variables (`eVar5 = 'authenticated'`).
  2. Adobe Analytics → Send Beacon.

**Rule: Target — Fire Global Mbox on Every Page**

- **Event:** DOM Ready
- **Actions:**
  1. Adobe Target v2 → Load Target.
  2. Adobe Target v2 → Fire Global Mbox.

### 8.7 Environments and Embed Codes

Launch uses separate **environments** (Development, Staging, Production) with individual embed codes.  
Add the embed codes to the EDS `scripts/aem.js` or a dedicated `scripts/launch.js` loaded by all pages:

```js
// scripts/launch.js — example for Production
(function (src) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}('https://assets.adobedtm.com/<org>/<property>/launch-<hash>.min.js'));
```

> Use the **Development** embed code on feature branches and the **Production** embed code on `main`.

**Environment detection helper:**

```js
// scripts/launch.js
const isDev = window.location.hostname.includes('.aem.page')
  || window.location.hostname === 'localhost';

const launchSrc = isDev
  ? 'https://assets.adobedtm.com/<org>/<property>/launch-<dev-hash>.js'
  : 'https://assets.adobedtm.com/<org>/<property>/launch-<prod-hash>.min.js';
```

### 8.8 Publish the Launch Library

After saving rules and data elements:

1. Go to **Publishing Flow → Development**.
2. Click **Add All Changed Resources** and **Save & Build for Development**.
3. Test on an EDS Development preview URL (`*.aem.page`).
4. Promote to **Staging** → test on Stage.
5. Promote to **Production** → click **Approve for Publishing** → **Build & Publish to Production**.

### 8.9 Validate with Adobe Experience Cloud Debugger

Install the [Adobe Experience Cloud Debugger](https://chrome.google.com/webstore/detail/adobe-experience-platform/bfnnokhpnncpkdmbokanobigaccjkpob) Chrome extension.

On an EDS page:

1. Open the debugger panel.
2. Under **Analytics** — verify the report suite, `pageName`, and that a beacon fires on each page view.
3. Under **Target** — verify the global mbox request and that the correct activity is returned.
4. Under **Launch** — verify the correct property and environment are loaded.

### 8.10 Market-Specific Considerations

| Market | Analytics Report Suite | Target Workspace | Launch Property Notes |
|---|---|---|---|
| US (`en-US`) | `sbux-us-prod` | `Starbucks US` | Default currency USD |
| UK (`en-GB`) | `sbux-uk-prod` | `Starbucks UK` | Currency GBP; cookie consent banner required (UK PECR) |
| JP (`ja-JP`) | `sbux-jp-prod` | `Starbucks JP` | Double-byte character set; locale-aware `pageName` |

For GDPR / PECR compliance:
- Implement a **Consent Management Platform (CMP)** (e.g., OneTrust) and use the **Adobe Consent Extension** in Launch.
- Gate Analytics and Target beacon fires behind user consent:
  ```js
  // In a Launch rule condition:
  // Custom Code: return window.__adobePrivacy?.hasOptedInToAll() === true
  ```
