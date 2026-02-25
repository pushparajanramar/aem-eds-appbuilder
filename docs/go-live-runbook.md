# Go-Live Runbook

This runbook provides step-by-step instructions for cutting over and launching each market on AEM Edge Delivery Services. It covers the pre-launch preparation window, go-live day execution, post-launch monitoring and rollback procedures.

---

## Table of Contents

1. [Go-Live Overview](#1-go-live-overview)
2. [Pre-Launch Preparation (T-5 Days)](#2-pre-launch-preparation-t-5-days)
3. [Pre-Launch Preparation (T-1 Day)](#3-pre-launch-preparation-t-1-day)
4. [Go-Live Day Runbook](#4-go-live-day-runbook)
5. [Rollback Procedure](#5-rollback-procedure)
6. [Post-Launch Monitoring](#6-post-launch-monitoring)
7. [Hypercare Period](#7-hypercare-period)
8. [Launch Communication Plan](#8-launch-communication-plan)

---

## 1. Go-Live Overview

### 1.1 Go-Live Sequence

Markets are launched sequentially to reduce risk:

| Market | Target date | Go-live type | Dependencies |
|---|---|---|---|
| US | (as agreed) | Full launch | Go-live checklist signed off |
| UK | US + 1 week | Full launch | US stable for 5 days |
| JP | UK + 1 week | Full launch | UK stable for 5 days |

Each market go-live requires the [Go-Live Checklist](go-live-checklist.md) to be fully completed and signed off before the launch window opens.

### 1.2 Go-Live Window

| Parameter | Value |
|---|---|
| Preferred time | Low-traffic window (e.g., 06:00–08:00 local market time, Tuesday–Thursday) |
| Maximum window | 4 hours |
| War room | Microsoft Teams / Slack channel: `#qsr-golive-<market>` |
| Go/No-Go call | 30 minutes before launch window opens |

### 1.3 Team on Call

| Role | Person | Contact |
|---|---|---|
| Go-Live Lead | Project Manager | (phone / Teams) |
| Technical Lead | AEM Technical Architect | (phone / Teams) |
| Front-End Developer | AEM Consultant (Tech/Dev) | (Teams) |
| Analytics | Analytics Consultant | (Teams) |
| Quick Service Restaurant IT | (Quick Service Restaurant DNS / Infra contact) | (phone) |
| Quick Service Restaurant Programme Lead | (Name) | (phone) |

---

## 2. Pre-Launch Preparation (T-5 Days)

Complete these tasks in the week before go-live:

### 2.1 Final Content Review

- [ ] Quick Service Restaurant Content Lead reviews all published pages on the production EDS preview URL (`*.aem.page`).
- [ ] Any last-minute content corrections raised and resolved.
- [ ] Final content freeze agreed — no further authoring changes after T-2 days.

### 2.2 DNS Preparation

If a custom domain (e.g., `www.qsr.com/us`) is being activated:

1. Confirm the CNAME target with Adobe account team (EDS CDN CNAME value).
2. Schedule the DNS change with Quick Service Restaurant IT.
3. Agree the DNS TTL reduction schedule:
   - T-7 days: Reduce TTL to 300 seconds (5 min)
   - T-1 day: Confirm low TTL is in effect
   - Go-live: Execute CNAME change

### 2.3 Production Deployment Verification

- [ ] Run a full CI/CD pipeline deployment on `main` and confirm all stages pass.
- [ ] Verify all three App Builder action endpoints in production workspace respond correctly.
- [ ] Verify EDS sites at production live hosts (`*.aem.live`).

### 2.4 Rollback Preparation

- [ ] Confirm rollback procedure is understood by all team members (see [§5](#5-rollback-procedure)).
- [ ] Previous stable deployment artefact identified (Git commit SHA recorded).
- [ ] Quick Service Restaurant IT confirms they can revert DNS changes within 15 minutes if needed.

---

## 3. Pre-Launch Preparation (T-1 Day)

### 3.1 Final Go/No-Go Assessment

The Project Manager runs a final Go/No-Go assessment 24 hours before launch:

| Check | Status |
|---|---|
| [Go-Live Checklist](go-live-checklist.md) fully completed and signed off | ☐ GO / ☐ NO-GO |
| CI/CD pipeline green on `main` | ☐ GO / ☐ NO-GO |
| Production App Builder actions healthy | ☐ GO / ☐ NO-GO |
| Content freeze in effect | ☐ GO / ☐ NO-GO |
| DNS TTL reduced (if applicable) | ☐ GO / ☐ NO-GO |
| All team members available for go-live window | ☐ GO / ☐ NO-GO |
| Rollback procedure confirmed | ☐ GO / ☐ NO-GO |

If any item is NO-GO, escalate immediately to Client Partner and Quick Service Restaurant Programme Lead.

### 3.2 War Room Setup

- [ ] Teams / Slack channel `#qsr-golive-<market>` created with all team members.
- [ ] Screen-sharing session prepared for go-live day.
- [ ] Monitoring dashboards open and shared: EDS CDN metrics, App Builder I/O Runtime console, AA real-time report.

---

## 4. Go-Live Day Runbook

### Step 1: Go/No-Go Call (T-30 min)

1. Project Manager opens the war room call.
2. Each team lead confirms their area is GO.
3. Quick Service Restaurant Programme Lead provides formal go-ahead.
4. Project Manager announces: **"Go-live is authorised. Proceeding at [time]."**

### Step 2: Final Deployment (T-0)

1. Confirm no new commits have been merged to `main` since the last verified deployment.
2. If there are no new commits, the current production deployment is live. Proceed to Step 3.
3. If a final change is needed, merge it, wait for the CI/CD pipeline to complete (≈10 min), and verify.

```bash
# Verify the pipeline run status
# GitHub → Actions → Most recent workflow run on main
```

### Step 3: Publish All Content (T+5 min)

Trigger a bulk publish of all content for the target market:

```bash
# Replace <market> with us, uk, or jp
# Bulk publish all pages
curl -X POST \
  -H "Authorization: Bearer $EDS_TOKEN" \
  "https://admin.hlx.page/publish/org/qsr-<market>/main/*"

# Bulk index content fragments
curl -X POST \
  -H "Authorization: Bearer $EDS_TOKEN" \
  "https://admin.hlx.page/index/org/qsr-<market>/main/*"
```

Wait 2 minutes for publishing to complete, then verify the live site.

### Step 4: DNS Cutover (T+10 min — custom domain only)

If activating a custom domain:

1. Instruct Quick Service Restaurant IT to execute the DNS CNAME change.
2. Monitor DNS propagation: `dig +short <custom-domain>` (expect propagation within 5–15 min due to low TTL).
3. Verify TLS certificate is valid on the custom domain.
4. Test HTTPS access on the custom domain from multiple regions (use VPN or an online DNS checker).

### Step 5: Smoke Test (T+15 min)

Run the smoke test checklist for the target market:

| Page | URL | Check | Status |
|---|---|---|---|
| Home page | `https://main--qsr-<market>--org.aem.live/` | Loads with all blocks visible | ☐ |
| Menu page | `https://main--qsr-<market>--org.aem.live/menu` | Menu items render with images and prices | ☐ |
| Product detail | `https://main--qsr-<market>--org.aem.live/menu/<product>` | Product detail loads with customiser | ☐ |
| Store locator | `https://main--qsr-<market>--org.aem.live/stores` | Store list renders | ☐ |
| Rewards page | `https://main--qsr-<market>--org.aem.live/rewards` | Auth prompt appears; rewards load after login | ☐ |
| 404 page | `https://main--qsr-<market>--org.aem.live/nonexistent` | Custom 404 page displayed | ☐ |

### Step 6: Analytics Smoke Test (T+20 min)

With the Adobe Experience Platform Debugger active:

- [ ] AA page view beacon fires on home page
- [ ] Correct report suite: `qsr-<market>-prod`
- [ ] `eVar1` = correct market value
- [ ] Target global mbox fires on every page
- [ ] Consent gate active on UK and JP (no beacons before opt-in)

### Step 7: Go-Live Confirmation (T+30 min)

1. Project Manager confirms all smoke tests passed.
2. Announce in the war room: **"Market [US/UK/JP] is LIVE. Go-live confirmed at [time]."**
3. Notify stakeholders via email / Teams message (see [§8](#8-launch-communication-plan)).
4. Record the go-live timestamp and commit SHA in the RAID log / project management tool.

---

## 5. Rollback Procedure

In the event of a critical failure during or after go-live, execute the following rollback procedure.

### 5.1 When to Roll Back

| Condition | Action |
|---|---|
| CI/CD pipeline failure during go-live deployment | Do not proceed; fix or revert commit |
| Critical App Builder action failures (error rate > 5 %) | Immediately roll back App Builder workspace |
| DNS cutover failure (TLS error on custom domain) | Revert DNS to previous CNAME immediately |
| Critical content rendering failures (missing images, broken layout) | Unpublish affected pages; revert content; republish |

### 5.2 Rollback: App Builder

```bash
# 1. Identify the last known good commit
git log --oneline app-builder/

# 2. Redeploy the previous App Builder workspace snapshot
git checkout <last-known-good-sha> -- app-builder/
aio app deploy
```

Alternatively, use the Adobe I/O Runtime console to roll back the action version:

```bash
# List action versions
aio rt action get qsr/menu-provider --save

# Activate previous version
aio rt action update qsr/menu-provider --version <previous-version>
```

### 5.3 Rollback: EDS Content

```bash
# Unpublish all pages for the affected market
curl -X DELETE \
  -H "Authorization: Bearer $EDS_TOKEN" \
  "https://admin.hlx.page/publish/org/qsr-<market>/main/*"

# Re-publish from the previous stable state
# (revert the AEM Author content to the previous version, then republish)
```

### 5.4 Rollback: DNS (Custom Domain)

Instruct Quick Service Restaurant IT to revert the CNAME to the previous value. With a 5-minute TTL, propagation completes within 5–15 minutes.

### 5.5 Post-Rollback

1. Announce the rollback in the war room.
2. Conduct an immediate debrief (15 min): root cause, fix plan, estimated time to re-launch.
3. Notify Quick Service Restaurant Programme Lead and Client Partner.
4. Document the incident in the RAID log.
5. Reschedule the go-live once the fix is confirmed.

---

## 6. Post-Launch Monitoring

### 6.1 Monitoring Scope

| Metric | Tool | Alert threshold |
|---|---|---|
| EDS CDN error rate (5xx) | EDS CDN metrics / uptime monitor | > 0.1 % for 5 min |
| App Builder action error rate | Adobe I/O Runtime console | > 1 % for 5 min |
| App Builder action P95 latency | I/O Runtime console | > 2 s |
| AA data collection | AA real-time report | No data for 30 min |
| Uptime (all three live hosts) | Uptime monitoring tool | Any downtime |

### 6.2 First 48 Hours

Check the following every 4 hours for the first 48 hours post-launch:

- [ ] All EDS live hosts accessible and serving correct content
- [ ] App Builder action error rates within threshold
- [ ] AA real-time report shows traffic for the launched market
- [ ] No P1 incidents open

### 6.3 Performance Baseline (T+24 hours)

After 24 hours of live traffic, capture the initial CrUX performance baseline:

- Run PageSpeed Insights on home page, menu page and product detail page.
- Record LCP, CLS and FID values in the project management tool.
- Compare against pre-launch Lighthouse scores.

---

## 7. Hypercare Period

### 7.1 Duration

Hypercare runs for **2 weeks** after each market's go-live. During this period:

- The full delivery team remains available.
- P1 defects are resolved within 4 hours.
- P2 defects are resolved within 1 business day.
- Daily hypercare status update sent to Quick Service Restaurant stakeholders.

### 7.2 Defect Severity Definitions

| Severity | Definition | Response SLA |
|---|---|---|
| P1 — Critical | Site down; major feature completely broken; data loss | 4 hours to resolution |
| P2 — Major | Important feature impaired; analytics not collecting data | 1 business day |
| P3 — Minor | Visual defect; non-critical feature impaired | Next sprint |
| P4 — Enhancement | Nice-to-have improvement | Backlog |

### 7.3 Hypercare Handover

At the end of hypercare, the delivery team hands over to the run-and-operate team:

- [ ] Runbooks and architecture documentation reviewed and updated
- [ ] Open defects triaged and assigned
- [ ] Monitoring dashboards and alert configurations documented
- [ ] Operations team trained on deployment, content publishing and rollback procedures
- [ ] Adobe Support case raised (if required) for ongoing platform support

---

## 8. Launch Communication Plan

### 8.1 Internal Announcement (T+30 min post-launch)

**Channel:** Project Teams / Slack channel + email to all delivery team members

**Template:**

```
Subject: [LIVE] Quick Service Restaurant EDS <Market> — Go-Live Confirmed ✅

Market <US / UK / JP> is now LIVE on AEM Edge Delivery Services.

Live URL: https://main--qsr-<market>--org.aem.live
Go-live time: <time>
Deployment SHA: <git-sha>

All smoke tests passed. Analytics data collection confirmed.

We are now in Hypercare. P1 issues: respond within 4 hours.

Thanks to the whole team for a successful launch!
```

### 8.2 Quick Service Restaurant Stakeholder Announcement

**Channel:** Email to Quick Service Restaurant Programme Lead + Digital Marketing Lead + Content Lead

**Template:**

```
Subject: Quick Service Restaurant <Market> Website — Now Live on AEM Edge Delivery Services

Hi [Name],

The <US / UK / JP> market website is now live on AEM Edge Delivery Services.

Live URL: <production URL>
Performance (initial Lighthouse scores):
  - LCP: <value> s
  - CLS: <value>
  - Performance score: <value>

The team is monitoring the site closely over the next 48 hours. 
Please report any issues to <PM contact>.

Best regards,
<Client Partner / Project Manager>
```

### 8.3 Executive Steering Update

At the next Executive Steering meeting (within 1 week of go-live), the Client Partner presents:

- Go-live summary: markets live, dates, any incidents
- Initial performance metrics (CWV, uptime, AA data confirmation)
- Hypercare status and open issues
- Optimisation programme start date
