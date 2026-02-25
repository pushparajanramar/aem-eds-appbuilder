import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'hero',
    label: 'Hero',
  });

  const picture = block.querySelector('picture');
  const img = block.querySelector('img');
  const heading = block.querySelector('h1, h2, h3');
  const description = [...block.querySelectorAll('p')].find((p) => !p.querySelector('picture, a'));
  const cta = block.querySelector('a');

  if (picture || img) {
    annotateField(picture || img, { prop: 'image', type: 'media', label: 'Hero Image' });
    if (img) {
      img.setAttribute('loading', 'eager');
      img.setAttribute('decoding', 'async');
    }
  }
  if (heading) annotateField(heading, { prop: 'heading', type: 'text', label: 'Heading' });
  if (description) annotateField(description, { prop: 'description', type: 'richtext', label: 'Description' });
  if (cta) annotateField(cta, { prop: 'cta', type: 'reference', label: 'CTA Link' });

  block.textContent = '';

  if (picture || img) {
    const bg = document.createElement('div');
    bg.className = 'hero__bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.append(picture || img);
    block.append(bg);
  }

  const overlay = document.createElement('div');
  overlay.className = 'hero__overlay';
  overlay.setAttribute('aria-hidden', 'true');
  block.append(overlay);

  const content = document.createElement('div');
  content.className = 'hero__content';
  if (heading) content.append(heading);
  if (description) content.append(description);
  if (cta) {
    cta.className = 'hero__cta';
    content.append(cta);
  }
  block.append(content);
}
