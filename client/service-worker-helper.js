/**
 * This namespace contains helpers for building a service worker. This namespace only exports *initializeQServiceWorker*.
 *
 * See [Setting up Push Notifications](https://developers.quintype.com/malibu/tutorial/setting-up-push-notifications) for an example of setting up push notifications.
 *
 * ```javascript
 * import { initializeQServiceWorker } from "@quintype/framework/client/service-worker-helper";
 * ```
 *
 * @category Service Worker
 * @module service-worker-helper
 * @returns {void}
 */
// istanbul ignore file: Needs to be run as a service worker

import { matchBestRoute } from "../isomorphic/match-best-route";

const workboxVersion = "6.2.0";

function qDebug() {
  if (process.env.NODE_ENV !== "production") {
    console.debug.apply(console, arguments);
  }
}

/**
 * Start the Service Worker.
 * @param {ServiceWorkerScope} self
 * @param {Object} params
 * @param {function} params.excludeNavigation A function to exclude the PWA from serving the shell on that route, even if the route matches as per *routes*.
 * @param {Array<Route>} params.routes An array of routes for the PWA to match
 * @param {Array<string>} params.assets A list of assets to be cached before the ServiceWorker is installed
 * @param {string|undefined} params.mountAt Mount point for the routes to be mounted
 * @param {string} params.shell Path for the shell. Default '/shell.html'
 */
export function initializeQServiceWorker(params = {}) {
  importScripts(`https://storage.googleapis.com/workbox-cdn/releases/${workboxVersion}/workbox-sw.js`);

  const routeMatcher = function routeMatcher({ event, url }) {
    if (event.request.mode !== "navigate") {
      return false;
    }

    // Can this somehow be changed to using a combination of qtLoadedFromShell and some other stuff?
    // Other random libraries may change this fragment
    if (url.searchParams.has("bypass-sw") || url.hash === "#bypass-sw") {
      qDebug(`Bypassing the shell due to bypass-sw being present`);
      return false;
    }

    if (params.excludeNavigation && params.excludeNavigation(url)) {
      return false;
    }

    let { pathname } = url;

    if (params.mountAt && !pathname.startsWith(params.mountAt)) {
      return false;
    }

    // Remove the mountAt before matching any routes
    if (params.mountAt && pathname.startsWith(params.mountAt)) {
      pathname = pathname.slice(params.mountAt.length);
    }

    if (matchBestRoute(pathname, params.routes)) {
      qDebug(`Rendering the shell for navigation to ${pathname}`);
      return true;
    }
    qDebug(`Not rendering the shell for navigation to ${pathname}`);
    return false;
  };
  const shell = params.shell || "/shell.html";
  const shellHandler = ({ event }) => caches.match(shell).then((r) => r || fetch(event.request));

  self.skipWaiting();
  workbox.core.clientsClaim();
  workbox.precaching.cleanupOutdatedCaches();
  workbox.precaching.precache(params.assets);
  workbox.routing.registerRoute(routeMatcher, shellHandler);
}
