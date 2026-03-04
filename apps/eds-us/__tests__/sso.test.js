/**
 * Tests for apps/eds-us/scripts/sso.js
 *
 * Uses jsdom environment so that sessionStorage, window.location, and
 * crypto.subtle are available (the last two are polyfilled/mocked below).
 */

import { jest } from '@jest/globals';

/* ── Browser-API mocks (must be declared before the module import) ────── */

// Minimal sessionStorage mock (jsdom provides one, but we ensure it here)
const store = {};
const sessionStorageMock = {
  getItem: jest.fn((key) => store[key] ?? null),
  setItem: jest.fn((key, val) => { store[key] = String(val); }),
  removeItem: jest.fn((key) => { delete store[key]; }),
  clear: jest.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
};
Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock, writable: true });

// window.location mock
const locationMock = { pathname: '/', href: 'https://example.com/', origin: 'https://example.com', search: '', assign: jest.fn() };
Object.defineProperty(globalThis, 'window', {
  value: { location: locationMock, innerWidth: 1024 },
  writable: true,
});

// crypto mocks
const cryptoMock = {
  getRandomValues: jest.fn((arr) => {
    for (let i = 0; i < arr.length; i += 1) arr[i] = i % 256;
    return arr;
  }),
  subtle: {
    digest: jest.fn(async () => new ArrayBuffer(32)),
  },
};
Object.defineProperty(globalThis, 'crypto', { value: cryptoMock, writable: true });

// fetch mock
globalThis.fetch = jest.fn();

// TextEncoder polyfill (may already exist in node ≥ 18)
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = class { encode(s) { return Buffer.from(s); } };
}
// btoa polyfill
if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
}

/* ── Import the module under test ─────────────────────────────────────── */

const {
  SSOPlugin,
  SSOLogger,
  generateRandomString,
  generateCodeChallenge,
  loadSSOConfig,
} = await import('../scripts/sso.js');

/* ── Helpers ──────────────────────────────────────────────────────────── */

function makeAzureConfig(overrides = {}) {
  return {
    enabled: true,
    provider: 'azure',
    logLevel: 'error', // quiet during tests
    publicPaths: ['/login', '/callback', '/logout', '/'],
    callbackPath: '/callback',
    logoutPath: '/logout',
    azure: {
      tenantId: 'test-tenant',
      clientId: 'test-client-id',
      redirectUri: 'https://example.com/callback',
      scope: 'openid profile email',
      postLogoutRedirectUri: 'https://example.com',
    },
    ims: {
      clientId: 'ims-client-id',
      redirectUri: 'https://example.com/callback',
      scope: 'openid,AdobeID',
      postLogoutRedirectUri: 'https://example.com',
    },
    ...overrides,
  };
}

function makeImsConfig(overrides = {}) {
  return makeAzureConfig({ provider: 'ims', ...overrides });
}

/* ── Tests ─────────────────────────────────────────────────────────────── */

