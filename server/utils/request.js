export const logRequest = (req, res) => {
  const logger = require("../logger");
  const { path } = req;
  const { statusCode, method, statusMessage, headers } = res;
  const loggedDataAttributes = {
    request: {
      host: req.headers['host'],
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
  return logger.info({
    level: 'info',
    logged_data: loggedDataAttributes,
    message: `PATH => ${path}`
  });
}
