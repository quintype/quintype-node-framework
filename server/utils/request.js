import { v4 as uuidv4 } from 'uuid';

export const logRequest = (req, res) => {
  const logger = require("../logger");
  const getClient = require('../api-client').getClient;



  const qtTraceId = (req && req.headers && req.headers['qt-trace-id']) || uuidv4();
  const { path } = req;
  const { statusCode, method, statusMessage, headers } = res;

  req.headers['qt-trace-id'] = qtTraceId;

  const loggedDataAttributes = {
    request: {
      host: getClient(req.hostname).getHostname(),
      path,
      time: Date.now(),
      headers: req.headers
    },
    response: {
      statusCode,
      method,
      headers,
      statusMessage
    }
  };

  logger.info({
    level: 'info',
    logged_data: loggedDataAttributes,
    message: `PATH => ${path}`
  });

  return { req, res }
}
