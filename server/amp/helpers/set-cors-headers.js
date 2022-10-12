const get = require("lodash/get");
const flatten = require("lodash/flatten");

function getCacheUrls(url) {
  const partialUrl = url.replace(/-/g, "--").replace(/\./g, "-");
  return [`${partialUrl}.cdn.ampproject.org`, `${partialUrl}.www.bing-amp.com`];
}

function setCorsHeaders({ req, res, publisherConfig }) {
  console.log(">>> 3. setCorsHeaders:", req.headers.origin);
  // https://amp.dev/documentation/guides-and-tutorials/learn/amp-caches-and-cors/amp-cors-requests/

  const subdomains = get(publisherConfig, ["domains"], []).map(
    (domain) => domain["host-url"]
  );
  const cachedSubdomains = subdomains.map((subdomain) =>
    getCacheUrls(subdomain)
  );
  const { origin, "amp-same-origin": ampSameOrigin } = req.headers;
  const whiteList = flatten([
    ...subdomains,
    ...cachedSubdomains,
    getCacheUrls(publisherConfig["sketches-host"]),
    origin,
  ]);
  console.log(">>> 4. whiteList:", whiteList, origin, whiteList.includes(origin));

  if (!origin && ampSameOrigin) {
    // allow same origin
    return;
  }
  if (whiteList.includes(origin)) {
    // allow whitelisted CORS origins
    res.set("Access-Control-Allow-Origin", origin);
    return;
  }
  res.status(401).json(`Unauthorized`);
}

module.exports = { setCorsHeaders };
