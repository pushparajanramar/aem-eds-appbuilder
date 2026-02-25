<svelte:options customElement="qsr-hero" />

<script>
  export let imageurl = '';
  export let imagealt = '';
  export let contenthtml = '';
</script>

<section class="hero">
  {#if imageurl}
    <div class="hero__media">
      <img
        src={imageurl}
        alt={imagealt}
        loading="eager"
        fetchpriority="high"
        decoding="async"
        class="hero__img"
      />
    </div>
  {/if}
  {#if contenthtml}
    <div class="hero__content">
      {@html contenthtml}
    </div>
  {/if}
</section>

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

  .hero {
    position: relative;
    width: 100%;
    overflow: hidden;
    background: var(--color-green-dark);
    color: var(--color-white);
  }

  .hero__media {
    position: relative;
    width: 100%;
    max-height: 600px;
    overflow: hidden;
  }

  .hero__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    max-height: 600px;
  }

  .hero__content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: var(--space-12) var(--space-8);
    background: linear-gradient(90deg, rgba(30, 57, 50, 0.75) 0%, transparent 60%);
    max-width: var(--max-width-content);
    margin: 0 auto;
  }

  .hero__content :global(h1),
  .hero__content :global(h2) {
    color: var(--color-white);
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    margin: 0 0 var(--space-4);
    max-width: var(--max-width-text);
  }

  .hero__content :global(p) {
    color: rgba(255, 255, 255, 0.9);
    font-size: var(--font-size-lg);
    line-height: var(--line-height-normal);
    margin: 0 0 var(--space-6);
    max-width: 540px;
  }

  .hero__content :global(a) {
    display: inline-block;
    padding: var(--space-3) var(--space-8);
    background: var(--color-interactive);
    color: var(--color-white);
    text-decoration: none;
    border-radius: var(--radius-pill);
    font-weight: var(--font-weight-semibold);
    transition: background-color var(--transition-fast);
  }

  .hero__content :global(a:hover) {
    background: var(--color-green-dark);
  }

  @container (max-width: 768px) {
    .hero__content {
      position: static;
      background: var(--color-green-dark);
      padding: var(--space-8) var(--space-6);
    }

    .hero__content :global(h1),
    .hero__content :global(h2) {
      font-size: var(--font-size-2xl);
    }
  }
</style>
