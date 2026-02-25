# Digital Foundation Blueprint Runbook

This runbook describes the Digital Foundation Blueprint for the AEM Edge Delivery Services (EDS) + Adobe App Builder programme. It is the authoritative reference for the overall solution vision, guiding principles, platform standards and the engagement model applied across all three markets (US, UK, JP).

---

## Table of Contents

1. [Programme Vision](#1-programme-vision)
2. [Platform Standards](#2-platform-standards)
3. [Engagement Model](#3-engagement-model)
4. [Team Structure](#4-team-structure)
5. [Technology Stack](#5-technology-stack)
6. [Delivery Methodology](#6-delivery-methodology)
7. [Quality Standards](#7-quality-standards)
8. [Governance](#8-governance)

---

## 1. Programme Vision

The Digital Foundation Blueprint establishes the strategic intent and architectural direction for all AEM EDS + App Builder engagements.

### 1.1 Objectives

| Objective | Description |
|---|---|
| **Speed to market** | Deliver fully authored, production-ready pages within weeks using AEM EDS document-based or Universal Editor authoring |
| **Performance** | Achieve Core Web Vitals scores of LCP < 2.5 s, CLS < 0.1, FID < 100 ms on all markets |
| **Scalability** | Support multi-market rollout (US → UK → JP) using a shared App Builder backend and per-market EDS sites |
| **Maintainability** | All code and configuration in Git; CI/CD pipeline automates lint, build and deployment |
| **Personalisation** | Adobe Target and Adobe Analytics integrated via Adobe Launch for A/B testing and conversion optimisation |

### 1.2 Guiding Principles

1. **Edge-first delivery** — Static, cacheable HTML served directly from the CDN edge. Dynamic content loaded client-side or via BYOM App Builder overlays.
2. **Content as code** — All content models, taxonomy and site configuration are version-controlled in Git.
3. **Composable architecture** — EDS blocks, App Builder actions and Svelte web components are independently deployable.
4. **Security by default** — Secrets in GitHub Actions / `.env` only; IMS authentication for all sensitive actions; HTTPS everywhere.
5. **Incremental rollout** — Each market goes live independently; phased optimisation continues post-launch.

---

## 2. Platform Standards

### 2.1 Adobe Technology Choices

| Capability | Adobe Technology | Notes |
|---|---|---|
| Content authoring | AEM Author (Universal Editor) | Feeds EDS via publish webhook |
| Web delivery | AEM Edge Delivery Services | Git-backed, CDN-cached HTML |
| Serverless back-end | Adobe App Builder (I/O Runtime) | BYOM actions for menu, stores, rewards, webhook |
| Tag management | AEP Tags (Adobe Launch) | Analytics + Target on EDS pages |
| Analytics | Adobe Analytics | Per-market report suites |
| Personalisation | Adobe Target | A/B testing; audience-based experiences |
| Identity | Adobe IMS | SSO for Author, App Builder, Target auth |
| CI/CD | GitHub Actions | Lint → build → deploy pipeline |

### 2.2 Non-Adobe Dependencies

| Dependency | Purpose | Owner |
|---|---|---|
| GitHub (`pushparajanramar/aem-eds-appbuilder`) | Source of truth for all code and configuration | Platform Engineers |
| Node.js 18.x | Runtime for App Builder actions and front-end build tools | All developers |
| Vite | Svelte web-component bundler | Front-End developers |

---

## 3. Engagement Model

### 3.1 Project Phases

The full engagement follows five sequential (but overlapping) phases. Each phase has a designated runbook and set of reference documents:

| # | Phase | Activity | Reference Document |
|---|---|---|---|
| 01 | Kickoff | Read this Blueprint Runbook | [Blueprint Runbook](blueprint-runbook.md) |
| 02 | Kickoff | Create the Kickoff Deck | [Kick-off Deck Template](kickoff-deck-template.md) |
| 03 | Discovery | Follow the Discovery Runbook | [Discovery Runbook](discovery-runbook.md) |
| 04 | Discovery | Perform UX Solution Design | [UX Solution Design Runbook](ux-solution-design-runbook.md) |
| 05 | Discovery | Perform Content Architecture Discovery | [AEM Sites Discovery Checklist](aem-sites-discovery-checklist.md) |
| 06 | Discovery | Perform Analytics Discovery | [Analytics Discovery Template](analytics-discovery-template.md) |
| 07 | Discovery | Perform Optimisation Discovery | [Optimisation Runbook — Chapter 1](optimization-runbook.md#chapter-1-optimisation-discovery) |
| 08 | Implementation | Follow the Implementation Runbook | [Implementation Runbook](implementation-runbook.md) |
| 09 | Implementation | Configure AEM Code & Environment | [AEM Configuration Guide](aem-configuration-guide.md) |
| 10 | Implementation | AA / AT / Launch Automation | [Implementation Runbook §3.2.2](implementation-runbook.md#322-aa--at--launch-automation) |
| 11 | Implementation | Style the Templates / Components | [Front-End Styling Runbook](front-end-styling-runbook.md) |
| 12 | Implementation | Create site content | [Content Architecture Runbook](content-architecture-runbook.md) |
| 13 | Go-Live | Perform Go-Live Check | [Go-Live Checklist](go-live-checklist.md) |
| 14 | Go-Live | Cutover / Launch Site | [Go-Live Runbook](go-live-runbook.md) |
| 15 | Optimisation | Configure Audiences | [Optimisation Runbook — Chapter 3](optimization-runbook.md#chapter-3-audience-configuration) |
| 16 | Optimisation | Plan & Execute Tests | [Optimisation Runbook — Chapter 4](optimization-runbook.md#chapter-4-planning--executing-tests) |
| 17 | Optimisation | Optimise Tests | [Optimisation Runbook — Chapter 5](optimization-runbook.md#chapter-5-optimising-tests) |

### 3.2 Phase Gates

No phase begins until the previous phase gate is formally signed off by the relevant stakeholders:

| Gate | Prerequisite | Approver |
|---|---|---|
| Discovery start | Blueprint reviewed; kickoff deck presented | Client Partner |
| Implementation start | Discovery outputs signed off; content model approved | AEM Technical Architect |
| Go-Live | All implementation acceptance criteria met; UAT passed | Project Manager + Client Partner |
| Optimisation start | Site live and stable; baseline analytics collected | Analytics Consultant |

---

## 4. Team Structure

### 4.1 Core Team Roles

| Role | Document | Responsibility |
|---|---|---|
| Client Partner | [`client-partner.md`](client-partner.md) | Executive relationship, commercial, value realisation |
| Project Manager | [`project-manager.md`](project-manager.md) | Delivery planning, risk, reporting |
| AEM Technical Architect | [`aem-technical-architect.md`](aem-technical-architect.md) | Solution design, standards, code review |
| AEM Consultant (Functional) / Project Lead | [`aem-consultant-functional-project-lead.md`](aem-consultant-functional-project-lead.md) | Backlog, content strategy, UAT |
| AEM Consultant (Tech/Dev) / UX Consultant | [`aem-consultant-tech-dev-ux-consultant.md`](aem-consultant-tech-dev-ux-consultant.md) | EDS blocks, App Builder actions, Svelte WCs, UX design |
| Analytics Consultant | [`analytics-consultant.md`](analytics-consultant.md) | Measurement strategy, tagging, reporting |

### 4.2 RACI Summary

| Activity | CP | PM | TA | FL | TD/UX | AC |
|---|---|---|---|---|---|---|
| Blueprint review | I | I | A/R | R | R | I |
| Kickoff deck | I | R | I | A/R | I | I |
| Discovery workshops | I | I | A | R | R | R |
| Architecture design | I | I | A/R | I | R | I |
| Implementation | I | I | A | I | R | I |
| Analytics tagging | I | I | I | I | R | A/R |
| UAT | I | R | I | A/R | R | I |
| Go-live approval | A | R | R | R | R | R |
| Post-live optimisation | I | I | I | I | R | A/R |

> **R** = Responsible, **A** = Accountable, **C** = Consulted, **I** = Informed

---

## 5. Technology Stack

### 5.1 Repository Structure Overview

```
aem-eds-appbuilder/
├── app-builder/          # Adobe App Builder serverless actions
├── apps/
│   ├── eds-us/           # US market EDS site
│   ├── eds-uk/           # UK market EDS site
│   └── eds-jp/           # JP market EDS site
├── packages/
│   └── eds-components/   # Shared Svelte web components
└── docs/                 # All project runbooks and reference documents
```

See the main [`README.md`](../README.md) for detailed architecture diagrams and repository structure.

### 5.2 Market Configuration

| Market | Locale | Currency | EDS Host |
|---|---|---|---|
| `us` | `en-US` | USD | `main--qsr-us--org.aem.live` |
| `uk` | `en-GB` | GBP | `main--qsr-uk--org.aem.live` |
| `jp` | `ja-JP` | JPY | `main--qsr-jp--org.aem.live` |

---

## 6. Delivery Methodology

### 6.1 Agile Sprint Cadence

- **Sprint length:** 2 weeks
- **Ceremonies:** Stand-up (daily), Sprint Planning, Sprint Review, Retrospective (all bi-weekly)
- **Backlog tool:** Jira / Azure DevOps
- **Definition of Done:**
  - Code passes ESLint and `svelte-check`
  - Unit tests pass (`npm test` in `app-builder/`)
  - Feature deployed to Dev environment
  - Acceptance criteria reviewed by Functional Lead

### 6.2 Branching Strategy

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Production code | `*.aem.live` (production EDS) + App Builder production workspace |
| `feature/*` | Individual developer features | `*.aem.page` (preview EDS) |
| `release/*` | Release candidate testing | Staging environment |

---

## 7. Quality Standards

### 7.1 Performance Targets

| Metric | Target | Measurement tool |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5 s | Lighthouse / CrUX |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse / CrUX |
| FID (First Input Delay) | < 100 ms | CrUX |
| TTFB (Time to First Byte) | < 100 ms | EDS CDN metrics |

### 7.2 Accessibility

All blocks and web components must meet **WCAG 2.1 AA**. See [`aem-consultant-tech-dev-ux-consultant.md`](aem-consultant-tech-dev-ux-consultant.md#accessibility-standards) for implementation requirements.

### 7.3 Code Quality Gates

| Gate | Tool | Threshold |
|---|---|---|
| JavaScript linting | ESLint | 0 errors |
| Svelte type checking | svelte-check | 0 errors |
| Unit test coverage | Jest | ≥ 80 % line coverage |
| Security | GitHub Dependabot + CodeQL | No high/critical alerts |

---

## 8. Governance

### 8.1 Change Control

All scope, budget or timeline changes must follow the Change Control process:

1. Change request raised in the project management tool.
2. Impact assessed by the Technical Architect and Project Manager.
3. Approved by Client Partner and Quick Service Restaurant programme lead.
4. SOW / schedule updated and communicated to the team.

### 8.2 Architecture Decision Records

Significant technical decisions are documented as Architecture Decision Records (ADRs) in `docs/adr/` using the format `NNN-short-title.md`. ADRs are proposed by any team member and approved by the Technical Architect.

### 8.3 Escalation Path

```
Developer / Consultant
    │  (technical blocker)
    ▼
AEM Technical Architect
    │  (scope / commercial impact)
    ▼
Project Manager + Client Partner
    │  (executive decision required)
    ▼
Quick Service Restaurant Programme Lead
```
