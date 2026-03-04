/**
 * SSO Plugin for AEM Edge Delivery Services
 *
 * Checks login on every page and redirects unauthenticated users to the
 * configured identity provider (Azure AD / Entra ID or Adobe IMS).
 *
 * Features:
 *   - OAuth 2.0 Authorization Code flow with PKCE
 *   - Configurable identity provider (Azure AD or Adobe IMS)
 *   - Single logout (SLO) with IDP session termination
 *   - Structured logging with configurable log levels
 *   - Public path allow-listing (pages that skip auth)
 *
 * Configuration is read from /config/site-config.json under the "sso" key.
 *
 * NOTE: Unlike the in-memory-only token store in auth.js, SSO redirect flows
 * require sessionStorage to persist PKCE verifiers and tokens across full-page
 * redirects. This is standard OAuth 2.0 PKCE practice (RFC 7636).
 */

/* ─── Constants ────────────────────────────────────────────────────────── */

const LOG_PREFIX = '[SSO]';
const SESSION_KEY_TOKEN = 'sso_access_token';
const SESSION_KEY_EXPIRES = 'sso_token_expires';
const SESSION_KEY_VERIFIER = 'sso_code_verifier';
const SESSION_KEY_STATE = 'sso_state';
const SESSION_KEY_RETURN_URL = 'sso_return_url';

/* ─── Log Levels ───────────────────────────────────────────────────────── */

const LOG_LEVELS = Object.freeze({
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
});

/* ─── Logger ───────────────────────────────────────────────────────────── */

/**
 * Structured logger with configurable level.
 */
export class SSOLogger {
  /**
   * @param {string} [level='info'] - Minimum log level: debug | info | warn | error
   */
  constructor(level = 'info') {
    this.level = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  }

  /* eslint-disable no-console */
  debug(...args) {
    if (this.level <= LOG_LEVELS.debug) console.debug(LOG_PREFIX, ...args);
  }

  info(...args) {
    if (this.level <= LOG_LEVELS.info) console.info(LOG_PREFIX, ...args);
  }

  warn(...args) {
    if (this.level <= LOG_LEVELS.warn) console.warn(LOG_PREFIX, ...args);
  }

  error(...args) {
    if (this.level <= LOG_LEVELS.error) console.error(LOG_PREFIX, ...args);
  }
  /* eslint-enable no-console */
}

/* ─── PKCE Helpers ─────────────────────────────────────────────────────── */

/**
 * Generate a cryptographically random string for PKCE verifier / state.
 *
 * @param {number} [length=64] - Desired length of the output string
 * @returns {string}
 */
export function generateRandomString(length = 64) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(36).padStart(2, '0'))
    .join('')
    .substring(0, length);
}

/**
 * Derive a PKCE S256 code challenge from the given verifier.
 *
 * @param {string} verifier - The code verifier string
 * @returns {Promise<string>} Base64url-encoded SHA-256 digest
 */
export async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/* ─── SSO Plugin ───────────────────────────────────────────────────────── */

/**
 * Main SSO plugin class.
 *
 * @example
 *   const plugin = new SSOPlugin(ssoConfig);
 *   await plugin.init();
 */
export class SSOPlugin {
  /**
   * @param {object} config - SSO configuration from site-config.json
   * @param {string} config.provider     - 'azure' or 'ims'
   * @param {boolean} config.enabled     - Whether SSO is active
   * @param {string} [config.logLevel]   - Log level (debug|info|warn|error)
   * @param {string[]} [config.publicPaths] - Paths that skip authentication
   * @param {string} [config.callbackPath]  - OAuth callback path
   * @param {string} [config.logoutPath]    - Logout trigger path
   * @param {object} [config.azure]      - Azure AD provider settings
   * @param {object} [config.ims]        - Adobe IMS provider settings
   */
  constructor(config) {
    this.config = config;
    this.logger = new SSOLogger(config.logLevel || 'info');
    this.provider = config.provider; // 'azure' or 'ims'
    this.publicPaths = config.publicPaths || ['/login', '/callback', '/logout'];
    this.callbackPath = config.callbackPath || '/callback';
    this.logoutPath = config.logoutPath || '/logout';
  }

  /* ── Provider helpers ─────────────────────────────────────────────── */

  /**
   * Return the provider-specific sub-config (azure or ims).
   *
   * @returns {object}
   */
  getProviderConfig() {
    return this.provider === 'azure' ? this.config.azure : this.config.ims;
  }

