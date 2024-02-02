const { STALE_IF_ERROR_CACHE_DURATION } = require("../../constants");

async function generateServiceWorker(
  req,
  res,
  next,
  { config, generateRoutes, appendFn, assetHelper, renderServiceWorker, domainSlug, maxConfigVersion }
) {
  const configVersion = await maxConfigVersion(config, domainSlug);

  return new Promise((resolve) => {
    renderServiceWorker(
      res,
      "js/service-worker",
      {
        config,
        serviceWorkerHelper: assetHelper.serviceWorkerContents(),
        assetPath: assetHelper.assetPath,
        hostname: req.hostname,
        assetHash: assetHelper.assetHash,
        configVersion,
        getFilesForChunks: assetHelper.getFilesForChunks,
        routes: generateRoutes(config, domainSlug).filter((route) => !route.skipPWA),
      },
      (err, content) => {
        // istanbul ignore if
        if (err) {
          console.error(err);
          res.status(500).end();
        } else {
          res
            .status(200)
            .header("Content-Type", "application/javascript")
            .header(
              "Cache-Control",
              `public,max-age=300, stale-while-revalidate=1000, stale-if-error=${STALE_IF_ERROR_CACHE_DURATION}`
            )
            .header("Vary", "Accept-Encoding")
            .header("Cache-Tag", `s/${config["publisher-id"]}/service-worker s/${config["publisher-id"]}/config`)
            .write(content);
          if (appendFn) appendFn(res);
          res.end();
        }
        resolve();
      }
    );
  });
}

exports.generateServiceWorker = generateServiceWorker;
