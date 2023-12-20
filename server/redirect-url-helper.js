const url = require("url");
const logError = require("./logger").error;
const { match, compile } = require("path-to-regexp");

function isUrl(url) {
  try {
    return new URL(url);
  } catch (err) {
    return false;
  }
}

function processRedirects(req, res, next, sourceUrlArray, urls) {
  const query = url.parse(req.url, true) || {};
  const search = query.search || "";

  sourceUrlArray.some((sourceUrl) => {
    try {
      if (urls[sourceUrl]) {
        const destinationPath = urls[sourceUrl].destinationUrl;
        const destinationUrl = isUrl(destinationPath);
        if (isAbsoluteHttpUrl(sourceUrl)) {
          const url = new URL(`${req.protocol}://${req.get("host")}${req.originalUrl}`);
          if (`${url.origin}${url.pathname}` === sourceUrl) {
            const validStatusCodes = { 301: "max-age=604800", 302: "max-age=86400" };
            const statusCode = parseInt(urls[sourceUrl].statusCode, 10);
            const cacheValue = validStatusCodes[statusCode];
            if (cacheValue) {
              res.set("cache-control", `public,${cacheValue}`);
            }
            res.redirect(statusCode, destinationUrl.href);
            return true;
          }
        } else {
          const extractedSourceUrl = match(sourceUrl, {
            decode: decodeURIComponent,
          });
          if (extractedSourceUrl) {
            let extractedDestinationUrl;
            if (destinationUrl) {
              extractedDestinationUrl = compile(destinationUrl.pathname, {
                encode: encodeURIComponent,
              });
            } else {
              extractedDestinationUrl = compile(destinationPath, {
                encode: encodeURIComponent,
              });
            }
            const dynamicKeys = extractedSourceUrl(req.path);
            const compiledPath = dynamicKeys && extractedDestinationUrl(dynamicKeys.params);
            if (compiledPath) {
              const validStatusCodes = { 301: "max-age=604800", 302: "max-age=86400" };
              const statusCode = parseInt(urls[sourceUrl].statusCode, 10);
              const cacheValue = validStatusCodes[statusCode];
              if (cacheValue) {
                res.set("cache-control", `public,${cacheValue}`);
              }
              res.redirect(
                statusCode,
                destinationUrl
                  ? `${destinationUrl.protocol}//${destinationUrl.hostname}${compiledPath}${search}`
                  : `${compiledPath}${search}`
              );
              return true;
            }
          }
        }
      }
    } catch (err) {
      console.log(`Redirection error on ${req.hostname}-----`, err);
    }
  });
}

exports.getRedirectUrl = async function getRedirectUrl(req, res, next, { redirectUrls, config }) {
  let sourceUrls;
  if (typeof redirectUrls === "function") {
    const redirectUrlsList = await redirectUrls(config);
    sourceUrls = Object.keys(redirectUrlsList);
    if (sourceUrls.length > 0) {
      processRedirects(req, res, next, sourceUrls, redirectUrlsList);
    }
  } else if (redirectUrls) {
    sourceUrls = Object.keys(redirectUrls);
    sourceUrls.length > 0 && processRedirects(req, res, next, sourceUrls, redirectUrls);
  }
};

function isAbsoluteHttpUrl(url) {
  return url.startsWith("http");
}
