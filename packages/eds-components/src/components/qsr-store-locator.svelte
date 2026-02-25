<!--
  qsr-store-locator Web Component
  Covers the /bff/locations endpoint: nearby-store search by lat/lng or place name.
  RULE 3: custom element declaration required
  RULE 4: CSS uses token values in :host block (Shadow DOM can't inherit from document tokens)
-->
<svelte:options customElement="qsr-store-locator" />

<script>
  import { onMount } from 'svelte';
  import { fetchNearbyStores } from '../utils/api.js';

  // RULE 3: Props MUST be lowercase
  export let market = 'us';
  export let lat = '';
  export let lng = '';
  export let place = '';
  export let radius = '5';

  let stores = [];
  let isLoading = false;
  let error = null;
  let searchPlace = place;

  onMount(async () => {
    if (lat && lng) {
      await loadStores({ lat: Number(lat), lng: Number(lng) });
    } else if (place) {
      await loadStores({ place });
    }
  });

  async function loadStores(opts) {
    isLoading = true;
    error = null;
    try {
      const result = await fetchNearbyStores({ ...opts, market, radius: Number(radius) });
      stores = Array.isArray(result) ? result : (result?.data ?? []);
    } catch (err) {
      error = err.message || 'Failed to load stores.';
    } finally {
      isLoading = false;
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchPlace.trim()) return;
    await loadStores({ place: searchPlace.trim() });
  }

  function handleLocate() {
    if (!navigator.geolocation) {
      error = 'Geolocation is not supported by your browser.';
      return;
    }
    isLoading = true;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await loadStores({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        isLoading = false;
        error = 'Unable to retrieve your location.';
      },
    );
  }
</script>

<div class="locator">
  <form class="locator__search" on:submit={handleSearch}>
    <input
      class="locator__input"
      type="text"
      placeholder="Enter city, address or zip code"
      bind:value={searchPlace}
      aria-label="Search location"
    />
    <button class="locator__btn locator__btn--search" type="submit">Find Stores</button>
    <button class="locator__btn locator__btn--locate" type="button" on:click={handleLocate}>
      Use My Location
    </button>
  </form>

  {#if isLoading}
    <div class="locator__status" role="status" aria-busy="true">
      <div class="spinner" role="img" aria-label="Searching for stores…"></div>
    </div>
  {:else if error}
    <div class="locator__error" role="alert">{error}</div>
  {:else if stores.length === 0 && (lat || place)}
    <p class="locator__empty">No stores found in this area.</p>
  {:else}
    <ul class="locator__list">
      {#each stores as store (store.id ?? store.storeNumber ?? store.name)}
        <li class="store-card">
          <h3 class="store-card__name">{store.name}</h3>
          <address class="store-card__address">
            {store.address}<br />
            {store.city}{store.state ? `, ${store.state}` : ''} {store.zip ?? store.postcode ?? ''}
          </address>
          {#if store.phone}
            <p class="store-card__phone">{store.phone}</p>
          {/if}
          {#if store.hours}
            <p class="store-card__hours">{store.hours}</p>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

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
    --font-family-sans: 'SoDo Sans', 'Helvetica Neue', Arial, sans-serif;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    --radius-md: 8px;
    --radius-pill: 999px;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
    --transition-fast: 150ms ease;

    display: block;
    font-family: var(--font-family-sans);
    container-type: inline-size;
  }

  .locator__search {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }

  .locator__input {
    flex: 1 1 200px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    font-family: var(--font-family-sans);
    font-size: 0.875rem;
    color: var(--color-text-primary);
  }

  .locator__btn {
    padding: var(--space-2) var(--space-4);
    border: none;
    border-radius: var(--radius-pill);
    font-family: var(--font-family-sans);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .locator__btn--search {
    background: var(--color-green-primary);
    color: var(--color-white);
  }

  .locator__btn--search:hover {
    background: var(--color-green-dark);
  }

  .locator__btn--locate {
    background: var(--color-warm-neutral);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }

  .locator__btn--locate:hover {
    background: var(--color-border);
  }

  .locator__input:focus-visible {
    outline: 3px solid #005fcc;
    outline-offset: 2px;
  }

  .locator__btn:focus-visible {
    outline: 3px solid #005fcc;
    outline-offset: 2px;
  }

  .locator__status {
    display: flex;
    justify-content: center;
    padding: var(--space-6);
  }

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-green-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .locator__error {
    color: #c00;
    padding: var(--space-3);
  }

  .locator__empty {
    color: var(--color-text-secondary);
    padding: var(--space-3);
  }

  .locator__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .store-card {
    background: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    box-shadow: var(--shadow-sm);
  }

  .store-card__name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-2);
  }

  .store-card__address {
    font-style: normal;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .store-card__phone,
  .store-card__hours {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin: var(--space-2) 0 0;
  }

  @container (min-width: 768px) {
    .locator__list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
