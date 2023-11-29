const get = require("lodash/get");

function getAmpPageBasePath(opts = {}, config) {
  let ampPageBasePath = get(opts, ["featureConfig", "ampPageBasePath"], "/amp/story");
  ampPageBasePath = typeof ampPageBasePath === "function" ? ampPageBasePath(config) : ampPageBasePath;

  return ampPageBasePath;
}

module.exports = { getAmpPageBasePath };
