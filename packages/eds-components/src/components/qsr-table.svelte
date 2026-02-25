<svelte:options customElement="qsr-table" />

<script>
  export let tabledata = '[]';
  export let hasheader = 'true';
  export let variants = '';

  $: parsedData = (() => { try { return JSON.parse(tabledata); } catch(e) { return []; } })();
  $: showHeader = hasheader !== 'false';
  $: variantClasses = variants
    ? variants.split(' ').map(v => 'table--' + v).join(' ')
    : '';

  $: headerRow = showHeader && parsedData.length > 0 ? parsedData[0] : [];
  $: bodyRows = showHeader && parsedData.length > 0 ? parsedData.slice(1) : parsedData;
</script>

<div class="table__wrapper">
  <table class="table {variantClasses}">
    {#if showHeader && headerRow.length > 0}
      <thead class="table__head">
        <tr class="table__row">
          {#each headerRow as cell}
            <th class="table__th" scope="col">{@html cell}</th>
          {/each}
        </tr>
      </thead>
    {/if}
    <tbody class="table__body">
      {#each bodyRows as row}
        <tr class="table__row">
          {#each row as cell}
            <td class="table__td">{@html cell}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
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

  .table__wrapper {
    width: 100%;
    overflow-x: auto;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .table__head {
    background: var(--color-green-dark);
  }

  .table__th {
    padding: var(--space-3) var(--space-4);
    text-align: left;
    font-weight: var(--font-weight-semibold);
    color: var(--color-white);
    white-space: nowrap;
    font-size: var(--font-size-sm);
  }

  .table__td {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
    vertical-align: top;
    line-height: var(--line-height-normal);
  }

  .table__row:last-child .table__td {
    border-bottom: none;
  }

  .table__body .table__row:nth-child(even) {
    background: var(--color-gray-100);
  }

  .table__body .table__row:hover {
    background: var(--color-green-light);
  }

  /* Variant: striped (same as default even rows but explicit) */
  .table--striped .table__body .table__row:nth-child(odd) {
    background: var(--color-background);
  }

  /* Variant: bordered */
  .table--bordered .table__td,
  .table--bordered .table__th {
    border: 1px solid var(--color-border);
  }

  /* Variant: compact */
  .table--compact .table__th,
  .table--compact .table__td {
    padding: var(--space-2) var(--space-3);
  }
</style>
