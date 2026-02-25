# Client Partner

## Role Overview

The Client Partner is the primary relationship owner between the delivery organisation and the Quick Service Restaurant stakeholders. They act as a trusted advisor, ensuring the AEM Edge Delivery Services (EDS) and Adobe App Builder programme delivers measurable business value across all three markets (US, UK, JP).

---

## Responsibilities

| Area | Description |
|---|---|
| **Executive Alignment** | Maintain executive-level relationships with Quick Service Restaurant; present programme status, risks and outcomes |
| **Commercial Management** | Own the statement of work, change-order process and financial health of the engagement |
| **Strategic Guidance** | Translate Quick Service Restaurant business objectives (digital experience, loyalty, localisation) into programme priorities |
| **Risk & Escalation** | Identify and escalate risks that could affect scope, budget or timelines; drive resolution with senior stakeholders |
| **Value Realisation** | Measure and communicate business value delivered — performance scores, time-to-publish, conversion uplift |
| **Partner Ecosystem** | Coordinate with Adobe account teams, technology partners and third-party vendors as required |

---

## Interaction With This Project

```
Quick Service Restaurant Stakeholders
        │
        ▼
   Client Partner ──────────────────────► Programme Status
        │                                  (KPIs, budget, roadmap)
        ├──► AEM Technical Architect       (solution scope)
        ├──► Project Manager               (schedule & delivery)
        └──► AEM Consultant (Functional)   (feature backlog)
```

The Client Partner does not make day-to-day technical decisions but must understand the high-level architecture:

- **AEM EDS** delivers ultra-fast, Git-backed content to three markets via `admin.hlx.page`.
- **Adobe App Builder** (Adobe I/O Runtime) provides serverless BYOM actions that power menu, store-locator and rewards overlays.
- **Adobe IMS** protects the rewards catalogue behind authentication.

---

## Key Artefacts

| Artefact | Location | Purpose |
|---|---|---|
| Repository README | [`README.md`](../README.md) | Architecture and deployment overview |
| Market configuration | `apps/eds-<market>/config/site-config.json` | Overlay routes per market |
| CI/CD pipeline | `.github/workflows/deploy.yml` | Automated deployment across all markets |

---

## Success Metrics

- **Core Web Vitals** — LCP < 2.5 s, CLS < 0.1, FID < 100 ms across all markets
- **Time-to-publish** — content live within 5 minutes of AEM Author publish event (via webhook → EDS cache purge)
- **Availability** — App Builder actions ≥ 99.9 % uptime
- **Loyalty engagement** — rewards page conversion tracked via Analytics

---

## Onboarding Checklist

- [ ] Access to the GitHub repository (`pushparajanramar/aem-eds-appbuilder`)
- [ ] Invited to Adobe Developer Console project (read access)
- [ ] Quick Service Restaurant stakeholder introductions completed
- [ ] Programme charter and statement of work signed
- [ ] Recurring executive steering committee cadence established
