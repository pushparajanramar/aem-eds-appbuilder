/**
 * User Profile Block
 *
 * Lazy-loads the qsr-user-profile Web Component via IntersectionObserver.
 * Covers the /bff/proxy/orchestra/get-user endpoint: authenticated user profile.
 * Follows RULE 1 (Vanilla JS only) and RULE 2 (UE annotations required).
 */

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

  // RULE 1: use IntersectionObserver — never top-level await import
  const observer = new IntersectionObserver(
    async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      await import('/blocks/user-profile/qsr-user-profile.js');
      const wc = Object.assign(document.createElement('qsr-user-profile'), { market });
      block.replaceWith(wc);
    },
    { rootMargin: '200px' },
  );

  observer.observe(block);
}
