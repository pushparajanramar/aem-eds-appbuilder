<svelte:options customElement="qsr-tabs" />

<script>
  export let tabsdata = '[]';

  $: parsedTabs = (() => { try { return JSON.parse(tabsdata); } catch(e) { return []; } })();

  let activeIndex = 0;

  function selectTab(i) {
    activeIndex = i;
    dispatchEvent(new CustomEvent('qsr:tabs:change', {
      detail: { index: i, label: parsedTabs[i]?.label },
      bubbles: true,
      composed: true
    }));
    window.adobeDataLayer = window.adobeDataLayer || [];
    window.adobeDataLayer.push({
      event: 'component:tabs:change',
      component: { index: i, label: parsedTabs[i]?.label }
    });
  }

  function handleKeydown(e) {
    if (e.key === 'ArrowLeft') {
      selectTab((activeIndex - 1 + parsedTabs.length) % parsedTabs.length);
    } else if (e.key === 'ArrowRight') {
      selectTab((activeIndex + 1) % parsedTabs.length);
    } else if (e.key === 'Home') {
      selectTab(0);
    } else if (e.key === 'End') {
      selectTab(parsedTabs.length - 1);
    }
  }
</script>

<div class="tabs">
  <div class="tabs__tablist" role="tablist" aria-label="Tabs" on:keydown={handleKeydown}>
    {#each parsedTabs as tab, i}
      <button
        role="tab"
        id="tab-{i}"
        class="tabs__tab"
        class:tabs__tab--active={activeIndex === i}
        aria-selected={activeIndex === i}
        aria-controls="tabpanel-{i}"
        tabindex={activeIndex === i ? 0 : -1}
        on:click={() => selectTab(i)}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  {#each parsedTabs as tab, i}
    <div
      role="tabpanel"
      id="tabpanel-{i}"
      aria-labelledby="tab-{i}"
      class="tabs__panel"
      hidden={activeIndex !== i}
      tabindex="0"
    >
      {@html tab.contentHtml}
    </div>
  {/each}
</div>

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

  .tabs {
    width: 100%;
  }

  .tabs__tablist {
    display: flex;
    border-bottom: 2px solid var(--color-border);
    gap: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .tabs__tablist::-webkit-scrollbar {
    display: none;
  }

  .tabs__tab {
    padding: var(--space-3) var(--space-5);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    cursor: pointer;
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    white-space: nowrap;
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }

  .tabs__tab:hover {
    color: var(--color-interactive);
  }

  .tabs__tab:focus-visible {
    outline: 2px solid var(--color-interactive);
    outline-offset: -2px;
  }

  .tabs__tab--active {
    color: var(--color-interactive);
    border-bottom-color: var(--color-interactive);
  }

  .tabs__panel {
    padding: var(--space-6) 0;
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
  }

  .tabs__panel[hidden] {
    display: none;
  }

  .tabs__panel:focus-visible {
    outline: 2px solid var(--color-interactive);
    outline-offset: 2px;
  }

  .tabs__panel :global(a) {
    color: var(--color-interactive);
    text-decoration: none;
  }

  .tabs__panel :global(a:hover) {
    color: var(--color-interactive-hover);
    text-decoration: underline;
  }
</style>
