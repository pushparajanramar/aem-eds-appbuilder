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
      // Multiple entry points — one per Web Component (60 total)
      entry: {
        // Dynamic providers (special block-directory mappings)
        'qsr-product-customizer': resolve(__dirname, 'src/components/qsr-product-customizer.svelte'),
        'qsr-menu-card':          resolve(__dirname, 'src/components/qsr-menu-card.svelte'),
        // Alphabetical 1:1 components
        'qsr-accordion':          resolve(__dirname, 'src/components/qsr-accordion.svelte'),
        'qsr-alert':              resolve(__dirname, 'src/components/qsr-alert.svelte'),
        'qsr-avatar':             resolve(__dirname, 'src/components/qsr-avatar.svelte'),
        'qsr-badge':              resolve(__dirname, 'src/components/qsr-badge.svelte'),
        'qsr-banner':             resolve(__dirname, 'src/components/qsr-banner.svelte'),
        'qsr-breadcrumbs':        resolve(__dirname, 'src/components/qsr-breadcrumbs.svelte'),
        'qsr-button':             resolve(__dirname, 'src/components/qsr-button.svelte'),
        'qsr-button-group':       resolve(__dirname, 'src/components/qsr-button-group.svelte'),
        'qsr-calendar':           resolve(__dirname, 'src/components/qsr-calendar.svelte'),
        'qsr-cards':              resolve(__dirname, 'src/components/qsr-cards.svelte'),
        'qsr-carousel':           resolve(__dirname, 'src/components/qsr-carousel.svelte'),
        'qsr-checkbox':           resolve(__dirname, 'src/components/qsr-checkbox.svelte'),
        'qsr-columns':            resolve(__dirname, 'src/components/qsr-columns.svelte'),
        'qsr-date-picker':        resolve(__dirname, 'src/components/qsr-date-picker.svelte'),
        'qsr-divider':            resolve(__dirname, 'src/components/qsr-divider.svelte'),
        'qsr-drawer':             resolve(__dirname, 'src/components/qsr-drawer.svelte'),
        'qsr-dropdown-menu':      resolve(__dirname, 'src/components/qsr-dropdown-menu.svelte'),
        'qsr-embed':              resolve(__dirname, 'src/components/qsr-embed.svelte'),
        'qsr-file-upload':        resolve(__dirname, 'src/components/qsr-file-upload.svelte'),
        'qsr-footer':             resolve(__dirname, 'src/components/qsr-footer.svelte'),
        'qsr-form':               resolve(__dirname, 'src/components/qsr-form.svelte'),
        'qsr-fragment':           resolve(__dirname, 'src/components/qsr-fragment.svelte'),
        'qsr-header':             resolve(__dirname, 'src/components/qsr-header.svelte'),
        'qsr-hero':               resolve(__dirname, 'src/components/qsr-hero.svelte'),
        'qsr-icon':               resolve(__dirname, 'src/components/qsr-icon.svelte'),
        'qsr-image':              resolve(__dirname, 'src/components/qsr-image.svelte'),
        'qsr-input-field':        resolve(__dirname, 'src/components/qsr-input-field.svelte'),
        'qsr-link':               resolve(__dirname, 'src/components/qsr-link.svelte'),
        'qsr-list':               resolve(__dirname, 'src/components/qsr-list.svelte'),
        'qsr-modal':              resolve(__dirname, 'src/components/qsr-modal.svelte'),
        'qsr-pagination':         resolve(__dirname, 'src/components/qsr-pagination.svelte'),
        'qsr-popover':            resolve(__dirname, 'src/components/qsr-popover.svelte'),
        'qsr-pricing-table':      resolve(__dirname, 'src/components/qsr-pricing-table.svelte'),
        'qsr-progress-bar':       resolve(__dirname, 'src/components/qsr-progress-bar.svelte'),
        'qsr-promotion-banner':   resolve(__dirname, 'src/components/qsr-promotion-banner.svelte'),
        'qsr-quote':              resolve(__dirname, 'src/components/qsr-quote.svelte'),
        'qsr-radio-button':       resolve(__dirname, 'src/components/qsr-radio-button.svelte'),
        'qsr-rating-stars':       resolve(__dirname, 'src/components/qsr-rating-stars.svelte'),
        'qsr-rewards-feed':       resolve(__dirname, 'src/components/qsr-rewards-feed.svelte'),
        'qsr-search':             resolve(__dirname, 'src/components/qsr-search.svelte'),
        'qsr-select-dropdown':    resolve(__dirname, 'src/components/qsr-select-dropdown.svelte'),
        'qsr-sidebar':            resolve(__dirname, 'src/components/qsr-sidebar.svelte'),
        'qsr-skeleton-loader':    resolve(__dirname, 'src/components/qsr-skeleton-loader.svelte'),
        'qsr-slider':             resolve(__dirname, 'src/components/qsr-slider.svelte'),
        'qsr-spinner':            resolve(__dirname, 'src/components/qsr-spinner.svelte'),
        'qsr-stepper':            resolve(__dirname, 'src/components/qsr-stepper.svelte'),
        'qsr-store-locator':      resolve(__dirname, 'src/components/qsr-store-locator.svelte'),
        'qsr-table':              resolve(__dirname, 'src/components/qsr-table.svelte'),
        'qsr-tabs':               resolve(__dirname, 'src/components/qsr-tabs.svelte'),
        'qsr-tag':                resolve(__dirname, 'src/components/qsr-tag.svelte'),
        'qsr-testimonials':       resolve(__dirname, 'src/components/qsr-testimonials.svelte'),
        'qsr-textarea':           resolve(__dirname, 'src/components/qsr-textarea.svelte'),
        'qsr-timeline':           resolve(__dirname, 'src/components/qsr-timeline.svelte'),
        'qsr-toast':              resolve(__dirname, 'src/components/qsr-toast.svelte'),
        'qsr-toggle-switch':      resolve(__dirname, 'src/components/qsr-toggle-switch.svelte'),
        'qsr-tooltip':            resolve(__dirname, 'src/components/qsr-tooltip.svelte'),
        'qsr-user-profile':       resolve(__dirname, 'src/components/qsr-user-profile.svelte'),
        'qsr-video':              resolve(__dirname, 'src/components/qsr-video.svelte'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        // Place each bundle in the matching block directory
        entryFileNames: (chunk) => {
          const blockMap = {
            // Special mappings where WC name differs from block directory
            'qsr-product-customizer': 'product-detail',
            'qsr-menu-card':          'menu-item',
          };
          const blockDir = blockMap[chunk.name] || chunk.name.replace(/^qsr-/, '');
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
