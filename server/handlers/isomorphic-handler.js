// FIMXE: Convert this entire thing to async await / or even Typescript

const _ = require("lodash");

const urlLib = require("url");
const { matchBestRoute, matchAllRoutes } = require("../../isomorphic/match-best-route");
const { IsomorphicComponent } = require("../../isomorphic/component");
const { addCacheHeadersToResult } = require("./cdn-caching");
const { NotFoundException } = require("../impl/exceptions");
const { renderReduxComponent } = require("../render");
const { createStore } = require("redux");
const Promise = require("bluebird");
const { getDefaultState, createBasicStore } = require("./create-store");
const { customUrlToCacheKey } = require("../caching");
const { addLightPageHeaders } = require("../impl/light-page-impl");
const { getOneSignalScript } = require("./onesignal-script");
const { getRedirectUrl } = require("../redirect-url-helper");
const { Story } = require("../impl/api-client-impl");

const ABORT_HANDLER = "__ABORT__";
function abortHandler() {
  return Promise.resolve({ pageType: ABORT_HANDLER, [ABORT_HANDLER]: true });
}

function loadDataForIsomorphicRoute(
  loadData,
  loadErrorData,
  url,
  routes,
  {
    otherParams,
    config,
    client,
    host,
    logError,
    domainSlug,
    redirectToLowercaseSlugs,
    cookies,
    mobileApiEnabled,
    externalIdPattern,
    enableExternalStories,
  }
) {
  return loadDataForEachRoute().catch((error) => {
    logError(error);
    return loadErrorData(error, config, client, { host, domainSlug, cookies });
  });

  // Using async because this for loop reads really really well
  async function loadDataForEachRoute() {
    const redirectToLowercaseSlugsValue =
      typeof redirectToLowercaseSlugs === "function" ? redirectToLowercaseSlugs(config) : redirectToLowercaseSlugs;
    for (const match of matchAllRoutes(url.pathname, routes)) {
      const params = Object.assign({}, url.query, otherParams, match.params);
      /* On story pages, if the slug contains any capital letters (latin), we want to
       * redirect the browser to the URL having all lowercase letters. We need to be
       * wary of any asset routes that might make its way here and get wrongly redirected.
       */
      if (
        redirectToLowercaseSlugsValue &&
        match.pageType === "story-page" &&
        params.storySlug &&
        decodeURIComponent(params.storySlug) !== decodeURIComponent(params.storySlug.toLowerCase())
      ) {
        return {
          httpStatusCode: 301,
          data: {
            location: `${url.pathname.toLowerCase()}${url.search || ""}`,
          },
        };
      }
      const result = await loadData(match.pageType, params, config, client, {
        host,
        next: abortHandler,
        domainSlug,
        cookies,
        mobileApiEnabled,
      });

      if (result && result[ABORT_HANDLER]) continue;

      if (result && result.data && result.data[ABORT_HANDLER]) continue;

      return result;
    }

    const isExternalStoryEnabled =
      typeof enableExternalStories === "function" ? enableExternalStories(config) : enableExternalStories;
    if (isExternalStoryEnabled) {
      const pattern = typeof externalIdPattern === "function" ? externalIdPattern(config) : externalIdPattern;
      const externalId = url.pathname.split("/")[pattern.split("/").findIndex((e) => e === "EXTERNAL_ID")];
      const story = await Story.getStoryByExternalId(client, externalId);
      if (story) {
        const params = Object.assign({}, url.query, otherParams, { storySlug: story.slug });
        const result = await loadData("story-page", params, config, client, {
          host,
          next: abortHandler,
          domainSlug,
          cookies,
          mobileApiEnabled,
        });
        return result;
      }
    }
  }
}

function loadDataForPageType(
  loadData,
  loadErrorData = () => Promise.resolve({ httpStatusCode: 500 }),
  pageType,
  params,
  { config, client, logError, host, domainSlug, cookies }
) {
  return new Promise((resolve) =>
    resolve(
      loadData(pageType, params, config, client, {
        host,
        next: abortHandler,
        domainSlug,
        cookies,
      })
    )
  )
    .then((result) => {
      if (result && result.data && result.data[ABORT_HANDLER]) {
        return null;
      }
      return result;
    })
    .catch((error) => {
      logError(error);
      return loadErrorData(error, config, client, { host, domainSlug, cookies });
    });
}

function getSeoInstance(seo, config, pageType = "") {
  return typeof seo === "function" ? seo(config, pageType) : seo;
}

