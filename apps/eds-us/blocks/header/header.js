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

  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';

  await import('/blocks/header/qsr-header.js');
  const wc = document.createElement('qsr-header');
  wc.setAttribute('path', navPath);
  block.replaceWith(wc);
}
