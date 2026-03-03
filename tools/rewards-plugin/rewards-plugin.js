/**
 * DA Library Plugin — Rewards
 *
 * Fetches live rewards HTML from the Fastly Compute edge function
 * and lets authors insert it into the current document as an EDS block.
 */
(async () => {
  const EDGE_URL = 'https://dynamic.yourbrand.com/rewards-provider';

  const { actions } = await import('https://da.live/nx/utils/sdk.js').then((m) => m.default || m);

  document.body.innerHTML = '<p class="status">Loading rewards data…</p>';

  try {
    const response = await fetch(EDGE_URL);
    const html = await response.text();

    document.body.innerHTML = `
      <div class="preview">${html}</div>
      <button id="insert">Insert Rewards Block</button>
    `;

    document.getElementById('insert').addEventListener('click', () => {
      actions.sendHTML(html);
      actions.closeLibrary();
    });
  } catch (err) {
    document.body.innerHTML = `<p class="error">Failed to load rewards: ${err.message}</p>`;
  }
})();
