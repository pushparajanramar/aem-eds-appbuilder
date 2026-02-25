<svelte:options customElement="qsr-form" />

<script>
  import { onMount } from 'svelte';

  export let fields = '[]';
  export let action = '/submit';
  export let redirect = '';

  $: parsedFields = (() => { try { return JSON.parse(fields); } catch(e) { return []; } })();

  let submitting = false;
  let submitted = false;
  let errorMsg = '';
  let values = {};

  $: parsedFields.forEach(f => {
    if (!(f.name in values)) values[f.name] = '';
  });

  function handleInput(name, value) {
    values = { ...values, [name]: value };
  }

  async function handleSubmit() {
    submitting = true;
    errorMsg = '';
    try {
      const res = await fetch(action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) throw new Error(`Submission failed: ${res.status}`);
      submitted = true;
      dispatchEvent(new CustomEvent('qsr:form:submit', {
        detail: { values },
        bubbles: true,
        composed: true
      }));
      window.adobeDataLayer = window.adobeDataLayer || [];
      window.adobeDataLayer.push({
        event: 'component:form:submit',
        component: { action, fields: Object.keys(values) }
      });
      if (redirect) window.location.href = redirect;
    } catch (e) {
      errorMsg = e.message;
    } finally {
      submitting = false;
    }
  }
</script>

{#if submitted}
  <div class="form__confirmation" role="alert" aria-live="polite">
    <p class="form__confirmation-msg">Thank you! Your submission has been received.</p>
  </div>
{:else}
  <form class="form" on:submit|preventDefault={handleSubmit} novalidate>
    {#each parsedFields as field}
      <div class="form__group">
        <label class="form__label" for={field.name}>
          {field.label}
          {#if field.required}<span class="form__required" aria-hidden="true">*</span>{/if}
        </label>

        {#if field.type === 'textarea'}
          <textarea
            id={field.name}
            name={field.name}
            class="form__control form__textarea"
            placeholder={field.placeholder || ''}
            required={!!field.required}
            rows={field.rows || 4}
            aria-required={!!field.required}
            value={values[field.name] || ''}
            on:input={(e) => handleInput(field.name, e.target.value)}
          ></textarea>
        {:else if field.type === 'select'}
          <select
            id={field.name}
            name={field.name}
            class="form__control form__select"
            required={!!field.required}
            aria-required={!!field.required}
            value={values[field.name] || ''}
            on:change={(e) => handleInput(field.name, e.target.value)}
          >
            <option value="">-- Select --</option>
            {#each field.options || [] as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        {:else}
          <input
            id={field.name}
            name={field.name}
            type={field.type || 'text'}
            class="form__control"
            placeholder={field.placeholder || ''}
            required={!!field.required}
            aria-required={!!field.required}
            value={values[field.name] || ''}
            on:input={(e) => handleInput(field.name, e.target.value)}
          />
        {/if}
      </div>
    {/each}

    {#if errorMsg}
      <p class="form__error" role="alert">{errorMsg}</p>
    {/if}

    <button type="submit" class="form__submit" disabled={submitting} aria-busy={submitting}>
      {#if submitting}Submitting…{:else}Submit{/if}
    </button>
  </form>
{/if}

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

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: var(--max-width-text);
  }

  .form__group {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .form__label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  .form__required {
    color: var(--color-error);
    margin-left: var(--space-1);
  }

  .form__control {
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
    background: var(--color-background);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    width: 100%;
    box-sizing: border-box;
  }

  .form__control:focus {
    outline: none;
    border-color: var(--color-interactive);
    box-shadow: 0 0 0 3px rgba(0, 112, 74, 0.15);
  }

  .form__control:invalid:not(:placeholder-shown) {
    border-color: var(--color-error);
  }

  .form__textarea {
    resize: vertical;
    min-height: 100px;
  }

  .form__select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23404040' d='M8 11L2 5h12z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right var(--space-3) center;
    background-size: 16px;
    padding-right: var(--space-8);
  }

  .form__error {
    color: var(--color-error);
    font-size: var(--font-size-sm);
    margin: 0;
  }

  .form__submit {
    align-self: flex-start;
    padding: var(--space-3) var(--space-8);
    background: var(--color-interactive);
    color: var(--color-white);
    border: none;
    border-radius: var(--radius-pill);
    font-family: var(--font-family-sans);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .form__submit:hover:not(:disabled) {
    background: var(--color-interactive-hover);
  }

  .form__submit:focus-visible {
    outline: 2px solid var(--color-interactive);
    outline-offset: 2px;
  }

  .form__submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .form__confirmation {
    padding: var(--space-6);
    background: var(--color-green-light);
    border-radius: var(--radius-md);
    text-align: center;
  }

  .form__confirmation-msg {
    margin: 0;
    color: var(--color-green-dark);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-md);
  }
</style>
