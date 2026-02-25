<svelte:options customElement="qsr-search" />

<script>
  let query = '';
  let results = [];
  let loading = false;
  let error = '';
  let submitted = false;

  async function handleSubmit() {
    if (!query.trim()) return;
    loading = true;
    error = '';
    submitted = true;
    try {
      const r = await fetch('/search.json?q=' + encodeURIComponent(query));
      if (!r.ok) throw new Error('Search failed');
      results = await r.json();
    } catch (e) {
      error = e.message;
      results = [];
    } finally {
      loading = false;
    }
    window.adobeDataLayer = window.adobeDataLayer || [];
    window.adobeDataLayer.push({
      event: 'component:search:submit',
      component: { query }
    });
    window.adobeDataLayer.push({
      event: 'component:search:results',
      component: { query, resultCount: results.length }
    });
    dispatchEvent(new CustomEvent('qsr:search:results', {
      detail: { query, results },
      bubbles: true,
      composed: true
    }));
  }
</script>

<div class="search">
  <form role="search" class="search__form" on:submit|preventDefault={handleSubmit}>
    <label class="search__label" for="search-input">Search</label>
    <div class="search__input-row">
      <input
        id="search-input"
        type="search"
        class="search__input"
        bind:value={query}
        placeholder="Search…"
        aria-label="Search"
        autocomplete="off"
      />
      <button type="submit" class="search__btn" aria-label="Submit search" disabled={loading}>
        {#if loading}
          <span class="search__spinner" aria-hidden="true"></span>
        {:else}
          <svg class="search__icon" viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
            <line x1="16.5" y1="16.5" x2="22" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        {/if}
      </button>
    </div>
  </form>

  <div aria-live="polite" aria-atomic="false" class="search__results">
    {#if loading}
      <p class="search__status">Searching…</p>
    {:else if error}
      <p class="search__error" role="alert">{error}</p>
    {:else if submitted && results.length === 0}
      <p class="search__empty">No results found for <strong>{query}</strong>.</p>
    {:else if results.length > 0}
      <p class="search__count">{results.length} result{results.length !== 1 ? 's' : ''} for <strong>{query}</strong></p>
      <ul class="search__list" role="list">
        {#each results as result}
          <li class="search__item">
            <a href={result.path || result.url || '#'} class="search__link">
              <span class="search__result-title">{result.title || result.name || result.path}</span>
              {#if result.description}
                <span class="search__result-desc">{result.description}</span>
              {/if}
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
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
  }

  .search {
    width: 100%;
    max-width: var(--max-width-text);
  }

  .search__label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--space-2);
  }

  .search__input-row {
    display: flex;
    gap: 0;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    overflow: hidden;
    transition: box-shadow var(--transition-fast);
    background: var(--color-background);
  }

  .search__input-row:focus-within {
    box-shadow: 0 0 0 3px rgba(0, 112, 74, 0.15);
    border-color: var(--color-interactive);
  }

  .search__input {
    flex: 1;
    padding: var(--space-3) var(--space-4);
    border: none;
    outline: none;
    font-family: var(--font-family-sans);
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
    background: transparent;
    min-width: 0;
  }

  .search__btn {
    padding: var(--space-3) var(--space-4);
    background: var(--color-interactive);
    border: none;
    cursor: pointer;
    color: var(--color-white);
    display: flex;
    align-items: center;
    transition: background-color var(--transition-fast);
    flex-shrink: 0;
  }

  .search__btn:hover:not(:disabled) {
    background: var(--color-interactive-hover);
  }

  .search__btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .search__icon {
    display: block;
  }

  .search__spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: var(--color-white);
    border-radius: var(--radius-circle);
    animation: spin 0.8s linear infinite;
    display: block;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .search__results {
    margin-top: var(--space-4);
  }

  .search__status,
  .search__count,
  .search__empty {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-3);
  }

  .search__error {
    color: var(--color-error);
    font-size: var(--font-size-sm);
    margin: 0;
  }

  .search__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .search__item {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .search__link {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-4);
    text-decoration: none;
    transition: background-color var(--transition-fast);
  }

  .search__link:hover {
    background: var(--color-gray-100);
  }

  .search__link:focus-visible {
    outline: 2px solid var(--color-interactive);
    outline-offset: -2px;
  }

  .search__result-title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-interactive);
    font-size: var(--font-size-base);
  }

  .search__result-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
  }
</style>
