/**
 * DA Library Plugin — Device Info
 *
 * Fetches device detection meta HTML from the Fastly Compute edge function
 * and lets authors insert it into the current document.
 */
(async () => {
  const EDGE_URL = 'https://dynamic.yourbrand.com/device-provider';

  const { actions } = await import('https://da.live/nx/utils/sdk.js').then((m) => m.default || m);

  document.body.innerHTML = '<p class="status">Loading device info…</p>';

  try {
    const response = await fetch(EDGE_URL, {
      headers: { Accept: 'text/html' },
    });
    const html = await response.text();

    document.body.innerHTML = `
      <div class="preview">${html}</div>
      <button id="insert">Insert Device Meta Block</button>
    `;

    document.getElementById('insert').addEventListener('click', () => {
      actions.sendHTML(html);
      actions.closeLibrary();
    });
  } catch (err) {
    document.body.innerHTML = `<p class="error">Failed to load device info: ${err.message}</p>`;
  }
})();
