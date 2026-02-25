<!--
  qsr-user-profile Web Component
  Covers the /bff/proxy/orchestra/get-user endpoint: authenticated user profile.
  RULE 3: custom element declaration required
  RULE 4: CSS uses token values in :host block (Shadow DOM can't inherit from document tokens)
-->
<svelte:options customElement="qsr-user-profile" />

<script>
  import { onMount } from 'svelte';
  import { fetchUserProfile } from '../utils/api.js';
  import { isAuthenticated } from '../utils/auth.js';

  // RULE 3: Props MUST be lowercase
  export let market = 'us';

  let user = null;
  let isLoading = true;
  let error = null;

  onMount(async () => {
    if (!isAuthenticated()) {
      error = 'Please sign in to view your profile.';
      isLoading = false;
      return;
    }
    try {
      user = await fetchUserProfile(market);
    } catch (err) {
      error = err.message || 'Failed to load user profile.';
    } finally {
      isLoading = false;
    }
  });

  function handleSignOut() {
    // RULE 3: inter-WC communication via CustomEvent with composed:true
    dispatchEvent(
      new CustomEvent('qsr:sign-out', {
        bubbles: true,
        composed: true,
      }),
    );
  }
</script>

{#if isLoading}
  <div class="profile profile--loading" aria-busy="true">
    <div class="spinner" aria-label="Loading profile…"></div>
  </div>
{:else if error}
  <div class="profile profile--error" role="alert">
    <p>{error}</p>
  </div>
{:else if user}
  <div class="profile">
    <div class="profile__avatar" aria-hidden="true">
      {#if user.avatarUrl}
        <img src={user.avatarUrl} alt={user.displayName ?? 'Member'} />
      {:else}
        <span class="profile__avatar-initials">
          {(user.firstName?.[0] ?? user.displayName?.[0] ?? 'M').toUpperCase()}
        </span>
      {/if}
    </div>
    <div class="profile__body">
      <h2 class="profile__name">{user.displayName ?? user.firstName ?? 'Member'}</h2>
      {#if user.email}
        <p class="profile__email">{user.email}</p>
      {/if}
      <div class="profile__loyalty">
        <span class="profile__stars" aria-label="Stars balance">
          ★ {user.loyaltyStars ?? user.stars ?? 0} Stars
        </span>
        {#if user.rewardsTier ?? user.tier}
          <span class="profile__tier">{user.rewardsTier ?? user.tier}</span>
        {/if}
      </div>
    </div>
    <button class="profile__signout" on:click={handleSignOut}>Sign Out</button>
  </div>
{/if}

<style>
  /* RULE 4: copy token values into :host block for Shadow DOM */
  :host {
    --color-green-primary: #00704a;
    --color-green-dark: #1e3932;
    --color-gold: #cba258;
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
    --radius-full: 50%;
    --radius-pill: 999px;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
    --transition-fast: 150ms ease;

    display: block;
    font-family: var(--font-family-sans);
  }

  .profile {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    background: var(--color-white);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    padding: var(--space-4) var(--space-6);
  }

  .profile--loading,
  .profile--error {
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

  .profile__avatar {
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    border-radius: var(--radius-full);
    overflow: hidden;
    background: var(--color-warm-neutral);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .profile__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .profile__avatar-initials {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-green-primary);
  }

  .profile__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .profile__name {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }

  .profile__email {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .profile__loyalty {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .profile__stars {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-gold);
  }

  .profile__tier {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-green-primary);
    background: var(--color-warm-neutral);
    padding: 2px var(--space-2);
    border-radius: var(--radius-pill);
  }

  .profile__signout {
    flex-shrink: 0;
    padding: var(--space-2) var(--space-4);
    background: transparent;
    color: var(--color-text-secondary);
    font-family: var(--font-family-sans);
    font-size: 0.875rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    cursor: pointer;
    transition: var(--transition-fast);
  }

  .profile__signout:hover {
    background: var(--color-warm-neutral);
    color: var(--color-text-primary);
  }

  @media (max-width: 480px) {
    .profile {
      flex-direction: column;
      align-items: flex-start;
    }

    .profile__signout {
      align-self: flex-end;
    }
  }
</style>
