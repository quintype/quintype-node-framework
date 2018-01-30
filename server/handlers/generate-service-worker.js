const {assetPath, readAsset, assetHash} = require("../asset-helper");
const serviceWorkerContents = readAsset("serviceWorkerHelper.js");

function generateServiceWorker(req, res, {config, generateRoutes, appVersion, appendFn}) {
  res.render("js/service-worker", {
    routes: generateRoutes(config).filter(route => !route.skipPWA),
    serviceWorkerHelper: serviceWorkerContents,
    assetPath: assetPath,
    hostname: req.hostname,
    appVersion: appVersion,
    assetHash: assetHash,
  }, (err, content) => {
    if(err) {
      console.error(err);
      res.status(500).end();
    } else {
      res.status(200)
        .header("Content-Type", "application/javascript")
        .header("Cache-Control", "public,max-age=300")
        .header("Vary", "Accept-Encoding")
        .write(content);
      if(appendFn) appendFn(res);
      res.end();
    }
  });

  return Promise.resolve();
}

exports.generateServiceWorker = generateServiceWorker;
