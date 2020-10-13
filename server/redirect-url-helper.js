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
    if (urls[sourceUrl]) {
      const destinationPath = urls[sourceUrl].destinationUrl;
      const extractedSourceUrl = match(sourceUrl, {
        decode: decodeURIComponent,
      });
      const destinationUrl = isUrl(destinationPath);
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
        const compiledPath =
          dynamicKeys && extractedDestinationUrl(dynamicKeys.params);
        if (compiledPath) {
          res.redirect(
            urls[sourceUrl].statusCode,
            destinationUrl
              ? `${destinationUrl.protocol}//${destinationUrl.hostname}${compiledPath}${search}`
              : `${compiledPath}${search}`
          );
          return true;
        }
      }
    }
  });
}

exports.getRedirectUrl = async function getRedirectUrl(
  req,
  res,
  next,
  { redirectUrls, config }
) {
  let sourceUrls;
  if (typeof redirectUrls === "function") {
    const redirectUrlsList = await redirectUrls(config);
    sourceUrls = Object.keys(redirectUrlsList);
    if (sourceUrls.length > 0) {
      processRedirects(req, res, next, sourceUrls, redirectUrlsList);
    }
  } else if (redirectUrls) {
    sourceUrls = Object.keys(redirectUrls);
    sourceUrls.length > 0 &&
      processRedirects(req, res, next, sourceUrls, redirectUrls);
  }
};
