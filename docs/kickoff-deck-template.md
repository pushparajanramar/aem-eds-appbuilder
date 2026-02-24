# Kick-off Deck Template

This document is the canonical template for preparing and presenting the project kick-off deck at the start of the AEM EDS + App Builder engagement. The deck is presented to both the delivery team and Starbucks stakeholders to align on programme objectives, scope, team, timeline and ways of working.

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Deck Structure](#2-deck-structure)
3. [Slide-by-Slide Guide](#3-slide-by-slide-guide)
4. [Presenter Notes](#4-presenter-notes)
5. [Pre-Meeting Checklist](#5-pre-meeting-checklist)
6. [Post-Kick-off Actions](#6-post-kick-off-actions)

---

## 1. Purpose

The kick-off deck serves to:

- Introduce the delivery team to Starbucks stakeholders.
- Confirm the agreed scope, objectives and success metrics.
- Walk through the programme timeline and phase gates.
- Establish ways of working, communication cadences and tooling.
- Surface any open questions or risks before Discovery begins.

The deck should be prepared by the **Project Manager** and **Client Partner**, reviewed by the **AEM Technical Architect** for accuracy on technical content, and presented jointly at the kick-off meeting.

---

## 2. Deck Structure

The deck is organised into the following sections:

| Section | Slide count | Owner |
|---|---|---|
| Welcome & Introductions | 1–2 | Client Partner |
| Programme Objectives | 1–2 | Client Partner |
| Scope & Deliverables | 2–3 | Project Manager |
| Team Structure | 1–2 | Project Manager |
| Technology Overview | 2–3 | AEM Technical Architect |
| Programme Timeline | 1–2 | Project Manager |
| Ways of Working | 1–2 | Project Manager |
| Risks & Open Questions | 1 | Project Manager |
| Next Steps | 1 | Project Manager |

Total: **12–18 slides**

---

## 3. Slide-by-Slide Guide

### Section 1 — Welcome & Introductions

**Slide 1: Title Slide**

- Programme name: `Starbucks AEM EDS + App Builder — Multi-Market Programme`
- Date
- Client Partner name
- Adobe delivery team logo + Starbucks logo (if permitted)

**Slide 2: Introductions**

Table of team members with name, role and one-line responsibility:

| Name | Organisation | Role | Responsibility |
|---|---|---|---|
| (Name) | Adobe | Client Partner | Exec relationship, commercial |
| (Name) | Adobe | Project Manager | Delivery, schedule, risk |
| (Name) | Adobe | AEM Technical Architect | Solution design, code review |
| (Name) | Adobe | AEM Consultant (Functional) | Backlog, content strategy, UAT |
| (Name) | Adobe | AEM Consultant (Tech/Dev) | EDS blocks, App Builder actions |
| (Name) | Adobe | Analytics Consultant | Measurement, tagging |
| (Name) | Starbucks | Programme Lead | Business ownership, decisions |
| (Name) | Starbucks | Content Lead | Authoring, UAT |
| (Name) | Starbucks | Digital Marketing Lead | Analytics sign-off, optimisation |

---

### Section 2 — Programme Objectives

**Slide 3: Business Objectives**

Top 3–5 business objectives aligned to Starbucks' digital strategy:

1. Deliver ultra-fast, accessible web experiences across US, UK and JP markets.
2. Enable Starbucks content teams to author and publish pages without engineering support.
3. Power the menu, store-locator and rewards overlays through a composable, serverless back-end.
4. Integrate Adobe Analytics and Target to measure and optimise digital experiences.
5. Provide a repeatable delivery model that can extend to additional markets.

**Slide 4: Success Metrics**

| Metric | Target |
|---|---|
| Core Web Vitals: LCP | < 2.5 s |
| Core Web Vitals: CLS | < 0.1 |
| Time-to-publish (author → live) | < 5 minutes |
| App Builder action availability | ≥ 99.9 % |
| Rewards conversion lift (post-optimisation) | + 5 % (indicative) |

---

### Section 3 — Scope & Deliverables

**Slide 5: In-Scope Markets & Sites**

| Market | EDS Site | Live Host |
|---|---|---|
| United States | `eds-us` | `main--sbux-us--org.aem.live` |
| United Kingdom | `eds-uk` | `main--sbux-uk--org.aem.live` |
| Japan | `eds-jp` | `main--sbux-jp--org.aem.live` |

**Slide 6: In-Scope Deliverables**

- AEM EDS sites for all three markets (blocks, styles, scripts, sitemap)
- Adobe App Builder actions: `menu-provider`, `store-provider`, `rewards-provider`, `webhook`
- Shared Svelte web components: `sbux-menu-card`, `sbux-product-customizer`
- CI/CD pipeline (GitHub Actions): lint → build → deploy
- Analytics tagging (Adobe Analytics + Adobe Target via Launch) for all markets
- Content model definitions and Universal Editor instrumentation
- Documentation: runbooks, role guides, architecture decision records

**Slide 7: Out of Scope**

- Back-end product catalogue API (provided by Starbucks IT)
- Corporate identity provider (IdP) configuration
- Market-specific legal / compliance review (covered by Starbucks Legal)
- AEM Assets DAM migration

---

### Section 4 — Team Structure

**Slide 8: Engagement Model**

```
Starbucks Stakeholders
        │
        ▼
   Client Partner ──────────────────────► Programme Status
        │
        ├──► AEM Technical Architect    (solution design)
        ├──► Project Manager            (delivery)
        ├──► AEM Consultant (Functional)(backlog, UAT)
        ├──► AEM Consultant (Tech/Dev)  (implementation)
        └──► Analytics Consultant       (measurement)
```

**Slide 9: RACI Summary**

Reference the RACI table from [Blueprint Runbook §4.2](blueprint-runbook.md#42-raci-summary).

---

### Section 5 — Technology Overview

**Slide 10: Architecture Diagram**

Use the architecture diagram from [`README.md`](../README.md#architecture):

```
AEM Author
    │  (webhook on publish / unpublish / delete)
    ▼
Adobe App Builder (Adobe I/O Runtime)
    ├─ menu-provider
    ├─ store-provider
    ├─ rewards-provider (IMS-gated)
    └─ webhook → EDS Admin API cache purge
            │
            ▼
AEM Edge Delivery Services (aem.live)
    ├─ eds-us
    ├─ eds-uk
    └─ eds-jp
```

**Slide 11: Technology Choices**

| Capability | Technology |
|---|---|
| Content authoring | AEM Author (Universal Editor) |
| Web delivery | AEM Edge Delivery Services |
| Serverless back-end | Adobe App Builder (I/O Runtime) |
| Tag management | AEP Tags (Adobe Launch) |
| Analytics | Adobe Analytics |
| Personalisation | Adobe Target |
| CI/CD | GitHub Actions |

---

### Section 6 — Programme Timeline

**Slide 12: High-Level Timeline**

```
Week 1–2    Programme Kickoff + Discovery Start
Week 3–5    Discovery (content model, UX, analytics, optimisation)
Week 6–14   Implementation (sprints 1–4: blocks, actions, tagging)
Week 15     Go-Live preparation (UAT, go-live checklist)
Week 16     Go-Live: US market
Week 17     Go-Live: UK market
Week 18     Go-Live: JP market
Week 19+    Optimisation (audiences, A/B tests, iteration)
```

Include a Gantt chart if available in the project management tool.

**Phase gates** are described in [Blueprint Runbook §3.2](blueprint-runbook.md#32-phase-gates).

---

### Section 7 — Ways of Working

**Slide 13: Communication & Tooling**

| Channel | Tool | Frequency | Purpose |
|---|---|---|---|
| Day-to-day chat | Microsoft Teams / Slack | Ongoing | Informal communication |
| Stand-up | Microsoft Teams call | Daily | Team status |
| Sprint ceremonies | Microsoft Teams call | Bi-weekly | Planning, review, retro |
| Backlog management | Jira / Azure DevOps | Ongoing | Stories, bugs, tasks |
| Code & documentation | GitHub | Ongoing | Source of truth |
| Exec steering | Teams / in-person | Monthly | Status, risks, decisions |

**Slide 14: Definition of Done**

- Code passes ESLint (`npm run lint`) and `svelte-check`
- Unit tests pass (`npm test`)
- Feature deployed to Dev environment and verified
- Acceptance criteria reviewed and signed off by Functional Lead
- No high/critical security alerts in GitHub

---

### Section 8 — Risks & Open Questions

**Slide 15: Initial Risk Register**

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Starbucks product API unavailable during development | Medium | High | Use mock data fixtures for App Builder actions |
| IdP integration for IMS SSO delayed | Low | Medium | Use personal IMS accounts for initial UAT |
| JP market content model differences | Medium | Medium | Separate discovery session for JP authoring team |
| Adobe Target licence not provisioned | Low | High | Confirm licence with Adobe account team in Week 1 |

---

### Section 9 — Next Steps

**Slide 16: Immediate Actions**

| Action | Owner | Due |
|---|---|---|
| Share GitHub repository access with Starbucks team | PM | Day 1 |
| Schedule Discovery workshops (content, analytics, UX, optimisation) | PM | Week 1 |
| Confirm Adobe Developer Console project and licences | Tech Architect | Week 1 |
| Set up project management board and backlog | PM | Week 1 |
| Read the Discovery Runbook | All consultants | Before Discovery start |

---

## 4. Presenter Notes

- **Client Partner** opens the session, makes introductions, and presents Sections 1 and 2.
- **Project Manager** presents Sections 3, 6, 7 and 8.
- **AEM Technical Architect** presents Sections 4 and 5 (technology overview).
- Allow **15 minutes for Q&A** at the end of the deck.
- Record the session (with consent) and share the recording with attendees within 24 hours.
- Capture all open questions and actions in the RAID log.

---

## 5. Pre-Meeting Checklist

- [ ] Deck reviewed by Client Partner and Project Manager
- [ ] Technology slides reviewed by AEM Technical Architect
- [ ] Timeline confirmed with Adobe account team and Starbucks programme lead
- [ ] Meeting invite sent with deck attached (PDF) at least 48 hours in advance
- [ ] Dial-in / video call details confirmed
- [ ] Any NDAs or confidentiality agreements in place
- [ ] RAID log template prepared
- [ ] Project management board created

---

## 6. Post-Kick-off Actions

- [ ] Deck and recording shared with all attendees within 24 hours
- [ ] Open questions and actions added to RAID log
- [ ] Discovery Runbook distributed to all consultants
- [ ] Discovery workshop schedule agreed with Starbucks stakeholders
- [ ] Project management board populated with initial epics and stories
