<svelte:options customElement="qsr-breadcrumbs" />

<script>
  export let items = '[]';

  $: parsedItems = (() => { try { return JSON.parse(items); } catch(e) { return []; } })();
</script>

<nav aria-label="Breadcrumb">
  <ol class="breadcrumbs__list">
    {#each parsedItems as item, i}
      <li
        class="breadcrumbs__item"
        class:breadcrumbs__item--active={i === parsedItems.length - 1}
      >
        {#if i !== parsedItems.length - 1}
          <a href={item.path} class="breadcrumbs__link">{item.title}</a>
          <span class="breadcrumbs__separator" aria-hidden="true">/</span>
        {:else}
          <span class="breadcrumbs__link" aria-current="page">{item.title}</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

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

  .breadcrumbs__list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: var(--space-2) 0;
    gap: var(--space-1);
  }

  .breadcrumbs__item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .breadcrumbs__link {
    color: var(--color-interactive);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  a.breadcrumbs__link:hover {
    color: var(--color-interactive-hover);
    text-decoration: underline;
  }

  a.breadcrumbs__link:focus-visible {
    outline: 2px solid var(--color-interactive);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  .breadcrumbs__item--active .breadcrumbs__link {
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-semibold);
    pointer-events: none;
  }

  .breadcrumbs__separator {
    color: var(--color-gray-400);
    user-select: none;
  }
</style>
