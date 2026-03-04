/**
 * DA Library Plugin — User Profile
 *
 * Fetches user profile HTML from the Fastly Compute edge function
 * (requires authentication) and lets authors insert it as an EDS block.
 */
(async () => {
  const EDGE_URL = 'https://dynamic.yourbrand.com/user-provider';

  const { actions } = await import('https://da.live/nx/utils/sdk.js').then((m) => m.default || m);

  document.body.innerHTML = '<p class="status">Loading user profile…</p>';

  try {
    const response = await fetch(EDGE_URL);
    const html = await response.text();

    document.body.innerHTML = `
      <div class="preview">${html}</div>
      <button id="insert">Insert User Profile Block</button>
    `;

    document.getElementById('insert').addEventListener('click', () => {
      actions.sendHTML(html);
      actions.closeLibrary();
    });
  } catch (err) {
    document.body.innerHTML = `<p class="error">Failed to load user profile: ${err.message}</p>`;
  }
})();
