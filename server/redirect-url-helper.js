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

function processRedirects(req, res, next, urls) {
  const query = url.parse(req.url, true) || {};
  const search = query.search || "";

  const redirectObject = urls.find((urlObject) => urlObject.sourceUrl === req.pathname);

  //start
  if(redirectObject) {
    const {destinationPath, sourceUrl} = redirectObject;
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
            urlObject.statusCode,
            destinationUrl
                ? `${destinationUrl.protocol}//${destinationUrl.hostname}${compiledPath}${search}`
                : `${compiledPath}${search}`
        );
        return true;
      }
    }
  }
  //end
}

exports.getRedirectUrl = async function getRedirectUrl(
  req,
  res,
  next,
  { redirectUrls, config }
) {
  if (typeof redirectUrls === "function") {
    const redirectUrlsList = await redirectUrls(config);
    if (redirectUrlsList.length > 0) {
      processRedirects(req, res, next, redirectUrlsList);
    }
  } else if (redirectUrls) {
    redirectUrls.length > 0 &&
      processRedirects(req, res, next, redirectUrls);
  }
};
