<svelte:options customElement="qsr-modal" />

<script>
  import { onMount } from 'svelte';

  export let open = 'false';
  export let contenthtml = '';
  export let label = 'Dialog';

  let dialogEl;

  $: isOpen = open === 'true';

  $: if (dialogEl) {
    if (isOpen) {
      dialogEl.showModal();
    } else {
      if (dialogEl.open) dialogEl.close();
    }
  }

  function handleClose() {
    dispatchEvent(new CustomEvent('qsr:modal:close', { bubbles: true, composed: true }));
    window.adobeDataLayer = window.adobeDataLayer || [];
    window.adobeDataLayer.push({ event: 'component:modal:close' });
  }

  function handleBackdropClick(e) {
    if (e.target === dialogEl) handleClose();
  }

  function trapFocus(e) {
    if (!dialogEl || !dialogEl.open) return;
    const focusable = Array.from(
      dialogEl.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.disabled);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    if (e.key === 'Escape') handleClose();
  }

  onMount(() => {
    if (dialogEl) {
      dialogEl.addEventListener('click', handleBackdropClick);
      dialogEl.addEventListener('keydown', trapFocus);
    }
    return () => {
      if (dialogEl) {
        dialogEl.removeEventListener('click', handleBackdropClick);
        dialogEl.removeEventListener('keydown', trapFocus);
      }
    };
  });
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog
  bind:this={dialogEl}
  aria-label={label}
  class="modal__dialog"
  on:close={handleClose}
>
  <div class="modal__inner">
    <button
      class="modal__close"
      aria-label="Close dialog"
      on:click={handleClose}
    >
      &times;
    </button>
    <div class="modal__content">
      {@html contenthtml}
    </div>
  </div>
</dialog>

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

  .modal__dialog {
    padding: 0;
    border: none;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: min(90vw, 640px);
    width: 100%;
    background: var(--color-background);
    color: var(--color-text-primary);
  }

  .modal__dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
  }

  .modal__inner {
    position: relative;
    padding: var(--space-8);
  }

  .modal__close {
    position: absolute;
    top: var(--space-4);
    right: var(--space-4);
    width: 36px;
    height: 36px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--color-text-secondary);
    border-radius: var(--radius-circle);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color var(--transition-fast), color var(--transition-fast);
  }

  .modal__close:hover {
    background: var(--color-gray-100);
    color: var(--color-text-primary);
  }

  .modal__close:focus-visible {
    outline: 2px solid var(--color-interactive);
    outline-offset: 2px;
  }

  .modal__content {
    line-height: var(--line-height-normal);
  }

  .modal__content :global(h2),
  .modal__content :global(h3) {
    margin-top: 0;
    color: var(--color-text-primary);
    line-height: var(--line-height-tight);
  }
</style>