  /**
   * Build the authorization endpoint URL for the configured provider.
   *
   * @returns {string}
   */
  getAuthorizationEndpoint() {
    const pc = this.getProviderConfig();
    if (this.provider === 'azure') {
      return `https://login.microsoftonline.com/${pc.tenantId}/oauth2/v2.0/authorize`;
    }
    return 'https://ims-na1.adobelogin.com/ims/authorize/v2';
  }

  /**
   * Build the token endpoint URL for the configured provider.
   *
   * @returns {string}
   */
  getTokenEndpoint() {
    const pc = this.getProviderConfig();
    if (this.provider === 'azure') {
      return `https://login.microsoftonline.com/${pc.tenantId}/oauth2/v2.0/token`;
    }
    return 'https://ims-na1.adobelogin.com/ims/token/v3';
  }

  /**
   * Build the logout endpoint URL for the configured provider.
   *
   * @returns {string}
   */
  getLogoutEndpoint() {
    const pc = this.getProviderConfig();
    if (this.provider === 'azure') {
      return `https://login.microsoftonline.com/${pc.tenantId}/oauth2/v2.0/logout`;
    }
    return 'https://ims-na1.adobelogin.com/ims/logout/v1';
  }

  /* ── Path helpers ─────────────────────────────────────────────────── */

  /**
   * Check whether the given pathname is public (no authentication required).
   *
   * @param {string} pathname - URL pathname to check
   * @returns {boolean}
   */
  isPublicPath(pathname) {
    return this.publicPaths.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
  }

  /* ── Token management ─────────────────────────────────────────────── */

  /**
   * Returns true if a valid (non-expired) access token exists.
   *
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(SESSION_KEY_TOKEN)
      : null;
    const expiresAt = Number(
      typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem(SESSION_KEY_EXPIRES)
        : 0,
    );
    return !!token && Date.now() < expiresAt;
  }

  /**
   * Persist the access token in sessionStorage.
   *
   * @param {string} token     - Access token
   * @param {number} expiresIn - Seconds until expiry
   */
  setToken(token, expiresIn = 3600) {
    const expiresAt = Date.now() + expiresIn * 1000;
    sessionStorage.setItem(SESSION_KEY_TOKEN, token);
    sessionStorage.setItem(SESSION_KEY_EXPIRES, String(expiresAt));
    this.logger.info('Token stored, expires in', expiresIn, 'seconds');
  }

  /**
   * Retrieve the stored access token, or null if missing / expired.
   *
   * @returns {string|null}
   */
  getToken() {
    if (!this.isAuthenticated()) {
      this.clearToken();
      return null;
    }
    return sessionStorage.getItem(SESSION_KEY_TOKEN);
  }

  /**
   * Remove the stored access token.
   */
  clearToken() {
    sessionStorage.removeItem(SESSION_KEY_TOKEN);
    sessionStorage.removeItem(SESSION_KEY_EXPIRES);
    this.logger.info('Token cleared');
  }

  /* ── Login flow ───────────────────────────────────────────────────── */

