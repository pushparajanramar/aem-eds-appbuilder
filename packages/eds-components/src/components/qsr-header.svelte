<svelte:options customElement="qsr-header" />

<script>
  import { onMount } from 'svelte';

  export let path = '/nav';

  let navHtml = '';
  let menuOpen = false;
  let loading = true;

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  function handleNavClick(e) {
    const link = e.target.closest('a');
    if (link) {
      window.adobeDataLayer = window.adobeDataLayer || [];
      window.adobeDataLayer.push({
        event: 'component:nav:link:click',
        component: { href: link.href, text: link.textContent?.trim() }
      });
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && menuOpen) {
      menuOpen = false;
    }
  }

  onMount(async () => {
    try {
      const res = await fetch(`${path}.plain.html`);
      if (!res.ok) throw new Error(`Failed to load nav: ${res.status}`);
      navHtml = await res.text();
    } catch {
      navHtml = '';
    } finally {
      loading = false;
    }
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
</script>

<header class="header">
  <div class="header__inner">
    <button
      class="header__hamburger"
      aria-expanded={menuOpen}
      aria-controls="header-nav"
      aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      on:click={toggleMenu}
    >
      <span class="header__hamburger-bar"></span>
      <span class="header__hamburger-bar"></span>
      <span class="header__hamburger-bar"></span>
    </button>

    {#if loading}
      <div class="header__loading" aria-hidden="true">
        <span class="header__spinner"></span>
      </div>
    {:else}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <nav
        id="header-nav"
        class="header__nav"
        class:header__nav--open={menuOpen}
        aria-expanded={menuOpen}
        on:click={handleNavClick}
      >
        {@html navHtml}
      </nav>
    {/if}
  </div>
</header>

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
    container-type: inline-size;
  }

  .header {
    background: var(--color-white);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: var(--z-overlay);
    height: var(--header-height);
    box-shadow: var(--shadow-sm);
  }

  .header__inner {
    display: flex;
    align-items: center;
    height: 100%;
    max-width: var(--max-width-content);
    margin: 0 auto;
    padding: 0 var(--space-6);
    gap: var(--space-4);
  }

  .header__hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-2);
    border-radius: var(--radius-sm);
    transition: background-color var(--transition-fast);
    flex-shrink: 0;
  }

  .header__hamburger:hover {
    background: var(--color-gray-100);
  }

  .header__hamburger:focus-visible {
    outline: 2px solid var(--color-interactive);
    outline-offset: 2px;
  }

  .header__hamburger-bar {
    display: block;
    height: 2px;
    background: var(--color-text-primary);
    border-radius: 2px;
    transition: transform var(--transition-fast), opacity var(--transition-fast);
  }

  .header__nav {
    display: flex;
    align-items: center;
    flex: 1;
  }

  .header__nav :global(ul) {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: var(--space-4);
    align-items: center;
  }

  .header__nav :global(a) {
    color: var(--color-text-primary);
    text-decoration: none;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast), background-color var(--transition-fast);
  }

  .header__nav :global(a:hover) {
    color: var(--color-interactive);
    background: var(--color-gray-100);
  }

  .header__loading {
    display: flex;
    align-items: center;
    padding: var(--space-4);
  }

  .header__spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-gray-200);
    border-top-color: var(--color-interactive);
    border-radius: var(--radius-circle);
    animation: spin 0.8s linear infinite;
    display: block;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @container (max-width: 768px) {
    .header__hamburger {
      display: flex;
    }

    .header__nav {
      display: none;
      position: absolute;
      top: var(--header-height);
      left: 0;
      right: 0;
      background: var(--color-white);
      border-bottom: 1px solid var(--color-border);
      box-shadow: var(--shadow-md);
      padding: var(--space-4);
      flex-direction: column;
      align-items: flex-start;
      z-index: var(--z-overlay);
    }

    .header__nav--open {
      display: flex;
    }

    .header__nav :global(ul) {
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
      gap: var(--space-1);
    }
  }
</style>
