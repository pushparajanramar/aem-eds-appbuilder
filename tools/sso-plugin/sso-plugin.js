/**
 * DA Library Plugin — SSO Configuration
 *
 * Displays the current SSO configuration and authentication status,
 * and lets authors insert an SSO login/logout block into the document.
 */
(async () => {
  const CONFIG_URL = '/config/site-config.json';

  const { actions } = await import('https://da.live/nx/utils/sdk.js').then((m) => m.default || m);

  document.body.innerHTML = '<p class="status">Loading SSO configuration…</p>';

  try {
    const response = await fetch(CONFIG_URL);
    const config = await response.json();
    const sso = config.sso || {};

    const enabled = sso.enabled ? '✅ Enabled' : '❌ Disabled';
    const provider = sso.provider || 'not configured';
    const publicPaths = (sso.publicPaths || []).join(', ') || 'none';

    const html = `
      <div class="sso-status">
        <h3>SSO Configuration</h3>
        <table>
          <tr><td><strong>Status</strong></td><td>${enabled}</td></tr>
          <tr><td><strong>Provider</strong></td><td>${provider}</td></tr>
          <tr><td><strong>Public Paths</strong></td><td>${publicPaths}</td></tr>
          <tr><td><strong>Callback Path</strong></td><td>${sso.callbackPath || '/callback'}</td></tr>
          <tr><td><strong>Logout Path</strong></td><td>${sso.logoutPath || '/logout'}</td></tr>
        </table>
      </div>
    `;

    const blockHtml = `
      <div class="sso-login">
        <div><div>provider</div><div>${provider}</div></div>
        <div><div>login-text</div><div>Sign In</div></div>
        <div><div>logout-text</div><div>Sign Out</div></div>
      </div>
    `;

    document.body.innerHTML = `
      <div class="preview">${html}</div>
      <button id="insert">Insert SSO Login/Logout Block</button>
    `;

    document.getElementById('insert').addEventListener('click', () => {
      actions.sendHTML(blockHtml);
      actions.closeLibrary();
    });
  } catch (err) {
    document.body.innerHTML = `<p class="error">Failed to load SSO config: ${err.message}</p>`;
  }
})();
