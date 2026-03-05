import { getMetadata } from '../../scripts/aem.js';
import { annotateBlock, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default async function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'header',
    label: 'Header',
  });

  block.setAttribute('role', 'banner');
  block.setAttribute('aria-label', 'Header');

  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';

  await import('/blocks/header/qsr-header.js');
  const wc = document.createElement('qsr-header');
  wc.setAttribute('path', navPath);
  wc.setAttribute('role', 'banner');
  wc.setAttribute('aria-label', 'Header');
  block.replaceWith(wc);
}
