# Project Manager

## Role Overview

The Project Manager is responsible for planning, monitoring and controlling the delivery of the AEM EDS + App Builder programme. They ensure that work is completed on time, within budget and to the agreed scope across all three markets (US, UK, JP), coordinating across a multi-disciplinary team of Adobe consultants and Starbucks stakeholders.

---

## Responsibilities

| Area | Description |
|---|---|
| **Programme Planning** | Create and maintain the project schedule; track milestones for each market go-live |
| **Sprint Management** | Facilitate sprint planning, reviews and retrospectives in collaboration with the Functional Lead |
| **Risk & Issue Management** | Maintain the RAID log; escalate blockers to the Client Partner and Technical Architect |
| **Resource Management** | Track team capacity; coordinate leave, onboarding and ramp-up of new team members |
| **Reporting** | Produce weekly status reports for Starbucks stakeholders and internal leadership |
| **Budget Tracking** | Monitor actuals against forecast; flag variances to the Client Partner |
| **Dependency Management** | Track cross-team and external dependencies (Adobe product roadmap, third-party APIs) |
| **Change Control** | Assess and process change requests; update scope documentation and SOW as required |

---

## Delivery Cadence

| Ceremony | Frequency | Owner | Attendees |
|---|---|---|---|
| Stand-up | Daily | Functional Lead / PM | Full delivery team |
| Sprint Planning | Bi-weekly | PM + Functional Lead | Full delivery team |
| Sprint Review | Bi-weekly | PM | Delivery team + Starbucks |
| Retrospective | Bi-weekly | PM | Delivery team |
| Executive Steering | Monthly | Client Partner | Exec stakeholders + PM |
| Risk Review | Weekly | PM | Tech Architect + Functional Lead |

---

## Project Phases

### Phase 1 — Foundation

- Repository scaffolding and CI/CD pipeline established
- App Builder actions (menu, stores, rewards, webhook) deployed to Adobe I/O Runtime
- EDS site configurations verified for all three markets (US, UK, JP)

### Phase 2 — Market Rollout

- Content models and block library finalised
- UAT with Starbucks content teams per market
- Performance baseline (Core Web Vitals) captured
- Analytics tagging verified

### Phase 3 — Live & Optimise

- All markets live on `aem.live`
- Hypercare support period
- Performance optimisation backlog prioritised
- Handover to run-and-operate team

---

## Key Artefacts

| Artefact | Location | Purpose |
|---|---|---|
| Project schedule | Project management tool (Jira / ADO) | Sprint plan and milestone tracking |
| RAID log | Project management tool | Risks, assumptions, issues, dependencies |
| Status report | Shared drive / SharePoint | Weekly stakeholder update |
| Repository README | [`README.md`](../README.md) | Technical overview for onboarding |
| CI/CD pipeline | `.github/workflows/deploy.yml` | Automated deployment — tracks release readiness |

---

## Deployment & Release Gates

The PM must confirm the following before approving a market go-live:

- [ ] All sprint acceptance criteria met for the target market
- [ ] UAT sign-off obtained from Starbucks content lead
- [ ] Analytics tagging validated by Analytics Consultant
- [ ] Core Web Vitals targets met (LCP < 2.5 s, CLS < 0.1)
- [ ] App Builder actions passing health checks in production workspace
- [ ] Rollback plan documented and agreed

---

## Onboarding Checklist

- [ ] GitHub repository access (read)
- [ ] Project management tool access (Jira / ADO board)
- [ ] Shared drive / SharePoint access for project artefacts
- [ ] Starbucks stakeholder contact list obtained
- [ ] Adobe Developer Console project access (read) for deployment visibility
- [ ] GitHub Actions access to monitor CI/CD pipeline runs
