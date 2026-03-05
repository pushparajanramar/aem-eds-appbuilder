/**
 * User Profile Block
 *
 * Lazy-loads the qsr-user-profile Web Component via IntersectionObserver.
 * Covers the /bff/proxy/orchestra/get-user endpoint: authenticated user profile.
 * Follows RULE 1 (Vanilla JS only) and RULE 2 (UE annotations required).
 */

import { withLazyLoading } from '../../scripts/a11y.js';
import { annotateBlock, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default async function decorate(block) {
  const cfPath = getCFPath(block);

  // RULE 2: annotate block container before lazy-loading
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'user-profile',
    label: 'User Profile',
  });

  const market = document.documentElement.lang?.substring(0, 2) || 'us';

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/user-profile/qsr-user-profile.js');
      const wc = Object.assign(document.createElement('qsr-user-profile'), { market });
      return wc;
    },
  });
}
