# Go-Live Checklist

This checklist must be completed in full and signed off by the Project Manager and Client Partner before any market goes live. Work through each section sequentially. Do not approve a go-live until all items are checked.

---

## Table of Contents

1. [Pre-Go-Live: Technical Readiness](#1-pre-go-live-technical-readiness)
2. [Pre-Go-Live: Content Readiness](#2-pre-go-live-content-readiness)
3. [Pre-Go-Live: Analytics Readiness](#3-pre-go-live-analytics-readiness)
4. [Pre-Go-Live: UAT Sign-off](#4-pre-go-live-uat-sign-off)
5. [Pre-Go-Live: Performance](#5-pre-go-live-performance)
6. [Pre-Go-Live: Security](#6-pre-go-live-security)
7. [Pre-Go-Live: Operations](#7-pre-go-live-operations)
8. [Go-Live Day](#8-go-live-day)
9. [Post-Go-Live](#9-post-go-live)
10. [Sign-off](#10-sign-off)

---

## 1. Pre-Go-Live: Technical Readiness

### 1.1 Repository & CI/CD

- [ ] All feature branches merged to `main`; no open PRs blocking release
- [ ] CI/CD pipeline (`deploy.yml`) passes on `main` with 0 failures: lint, build-components, deploy
- [ ] App Builder production workspace deployed (`aio app deploy` confirmed)
- [ ] App Builder action endpoints return HTTP 200 for all actions:
  - [ ] `menu-provider`
  - [ ] `store-provider`
  - [ ] `rewards-provider`
  - [ ] `webhook`
- [ ] GitHub secrets set for production:
  - [ ] `AIO_IMS_CONTEXT_CONFIG`
  - [ ] `AIO_PROJECT_ID`
  - [ ] `AIO_WORKSPACE_ID`
  - [ ] `EDS_TOKEN`

### 1.2 EDS Sites

- [ ] All three EDS sites accessible at production live hosts:
  - [ ] `main--sbux-us--org.aem.live` (US)
  - [ ] `main--sbux-uk--org.aem.live` (UK)
  - [ ] `main--sbux-jp--org.aem.live` (JP)
- [ ] EDS Admin API `publish` confirmed for all required page paths per market
- [ ] `fstab.yaml` confirmed and pointing to production content source
- [ ] AEM Bot installed and verified on all market EDS repositories
- [ ] Custom domain DNS configured and propagated (if applicable)
- [ ] TLS/SSL certificates valid on all custom domains

### 1.3 App Builder Overlay Routes

- [ ] `site-config.json` per market updated with production App Builder host URLs
- [ ] `/menu` overlay returns correct HTML markup in production
- [ ] `/stores` overlay returns correct HTML markup in production
- [ ] `/rewards` overlay returns correct HTML markup in production (with valid IMS token)
- [ ] Webhook action tested end-to-end: AEM Author publish → webhook fires → EDS cache purges

### 1.4 Environment Configuration

- [ ] Production App Builder workspace `final: true` annotations in place (prevent parameter injection)
- [ ] CORS headers restrict to known EDS origins (see `aem-configuration-guide.md` §7.4)
- [ ] Content Security Policy headers configured in Dispatcher (§7.3)
- [ ] TLS minimum version 1.2 enforced on all endpoints

---

## 2. Pre-Go-Live: Content Readiness

### 2.1 US Market

- [ ] All required pages published and accessible at `main--sbux-us--org.aem.live`
- [ ] `/menu/query-index.json` populated with ≥ 20 menu items
- [ ] `/stores/query-index.json` populated with ≥ 10 stores
- [ ] `/rewards/query-index.json` populated (if rewards page is in scope for US go-live)
- [ ] Sitemap (`sitemap.json`) up to date and accurate
- [ ] All images loading correctly from AEM delivery CDN
- [ ] No broken links detected (run automated link checker)
- [ ] 404 page configured and styled

### 2.2 UK Market

- [ ] All required pages published and accessible at `main--sbux-uk--org.aem.live`
- [ ] `/menu/query-index.json` populated (UK-specific menu items)
- [ ] `/stores/query-index.json` populated (UK stores)
- [ ] UK cookie consent banner present and functional (GDPR / PECR)
- [ ] Currency displayed as GBP (£) on all price fields
- [ ] No broken links detected

### 2.3 JP Market

- [ ] All required pages published and accessible at `main--sbux-jp--org.aem.live`
- [ ] `/menu/query-index.json` populated (JP-specific menu items in Japanese)
- [ ] `/stores/query-index.json` populated (JP stores)
- [ ] Japanese character rendering verified (headings, body copy, product names)
- [ ] `lang="ja"` set on `<html>` element
- [ ] Currency displayed as JPY (¥) with no decimal places
- [ ] JP consent banner present and functional (APPI)
- [ ] No broken links detected

---

## 3. Pre-Go-Live: Analytics Readiness

### 3.1 Adobe Analytics

- [ ] Production report suites receiving data: `sbux-us-prod`, `sbux-uk-prod`, `sbux-jp-prod`
- [ ] All `page_view` events firing on every page with correct `eVar1` (market) values
- [ ] `menu_click` events firing on menu item interactions
- [ ] `product_view` events firing on product detail pages
- [ ] `store_search` events firing on store searches
- [ ] `promotion_view` and `promotion_click` events firing on banner impressions/clicks
- [ ] Analytics Consultant sign-off on data validation report

### 3.2 Adobe Target

- [ ] Production Target workspace active: `Starbucks Global`, `Starbucks US`, `Starbucks UK`, `Starbucks JP`
- [ ] Global mbox firing on all pages with correct mbox parameters (`market`, `pageType`)
- [ ] No test activities active at go-live (clean baseline required)
- [ ] On-device decisioning configured for JP (if enabled)

### 3.3 Adobe Launch

- [ ] Production Launch library deployed to all three markets
- [ ] Correct production embed code in `scripts/launch.js` for each market
- [ ] Launch Debugger confirms correct property and environment on each market

### 3.4 Consent / Privacy

- [ ] UK: GDPR / PECR consent banner blocks AA and Target before opt-in ✓
- [ ] US: CCPA "Do Not Sell" link present in footer ✓
- [ ] JP: APPI consent banner present in Japanese ✓

---

## 4. Pre-Go-Live: UAT Sign-off

- [ ] UAT completed for US market — Starbucks Content Lead sign-off obtained
- [ ] UAT completed for UK market — Starbucks Content Lead sign-off obtained
- [ ] UAT completed for JP market — Starbucks Content Lead sign-off obtained
- [ ] All P1 and P2 UAT defects resolved
- [ ] All UAT defects logged in project management tool and triaged
- [ ] Regression test pass completed after final defect fixes

---

## 5. Pre-Go-Live: Performance

- [ ] Lighthouse audit run on home page, menu page and product detail page for all three markets
  - [ ] LCP < 2.5 s (all markets, all page types)
  - [ ] CLS < 0.1 (all markets, all page types)
  - [ ] FID < 100 ms (all markets)
  - [ ] Accessibility score ≥ 90
  - [ ] SEO score ≥ 90
- [ ] Core Web Vitals field data (CrUX) baseline captured
- [ ] App Builder action P95 response time < 500 ms under expected load

---

## 6. Pre-Go-Live: Security

- [ ] GitHub Dependabot: no high/critical dependency vulnerabilities open
- [ ] CodeQL: no high/critical code scanning alerts open
- [ ] No secrets committed to the repository (scan with `git-secrets` or equivalent)
- [ ] All App Builder actions using HTTPS-only endpoints
- [ ] `require-adobe-auth: true` set on `rewards-provider` and `webhook` actions
- [ ] `final: true` annotation set on all App Builder action parameters
- [ ] IP allowlists configured for AEM Author tier (Cloud Manager)

---

## 7. Pre-Go-Live: Operations

- [ ] Rollback procedure documented and shared with the team (see [Go-Live Runbook §5](go-live-runbook.md#5-rollback-procedure))
- [ ] On-call rota agreed for go-live day and hypercare period
- [ ] Monitoring and alerting configured:
  - [ ] App Builder action health-check endpoint monitored
  - [ ] EDS CDN error rate alert configured
  - [ ] Uptime monitoring for all three live EDS hosts
- [ ] Incident response process communicated to the team
- [ ] Starbucks IT contacts confirmed (for DNS cutover and infrastructure issues)

---

## 8. Go-Live Day

Complete these steps on go-live day. See [Go-Live Runbook §4](go-live-runbook.md#4-go-live-day-runbook) for detailed step-by-step instructions.

- [ ] Final production deployment triggered via CI/CD pipeline
- [ ] CI/CD pipeline passes (lint, build, deploy — all green)
- [ ] DNS cutover executed (if custom domain is being activated)
- [ ] TLS/SSL certificates validated on custom domain
- [ ] Smoke test performed: all critical page paths load correctly
- [ ] App Builder overlays verified: `/menu`, `/stores`, `/rewards`
- [ ] Analytics: page view beacons confirmed in AA real-time report
- [ ] Target: global mbox firing confirmed via Launch Debugger
- [ ] All team members notified: go-live confirmed ✓

---

## 9. Post-Go-Live

Complete these within 24–72 hours of go-live:

- [ ] Core Web Vitals monitored for the first 48 hours (CrUX, Lighthouse)
- [ ] Adobe Analytics report confirms data flowing correctly into production report suites
- [ ] App Builder action error rate < 0.1 % in production (check I/O Runtime console)
- [ ] Any P1 post-launch defects triaged and resolved within SLA
- [ ] Starbucks stakeholders notified with go-live confirmation and initial performance snapshot
- [ ] Retrospective scheduled within 5 business days of go-live

---

## 10. Sign-off

| Item | Verified by | Date |
|---|---|---|
| Technical readiness | AEM Technical Architect | |
| Content readiness | Starbucks Content Lead | |
| Analytics readiness | Analytics Consultant | |
| UAT sign-off | AEM Consultant (Functional) | |
| Performance sign-off | AEM Technical Architect | |
| Security sign-off | AEM Technical Architect | |
| Operations readiness | Project Manager | |

**Final go-live approval:**

- [ ] Starbucks Programme Lead: _______________________
- [ ] Client Partner: _______________________
- [ ] Project Manager: _______________________
- [ ] Date approved: _______________________
- [ ] Market(s) approved for go-live: ☐ US  ☐ UK  ☐ JP
