/**
 * Rewards Feed Block
 *
 * Lazy-loads the sbux-rewards-feed Web Component via IntersectionObserver.
 * Covers the /bff/proxy/stream/v1/me/streamItems endpoint: personalised
 * rewards and activity feed for the authenticated user.
 * Follows RULE 1 (Vanilla JS only) and RULE 2 (UE annotations required).
 */

import { readBlockConfig } from '../../scripts/aem.js';
import { annotateBlock, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const cfPath = getCFPath(block);

  // RULE 2: annotate block container before lazy-loading
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'rewards-feed',
    label: 'Rewards Feed',
  });

  const market = config.market || document.documentElement.lang?.substring(0, 2) || 'us';
  const limit = config.limit || '20';

  // RULE 1: use IntersectionObserver — never top-level await import
  const observer = new IntersectionObserver(
    async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      await import('/blocks/rewards-feed/sbux-rewards-feed.js');
      const wc = Object.assign(document.createElement('sbux-rewards-feed'), { market, limit });
      block.replaceWith(wc);
    },
    { rootMargin: '200px' },
  );

  observer.observe(block);
}
