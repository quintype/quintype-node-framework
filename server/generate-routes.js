/**
 * This name contins helpers for generating routes.
 * ```javascript
 * import { generateCommonRoutes } from "@quintype/framework/server/generate-routes";
 * ```
 * @category Server
 * @module generate-routes
 */

// The below code dynamically generates routes based on the config
// A section sect will generate three urls:
// /sect, /sect/:storySlug, /sect/*/:storySlug
const _ = require("lodash");

let shownDeprecationWarning = false;
function deprecationWarning() {
  if (!shownDeprecationWarning) {
    // eslint-disable-next-line no-console
    console.warn(
      "[WARNING] generateSectionPageRoutes and generateStoryPageRoutes are deprecated and will be removed in @quintype/framework v4. Please switch to generateCommonRoutes https://github.com/quintype/quintype-node-framework/blob/master/README.md#switching-to-generatecommonroutes"
    );
    shownDeprecationWarning = true;
  }
}

exports.generateSectionPageRoutes = function generateSectionPageRoutes(
  config,
  opts = {}
) {
  deprecationWarning();

  const sections = config.getDomainSections(opts.domainSlug);

  const sectionsById = _(sections).reduce((acc, section) => {
    acc[section.id] = section;
    return acc;
  }, {});

  return _(sections)
    .flatMap((section) => generateSectionPageRoute(section, sectionsById, opts))
    .value();
};

function generateSectionPageRoute(section, sectionsById, opts) {
  const params = { sectionId: section.id, ...(opts.preview && { preview: true }) };
  if (section.collection) params.collectionSlug = section.collection.slug;

  let { slug } = section;

  if (section["parent-id"]) {
    let currentSection = section;
    let depth = 0;
    while (currentSection["parent-id"] && depth++ < 5) {
      currentSection = sectionsById[currentSection["parent-id"]] || {
        slug: "invalid",
      };
      slug = `${currentSection.slug}/${slug}`;
    }
  }

  let routes = [];
  if (section["parent-id"] && opts.secWithoutParentPrefix)
    routes = [section.slug, slug];
  else routes = [slug];

  if (opts.addSectionPrefix)
    routes = _.flatMap(routes, (route) => [
      sectionPageRoute(route, params),
      addSectionPrefix(route, params),
    ]);
  else routes = _.flatMap(routes, (route) => [sectionPageRoute(route, params)]);

  return routes;
}

function addSectionPrefix(route, params) {
  return sectionPageRoute(`section/${route}`, params);
}

function sectionPageRoute(route, params) {
  return {
    pageType: "section-page",
    exact: true,
    path: `/${route}`,
    params,
  };
}

exports.generateStoryPageRoutes = function generateStoryPageRoutes(
  config,
  { withoutParentSection, domainSlug, skipPWA } = {}
) {
  deprecationWarning();
  const sections = config.getDomainSections(domainSlug);
  return _(sections)
    .filter((section) => withoutParentSection || !section["parent-id"])
    .flatMap((section) => [
      storyPageRoute(`/${section.slug}/:storySlug`, skipPWA || false),
      storyPageRoute(`/${section.slug}/*/:storySlug`, skipPWA || false),
    ])
    .value();
};

function storyPageRoute(path, skipPWA = false) {
  return {
    pageType: "story-page",
    exact: true,
    path,
    skipPWA,
  };
}

/**
 * This is used to generate all routes
 *
 * @param {Config} config The config object
 * @param {string} domainSlug The domainSlug (undefined if this is the main domain)
 * @param {Object} opts
 * @param {boolean} opts.allRoutes Generate all routes (default true)
 * @param {boolean} opts.sectionPageRoutes Generate section page routes (default *allRoutes*)
 * @param {boolean} opts.storyPageRoutes Generate story page routes (default *allRoutes*)
 * @param {boolean} opts.homePageRoute Generate home page route (default *allRoutes*)
 * @param {Object}  opts.skipPWA
 * @param {boolean} opts.skipPWA.story Skips PWA for story pages
 * @param {boolean} opts.skipPWA.home Skips PWA for home pages
 * @param {boolean} opts.skipPWA.section Skips PWA for section pages
 * @return {Array<module:match-best-route~Route>} Array of created routes
 */
exports.generateCommonRoutes = function generateSectionPageRoutes(
  config,
  domainSlug,
  {
    allRoutes = true,
    sectionPageRoutes = allRoutes,
    storyPageRoutes = allRoutes,
    homePageRoute = allRoutes,
    skipPWA = {},
  } = {}
) {
  const sections = config.getDomainSections(domainSlug);
  const sectionRoutes = sections.map((s) =>
    sectionToSectionRoute(config["sketches-host"], s, skipPWA.section || false)
  );
  const storyRoutes = sectionRoutes.map(({ path }) => ({
    path: `${path.replace(/^\/section\//, "/")}(/.*)?/:storySlug`,
    pageType: "story-page",
    exact: true,
    skipPWA: skipPWA.story || false,
  }));
  return [].concat(
    homePageRoute
      ? [
          {
            path: "/",
            pageType: "home-page",
            exact: true,
            skipPWA: skipPWA.home || false,
            params: {
              collectionSlug: config.getHomeCollectionSlug(domainSlug),
            },
          },
        ]
      : [],
    sectionPageRoutes ? sectionRoutes : [],
    storyPageRoutes ? storyRoutes : []
  );
};

function sectionToSectionRoute(baseUrl, section, skipPWA = false) {
  const params = {
    sectionId: section.id,
  };
  if (section.collection && section.collection.slug) {
    params.collectionSlug = section.collection.slug;
  }

  try {
    const sectionUrl = section["section-url"];
    const relativeUrl =
      baseUrl && sectionUrl.startsWith(baseUrl)
        ? sectionUrl.slice(baseUrl.length)
        : new URL(section["section-url"]).pathname;
    return {
      path: relativeUrl,
      pageType: "section-page",
      exact: true,
      params,
      skipPWA,
    };
  } catch (e) {
    return {
      path: `/${section.slug}`,
      pageType: "section-page",
      exact: true,
      params,
      skipPWA,
    };
  }
}
