const AmpOptimizer = require('@ampproject/toolbox-optimizer')

const ampOptimizer = AmpOptimizer.create()

async function optimize (ampHtml) {
  const optimizedAmp = ampOptimizer.transformHtml(ampHtml)

  return optimizedAmp
}

module.exports = { optimize }
