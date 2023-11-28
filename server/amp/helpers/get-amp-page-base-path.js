const get = require("lodash/get");

function getAmpPageBasePath(opts = {}) {
  let ampPageBasePath = get(opts, ["featureConfig", "ampPageBasePath"], "/amp/story");
  ampPageBasePath = typeof ampPageBasePath === "function" ? ampPageBasePath() : ampPageBasePath;

  return ampPageBasePath;
}

module.exports = { getAmpPageBasePath };
