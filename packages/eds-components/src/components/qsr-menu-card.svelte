<!--
  qsr-menu-card Web Component
  RULE 3: custom element declaration required
  RULE 4: CSS uses token values in :host block (Shadow DOM can't inherit from document tokens)
-->
<svelte:options customElement="qsr-menu-card" />

<script>
  import { onMount } from 'svelte';
  import { fetchMenuItem } from '../utils/api.js';
  import { buildDynamicMediaUrl, buildDynamicMediaSrcset, getImageWidthForDevice } from '../utils/image-utils.js';

  // RULE 3: Props MUST be lowercase
  export let itemid = '';
  export let market = 'us';
  export let category = 'drinks';
  export let devicetype = 'desktop';

  let item = null;
  let isLoading = true;
  let error = null;

  onMount(async () => {
    try {
      item = await fetchMenuItem(itemid, market, category);
    } catch (err) {
      error = err.message || 'Failed to load menu item.';
    } finally {
      isLoading = false;
    }
  });

  $: imageWidth = getImageWidthForDevice(devicetype);

  function handleCustomize() {
    // RULE 3: inter-WC communication via CustomEvent with composed:true
    dispatchEvent(
      new CustomEvent('qsr:customize', {
        detail: { itemid, market, category },
        bubbles: true,
        composed: true,
      }),
    );
  }
</script>

{#if isLoading}
  <div class="card card--loading" role="status" aria-busy="true">
    <div class="skeleton skeleton--image"></div>
    <div class="skeleton__body">
      <div class="skeleton skeleton--text"></div>
      <div class="skeleton skeleton--text skeleton--short"></div>
    </div>
  </div>
{:else if error}
  <div class="card card--error" role="alert">
    <p>{error}</p>
  </div>
{:else if item}
  <article class="card">
    {#if item.imageUrl}
      <div class="card__media">
        <picture>
          <source type="image/webp" srcset={buildDynamicMediaSrcset(item.imageUrl, imageWidth)} />
          <img
            src={buildDynamicMediaUrl(item.imageUrl, imageWidth, { format: 'jpeg' })}
            alt={item.name}
            loading="lazy"
            width={imageWidth}
          />
        </picture>
      </div>
    {/if}
    <div class="card__body">
      <h3 class="card__name">{item.name}</h3>
      {#if item.description}
        <p class="card__description">{item.description}</p>
      {/if}
      {#if item.price}
        <p class="card__price">{item.price}</p>
      {/if}
    </div>
    <div class="card__actions">
      <button class="card__btn-customize" on:click={handleCustomize} aria-label="Customize {item.name}">
        Customize
      </button>
    </div>
  </article>
{/if}

<style>
  /* RULE 4: copy token values into :host block for Shadow DOM */
  :host {
    --color-green-primary: #00704a;
    --color-green-dark: #1e3932;
    --color-white: #ffffff;
    --color-warm-neutral: #f2f0eb;
    --color-text-primary: #1e3932;
    --color-text-secondary: #404040;
    --color-border: #e5e5e5;
    --color-gray-200: #e5e5e5;
    --font-family-sans: 'SoDo Sans', 'Helvetica Neue', Arial, sans-serif;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    --radius-md: 8px;
    --radius-pill: 999px;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.12);
    --transition-fast: 150ms ease;

    display: block;
    font-family: var(--font-family-sans);
    container-type: inline-size;
  }

  .card {
    display: flex;
    flex-direction: column;
    background: var(--color-white);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    transition: box-shadow var(--transition-fast);
  }

  .card:hover {
    box-shadow: var(--shadow-md);
  }

  .card--loading,
  .card--error {
    padding: var(--space-4);
    min-height: 200px;
  }

  .skeleton {
    background: var(--color-gray-200);
    border-radius: 4px;
    animation: shimmer 1.5s infinite;
  }

  .skeleton--image {
    width: 100%;
    aspect-ratio: 1 / 1;
  }

  .skeleton__body {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .skeleton--text {
    height: 16px;
    width: 100%;
  }

  .skeleton--short {
    width: 60%;
  }

  @keyframes shimmer {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .card__media img {
    display: block;
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
  }

  .card__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
    flex: 1;
  }

  .card__name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .card__description {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .card__price {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-green-primary);
    margin: 0;
  }

  .card__actions {
    display: flex;
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid var(--color-border);
  }

  .card__btn-customize {
    flex: 1;
    padding: var(--space-2) var(--space-4);
    background: var(--color-green-primary);
    color: var(--color-white);
    font-family: var(--font-family-sans);
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    border-radius: var(--radius-pill);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .card__btn-customize:hover {
    background: var(--color-green-dark);
  }

  .card__btn-customize:focus-visible {
    outline: 3px solid #005fcc;
    outline-offset: 2px;
  }

  @container (max-width: 480px) {
    .card__btn-customize {
      min-height: 44px;
      padding: var(--space-3) var(--space-4);
    }
  }
</style>
