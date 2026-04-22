const url = require('url')
const logError = require('./logger').error
const { match, compile } = require('path-to-regexp')

function isUrl (url) {
  try {
    return new URL(url)
  } catch (err) {
    return false
  }
}

const safeMatch = pattern => {
  try {
    return match(pattern, { decode: decodeURIComponent })
  } catch (err) {
    console.log(`Invalid source pattern:${pattern} error:${err}`)
    return null
  }
}

const safeCompile = pattern => {
  try {
    return compile(pattern, { encode: encodeURIComponent })
  } catch (err) {
    console.log(`Invalid destination pattern:${pattern} error:${err}`)
    return null
  }
}
function processRedirects (req, res, next, sourceUrlArray, urls) {
  const query = url.parse(req.url, true) || {}
  const search = query.search || ''
  let handled = false
  sourceUrlArray.some(sourceUrl => {
    if (handled || res.headersSent) return true
    const urlConfig = urls[sourceUrl]
    if (!urlConfig) return false

    try {
      const statusCode = parseInt(urlConfig.statusCode, 10)
      if (statusCode === 410 && !res.headersSent) {
        res.sendStatus(410)
        handled = true
        return true
      }

      const extractedSourceUrl = safeMatch(sourceUrl)

      if (!extractedSourceUrl) return false

      const destinationPath = urlConfig.destinationUrl
      const destinationUrl = isUrl(destinationPath)

      const extractedDestinationUrl = safeCompile(destinationUrl ? destinationUrl.pathname : destinationPath)

      if (!extractedDestinationUrl) return false

      const dynamicKeys = extractedSourceUrl(req.path)
      const compiledPath = dynamicKeys && extractedDestinationUrl(dynamicKeys.params)
      if (compiledPath && !res.headersSent) {
        const validStatusCodes = { 301: 'max-age=604800', 302: 'max-age=86400' }
        const cacheValue = validStatusCodes[statusCode]
        if (cacheValue) {
          res.set('cache-control', `public,${cacheValue}`)
        }

        res.redirect(
          statusCode,
          destinationUrl
            ? `${destinationUrl.protocol}//${destinationUrl.hostname}${compiledPath}${search}`
            : `${compiledPath}${search}`
        )
        handled = true
        return true
      }
    } catch (err) {
      logError(err)
      console.log(`Redirection error on ${req.hostname}${req.path}:`, err)
      if (res.headersSent) {
        handled = true
        return true
      }
    }
    return false
  })
}

exports.getRedirectUrl = async function getRedirectUrl (req, res, next, { redirectUrls, config }) {
  let sourceUrls
  if (typeof redirectUrls === 'function') {
    const redirectUrlsList = await redirectUrls(config)
    sourceUrls = Object.keys(redirectUrlsList)
    if (sourceUrls.length > 0) {
      processRedirects(req, res, next, sourceUrls, redirectUrlsList)
    }
  } else if (redirectUrls) {
    sourceUrls = Object.keys(redirectUrls)
    sourceUrls.length > 0 && processRedirects(req, res, next, sourceUrls, redirectUrls)
  }
}
