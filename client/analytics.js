/**
 * This namespace handles a number of analytics related functions.
 * The vast majority of these features are already wired by default, but and are only required to be called manually if you are doing something special.
 * By default, both GA and qlitics are tracked (including when pages are loaded via AJAX).
 *
 * The GA tracker looks for the default tracker, then looks for the tracker called `gtm1`. If you would like to disable GA tracking, set `window.qtNoAutomaticGATracking` to true.
 *
 * ```javascript
 * import * from "@quintype/framework/client/analytics";
 * ```
 * @category Client
 * @module analytics
 */

import get from "lodash/get";

// Qlitics deprecation warning
const QLITICS_DEPRECATION_WARNING = `
🚨 QLITICS DEPRECATION WARNING 🚨
Qlitics analytics has been deprecated and will be removed in a future version.
Please migrate to Google Analytics (GA4) or other analytics solutions.
For migration guidance, contact the development team.
`;

/**
 * Load qlitics.js. This should be done automatically for you
 * @returns {void}
 */
// istanbul ignore next
export function startAnalytics({ mountAt = global.qtMountAt || "" } = {}) {
  // Check if qlitics is already initialized to avoid multiple warnings
  if (!global.qlitics) {
    console.warn(QLITICS_DEPRECATION_WARNING);

    // Create a no-op qlitics function to prevent errors
    global.qlitics = function () {
      // Silently ignore all qlitics calls to prevent breaking existing code
      // This ensures backward compatibility while deprecating the service
    };

    // Initialize the no-op function
    global.qlitics("init");
  }

  // Note: We're no longer loading the actual qlitics.js script
  // This prevents any external dependencies while maintaining API compatibility
}

function pageTypeToQliticsPageType(pageType) {
  switch (pageType) {
    case "story-page":
      return "story";
    case "home-page":
      return "home";
    case "section-page":
      return "section";
    case "tag-page":
      return "topic";
    default:
      return pageType;
  }
}

/**
 * Register a story view event. This should already be wired up for story pages, but this event can
 * be fired on an infinite scroll event. Ideally, please use {@link registerPageView}
 * @param {uuid} storyContentId
 * @returns {void}
 */
export function registerStoryView(storyContentId) {
  // Qlitics is deprecated - this function now does nothing
  // Consider migrating to GA4 or other analytics solutions
  if (global.qlitics && typeof global.qlitics === 'function') {
    global.qlitics("track", "story-view", {
      "story-content-id": storyContentId,
    });
  }
}

/**
 * Register a page view in both qlitics and google analytics. This method takes the page object, which is usually returned from *"/route-data.json"*.
 * @param {Object} page ex: *{"page-type": "story-page", "story": {...}}*
 * @param {string} newPath ex: "/path/to/story"
 * @returns {void}
 */
export function registerPageView(page, newPath) {
  // Qlitics is deprecated - only track in GA now
  if (global.qlitics && typeof global.qlitics === 'function') {
    global.qlitics("track", "page-view", {
      "page-type": pageTypeToQliticsPageType(page.pageType),
    });
  }

  if (page.pageType == "story-page") {
    registerStoryView(get(page.data, ["story", "id"]));
  }

  if (newPath && global.ga && !global.qtNoAutomaticGATracking) {
    global.ga(function (tracker) {
      tracker = tracker || global.ga.getByName("gtm1");
      if (!tracker) return;
      tracker.set("page", newPath);
      tracker.send("pageview");
    });
  }
}

/**
 * Set the current member id on qlitics
 * @param {number} memberId The member id of the logged in member
 * @returns {void}
 */
export function setMemberId(memberId) {
  // Qlitics is deprecated - this function now does nothing
  if (global.qlitics && typeof global.qlitics === 'function') {
    global.qlitics("set", "member-id", memberId);
  }
}

/**
 * This event will register a social share of a story in qlitics
 * @param {uuid} storyContentId The id of the story being shared
 * @param {string} socialMediaType The social network the item is being shared on
 * @param {string} storyUrl The canonical URL of the story
 * @returns {void}
 */
export function registerStoryShare(storyContentId, socialMediaType, storyUrl) {
  // Qlitics is deprecated - this function now does nothing
  if (global.qlitics && typeof global.qlitics === 'function') {
    global.qlitics("track", "story-share", {
      "story-content-id": storyContentId,
      "social-media-type": socialMediaType,
      url: storyUrl,
    });
  }
}
