/**
 * This namespace exposes a logger. We use winston under the hood for logging.
 * ```javascript
 * import logger from "@quintype/framework/server/logger";
 *
 * logger.error("Some Error Message");
 * logger.error(e);
 * ```
 * @category Server
 * @module logger
 */
// istanbul ignore file

const process = require("process");
const winston = require("winston");

const { combine, timestamp } = winston.format;

function trimNewline() {
  return {
    transform: (msg) => {
      if (msg.message && typeof message === "string" ) msg.message = msg.message.trim();
      return msg;
    },
  };
}

function createTestLogger() {
  return new winston.createLogger({
    format: combine(timestamp(), trimNewline(), winston.format.json()),
    transports: [
      new winston.transports.File({
        filename: "/dev/null",
      }),
    ],
  });
}

function createDevLogger() {
  return new winston.createLogger({
    format: combine(timestamp(), trimNewline(), winston.format.json()),
    transports: [
      new winston.transports.Console({
        colorize: true,
      }),
    ],
  });
}

function createProdLogger() {
  const transports = [
    new winston.transports.Console({
      colorize: false,
      level: "error",
    }),
  ];
  !process.env.LOG_TO_STDOUT &&
    transports.push(
      new winston.transports.File({
        filename: "log/production.log",
      })
    );
  return winston.createLogger({
    format: combine(timestamp(), trimNewline(), winston.format.json()),
    transports,
    exceptionHandlers: [new winston.transports.Console()],
    exitOnError: false,
  });
}

function createLogger() {
  switch (process.env.NODE_ENV) {
    case "production":
      return createProdLogger();
    case "test":
      return createTestLogger();
    default:
      return createDevLogger();
  }
}

function truncateStack(message) {
  if (message.length > 1024) {
    return `${message.substring(0, 1024)}... (truncated)`;
  }
  return message;
}

const logger = createLogger();
const errorFn = logger.error.bind(logger);
const infoFn = logger.error.bind(logger);
logger.error = function (e) {
  if (e && e.stack) {
    errorFn({ message: e.message, stack: truncateStack(e.stack) });
  } else {
    errorFn(e);
  }
};

logger.info = function (e) {
  if (e && e.stack) {
    infoFn({ message: e.message, stack: truncateStack(e.stack) });
  } else {
    infoFn(e);
  }
};

module.exports = logger;
