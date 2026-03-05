import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

function detectProvider(url) {
  if (/youtu(\.be|be\.com)/i.test(url)) return 'youtube';
  if (/vimeo\.com/i.test(url)) return 'vimeo';
  return 'default';
}

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'embed',
    label: 'Embed',
  });

  const link = block.querySelector('a');
  const picture = block.querySelector('picture');
  const img = picture?.querySelector('img');
  const src = link?.href || '';
  const provider = detectProvider(src);
  const posterurl = img?.src || '';

  if (link) annotateField(link.closest('div') || link, { prop: 'url', type: 'text', label: 'Embed URL' });

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/embed/qsr-embed.js');
      const wc = document.createElement('qsr-embed');
      wc.setAttribute('src', src);
      wc.setAttribute('provider', provider);
      wc.setAttribute('posterurl', posterurl);
      return wc;
    },
  });
}
