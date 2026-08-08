/**
 * This module contains functions for starting JS on the browser side
 * ```javascript
 * import * from "@quintype/framework/client/start";
 * ```
 * @category Client
 * @module start
 */

import { BreakingNews, CLIENT_SIDE_RENDERED, NAVIGATE_TO_PAGE, PAGE_LOADING } from "@quintype/components";
import { createBrowserHistory } from "history";
import get from "lodash/get";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { IsomorphicComponent } from "../isomorphic/component";
import { makePickComponentSync } from "../isomorphic/impl/make-pick-component-sync";
import { createQtStore } from "../store/create-store";
import { registerPageView, registerStoryShare, setMemberId, startAnalytics } from "./analytics";
import { initializeFCM } from "./impl/fcm";
import {
  checkForServiceWorkerUpdates,
  registerServiceWorker,
  setupServiceWorkerUpdates,
} from "./impl/load-service-worker";
import atob from "atob";

require("../assetify/client")();

/**
 * The history object can be used to manipulate browser history.
 */
export const history = createBrowserHistory();

/**
 * app contains multiple useful functions for controlling the app. These are saved on global.app.
 */
// App gets two more functions: updateServiceWorker and getAppVersion later
export const app = {
  navigateToPage,
  maybeNavigateTo,
  maybeSetUrl,
  registerPageView,
  registerStoryShare,
  setMemberId,
};

function getRouteDataAndPath(path, mountAt) {
  const relativePath = path.startsWith(mountAt) ? path.slice(mountAt.length) : path;
  return [`${mountAt || ""}/route-data.json`, relativePath];
}

function getRouteData(path, { location = global.location, existingFetch, mountAt = global.qtMountAt }) {
  // if mountAt is set, then hit /mountAt/route-data, remove mountAt from path

  const [routeDataPath, relativePath] = getRouteDataAndPath(path, mountAt);
  const url = new URL(relativePath, location.origin);
  return (
    existingFetch ||
    fetch(`${routeDataPath}?path=${encodeURIComponent(url.pathname)}${url.search ? `&${url.search.slice(1)}` : ""}`, {
      credentials: "same-origin",
    })
  )
    .then((response) => {
      if (response.status == 404) {
        // There is a chance this might abort
        maybeBypassServiceWorker();
      }

      return response.json();
    })
    .then(maybeRedirect);

  function maybeRedirect(page) {
    // This next line aborts the entire load
    if (page.httpStatusCode === 301 && page.data && page.data.location) {
      location.assign(page.data.location);
      return null;
    }

    return page;
  }

  function maybeBypassServiceWorker(e) {
    if (global.qtLoadedFromShell || `${location.pathname}${location.search}${location.hash}` != `${path}#bypass-sw`) {
      location.href = `${path}#bypass-sw`;
      location.reload();
    }
  }
}

let pickComponentWrapper = null;

/**
 * navigateToPage is called when hydrating the initial page, or moving between pages with AJAX.
 * You may want to consider calling {@link maybeNavigateTo} instead.
 *
 * This function can also be called as `app.navigateToPage()`.
 *
 * @param {function} dispatch The dispatch of the story
 * @param {string} path The new path you are jumping to
 * @param {boolean} doNotPushPath If set to true, then the path is not appended to *pushState*
 * @returns {void}
 */