exports.handleIsomorphicShell = async function handleIsomorphicShell(
  req,
  res,
  next,
  {
    config,
    renderLayout,
    seo,
    assetHelper,
    client,
    loadData,
    loadErrorData,
    logError,
    preloadJs,
    domainSlug,
    maxConfigVersion,
    appLoadingPlaceholder = "",
  }
) {
  const url = urlLib.parse(req.url, true);
  const freshRevision = `${assetHelper.assetHash("app.js")}-${await maxConfigVersion(config, domainSlug)}`;

  if (req.query.revision && req.query.revision !== freshRevision)
    return res.status(503).send("Requested Shell Is Not Current");

  loadDataForPageType(
    loadData,
    loadErrorData,
    "shell",
    {},
    { config, client, logError, host: req.hostname, domainSlug }
  ).then((result) => {
    res.status(200);
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "public,max-age=900,stale-while-revalidate=1500,stale-if-error=28800");
    res.setHeader("Vary", "Accept-Encoding");

    if (preloadJs) {
      res.append("Link", `<${assetHelper.assetPath("app.js")}>; rel=preload; as=script;`);
    }
    const seoInstance = getSeoInstance(seo, config, "shell");
    const seoTags = seoInstance && seoInstance.getMetaTags(config, "shell", result, { url });

    return renderLayout(res, {
      config,
      seoTags,
      content: `<div class="app-loading">${appLoadingPlaceholder}<script type="text/javascript">window.qtLoadedFromShell = true</script></div>`,
      store: createStore((state) => state, getDefaultState(result)),
      shell: true,
    });
  });
};

function createStoreFromResult(url, result, opts = {}) {
  // _.get()
  const isBotRequest = url.query.botrequest;
  const qt = {
    pageType: result.pageType || opts.defaultPageType,
    subPageType: result.subPageType,
    data: result.data,
    currentPath: `${url.pathname}${url.search || ""}`,
    currentHostUrl: result.currentHostUrl,
    primaryHostUrl: result.primaryHostUrl,
    isBotRequest: isBotRequest,
  };
  return createBasicStore(result, qt, opts);
}

function chunkDataForMobile(data, fieldsCallback, pageType) {
  const fields = typeof fieldsCallback === "function" ? fieldsCallback(pageType) : fieldsCallback;

  /* return data if no fields are passed */
  if (_.isEmpty(fields)) return data;

  /* If the incoming config is an array, filter and return */
  if (_.isArray(fields)) return _.pick(data, fields);

  /* Extract keys from data field in config */
  const dataConfigFields = Object.keys(fields);

  /* pick the keys matching whitelisted data */
  const dataChildren = _.pick(data, dataConfigFields);

  /* Second level of filtering */
  return dataConfigFields.reduce((acc, currEle) => {
    /* If whitelisted key turn out to be an array */
    if (_.isArray(dataChildren[currEle]) && _.isArray(fields[currEle])) {
      acc[currEle] = dataChildren[currEle].reduce((xAcc, xCurrEle) => {
        _.isObject(xCurrEle) ? xAcc.push(_.pick(xCurrEle, fields[currEle])) : xAcc.push(xCurrEle);
        return xAcc;
      }, []);
    } else if (
      /* If whitelisted key turn out to be an object */
      _.isPlainObject(dataChildren[currEle]) &&
      _.isArray(fields[currEle])
    ) {
      acc[currEle] = _.pick(dataChildren[currEle], fields[currEle]);

      /* If whitelisted key exists in data */
    } else if (dataChildren[currEle]) {
      acc[currEle] = dataChildren[currEle];
    }
    return acc;
  }, {});
}

