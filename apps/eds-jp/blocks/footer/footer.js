import { getMetadata } from '../../scripts/aem.js';
import { annotateBlock, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'footer',
    label: 'Footer',
  });

  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const inner = document.createElement('div');
  inner.className = 'footer__inner';

  if (fragment) {
    while (fragment.firstElementChild) {
      const section = fragment.firstElementChild;
      section.className = 'footer__section';
      inner.append(section);
    }
  }

  block.append(inner);
}
