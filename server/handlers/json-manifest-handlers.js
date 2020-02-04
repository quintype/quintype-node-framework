const get = require("lodash/get");
const Promise = require("bluebird");

exports.handleManifest = function handleManifest(
  req,
  res,
  next,
  { config, logError, manifestFn }
) {
  return new Promise(resolve => resolve(manifestFn(config)))
    .then(result => {
      res.setHeader("Cache-Control", "public,max-age=900");
      res.setHeader("Vary", "Accept-Encoding");
      res.json(
        Object.assign(
          {
            name: get(config, ["publisher-settings", "title"]),
            short_name: get(config, ["publisher-settings", "title"]),
            start_url: "/",
            display: "standalone",
            background_color: "#eee"
          },
          result
        )
      );
    })
    .catch(e => {
      logError(e);
      res.status(500);
      res.send(e.message);
    })
    .finally(() => res.end());
};

exports.handleAssetLink = function handleAssetLink(
  req,
  res,
  next,
  { config, logError, assetLinkFn }
) {
  return new Promise(resolve => resolve(assetLinkFn(config)))
    .then(({ packageName, authorizedKeys }) => {
      res.setHeader("Cache-Control", "public,max-age=900");
      res.setHeader("Vary", "Accept-Encoding");
      res.json([
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: packageName,
            sha256_cert_fingerprints: authorizedKeys
          }
        }
      ]);
    })
    .catch(e => {
      logError(e);
      res.status(500);
      res.send(e.message);
    })
    .finally(() => res.end());
};
