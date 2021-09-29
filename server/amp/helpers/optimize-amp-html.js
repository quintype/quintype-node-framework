const AmpOptimizer = require("@ampproject/toolbox-optimizer");

const ampOptimizer = AmpOptimizer.create({
  autoAddMandatoryTags: false,
  autoExtensionImport: false,
  preloadHeroImage: false,
});

async function optimize(ampHtml) {
  const optimizedAmp = ampOptimizer.transformHtml(ampHtml);

  return optimizedAmp;
}

module.exports = { optimize };
