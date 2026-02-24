/**
 * Auth Token Utility
 *
 * Stores IMS access tokens in module-scoped memory ONLY.
 * RULE 3: NO localStorage or sessionStorage.
 */

// Module-scoped in-memory token store — never written to Web Storage
let _accessToken = null;
let _expiresAt = 0;

/**
 * Store an IMS access token in memory.
 *
 * @param {string} token      - IMS access token
 * @param {number} expiresIn  - Seconds until expiry (default: 3600)
 */
export function setAccessToken(token, expiresIn = 3600) {
  _accessToken = token;
  _expiresAt = Date.now() + expiresIn * 1000;
}

/**
 * Retrieve the stored IMS access token.
 * Returns null if no token has been set or if it has expired.
 *
 * @returns {string|null}
 */
export function getAccessToken() {
  if (!_accessToken || Date.now() >= _expiresAt) {
    _accessToken = null;
    _expiresAt = 0;
    return null;
  }
  return _accessToken;
}

/**
 * Clear the stored access token (e.g., on sign-out).
 */
export function clearAccessToken() {
  _accessToken = null;
  _expiresAt = 0;
}

/**
 * Returns true if a valid (non-expired) access token is present.
 *
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getAccessToken() !== null;
}
