/**
 * Datalog — Structured request logging for Fastly Compute handlers.
 *
 * Every incoming request is recorded for auditing.
 * In Fastly Compute, logs are sent to stdout which can be routed
 * to a configured logging endpoint.
 *
 * Error events are also recorded so that the datalog captures the
 * full audit trail of both successful and failed requests.
 */

/**
 * Log a structured request record.
 *
 * @param {string} action  - Handler name (e.g. 'device-provider')
 * @param {Request} req    - Fetch API Request object
 * @param {string} market  - Market code
 */
export function logRequest(action, req, market = 'us') {
  const record = {
    type: 'datalog',
    level: 'info',
    action,
    method: req.method,
    market,
    url: req.url,
    timestamp: new Date().toISOString(),
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(record));
}

/**
 * Log a structured error record to the datalog.
 * Called from catch blocks so that errors are captured in the audit trail.
 *
 * @param {string} action      - Handler name (e.g. 'menu-provider')
 * @param {Request} req        - Fetch API Request object
 * @param {string} market      - Market code
 * @param {Error|string} error - The caught error
 * @param {number} statusCode  - HTTP status code returned to the caller
 */
export function logError(action, req, market = 'us', error, statusCode) {
  const record = {
    type: 'datalog',
    level: 'error',
    action,
    method: req.method,
    market,
    url: req.url,
    statusCode,
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(record));
}
