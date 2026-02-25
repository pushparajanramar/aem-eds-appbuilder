<!--
  qsr-product-customizer Web Component
  RULE 3: custom element declaration required
  RULE 4: CSS uses token values in :host block (Shadow DOM can't inherit from document tokens)
-->
<svelte:options customElement="qsr-product-customizer" />

<script>
  import { onMount } from 'svelte';
  import { fetchProduct } from '../utils/api.js';
  import { buildDynamicMediaUrl, buildDynamicMediaSrcset, getImageWidthForDevice } from '../utils/image-utils.js';

  // RULE 3: Props MUST be lowercase (HTML attributes are case-insensitive)
  export let productid = '';
  export let market = 'us';
  export let devicetype = 'desktop';

  let product = null;
  let selectedSize = null;
  let selectedMilk = null;
  let selectedExtras = [];
  let isLoading = true;
  let error = null;

  onMount(async () => {
    try {
      product = await fetchProduct(productid, market);
      if (product?.sizes?.length) selectedSize = product.sizes[0];
      if (product?.milkOptions?.length) selectedMilk = product.milkOptions[0];
    } catch (err) {
      error = err.message || 'Failed to load product.';
    } finally {
      isLoading = false;
    }
  });

  $: imageWidth = getImageWidthForDevice(devicetype);

  function toggleExtra(extra) {
    selectedExtras = selectedExtras.includes(extra)
      ? selectedExtras.filter((e) => e !== extra)
      : [...selectedExtras, extra];
  }

  function handleAddToCart() {
    const item = {
      productid,
      market,
      name: product?.name,
      size: selectedSize,
      milk: selectedMilk,
      extras: selectedExtras,
      price: product?.basePrice,
    };
    // RULE 3: inter-WC communication via CustomEvent with composed:true
    dispatchEvent(
      new CustomEvent('qsr:add-to-cart', {
        detail: item,
        bubbles: true,
        composed: true,
      }),
    );
  }
</script>

{#if isLoading}
  <div class="customizer customizer--loading" role="status" aria-busy="true">
    <div class="spinner" role="img" aria-label="Loading product…"></div>
  </div>
{:else if error}
  <div class="customizer customizer--error" role="alert">
    <p>{error}</p>
  </div>
{:else if product}
  <div class="customizer">
    <div class="customizer__media">
        <picture>
          <source type="image/webp" srcset={buildDynamicMediaSrcset(product.imageUrl, imageWidth)} />
          <img
            src={buildDynamicMediaUrl(product.imageUrl, imageWidth, { format: 'jpeg' })}
            alt={product.name}
            loading="lazy"
            width={imageWidth}
          />
        </picture>
      </div>
    <div class="customizer__body">
      <h2 class="customizer__name">{product.name}</h2>
      <p class="customizer__description">{product.description}</p>

      {#if product.sizes?.length}
        <fieldset class="customizer__fieldset">
          <legend>Size</legend>
          <div class="customizer__options">
            {#each product.sizes as size}
              <label class="customizer__option" class:customizer__option--selected={selectedSize === size}>
                <input
                  type="radio"
                  name="size"
                  value={size}
                  bind:group={selectedSize}
                  class="sr-only"
                />
                {size}
              </label>
            {/each}
          </div>
        </fieldset>
      {/if}

      {#if product.milkOptions?.length}
        <fieldset class="customizer__fieldset">
          <legend>Milk</legend>
          <div class="customizer__options">
            {#each product.milkOptions as milk}
              <label class="customizer__option" class:customizer__option--selected={selectedMilk === milk}>
                <input
                  type="radio"
                  name="milk"
                  value={milk}
                  bind:group={selectedMilk}
                  class="sr-only"
                />
                {milk}
              </label>
            {/each}
          </div>
        </fieldset>
      {/if}

      {#if product.extras?.length}
        <fieldset class="customizer__fieldset">
          <legend>Add-ons</legend>
          <div class="customizer__options">
            {#each product.extras as extra}
              <label
                class="customizer__option"
                class:customizer__option--selected={selectedExtras.includes(extra)}
              >
                <input
                  type="checkbox"
                  value={extra}
                  checked={selectedExtras.includes(extra)}
                  on:change={() => toggleExtra(extra)}
                  class="sr-only"
                />
                {extra}
              </label>
            {/each}
          </div>
        </fieldset>
      {/if}

      <button class="customizer__cta" on:click={handleAddToCart} aria-label="Add {product.name} to cart — {product.basePrice}">
        Add to Cart — {product.basePrice}
      </button>
    </div>
  </div>
{/if}

<style>
  /* RULE 4: copy token values into :host block for Shadow DOM */
  :host {
    --color-green-primary: #00704a;
    --color-green-dark: #1e3932;
    --color-green-light: #d4e9e2;
    --color-warm-neutral: #f2f0eb;
    --color-white: #ffffff;
    --color-text-primary: #1e3932;
    --color-text-secondary: #404040;
    --color-border: #e5e5e5;
    --font-family-sans: 'SoDo Sans', 'Helvetica Neue', Arial, sans-serif;
    --font-family-serif: 'Lander', Georgia, serif;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --radius-md: 8px;
    --radius-pill: 999px;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
    --transition-fast: 150ms ease;

    display: block;
    font-family: var(--font-family-sans);
    container-type: inline-size;
  }

  .customizer {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    background: var(--color-warm-neutral);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .customizer--loading,
  .customizer--error {
    padding: var(--space-8);
    text-align: center;
    color: var(--color-text-secondary);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-green-primary);
    border-radius: 50%;
    margin: 0 auto;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .customizer__media img {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }

  .customizer__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-6);
  }

  .customizer__name {
    font-family: var(--font-family-serif);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }

  .customizer__description {
    font-size: 1rem;
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  .customizer__fieldset {
    border: none;
    padding: 0;
    margin: 0;
  }

  .customizer__fieldset legend {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--space-2);
  }

  .customizer__options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .customizer__option {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    font-size: 0.875rem;
    cursor: pointer;
    transition: var(--transition-fast);
    color: var(--color-text-primary);
    background: var(--color-white);
    user-select: none;
  }

  .customizer__option--selected {
    background: var(--color-green-primary);
    border-color: var(--color-green-primary);
    color: var(--color-white);
  }

  .customizer__cta {
    padding: var(--space-3) var(--space-6);
    background: var(--color-green-primary);
    color: var(--color-white);
    font-family: var(--font-family-sans);
    font-size: 1rem;
    font-weight: 600;
    border: none;
    border-radius: var(--radius-pill);
    cursor: pointer;
    transition: background var(--transition-fast);
    align-self: flex-start;
  }

  .customizer__cta:hover {
    background: var(--color-green-dark);
  }

  .customizer__cta:focus-visible {
    outline: 3px solid #005fcc;
    outline-offset: 2px;
  }

  .customizer__option:focus-within {
    outline: 3px solid #005fcc;
    outline-offset: 2px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  @container (min-width: 768px) {
    .customizer {
      flex-direction: row;
    }

    .customizer__media {
      width: 45%;
      flex-shrink: 0;
    }

    .customizer__media img {
      height: 100%;
      aspect-ratio: unset;
    }

    .customizer__body {
      width: 55%;
    }
  }
</style>
