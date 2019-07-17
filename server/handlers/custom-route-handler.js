const urlLib = require("url");
const Promise = require("bluebird");
const get = require("lodash/get");
const ejs = require("ejs");
const fs = require("fs");
const path = require("path");

const staticPageTemplateStr = fs.readFileSync(path.join(__dirname, "../views/static-page.ejs"), {encoding: "utf-8"});
const staticPageTemplate = ejs.compile(staticPageTemplateStr);

const { CustomPath } = require("../impl/api-client-impl");
const { createBasicStore } = require("./create-store");
const { addCacheHeadersToResult } = require("./cdn-caching");

function renderStaticPageContent(store, content) {
  const renderedContent = staticPageTemplate({store, content});

  return renderedContent;
}

function writeStaticPageResponse(res, url, page, result, { config, renderLayout, seo }) {
  const qt = {
    pageType: page.type,
    data: Object.assign({}, page, result.data),
    currentPath: `${url.pathname}${url.search || ""}`,
  }
  const store = createBasicStore(result, qt, {
    disableIsomorphicComponent: true
  })

  const seoInstance = (typeof seo === 'function') ? seo(config) : seo;
  const seoTags = seoInstance && seoInstance.getMetaTags(config, page.type, {}, {url});

  res.status(page["status-code"] || 200);

  return renderLayout(res, {
    title: page.title,
    content: renderStaticPageContent(store, page.content),
    store,
    seoTags,
    disableAjaxNavigation: true,
  });
}

exports.customRouteHandler = function customRouteHandler(req, res, next, { config, client, loadData, loadErrorData, renderLayout, logError, seo, domainSlug }) {
  const url = urlLib.parse(req.url, true);
  const path = req.params[0].endsWith('/') ?
    req.params[0].slice(0, -1) :
    req.params[0];
  return CustomPath.getCustomPathData(client, path)
    .then(page => {
      if(!page) {
        return next();
      }

      if(page.type === 'redirect') {
        if(!page["status-code"] || !page["destination-path"]) {
          logError('Defaulting the status-code to 302 with destination-path as home-page');
        }
        addCacheHeadersToResult(res, page.cacheKeys(config["publisher-id"]))

        let destination = page["destination-path"] || "/";

        // FIXME: This ugly hack is because sketches returns absolute urls as /http
        if(destination.startsWith("/http")) {
          destination = destination.replace("/http", "http");
        }

        return res.redirect(page["status-code"] || 302, destination);
      }

      if(page.type === 'static-page') {
        addCacheHeadersToResult(res, page.cacheKeys(config["publisher-id"]))

        if(page.metadata.header || page.metadata.footer) {
          return loadData('custom-static-page', {}, config, client, { host: req.hostname, domainSlug })
            .then(response => {
              return writeStaticPageResponse(res, url, page.page, response, { config, renderLayout, seo });
            });
        }
        return res.send(page.content);
      }

      return next();
    }).catch(e => {
      logError(e);
      res.status(500);
      res.send(e.message);
    });
}
