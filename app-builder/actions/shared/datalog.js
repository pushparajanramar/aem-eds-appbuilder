/**
 * Datalog — Structured request logging for all App Builder actions.
 *
 * Every incoming request is recorded to the datalog so that engineers
 * have a full audit trail of all traffic across actions.
 */

/**
 * Log a structured request record to the datalog.
 *
 * @param {object} logger     - Core.Logger instance for the action
 * @param {string} action     - Action name (e.g. 'device-provider')
 * @param {object} params     - Incoming action params from Adobe I/O Runtime
 */
function logRequest(logger, action, params) {
  const record = {
    type: 'datalog',
    action,
    method: (params.__ow_method || 'GET').toUpperCase(),
    market: params.market || 'us',
    timestamp: new Date().toISOString(),
  };
  logger.info(JSON.stringify(record));
}

module.exports = { logRequest };
