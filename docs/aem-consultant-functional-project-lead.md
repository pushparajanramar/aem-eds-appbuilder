# AEM Consultant (Functional) / Project Lead

## Role Overview

The AEM Consultant (Functional) / Project Lead bridges business requirements and technical delivery. They own the product backlog, facilitate requirement workshops, govern content strategy and ensure that the authoring experience meets Starbucks content-team needs across all three markets (US, UK, JP).

---

## Responsibilities

| Area | Description |
|---|---|
| **Requirements & Backlog** | Gather, refine and prioritise user stories; maintain the sprint backlog in collaboration with the Project Manager |
| **Content Strategy** | Define page templates, content models and authoring conventions aligned to AEM EDS block-based authoring |
| **Universal Editor Governance** | Configure and validate Universal Editor (UE) instrumentation for each market's blocks |
| **Stakeholder Workshops** | Facilitate content-design sprints; align authors, designers and developers on block components |
| **Acceptance Testing** | Define acceptance criteria; lead UAT sessions with Starbucks content teams |
| **Project Lead Duties** | Day-to-day team coordination, stand-up facilitation, dependency tracking and sprint review preparation |

---

## Interaction With This Project

```
Product Backlog
      │
      ▼
AEM Consultant (Functional) / Project Lead
      ├──► AEM Technical Architect    (block & model design)
      ├──► AEM Consultant (Tech/Dev)  (implementation)
      ├──► UX Consultant              (design tokens, templates)
      └──► Analytics Consultant       (tagging requirements)
```

### Key Technical Areas

#### Content Modelling

Component definitions live in each market folder:

```
apps/eds-<market>/
├── component-definition.json   # component registry
├── component-filters.json      # authoring placement rules
└── component-models.json       # field definitions for UE
```

Changes to content models must be reviewed against all three market variants to ensure consistency.

#### Block Structure

EDS blocks follow a file-per-block convention:

```
apps/eds-us/blocks/
├── menu-item/
├── product-detail/
└── promotion-banner/
```

Each block maps to an App Builder action via `site-config.json` overlays. Functional changes to a block (new fields, changed display logic) require coordination with the Technical Architect.

#### Universal Editor

UE instrumentation script: `apps/eds-<market>/ue/instrumentation.js`

This script annotates DOM elements with `data-aue-*` attributes so that Universal Editor can identify editable regions. Functional consultants must verify that new blocks are correctly instrumented before UAT.

---

## Key Artefacts

| Artefact | Location | Purpose |
|---|---|---|
| Component models | `apps/eds-<market>/component-models.json` | Defines UE field schema per block |
| Component filters | `apps/eds-<market>/component-filters.json` | Controls where blocks can be placed |
| Sitemap | `apps/eds-<market>/sitemap.json` | Page inventory per market |
| UE instrumentation | `apps/eds-<market>/ue/instrumentation.js` | DOM annotations for Universal Editor |

---

## Onboarding Checklist

- [ ] Access to the GitHub repository (read/write)
- [ ] AEM Author instance credentials (all three markets)
- [ ] Universal Editor browser extension installed
- [ ] Local AEM EDS development proxy running (`aem up` in each market folder)
- [ ] Sprint board access (Jira / ADO) with backlog view
- [ ] Alignment with AEM Technical Architect on block naming conventions
