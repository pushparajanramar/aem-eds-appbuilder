<svelte:options customElement="qsr-fragment" />

<script>
  import { onMount } from 'svelte';

  export let path = '';

  let html = '';
  let loading = true;
  let error = '';

  onMount(async () => {
    if (!path) {
      loading = false;
      return;
    }
    try {
      const res = await fetch(`${path}.plain.html`);
      if (!res.ok) throw new Error(`Failed to load fragment: ${res.status}`);
      html = await res.text();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });
</script>

<div class="fragment">
  {#if loading}
    <div class="fragment__loading" aria-label="Loading content" role="status">
      <span class="fragment__spinner"></span>
    </div>
  {:else if error}
    <p class="fragment__error" role="alert">{error}</p>
  {:else}
    <div class="fragment__content">{@html html}</div>
  {/if}
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

  .fragment {
    width: 100%;
  }

  .fragment__loading {
    display: flex;
    justify-content: center;
    padding: var(--space-8);
  }

  .fragment__spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-gray-200);
    border-top-color: var(--color-interactive);
    border-radius: var(--radius-circle);
    animation: spin 0.8s linear infinite;
    display: block;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .fragment__error {
    color: var(--color-error);
    padding: var(--space-4);
    background: #fdf0f0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-error);
    margin: 0;
    font-size: var(--font-size-sm);
  }

  .fragment__content {
    line-height: var(--line-height-normal);
    color: var(--color-text-secondary);
  }

  .fragment__content :global(a) {
    color: var(--color-interactive);
    text-decoration: none;
  }

  .fragment__content :global(a:hover) {
    color: var(--color-interactive-hover);
    text-decoration: underline;
  }
</style>
