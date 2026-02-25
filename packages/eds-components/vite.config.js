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
