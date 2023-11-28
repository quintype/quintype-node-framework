function getAmpPageBasePath(opts = {}) {
  let ampPageBasePath = "/amp/story";
  if (opts.featureConfig) {
    const configAmpPath =
      typeof opts.featureConfig.ampPageBasePath === "function"
        ? opts.featureConfig.ampPageBasePath()
        : opts.featureConfig.ampPageBasePath;
    ampPageBasePath = configAmpPath || ampPageBasePath;
  }

  return ampPageBasePath;
}

module.exports = { getAmpPageBasePath };
