<svelte:options customElement="qsr-carousel" />

<script>
  import { onMount } from 'svelte';

  export let slides = '[]';

  $: parsedSlides = (() => { try { return JSON.parse(slides); } catch(e) { return []; } })();

  let activeIndex = 0;
  let timer;
  let paused = false;

  function trackSlide() {
    window.adobeDataLayer = window.adobeDataLayer || [];
    window.adobeDataLayer.push({
      event: 'component:carousel:slide',
      component: { index: activeIndex }
    });
  }

  function prev() {
    activeIndex = (activeIndex - 1 + parsedSlides.length) % parsedSlides.length;
    trackSlide();
  }

  function next() {
    activeIndex = (activeIndex + 1) % parsedSlides.length;
    trackSlide();
  }

  function goTo(i) {
    activeIndex = i;
    trackSlide();
  }

  function startAutoplay() {
    if (parsedSlides.length > 1) {
      timer = setInterval(() => {
        if (!paused) next();
      }, 5000);
    }
  }

  function handleKeydown(e) {
    if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'ArrowRight') next();
  }

  onMount(() => {
    startAutoplay();
    return () => clearInterval(timer);
  });
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<section
  class="carousel"
  aria-roledescription="carousel"
  aria-label="Image carousel"
  on:keydown={handleKeydown}
  on:mouseenter={() => (paused = true)}
  on:mouseleave={() => (paused = false)}
  on:focusin={() => (paused = true)}
  on:focusout={() => (paused = false)}
>
  <div class="carousel__track" aria-live="polite" aria-atomic="false">
    {#each parsedSlides as slide, i}
      <div
        class="carousel__slide"
        aria-hidden={i !== activeIndex}
        aria-roledescription="slide"
        aria-label="Slide {i + 1} of {parsedSlides.length}"
        role="group"
      >
        {#if slide.imageUrl}
          <img
            src={slide.imageUrl}
            alt={slide.imageAlt || ''}
            loading={i === 0 ? 'eager' : 'lazy'}
            class="carousel__img"
          />
        {/if}
        {#if slide.contentHtml}
          <div class="carousel__caption">{@html slide.contentHtml}</div>
        {/if}
      </div>
    {/each}
  </div>

  {#if parsedSlides.length > 1}
    <button class="carousel__btn carousel__btn--prev" aria-label="Previous slide" on:click={prev}>
      &#10094;
    </button>
    <button class="carousel__btn carousel__btn--next" aria-label="Next slide" on:click={next}>
      &#10095;
    </button>

    <div class="carousel__dots" role="tablist" aria-label="Slide navigation">
      {#each parsedSlides as _, i}
        <button
          role="tab"
          class="carousel__dot"
          class:carousel__dot--active={i === activeIndex}
          aria-selected={i === activeIndex}
          aria-label="Slide {i + 1} of {parsedSlides.length}"
          on:click={() => goTo(i)}
        ></button>
      {/each}
    </div>
  {/if}
</section>

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

  .carousel {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-md);
    background: var(--color-black);
    user-select: none;
  }

  .carousel:focus-within {
    outline: 2px solid var(--color-interactive);
    outline-offset: 2px;
  }

  .carousel__track {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
  }

  .carousel__slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity var(--transition-slow);
    pointer-events: none;
  }

  .carousel__slide[aria-hidden="false"] {
    opacity: 1;
    pointer-events: auto;
  }

  .carousel__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .carousel__caption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--space-6);
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
    color: var(--color-white);
  }

  .carousel__btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.85);
    border: none;
    border-radius: var(--radius-circle);
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
    transition: background-color var(--transition-fast), box-shadow var(--transition-fast);
    z-index: var(--z-overlay);
    box-shadow: var(--shadow-sm);
  }

  .carousel__btn:hover {
    background: var(--color-white);
    box-shadow: var(--shadow-md);
  }

  .carousel__btn:focus-visible {
    outline: 2px solid var(--color-interactive);
    outline-offset: 2px;
  }

  .carousel__btn--prev {
    left: var(--space-3);
  }

  .carousel__btn--next {
    right: var(--space-3);
  }

  .carousel__dots {
    position: absolute;
    bottom: var(--space-3);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: var(--space-2);
    z-index: var(--z-overlay);
  }

  .carousel__dot {
    width: 10px;
    height: 10px;
    border-radius: var(--radius-circle);
    background: rgba(255, 255, 255, 0.6);
    border: none;
    cursor: pointer;
    padding: 0;
    transition: background-color var(--transition-fast), transform var(--transition-fast);
  }

  .carousel__dot--active {
    background: var(--color-white);
    transform: scale(1.3);
  }

  .carousel__dot:focus-visible {
    outline: 2px solid var(--color-white);
    outline-offset: 2px;
  }
</style>
