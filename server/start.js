/**
 * This namespace exports a utility function for starting the server, and correctly handling signal like SIGHUP and SIGTERM.
 * ```javascript
 * import { startApp } from "@quintype/framework/server/start";
 * ```
 * @category Server
 * @module server-start
 */

// istanbul ignore file
// This is the start file, to be called from your start.js

const chalk = require("chalk");
const cluster = require("cluster");
const process = require("process");
const { initializeAllClients, mappingHost } = require("./api-client");
const logger = require("./logger");
const logSuccess = chalk.bold.cyanBright;

function startMaster({ workers = 4 }) {
  let terminating = false;

  for (let i = 0; i < workers; i++) {
    cluster.fork();
  }

  process.on("SIGTERM", () => {
    logger.info("Caught a SIGTERM. Terminating All Workers");
    terminating = true;
    for (const worker of Object.values(cluster.workers)) {
      worker.process.kill("SIGTERM");
    }
  });

  process.on("SIGHUP", () => {
    logger.info("Respawning All Workers.");
    Object.values(cluster.workers).forEach((worker, index) => {
      if (index < workers) {
        const newWorker = cluster.fork();
        newWorker.on("listening", () => {
          worker.process.kill("SIGTERM");
        });
      } else {
        worker.process.kill("SIGTERM");
      }
    });
  });

  cluster.on("exit", (worker, code, signal) => {
    logger.error(`worker ${worker.process.pid} died`);
    const aliveWorkers = Object.values(cluster.workers).filter((worker) => worker.state !== "dead");

    if (terminating) {
      if (aliveWorkers.length == 0) {
        logger.info("All Workers Terminated. Gracefully Exiting");
        process.exit();
      }
    } else if (aliveWorkers.length < workers) {
      cluster.fork();
    }
  });
}

async function startWorker(appThunk, opts) {
  let setIntervalIndex = null;
  const { hostToApiInterval } = opts;
  if (process.env.NODE_ENV !== "production") {
    require("@quintype/build")(opts);
  }
  require("../assetify/server")();

  try {
    const app = appThunk();

    await mappingHost();
    await initializeAllClients();
    const server = app.listen(opts.port || 3000, () => {
      console.log(logSuccess(`||=============================||`));
      console.log(logSuccess(`|| App listening on port ${opts.port || 3000}! ||`));
      console.log(logSuccess(`||=============================||`));
    });

    process.on("SIGTERM", () => {
      server.close(() => {
        cluster.worker.disconnect();
        process.exit();
      });
    });
    process.on("SIGHUP", () => {});

    if (hostToApiInterval) {
      setIntervalIndex = setInterval(() => {
        mappingHost();
      }, hostToApiInterval);
    }
  } catch (e) {
    if (hostToApiInterval) {
      clearInterval(setIntervalIndex);
    }
    if (process.env.NODE_ENV !== "production") {
      console.log(e.stack);
    }

    e = e || "";
    const sleep = require("sleep-promise");
    logger.error(`Worker died - ${e.message || e}`);
    cluster.worker.disconnect();
    await sleep(opts.sleep || 250);
    process.exit();
  }
}

/**
 * This app starts a cluster with workers who listen for web requests
 * @param {function} appThunk A function which returns an express app when evaluated
 * @param {Object} opts Options that are passed to [@quintype/build](https://developers.quintype.com/quintype-node-build) (in dev mode)
 * @param {number} opts.workers The number of workers to be spawned (default 4)
 * @param {number} opts.port The port to start on (default 3000)
 * @param {number} opts.sleep Number of milliseconds to wait to respawn a terminated worker (default 250)
 */
module.exports.startApp = function (appThunk, opts = {}) {
  if (cluster.isMaster) {
    startMaster(opts);
  } else {
    startWorker(appThunk, opts);
  }
};
