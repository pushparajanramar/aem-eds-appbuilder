<svelte:options customElement="qsr-footer" />

<script>
  import { onMount } from 'svelte';

  export let path = '/footer';

  let html = '';
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      const res = await fetch(`${path}.plain.html`);
      if (!res.ok) throw new Error(`Failed to load footer: ${res.status}`);
      html = await res.text();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });
</script>

<footer class="footer">
  {#if loading}
    <div class="footer__loading" aria-label="Loading footer" role="status">
      <span class="footer__spinner"></span>
    </div>
  {:else if error}
    <p class="footer__error" role="alert">{error}</p>
  {:else}
    <div class="footer__content">{@html html}</div>
  {/if}
</footer>

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

  .footer {
    background-color: var(--color-green-dark);
    color: var(--color-white);
    padding: var(--space-12) var(--space-6);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
  }

  .footer__loading {
    display: flex;
    justify-content: center;
    padding: var(--space-8);
  }

  .footer__spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: var(--color-white);
    border-radius: var(--radius-circle);
    animation: spin 0.8s linear infinite;
    display: block;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .footer__error {
    color: var(--color-error);
    text-align: center;
    padding: var(--space-4);
  }

  .footer__content :global(a) {
    color: var(--color-green-light);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .footer__content :global(a:hover) {
    color: var(--color-white);
    text-decoration: underline;
  }
</style>
