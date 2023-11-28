const _ = require("lodash");

function addLightPageHeaders(
  result,
  lightPages,
  { config, res, client, req, shouldEncodeAmpUri = true, ampPageBasePath }
) {
  const isAmpSupported = _.get(result, ["data", "story", "is-amp-supported"], false);

  if (typeof lightPages === "function" && !lightPages(config)) {
    return;
  }

  if (isAmpSupported) {
    let { path = "" } = req;

    if (typeof shouldEncodeAmpUri === "function") {
      path = shouldEncodeAmpUri(path) ? encodeURIComponent(path) : path;
    } else {
      path = shouldEncodeAmpUri ? encodeURIComponent(path) : path;
    }

    const ampPagePath = typeof ampPageBasePath === "function" ? ampPageBasePath() : ampPageBasePath;
    res.set("X-QT-Light-Pages-Url", `${req.protocol}://${req.hostname}${ampPagePath}/${path}`);
  }
}

module.exports = {
  addLightPageHeaders,
};
