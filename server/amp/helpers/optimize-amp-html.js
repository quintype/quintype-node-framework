const AmpOptimizer = require('@ampproject/toolbox-optimizer')

const ampOptimizer = AmpOptimizer.create({
  autoAddMandatoryTags: false,
  autoExtensionImport: false,
  preloadHeroImage: false
})

const ampOptimizer1 = AmpOptimizer.create()

async function optimize (ampHtml, query) {
  const optimizedAmp = query?.prefetch ? ampOptimizer1 : ampOptimizer.transformHtml(ampHtml)

  return optimizedAmp
}

module.exports = { optimize }
