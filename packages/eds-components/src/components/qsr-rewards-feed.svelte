<!--
  qsr-rewards-feed Web Component
  Covers the /bff/proxy/stream/v1/me/streamItems endpoint: personalised rewards
  and activity feed for the authenticated user.
  RULE 3: custom element declaration required
  RULE 4: CSS uses token values in :host block (Shadow DOM can't inherit from document tokens)
-->
<svelte:options customElement="qsr-rewards-feed" />

<script>
  import { onMount } from 'svelte';
  import { fetchStreamItems } from '../utils/api.js';
  import { isAuthenticated } from '../utils/auth.js';
  import { buildDynamicMediaUrl, buildDynamicMediaSrcset } from '../utils/image-utils.js';

  // RULE 3: Props MUST be lowercase
  export let market = 'us';
  export let limit = '20';

  // Feed card thumbnails are 100 px wide; request 100 px (1×) / 200 px (2×)
  const FEED_IMAGE_WIDTH = 100;

  let items = [];
  let isLoading = true;
  let error = null;

  onMount(async () => {
    if (!isAuthenticated()) {
      error = 'Please sign in to view your rewards.';
      isLoading = false;
      return;
    }
    try {
      const result = await fetchStreamItems(market, Number(limit));
      items = Array.isArray(result) ? result : (result?.items ?? result?.data ?? []);
    } catch (err) {
      error = err.message || 'Failed to load rewards feed.';
    } finally {
      isLoading = false;
    }
  });

  function handleRedeem(item) {
    // RULE 3: inter-WC communication via CustomEvent with composed:true
    dispatchEvent(
      new CustomEvent('qsr:redeem', {
        detail: { itemId: item.id, itemType: item.type, market },
        bubbles: true,
        composed: true,
      }),
    );
  }
</script>

{#if isLoading}
  <div class="feed feed--loading" role="status" aria-busy="true">
    <div class="spinner" role="img" aria-label="Loading rewards…"></div>
  </div>
{:else if error}
  <div class="feed feed--error" role="alert">
    <p>{error}</p>
  </div>
{:else if items.length === 0}
  <p class="feed__empty">No rewards or activity to display.</p>
{:else}
  <ul class="feed__list">
    {#each items as item (item.id)}
      <li class="feed-card" data-type={item.type ?? 'activity'}>
        {#if item.imageUrl}
          <div class="feed-card__media">
            <picture>
              <source type="image/webp" srcset={buildDynamicMediaSrcset(item.imageUrl, FEED_IMAGE_WIDTH)} />
              <img
                src={buildDynamicMediaUrl(item.imageUrl, FEED_IMAGE_WIDTH, { format: 'jpeg' })}
                alt={item.title ?? ''}
                loading="lazy"
                width={FEED_IMAGE_WIDTH}
              />
            </picture>
          </div>
        {/if}
        <div class="feed-card__body">
          <p class="feed-card__type">{item.type ?? 'Activity'}</p>
          <h3 class="feed-card__title">{item.title ?? ''}</h3>
          {#if item.description}
            <p class="feed-card__description">{item.description}</p>
          {/if}
          {#if item.expiresAt}
            <p class="feed-card__expires">Expires: {item.expiresAt}</p>
          {/if}
          {#if item.redeemable}
            <button class="feed-card__redeem" on:click={() => handleRedeem(item)} aria-label="Redeem {item.title ?? 'reward'}">
              Redeem
            </button>
          {/if}
        </div>
      </li>
    {/each}
  </ul>
{/if}

<style>
  /* RULE 4: copy token values into :host block for Shadow DOM */
  :host {
    --color-green-primary: #00704a;
    --color-green-dark: #1e3932;
    --color-gold: #7d5b00;
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
    --transition-fast: 150ms ease;

    display: block;
    font-family: var(--font-family-sans);
    container-type: inline-size;
  }

  .feed--loading,
  .feed--error {
    display: flex;
    justify-content: center;
    padding: var(--space-6);
    color: var(--color-text-secondary);
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

  .feed__empty {
    color: var(--color-text-secondary);
    text-align: center;
    padding: var(--space-6);
  }

  .feed__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .feed-card {
    display: flex;
    gap: var(--space-4);
    background: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .feed-card__media {
    flex-shrink: 0;
    width: 100px;
  }

  .feed-card__media img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .feed-card__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
  }

  .feed-card__type {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-green-primary);
    margin: 0;
  }

  .feed-card__title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .feed-card__description {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  .feed-card__expires {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .feed-card__redeem {
    align-self: flex-start;
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
    margin-top: auto;
  }

  .feed-card__redeem:hover {
    background: var(--color-green-dark);
  }

  .feed-card__redeem:focus-visible {
    outline: 3px solid #005fcc;
    outline-offset: 2px;
  }

  @container (min-width: 768px) {
    .feed__list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
