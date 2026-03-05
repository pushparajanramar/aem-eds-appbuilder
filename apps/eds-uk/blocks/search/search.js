import { annotateBlock, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'search',
    label: 'Search',
  });

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/search/qsr-search.js');
      const wc = document.createElement('qsr-search');
      return wc;
    },
  });
}
