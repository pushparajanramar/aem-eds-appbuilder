/**
 * DA Library Plugin — Store Locator
 *
 * Fetches live store location HTML from the Fastly Compute edge function
 * and lets authors insert it into the current document as an EDS block.
 */
(async () => {
  const EDGE_URL = 'https://dynamic.yourbrand.com/store-provider';

  const { actions } = await import('https://da.live/nx/utils/sdk.js').then((m) => m.default || m);

  document.body.innerHTML = '<p class="status">Loading store data…</p>';

  try {
    const response = await fetch(EDGE_URL);
    const html = await response.text();

    document.body.innerHTML = `
      <div class="preview">${html}</div>
      <button id="insert">Insert Store Locator Block</button>
    `;

    document.getElementById('insert').addEventListener('click', () => {
      actions.sendHTML(html);
      actions.closeLibrary();
    });
  } catch (err) {
    document.body.innerHTML = `<p class="error">Failed to load stores: ${err.message}</p>`;
  }
})();
