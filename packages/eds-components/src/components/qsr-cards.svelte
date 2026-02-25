<svelte:options customElement="qsr-cards" />

<script>
  import { buildDynamicMediaUrl, buildDynamicMediaSrcset, getImageWidthForDevice } from '../utils/image-utils.js';

  export let items = '[]';
  export let devicetype = 'desktop';

  $: parsedItems = (() => { try { return JSON.parse(items); } catch(e) { return []; } })();
  $: imageWidth = getImageWidthForDevice(devicetype);

  function handleClick(i, title) {
    dispatchEvent(new CustomEvent('qsr:cards:click', {
      detail: { index: i, title },
      bubbles: true,
      composed: true
    }));
    window.adobeDataLayer = window.adobeDataLayer || [];
    window.adobeDataLayer.push({
      event: 'component:cards:click',
      component: { index: i, title }
    });
  }
</script>

<ul class="cards__list" role="list">
  {#each parsedItems as item, i}
    <li class="cards__item">
      <article
        class="cards__card"
        on:click={() => handleClick(i, item.title)}
        on:keydown={(e) => e.key === 'Enter' && handleClick(i, item.title)}
        role={item.href ? undefined : 'button'}
        tabindex={item.href ? undefined : 0}
      >
        {#if item.imageUrl}
          <div class="cards__media">
            {#if item.href}
              <a href={item.href} tabindex="-1" aria-hidden="true">
                <picture>
                  <source type="image/webp" srcset={buildDynamicMediaSrcset(item.imageUrl, imageWidth)} />
                  <img
                    src={buildDynamicMediaUrl(item.imageUrl, imageWidth, { format: 'jpeg' })}
                    alt={item.imageAlt || ''}
                    loading="lazy"
                    decoding="async"
                    width={imageWidth}
                    class="cards__img"
                  />
                </picture>
              </a>
            {:else}
              <picture>
                <source type="image/webp" srcset={buildDynamicMediaSrcset(item.imageUrl, imageWidth)} />
                <img
                  src={buildDynamicMediaUrl(item.imageUrl, imageWidth, { format: 'jpeg' })}
                  alt={item.imageAlt || ''}
                  loading="lazy"
                  decoding="async"
                  width={imageWidth}
                  class="cards__img"
                />
              </picture>
            {/if}
          </div>
        {/if}
        <div class="cards__body">
          {#if item.title}
            <h3 class="cards__title">
              {#if item.href}
                <a href={item.href} class="cards__link">{item.title}</a>
              {:else}
                {item.title}
              {/if}
            </h3>
          {/if}
          {#if item.body}
            <div class="cards__content">{@html item.body}</div>
          {/if}
        </div>
      </article>
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

  .cards__list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-6);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .cards__card {
    display: flex;
    flex-direction: column;
    background: var(--color-background);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    transition: box-shadow var(--transition-normal), transform var(--transition-normal);
    cursor: pointer;
    height: 100%;
  }

  .cards__card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .cards__card:focus-visible {
    outline: 2px solid var(--color-interactive);
    outline-offset: 2px;
  }

  .cards__media {
    overflow: hidden;
    aspect-ratio: 16 / 9;
  }

  .cards__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-normal);
    display: block;
  }

  .cards__card:hover .cards__img {
    transform: scale(1.04);
  }

  .cards__body {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .cards__title {
    margin: 0 0 var(--space-2);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: var(--line-height-tight);
  }

  .cards__link {
    color: inherit;
    text-decoration: none;
  }

  .cards__link:hover {
    color: var(--color-interactive);
  }

  .cards__content {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
  }
</style>