describe('SSOLogger', () => {
  let spy;
  beforeEach(() => { spy = jest.spyOn(console, 'info').mockImplementation(() => {}); });
  afterEach(() => { spy.mockRestore(); });

  it('logs info messages when level is info', () => {
    const logger = new SSOLogger('info');
    logger.info('hello');
    expect(spy).toHaveBeenCalled();
  });

  it('suppresses info messages when level is error', () => {
    const logger = new SSOLogger('error');
    logger.info('suppressed');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('generateRandomString', () => {
  it('returns a string of the requested length', () => {
    const str = generateRandomString(32);
    expect(typeof str).toBe('string');
    expect(str.length).toBe(32);
  });

  it('defaults to length 64', () => {
    const str = generateRandomString();
    expect(str.length).toBe(64);
  });
});

describe('generateCodeChallenge', () => {
  it('returns a base64url-encoded string', async () => {
    const challenge = await generateCodeChallenge('test-verifier');
    expect(typeof challenge).toBe('string');
    // base64url must not contain +, / or =
    expect(challenge).not.toMatch(/[+/=]/);
  });
});

describe('SSOPlugin — construction', () => {
  it('stores the provider from config', () => {
    const plugin = new SSOPlugin(makeAzureConfig());
    expect(plugin.provider).toBe('azure');
  });

  it('defaults publicPaths when not supplied', () => {
    const cfg = makeAzureConfig();
    delete cfg.publicPaths;
    const plugin = new SSOPlugin(cfg);
    expect(plugin.publicPaths).toContain('/login');
  });
});

describe('SSOPlugin — provider endpoints (Azure)', () => {
  let plugin;
  beforeAll(() => { plugin = new SSOPlugin(makeAzureConfig()); });

  it('authorization endpoint includes Azure tenant', () => {
    expect(plugin.getAuthorizationEndpoint()).toContain('test-tenant');
    expect(plugin.getAuthorizationEndpoint()).toContain('login.microsoftonline.com');
  });

  it('token endpoint includes Azure tenant', () => {
    expect(plugin.getTokenEndpoint()).toContain('test-tenant');
  });

  it('logout endpoint includes Azure tenant', () => {
    expect(plugin.getLogoutEndpoint()).toContain('test-tenant');
  });
});

describe('SSOPlugin — provider endpoints (IMS)', () => {
  let plugin;
  beforeAll(() => { plugin = new SSOPlugin(makeImsConfig()); });

  it('authorization endpoint is Adobe IMS', () => {
    expect(plugin.getAuthorizationEndpoint()).toContain('adobelogin.com');
  });

  it('token endpoint is Adobe IMS', () => {
    expect(plugin.getTokenEndpoint()).toContain('adobelogin.com');
  });

  it('logout endpoint is Adobe IMS', () => {
    expect(plugin.getLogoutEndpoint()).toContain('adobelogin.com');
  });
});

describe('SSOPlugin — isPublicPath', () => {
  let plugin;
  beforeAll(() => { plugin = new SSOPlugin(makeAzureConfig()); });

  it('returns true for exact match', () => {
    expect(plugin.isPublicPath('/login')).toBe(true);
  });

  it('returns true for sub-path', () => {
    expect(plugin.isPublicPath('/login/reset')).toBe(true);
  });

  it('returns false for non-public path', () => {
    expect(plugin.isPublicPath('/account')).toBe(false);
  });
});

describe('SSOPlugin — token management', () => {
  let plugin;
  beforeEach(() => {
    sessionStorageMock.clear();
    plugin = new SSOPlugin(makeAzureConfig());
  });

  it('isAuthenticated returns false when no token is stored', () => {
    expect(plugin.isAuthenticated()).toBe(false);
  });

  it('setToken + isAuthenticated returns true', () => {
    plugin.setToken('test-token', 3600);
    expect(plugin.isAuthenticated()).toBe(true);
  });

  it('getToken returns the stored token', () => {
    plugin.setToken('abc123', 3600);
    expect(plugin.getToken()).toBe('abc123');
  });

  it('clearToken removes the token', () => {
    plugin.setToken('abc123', 3600);
    plugin.clearToken();
    expect(plugin.isAuthenticated()).toBe(false);
    expect(plugin.getToken()).toBeNull();
  });

  it('expired token returns null', () => {
    plugin.setToken('expired', -1); // negative = already expired
    expect(plugin.isAuthenticated()).toBe(false);
    expect(plugin.getToken()).toBeNull();
  });
});

describe('SSOPlugin — buildLoginUrl', () => {
  let plugin;
  beforeEach(() => {
    sessionStorageMock.clear();
    plugin = new SSOPlugin(makeAzureConfig());
  });

  it('builds a URL with client_id and code_challenge', async () => {
    const url = await plugin.buildLoginUrl();
    expect(url).toContain('client_id=test-client-id');
    expect(url).toContain('code_challenge=');
    expect(url).toContain('code_challenge_method=S256');
  });

  it('stores PKCE verifier in sessionStorage', async () => {
    await plugin.buildLoginUrl();
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      'sso_code_verifier',
      expect.any(String),
    );
  });
});

describe('SSOPlugin — redirectToLogin', () => {
  let plugin;
  beforeEach(() => {
    sessionStorageMock.clear();
    locationMock.assign.mockClear();
    plugin = new SSOPlugin(makeAzureConfig());
  });

  it('calls window.location.assign with the login URL', async () => {
    await plugin.redirectToLogin();
    expect(locationMock.assign).toHaveBeenCalledTimes(1);
    expect(locationMock.assign.mock.calls[0][0]).toContain('login.microsoftonline.com');
  });
});

describe('SSOPlugin — handleCallback', () => {
  let plugin;
  beforeEach(() => {
    sessionStorageMock.clear();
    locationMock.assign.mockClear();
    globalThis.fetch.mockReset();
    plugin = new SSOPlugin(makeAzureConfig());
  });

  it('returns false when error param is present', async () => {
    locationMock.search = '?error=access_denied&error_description=user+cancelled';
    const result = await plugin.handleCallback();
    expect(result).toBe(false);
  });

  it('returns false when state does not match', async () => {
    locationMock.search = '?code=abc&state=wrong';
    store.sso_state = 'expected';
    store.sso_code_verifier = 'verifier';
    const result = await plugin.handleCallback();
    expect(result).toBe(false);
  });

  it('exchanges code for token on valid callback', async () => {
    store.sso_state = 'test-state';
    store.sso_code_verifier = 'test-verifier';
    store.sso_return_url = 'https://example.com/dashboard';
    locationMock.search = '?code=auth-code&state=test-state';

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'new-token', expires_in: 3600 }),
    });

    const result = await plugin.handleCallback();
    expect(result).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(locationMock.assign).toHaveBeenCalledWith('https://example.com/dashboard');
  });

  it('returns false when token exchange fails', async () => {
    store.sso_state = 'test-state';
    store.sso_code_verifier = 'test-verifier';
    locationMock.search = '?code=bad-code&state=test-state';

    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'invalid_grant',
    });

    const result = await plugin.handleCallback();
    expect(result).toBe(false);
  });
});