export function navigateToPage(dispatch, path, doNotPushPath) {
  const pathname = !path || path === "undefined" ? global.location.pathname : path;

  if (global.disableAjaxNavigation) {
    global.location = pathname;
  }

  dispatch({ type: PAGE_LOADING });
  getRouteData(pathname, {}).then((page) => {
    if (!page) {
      console && console.log("Recieved a null page. Expecting the browser to redirect.");
      return;
    }

    checkForServiceWorkerUpdates(app, page);

    if (page.disableIsomorphicComponent) {
      global.location = pathname;
      return;
    }

    Promise.resolve(
      pickComponentWrapper && pickComponentWrapper.preloadComponent(page.pageType, page.subPageType)
    ).then(() => {
      dispatch({
        type: NAVIGATE_TO_PAGE,
        page,
        currentPath: pathname,
      });

      if (!doNotPushPath) {
        const title = get(
          page,
          ["data", "customSeo", "title"],
          get(page, ["data", "story", "seo", "meta-title"], page.title)
        );

        if (title) {
          global.document.title = title;
        }

        history.push({
          pathname,
          search: "",
        });
        registerPageView(page, pathname);
      }
    });
    return page;
  });
}

/**
 * Navigate to the page if it is not the current page as per redux. This internally calls {@link navigateToPage}
 *
 * This function can also be called as `app.maybeNavigateTo()`.
 * @param {string} path The new path
 * @param {Redux} store The redux store
 * @returns {void}
 */
export function maybeNavigateTo(path, store) {
  if (store.getState().qt.currentPath != path) navigateToPage(store.dispatch, path, true);
}

/**
 * Sets the url and title
 *
 * * This function can also be called as `app.maybeSetUrl()`.
 * @param {string} path The new path
 * @param {string} title The new title.
 * @returns {void}
 */
export function maybeSetUrl(path, title) {
  if (global.location.pathname === path) return;
  if (global.history.pushState) {
    global.document.title = title;
    global.history.pushState(null, title, path);
  }
}

/**
 * renderComponent can be used to render a component given the component, container and a redux store.
 * @param {Component} clazz The component to render
 * @param {string} container The id of the container to render the given component
 * @param {Redux} store The redux store
 * @param {Object} props Properties to bootstrap the component with
 * @param {boolean} props.hydrate Hydrate the component instead of rendering it
 * @param {callback} callback Callback on completion
 */
export function renderComponent(clazz, container, store, props = {}, callback) {
  const component = React.createElement(Provider, { store }, React.createElement(clazz, props || {}));

  const containerEle = document.getElementById(container);

  if (!containerEle) {
    console && console.log(`Rendering component on DOM id ${container} FAILED, node not available`);
    return null;
  }

  if (props.hydrate) {
    return ReactDOM.hydrate(component, containerEle, callback);
  }
  return ReactDOM.render(component, containerEle, callback);
}

/**
 * renderIsomorphicComponent can be used to render a component given the container and a redux store. This uses {@link IsomorphicComponent} internally.
 * @param {string} container The id of the container to render the given component
 * @param {Redux} store The redux store
 * @param {function} pickComponent The [pickComponent](https://developers.quintype.com/malibu/isomorphic-rendering/server-side-architecture#pickcomponent) function
 * @param {Object} props Properties to bootstrap the component with
 * @param {boolean} props.hydrate Hydrate the component instead of rendering it
 */
export function renderIsomorphicComponent(container, store, pickComponent, props) {
  if (!store.getState().qt.disableIsomorphicComponent) {
    pickComponentWrapper = makePickComponentSync(pickComponent);
    return pickComponentWrapper
      .preloadComponent(store.getState().qt.pageType, store.getState().qt.subPageType)
      .then(() =>
        renderComponent(
          IsomorphicComponent,
          container,
          store,
          Object.assign({ pickComponent: pickComponentWrapper }, props),
          () => store.dispatch({ type: CLIENT_SIDE_RENDERED })
        )
      );
  }
  console && console.log("IsomorphicComponent is disabled");
}

/**
 *
 * @param {string} container The id of the container to render the given component
 * @param {Redux} store The redux store
 * @param {*} view The view to be rendered
 * @param {Object} props Properties to bootstrap the component with
 */
export function renderBreakingNews(container, store, view, props) {
  return renderComponent(BreakingNews, container, store, Object.assign({ view }, props));
}

