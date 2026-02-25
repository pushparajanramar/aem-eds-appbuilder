import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'search',
    label: 'Search',
  });

  window.adobeDataLayer = window.adobeDataLayer || [];

  const placeholder = block.querySelector('p, input');
  if (placeholder) annotateField(placeholder, { prop: 'placeholder', type: 'text', label: 'Search Placeholder' });

  const form = document.createElement('form');
  form.className = 'search__form';
  form.setAttribute('role', 'search');
  form.setAttribute('aria-label', 'Site search');

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'search__input';
  input.setAttribute('aria-label', 'Search');
  input.setAttribute('placeholder', 'Search…');
  input.setAttribute('autocomplete', 'off');

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'search__btn';
  btn.textContent = 'Search';
  btn.setAttribute('aria-label', 'Submit search');

  form.append(input, btn);

  const status = document.createElement('p');
  status.className = 'search__status';
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');

  const resultsList = document.createElement('ul');
  resultsList.className = 'search__results';
  resultsList.setAttribute('aria-label', 'Search results');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    status.textContent = 'Searching…';
    resultsList.textContent = '';

    window.adobeDataLayer.push({
      event: 'component:search:submit',
      component: { query },
    });

    try {
      const resp = await fetch(`/query-index.json?query=${encodeURIComponent(query)}`);
      const data = resp.ok ? await resp.json() : { data: [] };
      const results = data.data || [];

      if (results.length === 0) {
        const none = document.createElement('li');
        none.className = 'search__no-results';
        none.textContent = `No results found for "${query}".`;
        resultsList.append(none);
        status.textContent = 'No results found.';
      } else {
        results.slice(0, 10).forEach((item) => {
          const li = document.createElement('li');
          li.className = 'search__result-item';
          const a = document.createElement('a');
          a.href = item.path || '#';
          const title = document.createElement('p');
          title.className = 'search__result-title';
          title.textContent = item.title || item.path;
          const desc = document.createElement('p');
          desc.className = 'search__result-desc';
          desc.textContent = item.description || '';
          a.append(title, desc);
          li.append(a);
          resultsList.append(li);
        });
        status.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} found.`;
      }

      window.adobeDataLayer.push({
        event: 'component:search:results',
        component: { query, resultCount: results.length },
      });
    } catch {
      status.textContent = 'Search failed. Please try again.';
    }
  });

  block.textContent = '';
  block.append(form, status, resultsList);
}
