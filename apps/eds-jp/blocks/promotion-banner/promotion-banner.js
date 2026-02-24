/**
 * Promotion Banner Block
 *
 * Renders a full-width promotional banner backed by a Content Fragment.
 * Follows RULE 1 (Vanilla JS only) and RULE 2 (UE annotations required).
 */

import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default async function decorate(block) {
  const cfPath = getCFPath(block);

  // RULE 2: annotate block container
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'promotion',
    label: 'Promotion Banner',
  });

  // Extract content from EDS block table rows
  const rows = [...block.querySelectorAll(':scope > div')];
  const title = rows[0]?.querySelector('h1, h2, h3, p');
  const description = rows[1]?.querySelector('p');
  const picture = block.querySelector('picture');
  const ctaLink = rows[2]?.querySelector('a');

  // RULE 2: annotate individual editable fields
  annotateField(title, { prop: 'title', type: 'text', label: 'Headline' });
  annotateField(description, { prop: 'description', type: 'richtext', label: 'Description' });
  annotateField(picture, { prop: 'bannerImage', type: 'media', label: 'Banner Image' });
  if (ctaLink) {
    annotateField(ctaLink, { prop: 'ctaLink', type: 'reference', label: 'CTA Link' });
  }

  // Restructure DOM into semantic banner markup
  const banner = document.createElement('div');
  banner.className = 'promotion-banner__inner';

  if (picture) {
    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'promotion-banner__media';
    mediaWrap.append(picture);
    banner.append(mediaWrap);
  }

  const content = document.createElement('div');
  content.className = 'promotion-banner__content';
  if (title) content.append(title);
  if (description) content.append(description);
  if (ctaLink) {
    ctaLink.className = 'promotion-banner__cta';
    content.append(ctaLink);
  }
  banner.append(content);

  block.textContent = '';
  block.append(banner);
}