function getJsonContent(id) {
  const element = global.document.getElementById(id);
  if (element) {
    const content = element.textContent;
    try {
      if (atob(content)) {
        return JSON.parse(atob(content));
      }
    } catch {
      console.log('Looks like the content is not encrypted. Parsing regular content.');
    }

    return JSON.parse(content);
  }
}

const performance = window.performance || { mark: () => {}, measure: () => {} };
function runWithTiming(name, f) {
  performance.mark(`${name}Start`);
  f();
  performance.mark(`${name}Finish`);
  performance.measure(`${name}Time`, `${name}Start`, `${name}Finish`);
}

/**
 * Start the Browser Application. This is the entry point for the Quintype framework
 * @param {function} renderApplication Once the data is fetched, *renderApplication(store)* will be called to render all components on page. See [renderApplication](https://developers.quintype.com/malibu/isomorphic-rendering/client-side-architecture.html#renderapplication)
 * @param {Object} reducers A list of custom reducers for your application. This will be merged with the built in reducers
 * @param {Object} opts Options
 * @param {function} opts.preRenderApplication Render a part of the application on boot. See [preRenderApplication](https://developers.quintype.com/malibu/isomorphic-rendering/client-side-architecture.html#prerenderapplication)
 * @param {(function|string)} opts.fcmMessagingSenderId Enable Firebase Cloud Messaging for push notifications
 * @param {boolean} opts.enableServiceWorker Should service worker be enabled
 * @param {string} opts.serviceWorkerLocation Location of the service worker (default: /service-worker.js). Note, if using mountAt, this is relative to the mount point.
 * @param {number} opts.appVersion App Version. See [Updating App Version](https://developers.quintype.com/malibu/tutorial/updating-app-version)
 * @returns {Redux} The store that was created
 *
 */
export function startApp(renderApplication, reducers, opts) {
  app.getAppVersion = () => opts.appVersion || 1;
  global.app = app;
  const { location } = global;
  const path = `${location.pathname}${location.search || ""}`;
  const staticData = global.staticPageStoreContent || getJsonContent("static-page");
  const dataPromise = staticData
    ? Promise.resolve(staticData.qt)
    : getRouteData(path, { existingFetch: global.initialFetch });

  startAnalytics();

  const store = createQtStore(
    reducers,
    (staticData && staticData.qt) || global.initialPage || getJsonContent("initial-page") || {},
    {}
  );

  if (opts.preRenderApplication) {
    runWithTiming("qt_preRender", () => opts.preRenderApplication(store));
  }

  return dataPromise.then((page) => doStartApp(page, opts));

  function doStartApp(page, opts) {
    if (!page) {
      console && console.log("Received a null page. Expecting the browser to redirect.");
      return;
    }

    store.dispatch({ type: NAVIGATE_TO_PAGE, page, currentPath: path });

    if (opts.firebaseConfig) {
      const fcm = typeof opts.firebaseConfig === "function" ? opts.firebaseConfig(page) : opts.firebaseConfig;
      if (fcm) {
        const mssgSenderId = fcm.messagingSenderId;
        const projectId = fcm.projectId;
        const apiKey = fcm.apiKey;
        if (mssgSenderId && projectId && apiKey) initializeFCM(fcm);
      }
    }

    const { config: { "theme-attributes": pageThemeAttributes = {} } = {} } = page;
    const version = pageThemeAttributes["cache-burst"] || app.getAppVersion();

    const serviceWorkerPromise = registerServiceWorker({ ...opts, version });

    setupServiceWorkerUpdates(serviceWorkerPromise, app, store, page, opts);

    runWithTiming("qt_render", () => renderApplication(store));

    history.listen((change) => app.maybeNavigateTo(`${change.pathname}${change.search || ""}`, store));

    registerPageView(store.getState().qt);

    if (page.title) {
      global.document.title = get(
        page,
        ["data", "customSeo", "title"],
        get(page, ["data", "story", "seo", "meta-title"], page.title)
      );
    }
    return store;
  }
}
