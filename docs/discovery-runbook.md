# Discovery Runbook

This runbook guides the delivery team through the Discovery phase of the AEM EDS + App Builder programme. Discovery validates and deepens the understanding gathered during Kickoff, resulting in a signed-off set of requirements, content models, UX designs, analytics taxonomy and optimisation strategy before implementation begins.

---

## Table of Contents

1. [Discovery Overview](#1-discovery-overview)
2. [Discovery Workstreams](#2-discovery-workstreams)
3. [Content Architecture Discovery](#3-content-architecture-discovery)
4. [UX Solution Design](#4-ux-solution-design)
5. [Analytics Discovery](#5-analytics-discovery)
6. [Optimisation Discovery](#6-optimisation-discovery)
7. [Technical Discovery](#7-technical-discovery)
8. [Discovery Outputs](#8-discovery-outputs)
9. [Sign-off Process](#9-sign-off-process)

---

## 1. Discovery Overview

### 1.1 Purpose

Discovery produces the artefacts that Implementation relies upon:

- Content model definitions (`component-models.json`, `component-filters.json`, `component-definition.json`)
- Page templates and block inventory
- UX wireframes and design tokens
- Analytics measurement framework and tag taxonomy
- Optimisation baseline and test hypothesis backlog
- Technical architecture decisions (ADRs)

### 1.2 Duration

Discovery typically runs for **2–3 weeks** across parallel workstreams:

| Week | Workstream Activities |
|---|---|
| Week 1 | Stakeholder interviews; content inventory; UX kick-off; analytics discovery kick-off |
| Week 2 | Content model workshops; UX wireframes; analytics BRD; technical discovery sessions |
| Week 3 | Discovery output review; sign-off workshops; implementation backlog grooming |

### 1.3 Participants

| Workstream | Adobe Lead | Starbucks Stakeholders |
|---|---|---|
| Content Architecture | AEM Consultant (Functional) | Content Lead, Digital Marketing Lead |
| UX Solution Design | UX Consultant | Brand/UX team, Content Lead |
| Analytics | Analytics Consultant | Digital Analytics team, Digital Marketing Lead |
| Optimisation | Analytics Consultant + Functional Lead | Optimisation/CRO team |
| Technical | AEM Technical Architect | Starbucks IT, Digital Engineering |

---

## 2. Discovery Workstreams

### 2.1 Workstream Overview

```
Discovery Phase
├── Content Architecture Discovery  ──► AEM Sites Discovery Checklist
├── UX Solution Design               ──► UX Solution Design Runbook + XD designs
├── Analytics Discovery              ──► Analytics Discovery Template + AA BRD
├── Optimisation Discovery           ──► Optimisation Runbook Chapter 1
└── Technical Discovery              ──► ADRs + architecture diagrams
```

Each workstream runs **in parallel** and feeds a common Discovery output package that is signed off before Implementation starts.

---

## 3. Content Architecture Discovery

Reference document: [AEM Sites Discovery Checklist](aem-sites-discovery-checklist.md)

### 3.1 Goals

- Inventory all content types (pages, content fragments, assets) per market.
- Define the block library: which blocks are needed, their field schema and market variants.
- Agree taxonomy (menu categories, market identifiers).
- Confirm Universal Editor instrumentation requirements.

### 3.2 Activities

| Activity | Owner | Output |
|---|---|---|
| Content inventory workshop | AEM Consultant (Functional) + Starbucks Content Lead | Spreadsheet of page types and content types per market |
| Block definition workshop | AEM Consultant (Functional) + Tech/Dev | Draft `component-models.json` |
| Taxonomy agreement | Functional Lead + Starbucks | Approved taxonomy options in `component-models.json` |
| Sitemap definition | Functional Lead + Content Lead | `sitemap.json` per market |

### 3.3 Key Questions

- What page types are needed across all three markets (US, UK, JP)?
- Are there any market-specific blocks or field variations?
- What content is authored in AEM Author vs. document-based (Google Docs / SharePoint)?
- How will content fragments be structured and organised in the DAM?
- What query indexes are needed? (Refer to [`apps/eds-us/config/index-config.yaml`](../apps/eds-us/config/index-config.yaml))

---

## 4. UX Solution Design

Reference document: [UX Solution Design Runbook](ux-solution-design-runbook.md)

### 4.1 Goals

- Produce wireframes and high-fidelity designs for all page templates and blocks.
- Define global design tokens (colours, typography, spacing).
- Validate designs with Starbucks brand team.
- Prepare XD / Figma prototypes for UAT.

### 4.2 Activities

| Activity | Owner | Output |
|---|---|---|
| Brand alignment workshop | UX Consultant + Starbucks brand team | Design token definitions |
| Wireframe creation | UX Consultant | Low-fidelity wireframes for all page types |
| High-fidelity design | UX Consultant | XD / Figma designs per market |
| Responsive design review | UX Consultant + Tech/Dev | Annotated designs with breakpoints |
| Accessibility review | UX Consultant | WCAG 2.1 AA compliance notes |

---

## 5. Analytics Discovery

Reference document: [Analytics Discovery Template](analytics-discovery-template.md)

### 5.1 Goals

- Define the measurement framework: KPIs, events, dimensions.
- Map tracking points to EDS blocks and user journeys.
- Draft the Adobe Analytics Business Requirements Document (BRD).
- Confirm report suite configuration and Launch property structure.

### 5.2 Activities

| Activity | Owner | Output |
|---|---|---|
| KPI alignment workshop | Analytics Consultant + Digital Marketing Lead | Approved KPI list |
| Event taxonomy workshop | Analytics Consultant | Draft event taxonomy |
| Adobe Analytics BRD | Analytics Consultant | AA BRD document (per market) |
| Launch property planning | Analytics Consultant + Tech/Dev | Launch property and extension list |
| Consent / privacy requirements | Analytics Consultant + Starbucks Legal | Privacy requirements per market (GDPR, CCPA, APPI) |

---

## 6. Optimisation Discovery

Reference document: [Optimisation Runbook — Chapter 1](optimization-runbook.md#chapter-1-optimisation-discovery)

### 6.1 Goals

- Establish the optimisation baseline (current performance metrics, conversion rates).
- Identify priority optimisation opportunities.
- Agree the Adobe Target workspace and audience configuration.
- Draft the initial test hypothesis backlog.

### 6.2 Activities

| Activity | Owner | Output |
|---|---|---|
| Baseline data review | Analytics Consultant + Starbucks | Current CWV scores and conversion benchmarks |
| Opportunity identification | Analytics Consultant + Functional Lead | Ranked optimisation opportunities |
| Hypothesis workshop | Analytics + Starbucks CRO team | Initial test hypothesis backlog |
| Target workspace planning | Analytics Consultant | Adobe Target workspace and property plan |

---

## 7. Technical Discovery

### 7.1 Goals

- Validate the architecture against actual Starbucks API contracts.
- Confirm environment provisioning (Adobe Developer Console, Cloud Manager if applicable).
- Agree GitHub repository structure and branch protection rules.
- Document all ADRs arising from Discovery.

### 7.2 Activities

| Activity | Owner | Output |
|---|---|---|
| API contract review | AEM Technical Architect + Starbucks IT | Confirmed request/response schemas for App Builder actions |
| Environment provisioning | Tech Architect + Platform Engineers | Adobe Developer Console project, IMS credentials |
| GitHub setup | Tech Architect + Platform Engineers | Repository with CI/CD pipeline, branch protection |
| ADR documentation | Tech Architect | `docs/adr/` entries for all key decisions |
| Security review | Tech Architect | Secrets management plan; CORS / CSP configuration decisions |

### 7.3 Architecture Questions to Resolve

| Question | Resolved by |
|---|---|
| Will all three markets use the same App Builder workspace or separate? | AEM Technical Architect |
| What is the upstream product API authentication mechanism? | Starbucks IT |
| Is Adobe Target on-device decisioning required for JP (high-latency region)? | Analytics Consultant + Tech Architect |
| What is the CDN caching strategy for App Builder overlay responses? | Tech Architect |

---

## 8. Discovery Outputs

The following artefacts must be completed before sign-off:

| Artefact | Owner | Location |
|---|---|---|
| Block inventory and `component-models.json` | Functional Lead + Tech/Dev | `apps/eds-<market>/component-models.json` |
| `sitemap.json` per market | Functional Lead | `apps/eds-<market>/sitemap.json` |
| UX designs (XD / Figma) | UX Consultant | Shared design tool link |
| Design token specification | UX Consultant | `apps/eds-*/styles/` CSS custom properties |
| Analytics Discovery document | Analytics Consultant | Shared drive |
| Adobe Analytics BRD | Analytics Consultant | Shared drive |
| Optimisation baseline report | Analytics Consultant | Shared drive |
| Test hypothesis backlog | Analytics Consultant + Starbucks | Jira / ADO |
| Architecture Decision Records | Tech Architect | `docs/adr/` |
| Updated RAID log | Project Manager | Project management tool |
| Implementation backlog (epics and stories) | Project Manager + Functional Lead | Jira / ADO |

---

## 9. Sign-off Process

### 9.1 Discovery Sign-off Meeting

A formal Discovery sign-off meeting is held at the end of the Discovery phase, chaired by the **Client Partner** and **Project Manager**.

**Agenda:**

1. Review of all Discovery outputs (15 min)
2. Open questions and risks (10 min)
3. Confirmation of Implementation start date (5 min)
4. Formal sign-off by Starbucks programme lead (5 min)

### 9.2 Sign-off Checklist

- [ ] Block inventory reviewed and approved by Starbucks Content Lead
- [ ] UX designs reviewed and approved by Starbucks brand team
- [ ] Analytics BRD reviewed and approved by Starbucks Analytics team
- [ ] Test hypothesis backlog reviewed and prioritised
- [ ] All ADRs documented and approved by Tech Architect
- [ ] Implementation backlog groomed; first sprint stories estimated
- [ ] Phase gate signed off: Starbucks Programme Lead + Client Partner
