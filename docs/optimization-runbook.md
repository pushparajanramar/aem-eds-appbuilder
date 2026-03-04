# Optimisation Runbook

This runbook covers the full optimisation lifecycle for the AEM EDS + App Builder programme, from initial discovery through audience configuration, test execution and iterative improvement.

---

## Table of Contents

- [Chapter 1: Optimisation Discovery](#chapter-1-optimisation-discovery)
- [Chapter 2: Adobe Target Setup](#chapter-2-adobe-target-setup)
- [Chapter 3: Audience Configuration](#chapter-3-audience-configuration)
- [Chapter 4: Planning & Executing Tests](#chapter-4-planning--executing-tests)
- [Chapter 5: Optimising Tests](#chapter-5-optimising-tests)

---

## Chapter 1: Optimisation Discovery

This chapter guides the team through the Optimisation Discovery workstream conducted during the Discovery phase.

### 1.1 Purpose

The goal of Optimisation Discovery is to:

- Establish the current performance baseline.
- Identify the highest-value optimisation opportunities.
- Define the Adobe Target workspace and audience strategy.
- Build the initial test hypothesis backlog.

### 1.2 Participants

| Role | Responsibility |
|---|---|
| Analytics Consultant | Lead Optimisation Discovery; produce baseline report |
| AEM Consultant (Functional) | Map test hypotheses to content model and block capabilities |
| Quick Service Restaurant Digital Marketing Lead | Provide business context; prioritise opportunities |
| Quick Service Restaurant CRO / Optimisation team | Subject-matter experts on existing test results |

### 1.3 Baseline Data Collection

Before identifying opportunities, gather current performance data:

#### Core Web Vitals baseline

| Metric | US current | UK current | JP current | Target |
|---|---|---|---|---|
| LCP (P75) | ___ s | ___ s | ___ s | < 2.5 s |
| CLS | ___ | ___ | ___ | < 0.1 |
| FID / INP | ___ ms | ___ ms | ___ ms | < 100 ms |

Use [PageSpeed Insights](https://pagespeed.web.dev/) and Chrome User Experience Report (CrUX) to collect current values.

#### Conversion baseline

| KPI | US current | UK current | JP current |
|---|---|---|---|
| Menu item click rate | ___% | ___% | ___% |
| Rewards conversion rate | ___% | ___% | ___% |
| Store direction rate | ___% | ___% | ___% |
| Bounce rate | ___% | ___% | ___% |

### 1.4 Opportunity Identification

Run a structured opportunity identification session using the following framework:

| Opportunity | Page / component | Hypothesis | Potential lift | Effort | Priority |
|---|---|---|---|---|---|
| (Example) Larger CTA on menu | `menu-item` block | A more prominent "Customise" button will increase product detail page visits | +10 % CTR | Medium | High |
| (To be defined) | | | | | |

**Prioritisation scoring:**

- **Potential lift** (H/M/L) × **Confidence** (H/M/L) × **Ease** (H/M/L) → PIE score

### 1.5 Discovery Output

| Output | Owner | Location |
|---|---|---|
| Baseline performance report | Analytics Consultant | Shared drive |
| Opportunity backlog (prioritised) | Analytics Consultant + Quick Service Restaurant | Jira / ADO |
| Initial test hypothesis backlog | Analytics Consultant | Jira / ADO |
| Adobe Target workspace plan | Analytics Consultant | Adobe Target admin |

---

## Chapter 2: Adobe Target Setup

### 2.1 Workspace Structure

| Workspace | Markets | Purpose |
|---|---|---|
| `Quick Service Restaurant Global` | US, UK, JP | Shared audiences and global tests |
| `Quick Service Restaurant US` | US | US-specific tests |
| `Quick Service Restaurant UK` | UK | UK-specific tests |
| `Quick Service Restaurant JP` | JP | JP-specific tests |

### 2.2 Launch Integration

Adobe Target is integrated via the **Adobe Target v2** extension in Adobe Launch. See the [AEM Configuration Guide §8.4](aem-configuration-guide.md#84-install-the-adobe-target-extension) for the Target extension configuration.

#### Target Launch Rule

**Rule: Fire Global Mbox on Every Page**

- **Event:** DOM Ready
- **Actions:**
  1. Adobe Target v2 → Load Target
  2. Adobe Target v2 → Fire Global Mbox (passing `market`, `pageType`, `loyaltyTier` as mbox parameters)

```js
// Custom code in Load Target action
adobe.target.getOffers({
  request: {
    execute: {
      mboxes: [{
        index: 0,
        name: 'target-global-mbox',
        parameters: {
          market:      window.siteConfig?.market,
          pageType:    document.body.dataset.pageType,
          loyaltyTier: window.__USER_LOYALTY_TIER || 'none',
        },
      }],
    },
  },
});
```

### 2.3 On-Device Decisioning (Optional — JP)

For the JP market where network latency may affect Target response times, enable **on-device decisioning** in the Target extension:

1. Target extension settings → **Enable On-Device Decisioning**.
2. Download the rules artefact and cache it on the EDS edge (via the App Builder `menu-provider` action or a dedicated edge worker).
3. On-device decisions are evaluated locally with zero network round-trip.

---

## Chapter 3: Audience Configuration

This chapter covers the configuration of audiences in Adobe Target and Adobe Analytics for personalisation and A/B test segmentation.

### 3.1 Audience Types

| Audience type | Definition | Tool |
|---|---|---|
| Geo-based | Users in a specific country/region | Target → Audiences |
| Loyalty tier | Gold, Green, Star (from IMS/loyalty API) | Target → Audiences |
| Device type | Mobile, tablet, desktop | Target → Audiences |
| New vs. returning | First visit flag | AA segment + Target audience |
| Menu category affinity | Users who frequently view `drinks` vs. `food` | AA segment → Target audience via AAM / RTCDP |
| Authenticated users | Users with a valid IMS session | Target → Audiences (mbox parameter: `authState == 'authenticated'`) |

### 3.2 Creating Audiences in Adobe Target

1. Log in to [experience.adobe.com](https://experience.adobe.com) → Adobe Target → select the relevant workspace.
2. Go to **Audiences → Create Audience**.
3. Configure rules:

**Example: Authenticated Loyalty Users**

```
Rule set:
  mbox parameter: authState = 'authenticated'
  AND
  mbox parameter: loyaltyTier IN ['gold', 'green']
```

4. Save with a descriptive name: `Authenticated Loyalty Users — US`.

### 3.3 Market-Specific Audience Rules

| Market | Audience | Rule |
|---|---|---|
| US | US Visitors | Geo: Country = United States |
| UK | UK Visitors | Geo: Country = United Kingdom |
| JP | JP Visitors | Geo: Country = Japan |
| All | Mobile Users | Device type: Mobile |
| All | Rewards Users | mbox param: `loyaltyTier` is not null |

### 3.4 Audience Sharing with Adobe Analytics

For AA-defined segments to be available in Target:

1. Enable **Audience Sharing** between AA and Target in Adobe Admin Console (Experience Cloud integrations).
2. Create a segment in AA Workspace (e.g., users who viewed `/rewards` 3+ times in the last 30 days).
3. Share the segment to Target → it appears as an audience in the Target audience library within 24 hours.

### 3.5 Real-Time CDP Audiences (Optional)

If Adobe Real-Time CDP is provisioned:

1. Create a segment in RTCDP using profile attributes (loyalty tier, purchase history).
2. Activate the segment to Adobe Target destination.
3. The segment is available as a Target audience via the shared profile.

---

## Chapter 4: Planning & Executing Tests

This chapter covers the end-to-end process for planning, setting up and executing A/B tests on the EDS sites.

### 4.1 Test Hypothesis Template

Use the following template for every test hypothesis in the backlog:

```
HYPOTHESIS:
  We believe that [CHANGE]
  for [AUDIENCE]
  will result in [OUTCOME]
  because [RATIONALE].

PRIMARY METRIC: [KPI, e.g., menu item click rate]
SECONDARY METRICS: [e.g., bounce rate, time on page]
TRAFFIC ALLOCATION: [e.g., 50/50 A/B, or 33/33/33 for A/B/C]
MINIMUM DETECTABLE EFFECT: [e.g., +5 % relative lift]
REQUIRED SAMPLE SIZE: [calculated using power analysis]
ESTIMATED RUNTIME: [weeks based on traffic volume]
```

### 4.2 Test Library

Maintain a **Test Library** in the project management tool (Jira / ADO) with the following columns:

| Column | Description |
|---|---|
| Hypothesis | Plain-language statement |
| Status | Backlog / In Progress / Completed / Archived |
| Market | US / UK / JP / All |
| Page / Block | Where the test runs |
| Primary metric | KPI being measured |
| Start date | When test launched |
| End date | When test concluded |
| Result | Lift, confidence, winner |
| Implementation | Whether winning variant was shipped |

### 4.3 Prioritisation Sheet

Prioritise tests using the **PIE framework**:

| Test | Potential (1–5) | Importance (1–5) | Ease (1–5) | PIE score | Priority |
|---|---|---|---|---|---|
| (Test name) | | | | (avg) | |

**Scoring guidance:**

- **Potential:** How much improvement is possible relative to baseline?
- **Importance:** How much traffic / revenue does this page/feature affect?
- **Ease:** How difficult is implementation and how long is the expected runtime?

### 4.4 Setting Up an A/B Test in Adobe Target

1. **Target → Activities → Create Activity → A/B Test**.
2. Select **Form-Based Experience Composer** (for EDS overlay-based tests) or **Visual Experience Composer** (for CSS/copy changes).
3. Configure:

| Setting | Value |
|---|---|
| Activity name | `[Market] [Page] — [Hypothesis short name]` |
| Goal metric | Primary KPI (e.g., `event11` — Menu Click) |
| Audience | Select from pre-configured audiences |
| Traffic allocation | Per hypothesis (e.g., 50/50) |
| Priority | Medium (avoid conflicting activities) |

4. **Experience A (Control):** Current state — no changes.
5. **Experience B (Variant):** Implement the change (CSS override, HTML swap, or mbox-delivered JSON).

**Delivering a variant via mbox JSON:**

```js
// In EDS block JS (menu-item.js)
adobe.target.getOffer({
  mbox: 'menu-cta-test',
  success: function(offer) {
    adobe.target.applyOffer({ mbox: 'menu-cta-test', offer });
  },
  error: function() {
    // Render control state
  },
});
```

6. Set **QA Preview URL** and validate both experiences.
7. Activate the activity.

### 4.5 Statistical Significance

- Do not call a winner until the test reaches **95 % confidence** (p < 0.05) on the primary metric.
- Ensure the **minimum sample size** is reached before concluding. Use an online power calculator (e.g., Evan Miller's sample size calculator).
- Run tests for a **minimum of 2 business cycles** (typically 2 weeks) to account for day-of-week variation.

---

## Chapter 5: Optimising Tests

This chapter describes how to analyse completed tests, implement winning variants and use learnings to build a continuous optimisation cycle.

### 5.1 Test Results Analysis

After a test concludes:

1. **Download the test report** from Adobe Target → Activity → Reports.
2. Calculate the **relative lift**: `(Variant metric − Control metric) / Control metric × 100 %`.
3. Check **confidence level** and ensure it meets the 95 % threshold.
4. Segment the results by market, device type and loyalty tier to identify audience-level insights.
5. Document the results in the Test Library.

### 5.2 Declaring a Winner

A winner is declared when:

- [ ] 95 % statistical confidence reached
- [ ] Minimum sample size achieved
- [ ] Minimum runtime (2 business cycles) completed
- [ ] No anomalous data (e.g., sudden traffic spike distorting results)
- [ ] Results reviewed and approved by Analytics Consultant and Quick Service Restaurant Digital Marketing Lead

### 5.3 Implementing the Winning Variant

Once a winner is declared:

1. **Raise a GitHub PR** to implement the winning change permanently in the EDS block or App Builder action.
2. The Tech/Dev team implements the change following the standard development workflow.
3. The CI/CD pipeline deploys the change automatically via the path-based workflows (`app-builder-deploy.yml` or `eds-deploy.yml`) when merged to `main`.
4. The Target activity is **paused** once the permanent code change is live.
5. The Test Library entry is updated to `Completed — Shipped`.

**Permanent implementation checklist:**

- [ ] Code change raised as a PR with acceptance criteria from the test hypothesis
- [ ] PR reviewed by AEM Technical Architect
- [ ] Change deployed to Dev; verified against the winning experience
- [ ] Change deployed to Production via CI/CD pipeline
- [ ] Target activity paused
- [ ] Analytics confirms the lift is maintained in production data

### 5.4 Learning and Iteration

After each test cycle:

1. **Conduct a test debrief** (30 min) with the Analytics Consultant, Functional Lead and Quick Service Restaurant CRO team.
2. Extract **learnings** — what worked, what didn't and why.
3. Use learnings to refine the next test hypothesis:
   - Winning variants may reveal further micro-optimisation opportunities.
   - Losing variants often contain insights about what audiences respond negatively to.
4. Update the **Prioritisation Sheet** — reprioritise remaining backlog based on new learnings.

### 5.5 Continuous Optimisation Cycle

```
Hypothesis
    │
    ▼
Prioritise (PIE)
    │
    ▼
Set up test (Target)
    │
    ▼
Run test (minimum 2 business cycles)
    │
    ▼
Analyse results
    │
    ├── Winner → Implement permanently → Update Test Library → Extract learnings
    │
    └── No winner / inconclusive → Refine hypothesis or discard → Extract learnings
            │
            ▼
    Update Prioritisation Sheet
            │
            ▼
    Next test (repeat cycle)
```

### 5.6 Reporting to Stakeholders

Produce a monthly **Optimisation Performance Report** for Quick Service Restaurant Digital Marketing:

| Section | Content |
|---|---|
| Tests completed this month | Summary of concluded tests and results |
| Tests in progress | Active tests, expected completion date |
| Upcoming tests | Next 2–3 prioritised tests from backlog |
| Cumulative lift | Total measured conversion lift since programme start |
| Learnings | Key insights from this month's tests |
| Recommendations | Actions for next month |
