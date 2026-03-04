/**
 * Datalog — Structured request logging for Fastly Compute handlers.
 *
 * Every incoming request is recorded for auditing.
 * In Fastly Compute, logs are sent to stdout which can be routed
 * to a configured logging endpoint.
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
    action,
    method: req.method,
    market,
    url: req.url,
    timestamp: new Date().toISOString(),
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(record));
}
