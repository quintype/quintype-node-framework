/**
 * This namespace a helper method for render
 * ```javascript
 * import {renderReduxComponent} from "@quintype/framework/server/render";
 * ```
 * @category Server
 * @module render
 */

const ReactDOMServer = require("react-dom/server");
const React = require("react");

const { Provider } = require("react-redux");

/**
 * Render the given component in the redux store
 * @param {Component} Component The Component to render
 * @param {Redux} store The store to render
 * @param {Object} props The props to pass to the component
 */
exports.renderReduxComponent = function renderReduxComponent(
  Component,
  store,
  props
) {
  return ReactDOMServer.renderToString(
    React.createElement(
      Provider,
      { store },
      React.createElement(Component, props)
    )
  );
};

/**
 * This namespace a helper method for SSR using @loadable/component
 * ```javascript
 * import { ChunkExtractor } from "@loadable/server";
 * import {renderReduxComponent} from "@quintype/framework/server/render";
 * import path from "path";
 *
 * const statsFile = path.resolve("stats.json"); // This is the stats file generated by webpack loadable plugin
 * const extractor = new ChunkExtractor({ statsFile, entrypoints: ["topbarCriticalCss", "navbarCriticalCss"] }); // We create an extractor from the statsFile
 * renderLoadableReduxComponent(Header, params.store, extractor)
 * The changes to be done in the app level for rendering critical Css will be updated shortly
 * ```
 * @category Server
 * @module render
 */
/**
 * @param {Component} Component The Component to render
 * @param {Redux} store The store to render
 * @param {extractor} props Instance of ChunkExtractor from loadable
 * @param {Object} props The props to pass to the component
 */
exports.renderLoadableReduxComponent = function renderLoadableReduxComponent(
  Component,
  store,
  extractor,
  props
) {
  const children = React.createElement(Component, props);
  //Wrap your component using "collectChunks"
  const component = extractor.collectChunks(
    React.createElement(Provider, { store }, children)
  );
  // Render your Component
  return ReactDOMServer.renderToString(component);
};
