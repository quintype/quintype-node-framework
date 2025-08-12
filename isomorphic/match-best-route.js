/**
 * This namespace is used to match path to routes. This is done during the [server side render](https://developers.quintype.com/malibu/isomorphic-rendering/server-side-architecture.html#routing),
 * [client side hydration](developers.quintype.com/malibu/isomorphic-rendering/server-side-architecture.html#routing), and in the [service worker](https://developers.quintype.com/malibu/isomorphic-rendering/client-side-architecture.html#progressive-web-app)
 * ```javascript
 * import { matchAllRoutes } from "@quintype/framework/isomorphic/match-best-route";
 * ```
 * @category Isomorphic
 * @module match-best-route
 */

const { matchPath } = require("react-router");

/**
 * Route represents a url pattern which is matched by the quintype framework.
 * See {@link https://developers.quintype.com/malibu/isomorphic-rendering/server-side-architecture#routing Routing} for more information on how the route is used.
 * ```javascript
 * {
 *  path: "/my-route/:routeParam",
 *  pageType: "home-page",
 *  exact: true,
 *  params: { foo: "bar" }
 * }
 * ```
 * @typedef Route
 * @property {string} path The path that the route matches.
 * @property {string} pageType The page type
 * @property {boolean} exact Is this route an exact match or a prefix
 */

/**
 * Find all routes that match a given path
 * @param {string} path The current path
 * @param {Array<module:match-best-route~Route>} routes An array of routes to be matched
 * @returns {Array<module:match-best-route~Route>} Matching Routes
 */
function matchAllRoutes(path, routes) {
  // Sure there is some construct to do these two lines
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  // Using foreach instead of filter / map because I don't want to match the same route over and over
  const matchedRoutes = [];
  routes.forEach((route) => {
    const match = matchPath(path, route);
    if (match) {
      return matchedRoutes.push({
        pageType: route.pageType,
        params: Object.assign({}, route.params, match.params),
        match,
      });
    }
  });
  return matchedRoutes;
}

function matchBestRoute(path, routes) {
  return matchAllRoutes(path, routes)[0];
}

exports.matchBestRoute = matchBestRoute;
exports.matchAllRoutes = matchAllRoutes;
