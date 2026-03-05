<svelte:options customElement="qsr-calendar" />

<script>
  import { onMount } from 'svelte';
  
  export let month = new Date().getMonth();
  export let year = new Date().getFullYear();
  export let selected = '';
  
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  $: days = (() => {
    const d = new Date(year, +month + 1, 0).getDate();
    return Array.from({length: d}, (_, i) => String(i + 1).padStart(2, '0'));
  })();
  
  function selectDay(day) {
    selected = day;
    dispatchEvent(new CustomEvent('qsr:calendar:select', { detail: { date: `${year}-${String(+month+1).padStart(2,'0')}-${day}` }, bubbles: true, composed: true }));
  }
  function prevMonth() { if (+month === 0) { month = 11; year = +year - 1; } else { month = +month - 1; } }
  function nextMonth() { if (+month === 11) { month = 0; year = +year + 1; } else { month = +month + 1; } }
</script>

<div class="calendar" role="application" aria-label="Calendar">
  <div class="calendar__header">
    <button class="calendar__nav" aria-label="Previous month" on:click={prevMonth}>&#8249;</button>
    <span class="calendar__title">{monthNames[month]} {year}</span>
    <button class="calendar__nav" aria-label="Next month" on:click={nextMonth}>&#8250;</button>
  </div>
  <div class="calendar__grid" role="grid">
    {#each days as day}
      <button class="calendar__day {day === selected ? 'calendar__day--selected' : ''}"
        on:click={() => selectDay(day)}>{day}</button>
    {/each}
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
</style>
