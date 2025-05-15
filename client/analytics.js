/**
 * Register a page view in Google Analytics. This method takes the page object, which is usually returned from *"/route-data.json"*.
 * @param {Object} page ex: *{"page-type": "story-page", "story": {...}}*
 * @param {string} newPath ex: "/path/to/story"
 * @returns {void}
 */
export function registerPageView(page, newPath) {
  if (newPath && global.ga && !global.qtNoAutomaticGATracking) {
    global.ga(function (tracker) {
      tracker = tracker || global.ga.getByName("gtm1");
      if (!tracker) return;
      tracker.set("page", newPath);
      tracker.send("pageview");
    });
  }
}
