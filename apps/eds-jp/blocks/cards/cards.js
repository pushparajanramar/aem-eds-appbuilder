import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'cards',
    label: 'Cards',
  });

  window.adobeDataLayer = window.adobeDataLayer || [];

  const ul = document.createElement('ul');
  ul.className = 'cards__list';

  [...block.children].forEach((row, cardIndex) => {
    const li = document.createElement('li');
    li.className = 'cards__item';

    const picture = row.querySelector('picture');
    const imgEl = row.querySelector('img');
    const title = row.querySelector('h1, h2, h3, h4, h5, h6');
    const body = [...row.querySelectorAll('p')].filter((p) => !p.querySelector('picture, img'));

    if (picture || imgEl) {
      const imgSrc = picture || imgEl;
      annotateField(imgSrc, { prop: 'image', type: 'media', label: 'Card Image' });
      if (imgEl) {
        imgEl.setAttribute('loading', 'lazy');
        imgEl.setAttribute('decoding', 'async');
      }
      const wrap = document.createElement('div');
      wrap.className = 'cards__image-wrap';
      wrap.append(imgSrc);
      li.append(wrap);
    }

    const cardBody = document.createElement('div');
    cardBody.className = 'cards__body';

    if (title) {
      annotateField(title, { prop: 'title', type: 'text', label: 'Card Title' });
      title.className = 'cards__title';
      cardBody.append(title);
    }

    body.forEach((p) => {
      annotateField(p, { prop: 'body', type: 'richtext', label: 'Card Description' });
      p.className = 'cards__description';
      cardBody.append(p);
    });

    li.append(cardBody);

    const cardTitle = title ? title.textContent.trim() : '';
    li.addEventListener('click', () => {
      window.adobeDataLayer.push({
        event: 'component:cards:click',
        component: { cardIndex, title: cardTitle },
      });
    });

    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
