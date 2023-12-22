async function generateServiceWorker(
  req,
  res,
  next,
  {
    config,
    generateRoutes,
    appendFn,
    assetHelper,
    renderServiceWorker,
    domainSlug,
    maxConfigVersion,
  }
) {
  const configVersion = await maxConfigVersion(config, domainSlug);
  const customAssetHelper = typeof assetHelper === 'function' && Object.keys(config).length > 0 ? assetHelper(config) : assetHelper;

  return new Promise((resolve) => {
    renderServiceWorker(
      res,
      "js/service-worker",
      {
        config,
        serviceWorkerHelper: customAssetHelper.serviceWorkerContents(),
        assetPath: customAssetHelper.assetPath,
        hostname: req.hostname,
        assetHash: customAssetHelper.assetHash,
        configVersion,
        getFilesForChunks: customAssetHelper.getFilesForChunks,
        routes: generateRoutes(config, domainSlug).filter(
          (route) => !route.skipPWA
        ),
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
            .header("Cache-Control", "public,max-age=300")
            .header("Vary", "Accept-Encoding")
            .header(
              "Cache-Tag",
              `s/${config["publisher-id"]}/service-worker s/${config["publisher-id"]}/config`
            )
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
