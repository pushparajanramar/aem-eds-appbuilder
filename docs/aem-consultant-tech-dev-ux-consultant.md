# AEM Consultant (Tech/Dev) / UX Consultant

## Role Overview

The AEM Consultant (Tech/Dev) / UX Consultant implements the front-end and back-end components of the AEM EDS + App Builder solution. In the UX capacity they own visual design, design-system integration and the end-user experience across all three markets (US, UK, JP). In the tech/dev capacity they build, test and maintain EDS blocks, Svelte web components and App Builder actions.

---

## Responsibilities

### Technical Development

| Area | Description |
|---|---|
| **EDS Block Development** | Implement and maintain JavaScript/CSS blocks (`menu-item`, `product-detail`, `promotion-banner`) |
| **App Builder Actions** | Develop and test serverless actions (`menu-provider`, `store-provider`, `rewards-provider`, `webhook`) |
| **Svelte Web Components** | Build and maintain `qsr-menu-card` and `qsr-product-customizer` in `packages/eds-components` |
| **Unit Testing** | Write and maintain Jest tests for App Builder actions (`npm test` in `app-builder/`) |
| **Linting & Quality** | Ensure code passes ESLint (`npm run lint`) and `svelte-check` before raising a PR |
| **Universal Editor** | Implement `data-aue-*` instrumentation in `ue/instrumentation.js` for each market |

### UX Design

| Area | Description |
|---|---|
| **Visual Design** | Produce wireframes, mockups and high-fidelity designs for each block and page template |
| **Design System** | Define and maintain global CSS custom properties (design tokens) in `apps/eds-*/styles/` |
| **Responsive Design** | Ensure blocks render correctly across mobile, tablet and desktop breakpoints |
| **Accessibility** | Meet WCAG 2.1 AA standards for all components and page templates |
| **Prototype & Validate** | Create interactive prototypes for UAT; incorporate feedback from Quick Service Restaurant content teams |

---

## Repository Layout (Developer Focus)

```
app-builder/
└── actions/
    ├── menu-provider/         # GET /menu → text/html block markup
    ├── store-provider/        # GET /stores → text/html block markup
    ├── rewards-provider/      # GET /rewards → text/html block markup (IMS-gated)
    ├── webhook/               # POST → EDS Admin API cache purge
    └── shared/
        ├── market-config.js   # EDS host + locale per market
        └── url-utils.js       # Safe URL helpers

apps/eds-<market>/
├── blocks/
│   ├── menu-item/             # Block JS + CSS + qsr-menu-card WC
│   ├── product-detail/        # Block JS + CSS + qsr-product-customizer WC
│   └── promotion-banner/      # Block JS + CSS
├── scripts/aem.js             # EDS core runtime
├── styles/                    # Global CSS (design tokens, typography, layout)
└── ue/instrumentation.js      # Universal Editor DOM instrumentation

packages/eds-components/
└── src/
    ├── components/
    │   ├── qsr-menu-card.svelte
    │   └── qsr-product-customizer.svelte
    └── utils/
        ├── api.js             # Shared fetch helpers
        └── auth.js            # IMS token helpers
```

---

## Local Development

### App Builder Actions

```bash
cd app-builder
npm ci
npm run lint      # ESLint
npm test          # Jest unit tests
aio app run       # Local dev server (requires .env with IMS credentials)
```

Create `app-builder/.env` (never commit):

```
AIO_IMS_CONTEXT_CONFIG=<base64-encoded IMS context JSON>
AIO_PROJECT_ID=<your-project-id>
AIO_WORKSPACE_ID=<your-workspace-id>
```

### Svelte Web Components

```bash
cd packages/eds-components
npm ci
npm run dev       # Vite watch mode
npm run check     # svelte-check type checking
npm run lint      # ESLint on Svelte sources
npm run build     # Production bundle → dist/
```

Built bundles must be copied to the relevant market block directories:

```bash
cp dist/qsr-menu-card.js          ../../apps/eds-us/blocks/menu-item/
cp dist/qsr-product-customizer.js ../../apps/eds-us/blocks/product-detail/
```

### EDS Blocks

Run the AEM EDS local development proxy from an individual market folder using the `aem up` command (requires the AEM CLI). This serves the market site locally and picks up block JS/CSS changes instantly.

---

## App Builder Action Contract

All actions accept standard `params` from Adobe I/O Runtime. Common parameters:

| Parameter | Default | Description |
|---|---|---|
| `market` | `us` | Target market (`us` \| `uk` \| `jp`) |
| `LOG_LEVEL` | `warn` | Logging verbosity |

Market-specific configuration is resolved via `shared/market-config.js`:

| Market | EDS Host | Locale | Currency |
|---|---|---|---|
| `us` | `main--qsr-us--org.aem.live` | `en-US` | USD |
| `uk` | `main--qsr-uk--org.aem.live` | `en-GB` | GBP |
| `jp` | `main--qsr-jp--org.aem.live` | `ja-JP` | JPY |

---

## CSS / Design Tokens

Global styles and design tokens live in `apps/eds-*/styles/`. Use CSS custom properties to ensure theming is consistent and overridable at the market level. Avoid hard-coded colour or spacing values inside block stylesheets.

---

## Accessibility Standards

All blocks and web components must meet **WCAG 2.1 AA**:

- Interactive elements must have keyboard focus styles
- Images must have descriptive `alt` text
- Colour contrast ratio ≥ 4.5:1 for normal text
- ARIA roles and labels applied where semantic HTML is insufficient

---

## Onboarding Checklist

- [ ] GitHub repository access (read/write)
- [ ] Node.js 18.x and npm 9+ installed
- [ ] Adobe I/O CLI installed globally (`npm install -g @adobe/aio-cli`)
- [ ] AEM EDS CLI installed (`npm install -g @adobe/aem-cli`)
- [ ] `app-builder/.env` file created with valid IMS credentials
- [ ] `aio app run` verified locally for at least one action
- [ ] `npm run dev` verified in `packages/eds-components`
- [ ] Local AEM EDS proxy running for at least one market (`aem up`)
- [ ] ESLint and svelte-check passing with zero errors
