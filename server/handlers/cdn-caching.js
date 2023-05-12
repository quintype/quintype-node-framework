const { cache } = require("ejs");
const _ = require("lodash");

exports.addCacheHeadersToResult = function addCacheHeadersToResult({
  res,
  cacheKeys,
  cdnProvider = "cloudflare",
  config,
  sMaxAge = "900",
  networkOnly = false,
  pageType = "",
}) {
  let cdnProviderVal = null;
  cdnProviderVal =
    typeof cdnProvider === "function" && Object.keys(config).length > 0 ? cdnProvider(config) : cdnProvider;
  if (cacheKeys) {
    if (cacheKeys === "DO_NOT_CACHE") {
      res.setHeader("Cache-Control", "private,no-cache,no-store,max-age=0");
      cdnProviderVal === "akamai" && res.setHeader("Edge-Control", "private,no-cache,no-store,max-age=0");
      res.setHeader("Vary", "Accept-Encoding");
      res.setHeader(
        "Content-Security-Policy",
        `default-src data: 'unsafe-inline' 'unsafe-eval' https: http:;` +
          `script-src data: 'unsafe-inline' 'unsafe-eval' https: http: blob:;` +
          `style-src data: 'unsafe-inline' https: http: blob:;` +
          `img-src data: https: http: blob:;` +
          `font-src data: https: http:;` +
          `connect-src https: wss: ws: http: blob:;` +
          `media-src https: blob: http:;` +
          `object-src https: http:;` +
          `child-src https: data: blob: http:;` +
          `form-action https: http:;` +
          `block-all-mixed-content;`
      );
    } else {
      if (networkOnly) {
        res.setHeader("Cache-Control", `public,s-maxage=${sMaxAge}`);
        res.setHeader(
          "Cloudflare-CDN-Cache-Control",
          `max-age=${sMaxAge}, stale-while-revalidate=1000, stale-if-error=14400`
        );
        cdnProviderVal === "akamai" && res.setHeader("Edge-Control", `public,maxage=${sMaxAge}`);
      } else {
        res.setHeader(
          "Cache-Control",
          `public,max-age=15,s-maxage=${sMaxAge},stale-while-revalidate=1000,stale-if-error=14400`
        );
        cdnProviderVal === "akamai" &&
          res.setHeader("Edge-Control", `public,maxage=${sMaxAge},stale-while-revalidate=1000,stale-if-error=14400`);
        addCacheHeadersForTagPages({ pageType, res });
      }

      res.setHeader("Vary", "Accept-Encoding");

      // Cloudflare Headers
      res.setHeader("Cache-Tag", _(cacheKeys).uniq().join(","));

      // Akamai Headers
      cdnProviderVal === "akamai" && res.setHeader("Edge-Cache-Tag", _(cacheKeys).uniq().join(","));

      res.setHeader("Surrogate-Key", _(cacheKeys).uniq().join(" "));
      res.setHeader(
        "Content-Security-Policy",
        `default-src data: 'unsafe-inline' 'unsafe-eval' https: http:;` +
          `script-src data: 'unsafe-inline' 'unsafe-eval' https: http: blob:;` +
          `style-src data: 'unsafe-inline' https: http: blob:;` +
          `img-src data: https: http: blob:;` +
          `font-src data: https: http:;` +
          `connect-src https: wss: ws: http: blob:;` +
          `media-src https: blob: http:;` +
          `object-src https: http:;` +
          `child-src https: data: blob: http:;` +
          `form-action https: http:;` +
          `block-all-mixed-content;`
      );
    }
  } else {
    res.setHeader("Cache-Control", "public,max-age=15,s-maxage=60,stale-while-revalidate=150,stale-if-error=3600");
    cdnProviderVal === "akamai" &&
      res.setHeader("Edge-Control", "public,maxage=60,stale-while-revalidate=150,stale-if-error=3600");
    res.setHeader("Vary", "Accept-Encoding");
    res.setHeader(
      "Content-Security-Policy",
      `default-src data: 'unsafe-inline' 'unsafe-eval' https: http:;` +
        `script-src data: 'unsafe-inline' 'unsafe-eval' https: http: blob:;` +
        `style-src data: 'unsafe-inline' https: http: blob:;` +
        `img-src data: https: http: blob:;` +
        `font-src data: https: http:;` +
        `connect-src https: wss: ws: http: blob:;` +
        `media-src https: blob: http:;` +
        `object-src https: http:;` +
        `child-src https: data: blob: http:;` +
        `form-action https: http:;` +
        `block-all-mixed-content;`
    );
  }
  return res;
};

function addCacheHeadersForTagPages({ pageType, res }) {
  // platform doesn't provide cache tags to purge tag pages at the time of writing this, so hardcoding a ttl of 10 min
  if (pageType === "tag-page")
    res.setHeader("Cache-Control", `public,max-age=15,s-maxage=600,stale-while-revalidate=1000,stale-if-error=14400`);
}
