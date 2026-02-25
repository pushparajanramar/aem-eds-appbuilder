<svelte:options customElement="qsr-columns" />

<script>
  import { buildDynamicMediaUrl, buildDynamicMediaSrcset, getImageWidthForDevice } from '../utils/image-utils.js';

  export let columndata = '[]';
  export let devicetype = 'desktop';

  $: parsedCols = (() => { try { return JSON.parse(columndata); } catch(e) { return []; } })();
  $: imageWidth = getImageWidthForDevice(devicetype);
</script>

<div class="columns__row columns__row--{parsedCols.length}-cols">
  {#each parsedCols as col}
    {#if col.isImage}
      <div class="columns__img-col">
        <picture>
          <source type="image/webp" srcset={buildDynamicMediaSrcset(col.imageUrl, imageWidth)} />
          <img
            src={buildDynamicMediaUrl(col.imageUrl, imageWidth, { format: 'jpeg' })}
            alt={col.imageAlt || ''}
            loading="lazy"
            decoding="async"
            width={imageWidth}
            class="columns__img"
          />
        </picture>
      </div>
    {:else}
      <div class="columns__text-col">
        {@html col.contentHtml}
      </div>
    {/if}
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
    container-type: inline-size;
  }

  .columns__row {
    display: grid;
    gap: var(--space-6);
    align-items: start;
  }

  .columns__row--1-cols { grid-template-columns: 1fr; }
  .columns__row--2-cols { grid-template-columns: repeat(2, 1fr); }
  .columns__row--3-cols { grid-template-columns: repeat(3, 1fr); }
  .columns__row--4-cols { grid-template-columns: repeat(4, 1fr); }

  @container (max-width: 768px) {
    .columns__row--2-cols,
    .columns__row--3-cols,
    .columns__row--4-cols {
      grid-template-columns: 1fr;
    }
  }

  @container (min-width: 769px) and (max-width: 1024px) {
    .columns__row--3-cols,
    .columns__row--4-cols {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .columns__img-col {
    overflow: hidden;
    border-radius: var(--radius-md);
  }

  .columns__img {
    width: 100%;
    height: auto;
    display: block;
    object-fit: cover;
  }

  .columns__text-col {
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
  }

  .columns__text-col :global(h1),
  .columns__text-col :global(h2),
  .columns__text-col :global(h3) {
    color: var(--color-text-primary);
    line-height: var(--line-height-tight);
  }

  .columns__text-col :global(a) {
    color: var(--color-interactive);
    text-decoration: none;
  }

  .columns__text-col :global(a:hover) {
    color: var(--color-interactive-hover);
    text-decoration: underline;
  }
</style>