describe('SSOPlugin — logout', () => {
  let plugin;
  beforeEach(() => {
    sessionStorageMock.clear();
    locationMock.assign.mockClear();
  });

  it('clears token and redirects to Azure logout endpoint', async () => {
    plugin = new SSOPlugin(makeAzureConfig());
    plugin.setToken('some-token', 3600);
    await plugin.logout();
    expect(plugin.isAuthenticated()).toBe(false);
    expect(locationMock.assign).toHaveBeenCalledTimes(1);
    const url = locationMock.assign.mock.calls[0][0];
    expect(url).toContain('login.microsoftonline.com');
    expect(url).toContain('post_logout_redirect_uri');
  });

  it('clears token and redirects to IMS logout endpoint', async () => {
    plugin = new SSOPlugin(makeImsConfig());
    plugin.setToken('some-token', 3600);
    await plugin.logout();
    expect(plugin.isAuthenticated()).toBe(false);
    const url = locationMock.assign.mock.calls[0][0];
    expect(url).toContain('adobelogin.com');
    expect(url).toContain('client_id=ims-client-id');
  });
});

describe('SSOPlugin — init', () => {
  let plugin;
  beforeEach(() => {
    sessionStorageMock.clear();
    locationMock.assign.mockClear();
    globalThis.fetch.mockReset();
    plugin = new SSOPlugin(makeAzureConfig());
  });

  it('handles callback path', async () => {
    locationMock.pathname = '/callback';
    locationMock.search = '?error=access_denied';
    await plugin.init();
    // Error path — should not redirect
    expect(locationMock.assign).not.toHaveBeenCalled();
  });

  it('performs logout on logout path', async () => {
    locationMock.pathname = '/logout';
    await plugin.init();
    expect(locationMock.assign).toHaveBeenCalledTimes(1);
    expect(locationMock.assign.mock.calls[0][0]).toContain('logout');
  });

  it('skips auth check for public paths', async () => {
    locationMock.pathname = '/login';
    await plugin.init();
    expect(locationMock.assign).not.toHaveBeenCalled();
  });

  it('redirects to login for unauthenticated users on protected paths', async () => {
    locationMock.pathname = '/account';
    await plugin.init();
    expect(locationMock.assign).toHaveBeenCalledTimes(1);
    expect(locationMock.assign.mock.calls[0][0]).toContain('login.microsoftonline.com');
  });

  it('does not redirect authenticated users on protected paths', async () => {
    locationMock.pathname = '/account';
    plugin.setToken('valid-token', 3600);
    await plugin.init();
    expect(locationMock.assign).not.toHaveBeenCalled();
  });
});

describe('loadSSOConfig', () => {
  beforeEach(() => { globalThis.fetch.mockReset(); });

  it('returns sso config from site-config.json', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sso: { enabled: true, provider: 'azure' } }),
    });
    const cfg = await loadSSOConfig();
    expect(cfg.enabled).toBe(true);
    expect(cfg.provider).toBe('azure');
  });

  it('returns null when sso key is missing', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ auth: {} }),
    });
    const cfg = await loadSSOConfig();
    expect(cfg).toBeNull();
  });

  it('returns null when fetch fails', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const cfg = await loadSSOConfig();
    expect(cfg).toBeNull();
    warnSpy.mockRestore();
  });

  it('returns null when fetch throws', async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error('network'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const cfg = await loadSSOConfig();
    expect(cfg).toBeNull();
    errorSpy.mockRestore();
  });
});