  /**
   * Build the full authorization URL with PKCE parameters.
   *
   * @returns {Promise<string>}
   */
  async buildLoginUrl() {
    const pc = this.getProviderConfig();
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(32);

    // Store PKCE verifier + state for the callback (short-lived)
    sessionStorage.setItem(SESSION_KEY_VERIFIER, codeVerifier);
    sessionStorage.setItem(SESSION_KEY_STATE, state);
    sessionStorage.setItem(SESSION_KEY_RETURN_URL, window.location.href);

    const params = new URLSearchParams({
      client_id: pc.clientId,
      response_type: 'code',
      redirect_uri: pc.redirectUri,
      scope: pc.scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${this.getAuthorizationEndpoint()}?${params.toString()}`;
  }

  /**
   * Redirect the browser to the identity provider login page.
   */
  async redirectToLogin() {
    this.logger.info('Redirecting to', this.provider, 'login');
    const loginUrl = await this.buildLoginUrl();
    window.location.assign(loginUrl);
  }

  /* ── Callback handling ────────────────────────────────────────────── */

  /**
   * Process the OAuth callback: validate state, exchange code for token,
   * store the token, then redirect back to the original page.
   *
   * @returns {Promise<boolean>} true if the callback was handled successfully
   */
  async handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      this.logger.error(
        'IDP returned error:',
        error,
        params.get('error_description'),
      );
      return false;
    }

    // Validate state to prevent CSRF
    const savedState = sessionStorage.getItem(SESSION_KEY_STATE);
    if (state !== savedState) {
      this.logger.error('State mismatch — possible CSRF attack');
      return false;
    }

    const codeVerifier = sessionStorage.getItem(SESSION_KEY_VERIFIER);
    if (!code || !codeVerifier) {
      this.logger.error('Missing authorization code or PKCE verifier');
      return false;
    }

    try {
      const pc = this.getProviderConfig();
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: pc.redirectUri,
        client_id: pc.clientId,
        code_verifier: codeVerifier,
      });

      const response = await fetch(this.getTokenEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error('Token exchange failed:', response.status, text);
        return false;
      }

      const data = await response.json();
      this.setToken(data.access_token, data.expires_in);

      // Clean up PKCE artifacts
      sessionStorage.removeItem(SESSION_KEY_VERIFIER);
      sessionStorage.removeItem(SESSION_KEY_STATE);

      // Redirect to the page the user was originally trying to reach
      const returnUrl = sessionStorage.getItem(SESSION_KEY_RETURN_URL) || '/';
      sessionStorage.removeItem(SESSION_KEY_RETURN_URL);

      this.logger.info('Login successful, redirecting to', returnUrl);
      window.location.assign(returnUrl);
      return true;
    } catch (err) {
      this.logger.error('Token exchange error:', err.message);
      return false;
    }
  }

  /* ── Single logout ────────────────────────────────────────────────── */

  /**
   * Perform single logout: clear the local token, then redirect the browser
   * to the identity provider's logout endpoint so the IDP session is also
   * terminated.
   */
  async logout() {
    this.logger.info('Initiating single logout for provider:', this.provider);
    this.clearToken();

    const pc = this.getProviderConfig();
    const logoutEndpoint = this.getLogoutEndpoint();
    const postLogoutUri = pc.postLogoutRedirectUri || window.location.origin;

    const params = new URLSearchParams();
    if (this.provider === 'azure') {
      params.set('post_logout_redirect_uri', postLogoutUri);
    } else {
      // Adobe IMS logout parameters
      params.set('redirect_uri', postLogoutUri);
      params.set('client_id', pc.clientId);
    }

    this.logger.info('Redirecting to IDP logout endpoint');
    window.location.assign(`${logoutEndpoint}?${params.toString()}`);
  }

  /* ── Initialization ───────────────────────────────────────────────── */

  /**
   * Run the SSO check for the current page.
   *
   * Call this once per page load. It will:
   *   1. Handle /callback — exchange code for token
   *   2. Handle /logout  — perform single logout
   *   3. Skip public paths
   *   4. Redirect unauthenticated users to the IDP login
   */
  async init() {
    const { pathname } = window.location;
    this.logger.info('SSO check — path:', pathname, '| provider:', this.provider);

    // 1. OAuth callback
    if (pathname === this.callbackPath) {
      this.logger.info('Processing OAuth callback');
      await this.handleCallback();
      return;
    }

    // 2. Logout
    if (pathname === this.logoutPath) {
      await this.logout();
      return;
    }

    // 3. Public paths — no auth required
    if (this.isPublicPath(pathname)) {
      this.logger.debug('Public path — skipping auth check');
      return;
    }

    // 4. Protected path — require authentication
    if (!this.isAuthenticated()) {
      this.logger.info('User not authenticated — redirecting to login');
      await this.redirectToLogin();
    } else {
      this.logger.debug('User is authenticated');
    }
  }
}

/* ─── Configuration Loader ─────────────────────────────────────────────── */

/**
 * Fetch SSO configuration from the site config file.
 *
 * @returns {Promise<object|null>} The sso config object, or null if missing
 */
export async function loadSSOConfig() {
  try {
    const response = await fetch('/config/site-config.json');
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.warn(LOG_PREFIX, 'Could not load site-config.json:', response.status);
      return null;
    }
    const config = await response.json();
    return config.sso || null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(LOG_PREFIX, 'Failed to load SSO config:', err.message);
    return null;
  }
}

/* ─── Auto-Initialise ──────────────────────────────────────────────────── */

/**
 * Self-executing initializer.
 * Reads SSO config from site-config.json; if SSO is enabled, runs the
 * authentication check for the current page.
 */
export async function initSSO() {
  const config = await loadSSOConfig();
  if (!config || !config.enabled) return null;

  const plugin = new SSOPlugin(config);
  await plugin.init();
  return plugin;
}
