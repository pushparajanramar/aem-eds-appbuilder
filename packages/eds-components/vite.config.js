import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

/**
 * Build each Svelte Web Component as a standalone IIFE bundle
 * so it can be dynamically imported by EDS blocks via:
 *   await import('/blocks/{block-name}/qsr-{wc-name}.js')
 *
 * Output paths mirror the EDS block directory structure under apps/eds-us/blocks/.
 * The CI workflow distributes the same bundles to eds-uk and eds-jp.
 */
export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        customElement: true,
      },
    }),
  ],
  build: {
    lib: {
      // Multiple entry points — one per Web Component
      entry: {
        'qsr-product-customizer': resolve(__dirname, 'src/components/qsr-product-customizer.svelte'),
        'qsr-menu-card': resolve(__dirname, 'src/components/qsr-menu-card.svelte'),
        'qsr-accordion': resolve(__dirname, 'src/components/qsr-accordion.svelte'),
        'qsr-breadcrumbs': resolve(__dirname, 'src/components/qsr-breadcrumbs.svelte'),
        'qsr-cards': resolve(__dirname, 'src/components/qsr-cards.svelte'),
        'qsr-carousel': resolve(__dirname, 'src/components/qsr-carousel.svelte'),
        'qsr-columns': resolve(__dirname, 'src/components/qsr-columns.svelte'),
        'qsr-embed': resolve(__dirname, 'src/components/qsr-embed.svelte'),
        'qsr-footer': resolve(__dirname, 'src/components/qsr-footer.svelte'),
        'qsr-form': resolve(__dirname, 'src/components/qsr-form.svelte'),
        'qsr-fragment': resolve(__dirname, 'src/components/qsr-fragment.svelte'),
        'qsr-header': resolve(__dirname, 'src/components/qsr-header.svelte'),
        'qsr-hero': resolve(__dirname, 'src/components/qsr-hero.svelte'),
        'qsr-modal': resolve(__dirname, 'src/components/qsr-modal.svelte'),
        'qsr-quote': resolve(__dirname, 'src/components/qsr-quote.svelte'),
        'qsr-search': resolve(__dirname, 'src/components/qsr-search.svelte'),
        'qsr-table': resolve(__dirname, 'src/components/qsr-table.svelte'),
        'qsr-tabs': resolve(__dirname, 'src/components/qsr-tabs.svelte'),
        'qsr-video': resolve(__dirname, 'src/components/qsr-video.svelte'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        // Place each bundle in the matching block directory
        entryFileNames: (chunk) => {
          const blockMap = {
            'qsr-product-customizer': 'product-detail',
            'qsr-menu-card': 'menu-item',
            'qsr-accordion': 'accordion',
            'qsr-breadcrumbs': 'breadcrumbs',
            'qsr-cards': 'cards',
            'qsr-carousel': 'carousel',
            'qsr-columns': 'columns',
            'qsr-embed': 'embed',
            'qsr-footer': 'footer',
            'qsr-form': 'form',
            'qsr-fragment': 'fragment',
            'qsr-header': 'header',
            'qsr-hero': 'hero',
            'qsr-modal': 'modal',
            'qsr-quote': 'quote',
            'qsr-search': 'search',
            'qsr-table': 'table',
            'qsr-tabs': 'tabs',
            'qsr-video': 'video',
          };
          const blockDir = blockMap[chunk.name] || chunk.name;
          return `${blockDir}/${chunk.name}.js`;
        },
        // No code-splitting — each WC is a standalone self-contained file
        inlineDynamicImports: false,
        manualChunks: undefined,
      },
    },
    outDir: '../../apps/eds-us/blocks',
    emptyOutDir: false,
    sourcemap: false,
  },
});