exports.handleIsomorphicDataLoad = function handleIsomorphicDataLoad(
  req,
  res,
  next,
  {
    config,
    client,
    generateRoutes,
    loadData,
    loadErrorData,
    logError,
    staticRoutes,
    seo,
    appVersion,
    domainSlug,
    mobileApiEnabled,
    mobileConfigFields,
    cdnProvider,
    redirectToLowercaseSlugs,
    sMaxAge,
    networkOnly,
    maxAge,
  }
) {
  const url = urlLib.parse(req.query.path || "/", true);
  const dataLoader = staticDataLoader() || isomorphicDataLoader();

  return dataLoader.then((result) => {
    if (!result) {
      return returnNotFound();
    }
    return returnJson(result);
  }, handleException);

  function staticDataLoader() {
    const match = matchBestRoute(url.pathname, staticRoutes);

    if (match) {
      const params = Object.assign({}, url.query, req.query, match.params);
      const pageType = match.pageType || "static-page";
      return loadDataForPageType(loadData, loadErrorData, pageType, params, {
        config,
        client,
        logError,
        host: req.hostname,
        domainSlug,
        mobileApiEnabled,
      }).then((result) => Object.assign({ pageType, disableIsomorphicComponent: true }, result));
    }
  }

  function allRoutes() {
    try {
      return generateRoutes(config, domainSlug);
    } catch (e) {
      return [];
    }
  }

  function isomorphicDataLoader() {
    return loadDataForIsomorphicRoute(loadData, loadErrorData, url, allRoutes(), {
      config,
      client,
      logError,
      host: req.hostname,
      otherParams: req.query,
      domainSlug,
      redirectToLowercaseSlugs,
      cookies: req.cookies,
      mobileApiEnabled,
    }).catch((e) => {
      logError(e);
      return { httpStatusCode: 500, pageType: "error" };
    });
  }

  function handleException(e) {
    logError(e);
    res.status(500);
    return res.json({ error: { message: e.message } });
  }

  function returnJson(result) {
    return new Promise(() => {
      const statusCode = result.httpStatusCode || 200;
      res.status(statusCode < 500 ? 200 : 500);
      res.setHeader("Content-Type", "application/json");
      addCacheHeadersToResult({
        res: res,
        cacheKeys: _.get(result, ["data", "cacheKeys"]),
        cdnProvider: cdnProvider,
        config: config,
        sMaxAge,
        networkOnly,
        maxAge,
      });
      const seoInstance = getSeoInstance(seo, config, result.pageType);
      res.json(
        Object.assign({}, result, {
          appVersion,
          data: mobileApiEnabled
            ? chunkDataForMobile(result.data, mobileConfigFields, result.pageType)
            : _.omit(result.data, ["cacheKeys"]),
          config: mobileApiEnabled ? chunkDataForMobile(result.config, mobileConfigFields, "config") : result.config,
          title: seoInstance ? seoInstance.getTitle(config, result.pageType, result) : result.title,
        })
      );
    })
      .catch(handleException)
      .finally(() => res.end());
  }

  function returnNotFound() {
    return new Promise((resolve) =>
      resolve(
        loadErrorData(new NotFoundException(), config, client, {
          host: req.hostname,
          domainSlug,
          cookies: req.cookies,
        })
      )
    )
      .catch((e) => console.log("Exception", e))
      .then((result) => {
        res.status(result.httpStatusCode || 404);
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "public,max-age=15,s-maxage=120");
        res.setHeader("Vary", "Accept-Encoding");
        res.json(result);
      })
      .catch(handleException)
      .finally(() => res.end());
  }
};

exports.notFoundHandler = function notFoundHandler(
  req,
  res,
  next,
  { config, client, loadErrorData, seo, renderLayout, pickComponent, logError, domainSlug }
) {
  const url = urlLib.parse(req.url, true);

  return new Promise((resolve) =>
    resolve(
      loadErrorData(new NotFoundException(), config, client, {
        host: req.hostname,
        domainSlug,
        cookies: req.cookies,
      })
    )
  )
    .catch((e) => {
      logError(e);
      return { pageType: "error" };
    })
    .then((result) => {
      const statusCode = result.httpStatusCode || 404;
      const store = createStoreFromResult(url, result, {
        disableIsomorphicComponent: false,
        defaultPageType: "not-found",
      });
      const seoInstance = getSeoInstance(seo, config, result.pageType);
      const seoTags = seoInstance && seoInstance.getMetaTags(config, result.pageType || "not-found", result, { url });

      res.status(statusCode);
      res.setHeader("Cache-Control", "public,max-age=15,s-maxage=60, stale-while-revalidate=150,stale-if-error=3600");
      res.setHeader("Vary", "Accept-Encoding");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return pickComponent.preloadComponent(store.getState().qt.pageType, store.getState().qt.subPageType).then(() =>
        renderLayout(res, {
          config,
          seoTags,
          title: seoInstance ? seoInstance.getTitle(config, result.pageType, result) : result.title,
          content: renderReduxComponent(IsomorphicComponent, store, {
            pickComponent,
          }),
          store,
          pageType: store.getState().qt.pageType,
          subPageType: store.getState().qt.subPageType,
        })
      );
    })
    .catch((e) => {
      logError(e);
      res.status(500);
      res.send(e.message);
    })
    .finally(() => res.end());
};

