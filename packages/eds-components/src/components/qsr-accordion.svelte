<svelte:options customElement="qsr-accordion" />

<script>
  import { onMount } from 'svelte';

  export let items = '[]';

  $: parsedItems = (() => { try { return JSON.parse(items); } catch(e) { return []; } })();

  let openIndex = null;

  function toggle(i) {
    openIndex = openIndex === i ? null : i;
    dispatchEvent(new CustomEvent('qsr:accordion:toggle', {
      detail: { index: i, label: parsedItems[i]?.label, isOpen: openIndex === i },
      bubbles: true,
      composed: true
    }));
    window.adobeDataLayer = window.adobeDataLayer || [];
    window.adobeDataLayer.push({
      event: 'component:accordion:toggle',
      component: { index: i, label: parsedItems[i]?.label, isOpen: openIndex === i }
    });
  }
</script>

<ul class="accordion__list" role="list">
  {#each parsedItems as item, i}
    <li class="accordion__item">
      <button
        class="accordion__summary"
        aria-expanded={openIndex === i}
        aria-controls="accordion-body-{i}"
        id="accordion-btn-{i}"
        on:click={() => toggle(i)}
      >
        <span class="accordion__label">{item.label}</span>
        <span class="accordion__arrow" aria-hidden="true">&#9660;</span>
      </button>
      <div
        class="accordion__body"
        id="accordion-body-{i}"
        role="region"
        aria-labelledby="accordion-btn-{i}"
        hidden={openIndex !== i}
      >
        {@html item.body}
      </div>
    </li>
  {/each}
</ul>

<style>
  :host {
    --color-green-primary: #00704a;
    --color-green-dark: #1e3932;
    --color-green-light: #d4e9e2;
    --color-green-accent: #cba258;
    --color-warm-neutral: #f2f0eb;
    --color-white: #ffffff;
    --color-black: #000000;
    --color-gray-100: #f7f7f7;
    --color-gray-200: #e5e5e5;
    --color-gray-400: #9e9e9e;
    --color-gray-700: #404040;
    --color-text-primary: #1e3932;
    --color-text-secondary: #404040;
    --color-background: #ffffff;
    --color-surface: #f2f0eb;
    --color-border: #e5e5e5;
    --color-interactive: #00704a;
    --color-interactive-hover: #1e3932;
    --color-error: #d62b2b;
    --color-success: #00704a;
    --font-family-sans: 'SoDo Sans', 'Helvetica Neue', Arial, sans-serif;
    --font-family-serif: 'Lander', Georgia, serif;
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-md: 1.125rem;
    --font-size-lg: 1.25rem;
    --font-size-xl: 1.5rem;
    --font-size-2xl: 2rem;
    --font-size-3xl: 2.5rem;
    --font-weight-regular: 400;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    --line-height-tight: 1.2;
    --line-height-normal: 1.5;
    --line-height-loose: 1.75;
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-5: 1.25rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --space-10: 2.5rem;
    --space-12: 3rem;
    --space-16: 4rem;
    --space-20: 5rem;
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 16px;
    --radius-pill: 999px;
    --radius-circle: 50%;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.12);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.16);
    --transition-fast: 150ms ease;
    --transition-normal: 250ms ease;
    --transition-slow: 400ms ease;
    --z-base: 0;
    --z-overlay: 100;
    --z-modal: 200;
    --z-toast: 300;
    --max-width-content: 1280px;
    --max-width-text: 720px;
    --header-height: 64px;
    display: block;
    font-family: var(--font-family-sans);
  }

  .accordion__list {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--color-border);
  }

  .accordion__item {
    border-bottom: 1px solid var(--color-border);
  }

  .accordion__summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--space-4) var(--space-4);
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-family-sans);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    text-align: left;
    transition: background-color var(--transition-fast);
  }

  .accordion__summary:hover {
    background-color: var(--color-gray-100);
  }

  .accordion__summary:focus-visible {
    outline: 2px solid var(--color-interactive);
    outline-offset: -2px;
  }

  .accordion__arrow {
    font-size: var(--font-size-xs);
    transition: transform var(--transition-normal);
    flex-shrink: 0;
    margin-left: var(--space-2);
  }

  .accordion__summary[aria-expanded="true"] .accordion__arrow {
    transform: rotate(-180deg);
  }

  .accordion__body {
    padding: var(--space-4);
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
  }

  .accordion__body[hidden] {
    display: none;
  }
</style>
