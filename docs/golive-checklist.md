# Go-Live Checklist

This checklist must be completed and signed off by all four disciplines before any market is promoted to production.  
Work through each section in parallel; the **final sign-off gate** at the bottom requires all four leads to confirm readiness.

**Markets:** US (`qsr-us`) · UK (`qsr-uk`) · JP (`qsr-jp`)  
**Environments:** Development → Stage → Production

---

## Table of Contents

1. [Development](#1-development)
2. [QA](#2-qa)
3. [Sysadmin](#3-sysadmin)
4. [Business](#4-business)
5. [Final Go-Live Sign-Off](#5-final-go-live-sign-off)

---

## 1. Development

### 1.1 Code Quality

- [ ] All feature branches merged to `main`; no open draft pull requests targeting this release
- [ ] Branch protection rules enforced on `main` (see [GitHub Permissions](aem-configuration-guide.md#65-github-repository-permissions))
- [ ] ESLint passes with zero errors: `cd app-builder && npm run lint`
- [ ] Svelte component lint passes with zero errors: `cd packages/eds-components && npm run lint`
- [ ] `svelte-check` type-check passes: `npm run check`
- [ ] No `TODO` / `FIXME` comments remaining in production code paths
- [ ] All secrets removed from source code; `.env` files confirmed in `.gitignore`

### 1.2 Build & Dependency Health

- [ ] App Builder dependencies install cleanly: `cd app-builder && npm ci`
- [ ] Svelte Web Components build succeeds: `cd packages/eds-components && npm run build`
- [ ] Built bundles (`dist/`) copied to all three market block directories (`apps/eds-us`, `apps/eds-uk`, `apps/eds-jp`)
- [ ] No high or critical npm audit vulnerabilities: `npm audit --audit-level=high` (both `app-builder/` and `packages/eds-components/`)
- [ ] `package-lock.json` committed and up to date for both packages

### 1.3 App Builder Actions

- [ ] All four actions deploy successfully to the **production** Adobe I/O workspace: `aio app deploy`
- [ ] Action URLs printed by `aio app deploy` updated in each market's `config/site-config.json`
- [ ] `menu-provider` returns valid EDS block markup for US, UK, and JP
- [ ] `store-provider` returns valid EDS block markup for US, UK, and JP
- [ ] `rewards-provider` returns valid EDS block markup and rejects requests without a valid IMS token
- [ ] `webhook` action processes `publish`, `unpublish`, and `delete` events correctly and triggers EDS cache purge
- [ ] `final: true` annotation confirmed on all actions (prevents parameter injection)
- [ ] `require-adobe-auth: true` confirmed on `rewards-provider` and `webhook` actions

### 1.4 EDS Sites

- [ ] All three market EDS sites respond correctly on `*.aem.live` (production) and `*.aem.page` (preview)
- [ ] `fstab.yaml` mount points verified for each market (Google Drive or SharePoint URL correct)
- [ ] AEM Bot (helix-bot) installed and has access to all three market repositories
- [ ] `site-config.json` overlay routes point to production App Builder action URLs for each market
- [ ] `component-definition.json`, `component-models.json`, and `component-filters.json` validated against Universal Editor schema

### 1.5 CI/CD Pipeline

- [ ] GitHub Actions path-based workflows complete successfully on `main` (`app-builder-deploy.yml`, `eds-deploy.yml`, `aem-backend-deploy.yml`)
- [ ] All required GitHub secrets are set: `AIO_IMS_CONTEXT_CONFIG`, `AIO_PROJECT_ID`, `AIO_WORKSPACE_ID`, `EDS_TOKEN`, `CM_PROGRAM_ID`, `CM_API_KEY`, `CM_ORG_ID`, `CM_TECHNICAL_ACCOUNT_ID`, `CM_IMS_TOKEN`, `CM_PIPELINE_ID`
- [ ] GitHub environment `production` configured with required reviewers and branch restriction (`main` only)
- [ ] Rollback procedure documented and tested (re-deploy previous App Builder workspace; revert `main` and force-publish previous EDS content)

---

## 2. QA

### 2.1 Functional Testing

- [ ] **Menu block** renders correctly for each market; items match the upstream product API response
- [ ] **Stores block** renders correctly; store locations match the upstream API for each market
- [ ] **Rewards block** renders for authenticated users and shows an appropriate message for unauthenticated users
- [ ] **Promotion banner** displays the correct market-specific offers
- [ ] All EDS blocks render without JavaScript errors in the browser console
- [ ] All internal and external links on every page return HTTP 200 (no broken links)
- [ ] Form submissions (if any) validated end-to-end in production environment

### 2.2 Cross-Browser & Device Testing

- [ ] Chrome (latest) — Desktop & Mobile
- [ ] Safari (latest) — Desktop & Mobile (iOS)
- [ ] Firefox (latest) — Desktop
- [ ] Edge (latest) — Desktop
- [ ] Minimum viewport tested: 375 px wide (iPhone SE)
- [ ] Maximum viewport tested: 1920 px wide

### 2.3 Internationalisation & Localisation

- [ ] US (`en-US`): all text in American English; currency displayed as USD
- [ ] UK (`en-GB`): all text in British English; currency displayed as GBP; date format DD/MM/YYYY
- [ ] JP (`ja-JP`): all text in Japanese; double-byte characters render without truncation; currency displayed as JPY
- [ ] No hard-coded locale strings found in shared components

### 2.4 Accessibility

- [ ] WCAG 2.1 Level AA compliance verified with automated tool (Lighthouse Accessibility audit ≥ 90)
- [ ] All images have descriptive `alt` text
- [ ] All interactive elements reachable by keyboard; focus order is logical
- [ ] Colour contrast ratio meets 4.5 : 1 (normal text) and 3 : 1 (large text)
- [ ] Screen-reader smoke test passed (VoiceOver on iOS; NVDA or JAWS on Windows)

### 2.5 Performance

- [ ] Lighthouse Performance score ≥ 85 for each market homepage (production URL)
- [ ] LCP (Largest Contentful Paint) < 2.5 s on simulated 4G mobile
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] INP (Interaction to Next Paint) < 200 ms
- [ ] No render-blocking scripts on critical path; Adobe Launch loaded asynchronously
- [ ] Svelte Web Component bundles ≤ 100 KB gzipped per market

### 2.6 Analytics & Personalisation

- [ ] Adobe Analytics beacon fires on every page view; `s.pageName` and market `s.prop1` populated correctly
- [ ] Analytics report suite receiving data: `qsr-us-prod`, `qsr-uk-prod`, `qsr-jp-prod`
- [ ] Product detail view event (`prodView`) fires when a menu item page is loaded
- [ ] Rewards authenticated view event fires when `rewards:loaded` event is dispatched
- [ ] Adobe Target global mbox fires on each page; at least one A/B activity validated
- [ ] Cookie consent banner present and functional for UK market (UK PECR compliance)
- [ ] Analytics and Target beacons suppressed when the user has not consented (UK)

### 2.7 Security Testing

- [ ] OWASP Top 10 checklist reviewed; no critical or high findings outstanding
- [ ] `rewards-provider` endpoint returns HTTP 401 when called without a valid IMS token
- [ ] No sensitive data (IMS tokens, API keys) exposed in page source or browser network tab
- [ ] Content Security Policy headers present and correct on all EDS responses (see [CSP config](aem-configuration-guide.md#73-content-security-policy-csp))
- [ ] CORS headers on App Builder actions restricted to known EDS origins
- [ ] No mixed-content (HTTP resources on HTTPS pages) warnings in browser console

### 2.8 UAT Sign-Off

- [ ] UAT test cases executed and results documented for US market
- [ ] UAT test cases executed and results documented for UK market
- [ ] UAT test cases executed and results documented for JP market
- [ ] All P1 and P2 defects resolved; outstanding P3/P4 defects accepted by Product Owner with a remediation plan
- [ ] Quick Service Restaurant content lead sign-off obtained for each market

---

## 3. Sysadmin

### 3.1 Infrastructure & Environments

- [ ] AEM Cloud Service environments (Dev, Stage, Production) provisioned in Cloud Manager
- [ ] Cloud Manager program configured: program name, solutions (Sites, Assets), SLA tier
- [ ] Production environment health check passing in Cloud Manager
- [ ] Advanced Networking configured: dedicated egress IP for upstream API calls
- [ ] IP allowlist configured for AEM Author tier

### 3.2 DNS & TLS

- [ ] Custom domain DNS CNAME records updated to point to the Cloud Manager CDN endpoint for each market
- [ ] TLS/SSL certificates uploaded or provisioned; expiry date ≥ 12 months from go-live
- [ ] Minimum TLS 1.2 enforced; TLS 1.0 / 1.1 disabled
- [ ] SSL certificate auto-renewal process confirmed
- [ ] HTTP → HTTPS redirect configured for all domains
- [ ] HSTS header (`Strict-Transport-Security`) enabled with `max-age ≥ 31536000`

### 3.3 CDN & Caching

- [ ] EDS CDN (`aem.live`) cache rules reviewed; TTLs set correctly (`/menu` 300 s, `/stores` 600 s, `/rewards` 120 s)
- [ ] Cache purge confirmed working for publish, unpublish, and delete events via the webhook action
- [ ] Dispatcher cache rules reviewed for AEMaaCS (if applicable); stale content flush confirmed
- [ ] Surrogate-Key / Cache-Tag invalidation tested

### 3.4 Secrets & Access Management

- [ ] All production secrets stored in GitHub Actions secrets or Cloud Manager environment variables — none in source code
- [ ] OAuth Server-to-Server credentials rotated prior to go-live; old credentials revoked
- [ ] `EDS_TOKEN` validity confirmed; rotation schedule documented
- [ ] Adobe I/O production workspace credentials (`AIO_IMS_CONTEXT_CONFIG`) updated in GitHub secrets
- [ ] Unused developer console integrations and tokens revoked
- [ ] Adobe Admin Console user list reviewed; no test or contractor accounts with production access

### 3.5 Monitoring & Alerting

- [ ] App Builder action error rate alert configured in Adobe I/O Runtime console (threshold: > 1% over 5 min)
- [ ] AEM Cloud Manager monitoring dashboards reviewed; baseline metrics captured
- [ ] Uptime monitoring configured for each market live URL (e.g., Pingdom, New Relic, or equivalent)
- [ ] On-call rotation and escalation path documented for go-live weekend
- [ ] Log aggregation confirmed: App Builder logs (`aio app logs`), AEM Author logs, Cloud Manager pipeline logs

### 3.6 Backup & Disaster Recovery

- [ ] AEM content repository backup schedule confirmed (AEMaaCS automated daily snapshots)
- [ ] App Builder action source code tagged with the release version in Git (`git tag vX.Y.Z`)
- [ ] Rollback runbook documented: steps to revert App Builder to previous workspace, revert EDS content, re-point DNS if needed
- [ ] RTO (Recovery Time Objective) and RPO (Recovery Point Objective) targets agreed with the business and documented
- [ ] Disaster recovery drill completed in Stage environment

### 3.7 Pipelines & Deployment Gates

- [ ] Cloud Manager full-stack pipeline quality gates passing: Code Coverage ≥ 50%, SonarQube Security/Reliability/Maintainability rating A
- [ ] Production pipeline set to **manual approval** gate before Production deployment
- [ ] GitHub Actions environment `production` protection rules active (required reviewer: team lead)
- [ ] No pipeline runs in failed state on `main` branch

---

## 4. Business

### 4.1 Stakeholder Sign-Off

- [ ] Executive sponsor confirmed go-live date and approved the release
- [ ] Quick Service Restaurant marketing lead reviewed and approved all content for each market
- [ ] Legal / compliance team reviewed content for regulatory requirements (GDPR, UK PECR, Japanese APPI)
- [ ] Brand team confirmed visual identity (colours, fonts, logo usage) matches brand guidelines for each market
- [ ] Product Owner signed off on final scope; out-of-scope items documented in backlog

### 4.2 Content Readiness

- [ ] All production content authored, reviewed, and published in AEM Author / Google Drive / SharePoint
- [ ] Menu items, store locations, and rewards data verified as accurate for each market
- [ ] SEO metadata (page title, meta description, canonical URL, hreflang tags) present on all pages
- [ ] Sitemap (`sitemap.json`) updated and submitted to Google Search Console for each market
- [ ] 301 redirects configured for any URLs changed from the previous site

### 4.3 Legal & Compliance

- [ ] Privacy Policy and Terms of Service pages live and linked in the footer for each market
- [ ] Cookie consent banner live and functional for UK market (UK PECR)
- [ ] GDPR data subject request process confirmed (right to access, erasure, portability)
- [ ] Japanese APPI compliance reviewed for the JP market (personal data handling disclosure)
- [ ] Accessibility statement page published and linked (required for public sector in the UK; best practice globally)

### 4.4 Marketing & Communications

- [ ] Go-live announcement email / social media assets prepared and scheduled
- [ ] Internal stakeholder communication sent (Quick Service Restaurant team, agency partners)
- [ ] Customer support team briefed on new site features and known limitations
- [ ] Hypercare support period confirmed (recommended: 2 weeks post go-live)
- [ ] Feedback and issue intake channel established for post-go-live observations

### 4.5 Analytics & Reporting Readiness

- [ ] Business KPIs agreed and mapped to Analytics events and conversions (e.g., menu page views, store locator uses, rewards enrolments)
- [ ] Adobe Analytics dashboards / Workspace projects set up for each market and shared with business stakeholders
- [ ] Adobe Target activity performance reporting configured; business owners know how to read results
- [ ] Baseline traffic and conversion metrics captured from the previous site for comparison

### 4.6 Training & Handover

- [ ] Content author training completed for each market's content team (AEM Author / Google Drive / SharePoint workflows)
- [ ] Author user accounts provisioned in AEM and Adobe Admin Console
- [ ] Content governance process documented (who can publish, approval workflow, emergency publish process)
- [ ] Run-and-operate (BAU) team identified; handover documentation provided
- [ ] Known limitations and workarounds documented and communicated to the BAU team

---

## 5. Final Go-Live Sign-Off

All four leads must confirm readiness before the production deployment is triggered.

| Discipline | Lead | Status | Date |
|---|---|---|---|
| **Development** | Tech Lead / Technical Architect | ☐ Approved | |
| **QA** | QA Lead | ☐ Approved | |
| **Sysadmin** | Platform / Infra Lead | ☐ Approved | |
| **Business** | Product Owner / Client Partner | ☐ Approved | |

### Go-Live Decision

- [ ] All checklist items above completed or formally accepted with a risk/mitigation note
- [ ] Rollback plan reviewed and agreed by all four leads
- [ ] Go-live communication sent to all stakeholders
- [ ] On-call rota active for the go-live window

> **Proceed to production deployment only when all four leads have approved.**  
> Trigger the production pipeline via **Cloud Manager → Pipelines → qsr-production-deploy → Run** or via **GitHub Actions → Deploy EDS Sites & App Builder → Run workflow** (`market: all`, branch: `main`).

---

*Document owner: Technical Architect · Last reviewed: see Git history*