exports.handleIsomorphicRoute = function handleIsomorphicRoute(
  req,
  res,
  next,
  {
    config,
    client,
    generateRoutes,
    loadData,
    renderLayout,
    pickComponent,
    loadErrorData,
    seo,
    logError,
    assetHelper,
    preloadJs,
    domainSlug,
    cdnProvider,
    lightPages,
    redirectUrls,
    redirectToLowercaseSlugs,
    oneSignalServiceWorkers,
    shouldEncodeAmpUri,
    publisherConfig,
    sMaxAge,
    maxAge,
    ampPageBasePath,
    externalIdPattern,
    enableExternalStories,
  }
) {
  const url = urlLib.parse(req.url, true);

  function writeResponse(result) {
    const statusCode = result.httpStatusCode || 200;

    if (statusCode == 301 && result.data && result.data.location) {
      addCacheHeadersToResult({
        res: res,
        cacheKeys: [customUrlToCacheKey(config["publisher-id"], "redirect")],
        cdnProvider: cdnProvider,
        config: config,
        sMaxAge: result.pageType === "tag-page" ? 600 : sMaxAge,
        maxAge: maxAge,
      });
      return res.redirect(301, result.data.location);
    }
    const seoInstance = getSeoInstance(seo, config, result.pageType);
    const seoTags = seoInstance && seoInstance.getMetaTags(config, result.pageType || match.pageType, result, { url });

    const store = createStoreFromResult(url, result, {
      disableIsomorphicComponent: statusCode != 200,
    });

    if (lightPages) {
      addLightPageHeaders(result, lightPages, {
        config,
        res,
        client,
        req,
        shouldEncodeAmpUri,
        ampPageBasePath,
      });
    }

    res.status(statusCode);
    addCacheHeadersToResult({
      res: res,
      cacheKeys: _.get(result, ["data", "cacheKeys"]),
      cdnProvider: cdnProvider,
      config: config,
      sMaxAge: result.pageType === "tag-page" ? 600 : sMaxAge,
      maxAge: maxAge,
    });

    if (preloadJs) {
      res.append("Link", `<${assetHelper.assetPath("app.js")}>; rel=preload; as=script;`);
    }
    const oneSignalScript = oneSignalServiceWorkers ? getOneSignalScript({ config, publisherConfig }) : null;
    return pickComponent.preloadComponent(store.getState().qt.pageType, store.getState().qt.subPageType).then(() =>
      renderLayout(res, {
        config,
        title: result.title,
        content: renderReduxComponent(IsomorphicComponent, store, {
          pickComponent,
        }),
        store,
        seoTags,
        pageType: store.getState().qt.pageType,
        subPageType: store.getState().qt.subPageType,
        oneSignalScript,
      })
    );
  }

  if (typeof redirectUrls === "function" || (redirectUrls && Object.keys(redirectUrls).length > 0)) {
    getRedirectUrl(req, res, next, { redirectUrls, config });
  }

  return loadDataForIsomorphicRoute(loadData, loadErrorData, url, generateRoutes(config, domainSlug), {
    config,
    client,
    logError,
    host: req.hostname,
    domainSlug,
    redirectToLowercaseSlugs,
    cookies: req.cookies,
    externalIdPattern,
    enableExternalStories,
  })
    .catch((e) => {
      logError(e);
      return { httpStatusCode: 500, pageType: "error" };
    })
    .then((result) => {
      if (!result) {
        return next();
      }
      return new Promise((resolve) => resolve(writeResponse(result)))
        .catch((e) => {
          logError(e);
          res.status(500);
          res.send(e.message);
        })
        .finally(() => res.end());
    });
};

exports.handleStaticRoute = function handleStaticRoute(
  req,
  res,
  next,
  {
    path,
    config,
    client,
    logError,
    loadData,
    loadErrorData,
    renderLayout,
    pageType,
    seo,
    renderParams,
    disableIsomorphicComponent,
    domainSlug,
    cdnProvider,
    oneSignalServiceWorkers,
    publisherConfig,
    sMaxAge,
    maxAge,
  }
) {
  const url = urlLib.parse(path);
  pageType = pageType || "static-page";

  return loadDataForPageType(loadData, loadErrorData, pageType, renderParams, {
    config,
    client,
    logError,
    host: req.hostname,
    domainSlug,
  })
    .then((result) => {
      if (!result) {
        return next();
      }

      const statusCode = result.httpStatusCode || 200;

      if (statusCode == 301 && result.data && result.data.location) {
        return res.redirect(301, result.data.location);
      }

      const seoInstance = getSeoInstance(seo, config, result.pageType);
      const seoTags =
        seoInstance &&
        seoInstance.getMetaTags(config, result.pageType || pageType, result, {
          url,
        });
      const store = createStoreFromResult(url, result, {
        disableIsomorphicComponent: disableIsomorphicComponent === undefined ? true : disableIsomorphicComponent,
      });

      res.status(statusCode);
      addCacheHeadersToResult({
        res: res,
        cacheKeys: _.get(result, ["data", "cacheKeys"], ["static"]),
        cdnProvider: cdnProvider,
        config: config,
        sMaxAge,
        maxAge,
      });

      const oneSignalScript = oneSignalServiceWorkers ? getOneSignalScript({ config, publisherConfig }) : null;

      return renderLayout(
        res,
        Object.assign(
          {
            config,
            title: seoInstance
              ? seoInstance.getTitle(config, result.pageType || match.pageType, result, { url })
              : result.title,
            store,
            disableAjaxNavigation: true,
            seoTags,
            oneSignalScript,
          },
          renderParams
        )
      );
    })
    .catch((e) => {
      logError(e);
      res.status(500);
      res.send(e.message);
    });
};
