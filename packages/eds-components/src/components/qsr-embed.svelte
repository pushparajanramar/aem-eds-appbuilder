<svelte:options customElement="qsr-embed" />

<script>
  import { onMount } from 'svelte';
  import { buildDynamicMediaUrl, buildDynamicMediaSrcset } from '../utils/image-utils.js';

  const POSTER_IMAGE_WIDTH = 800;

  export let src = '';
  export let provider = 'default';
  export let posterurl = '';

  let loaded = false;
  let loading = false;
  let containerEl;

  function getYouTubeId(url) {
    const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return m ? m[1] : url;
  }

  function getVimeoId(url) {
    const m = url.match(/vimeo\.com\/(\d+)/);
    return m ? m[1] : url;
  }

  function loadEmbed() {
    loading = true;
    loaded = true;
    window.adobeDataLayer = window.adobeDataLayer || [];
    window.adobeDataLayer.push({
      event: 'component:embed:play',
      component: { src, provider }
    });
  }

  $: embedSrc = (() => {
    if (!loaded) return '';
    if (provider === 'youtube') return `https://www.youtube.com/embed/${getYouTubeId(src)}?autoplay=1`;
    if (provider === 'vimeo') return `https://player.vimeo.com/video/${getVimeoId(src)}?autoplay=1`;
    return src;
  })();

  onMount(() => {
    if (!posterurl && containerEl) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !loaded) {
            loadEmbed();
            observer.disconnect();
          }
        },
        { rootMargin: '200px' }
      );
      observer.observe(containerEl);
      return () => observer.disconnect();
    }
  });
</script>

<div class="embed" bind:this={containerEl}>
  {#if !loaded && posterurl}
    <div class="embed__poster" role="button" tabindex="0" aria-label="Play video" on:click={loadEmbed} on:keydown={(e) => e.key === 'Enter' && loadEmbed()}>
      <picture>
        <source type="image/webp" srcset={buildDynamicMediaSrcset(posterurl, POSTER_IMAGE_WIDTH)} />
        <img
          src={buildDynamicMediaUrl(posterurl, POSTER_IMAGE_WIDTH, { format: 'jpeg' })}
          alt="Video poster"
          class="embed__poster-img"
          loading="lazy"
          decoding="async"
          width={POSTER_IMAGE_WIDTH}
        />
      </picture>
      <span class="embed__play-btn" aria-hidden="true">
        <svg viewBox="0 0 68 48" width="68" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="68" height="48" rx="8" fill="rgba(0,0,0,0.7)" />
          <polygon points="26,14 54,24 26,34" fill="white" />
        </svg>
      </span>
    </div>
  {/if}

  {#if loading && !loaded}
    <div class="embed__spinner" aria-label="Loading" role="status">
      <span class="embed__spinner-circle"></span>
    </div>
  {/if}

  {#if loaded}
    {#if provider === 'youtube' || provider === 'vimeo'}
      <iframe
        class="embed__iframe"
        src={embedSrc}
        title="Embedded video"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
        loading="lazy"
      ></iframe>
    {:else}
      <!-- svelte-ignore a11y-media-has-caption -->
      <video class="embed__video" src={src} controls autoplay playsinline></video>
    {/if}
  {/if}
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

  .embed {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: var(--color-black);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .embed__poster {
    position: absolute;
    inset: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .embed__poster:focus-visible {
    outline: 2px solid var(--color-interactive);
    outline-offset: 2px;
  }

  .embed__poster-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .embed__play-btn {
    position: absolute;
    transition: transform var(--transition-fast), opacity var(--transition-fast);
  }

  .embed__poster:hover .embed__play-btn {
    transform: scale(1.1);
    opacity: 0.9;
  }

  .embed__iframe,
  .embed__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }

  .embed__spinner {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .embed__spinner-circle {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: var(--color-white);
    border-radius: var(--radius-circle);
    animation: spin 0.8s linear infinite;
    display: block;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
