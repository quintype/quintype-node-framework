const assert = require("assert");
const { Config } = require("../../server/impl/api-client-impl");
const {
  generateSectionPageRoutes,
  generateStoryPageRoutes,
  generateCommonRoutes,
} = require("../../server/generate-routes");

describe("generateRoutes", function () {
  it("generates section routes correctly", function () {
    const expectedRoutes = [
      {
        path: "/sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 42 },
      },
      {
        path: "/sect/sub-sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 43 },
      },
    ];
    assert.deepEqual(
      expectedRoutes,
      generateSectionPageRoutes(
        Config.build({
          sections: [
            { id: 42, slug: "sect" },
            { id: 43, slug: "sub-sect", "parent-id": 42 },
          ],
        })
      )
    );
  });

  it("generates section routes correctly with section prefix", function () {
    const expectedRoutes = [
      {
        path: "/sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 42 },
      },
      {
        path: "/section/sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 42 },
      },
      {
        path: "/sect/sub-sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 43 },
      },
      {
        path: "/section/sect/sub-sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 43 },
      },
    ];
    assert.deepEqual(
      expectedRoutes,
      generateSectionPageRoutes(
        Config.build({
          sections: [
            { id: 42, slug: "sect" },
            { id: 43, slug: "sub-sect", "parent-id": 42 },
          ],
        }),
        { addSectionPrefix: true }
      )
    );
  });

  it("generates section with collection slug", function () {
    const expectedRoutes = [
      {
        path: "/sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 42, collectionSlug: "sect" },
      },
    ];
    assert.deepEqual(
      expectedRoutes,
      generateSectionPageRoutes(
        Config.build({
          sections: [{ id: 42, slug: "sect", collection: { slug: "sect" } }],
        })
      )
    );
  });

  it("generates extra sub section route when secWithoutParentPrefix is true", function () {
    const expectedRoutes = [
      {
        path: "/sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 42 },
      },
      {
        path: "/sub-sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 43 },
      },
      {
        path: "/sect/sub-sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 43 },
      },
    ];
    assert.deepEqual(
      expectedRoutes,
      generateSectionPageRoutes(
        Config.build({
          sections: [
            { id: 42, slug: "sect" },
            { id: 43, slug: "sub-sect", "parent-id": 42 },
          ],
        }),
        { secWithoutParentPrefix: true }
      )
    );
  });

  it("generates extra sub section route and with section prefix when both secWithoutParentPrefix and addSectionPrefix is true", function () {
    const expectedRoutes = [
      {
        path: "/sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 42 },
      },
      {
        path: "/section/sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 42 },
      },
      {
        path: "/sub-sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 43 },
      },
      {
        path: "/section/sub-sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 43 },
      },
      {
        path: "/sect/sub-sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 43 },
      },
      {
        path: "/section/sect/sub-sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 43 },
      },
    ];

    assert.deepEqual(
      expectedRoutes,
      generateSectionPageRoutes(
        Config.build({
          sections: [
            { id: 42, slug: "sect" },
            { id: 43, slug: "sub-sect", "parent-id": 42 },
          ],
        }),
        { secWithoutParentPrefix: true, addSectionPrefix: true }
      )
    );
  });

  it("generates story routes correctly", function () {
    const expectedRoutes = [
      {
        path: "/sect/:storySlug",
        pageType: "story-page",
        exact: true,
        skipPWA: false,
      },
      {
        path: "/sect/*/:storySlug",
        pageType: "story-page",
        exact: true,
        skipPWA: false,
      },
    ];
    assert.deepEqual(
      expectedRoutes,
      generateStoryPageRoutes(
        Config.build({
          sections: [
            { id: 42, slug: "sect", skipPWA: false },
            { id: 43, slug: "sub-sect", "parent-id": 42, skipPWA: false },
          ],
        })
      )
    );
  });

  it("adds routes for subsections when withoutParentSection is set", function () {
    const expectedRoutes = [
      {
        path: "/sect/:storySlug",
        pageType: "story-page",
        exact: true,
        skipPWA: false,
      },
      {
        path: "/sect/*/:storySlug",
        pageType: "story-page",
        exact: true,
        skipPWA: false,
      },
      {
        path: "/sub-sect/:storySlug",
        pageType: "story-page",
        exact: true,
        skipPWA: false,
      },
      {
        path: "/sub-sect/*/:storySlug",
        pageType: "story-page",
        exact: true,
        skipPWA: false,
      },
    ];
    assert.deepEqual(
      expectedRoutes,
      generateStoryPageRoutes(
        Config.build({
          sections: [
            { id: 42, slug: "sect", skipPWA: false },
            { id: 43, slug: "sub-sect", "parent-id": 42, skipPWA: false },
          ],
        }),
        { withoutParentSection: true }
      )
    );
  });

  it("does not go into infinite loop if sections are recursive", function () {
    const expectedRoutes = [
      {
        path: "/sect/sect/sect/sect/sect/sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 42 },
      },
    ];
    assert.deepEqual(
      expectedRoutes,
      generateSectionPageRoutes(
        Config.build({
          sections: [{ id: 42, slug: "sect", "parent-id": 42 }],
        })
      )
    );
  });

  it("handles missing parents correctly", function () {
    const expectedRoutes = [
      {
        path: "/invalid/sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 42 },
      },
    ];
    assert.deepEqual(
      expectedRoutes,
      generateSectionPageRoutes(
        Config.build({
          sections: [{ id: 42, slug: "sect", "parent-id": 1 }],
        })
      )
    );
  });
});

describe("MultiDomain Support", function () {
  const config = {
    sections: [
      { id: 42, slug: "sect", "domain-slug": "subdomain" },
      { id: 43, slug: "sub-sect", "domain-slug": "subdomain", "parent-id": 42 },
      { id: 44, slug: "sect2", "domain-slug": null },
      { id: 45, slug: "sub-sect2", "parent-id": 44, "domain-slug": null },
    ],
  };

  it("generate routes given a domainSlug", function () {
    const expectedRoutes = [
      {
        path: "/sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 42 },
      },
      {
        path: "/sect/sub-sect",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 43 },
      },
    ];
    const allRoutes = generateSectionPageRoutes(Config.build(config), {
      domainSlug: "subdomain",
    });
    assert.deepEqual(expectedRoutes, allRoutes);
  });

  it("generates routes for null domain", function () {
    const expectedRoutes = [
      {
        path: "/sect2",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 44 },
      },
      {
        path: "/sect2/sub-sect2",
        pageType: "section-page",
        exact: true,
        params: { sectionId: 45 },
      },
    ];
    const allRoutes = generateSectionPageRoutes(Config.build(config), {
      domainSlug: null,
    });
    assert.deepEqual(expectedRoutes, allRoutes);
  });

  it("generates story page routes given a domain Slug", function () {
    const expectedRoutes = [
      {
        path: "/sect/:storySlug",
        pageType: "story-page",
        exact: true,
        skipPWA: false,
      },
      {
        path: "/sect/*/:storySlug",
        pageType: "story-page",
        exact: true,
        skipPWA: false,
      },
    ];
    const allRoutes = generateStoryPageRoutes(Config.build(config), {
      domainSlug: "subdomain",
    });
    assert.deepEqual(expectedRoutes, allRoutes);
  });
});

describe("generateCommonRoutes", function () {
  it("generates section and story page routes", function () {
    const config = Config.build({
      sections: [
        { id: 42, "section-url": "https://quintype-demo.quintype.io/photos" },
      ],
    });

    assert.deepEqual(
      [{
        exact: true,
        pageType: 'home-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/home',
        skipPWA: true
      },
      {
        exact: true,
        pageType: 'collection-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/:collectionSlug',
        skipPWA: false
      },
        {
          path: "/photos",
          pageType: "section-page",
          exact: true,
          params: { sectionId: 42 },
          skipPWA: false,
        },
      ],
      generateCommonRoutes(config, undefined, {
        allRoutes: false,
        sectionPageRoutes: true,
      })
    );

    assert.deepEqual(
      [{
        exact: true,
        pageType: 'home-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/home',
        skipPWA: true
      },
      {
        exact: true,
        pageType: 'collection-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/:collectionSlug',
        skipPWA: false
      },
        {
          path: "/photos(/.*)?/:storySlug",
          pageType: "story-page",
          exact: true,
          skipPWA: false,
        },
      ],
      generateCommonRoutes(config, undefined, {
        allRoutes: false,
        storyPageRoutes: true,
      })
    );
  });

  it("respects the skipPWA parameter for home, story and section pages", function () {
    const config = Config.build({
      sections: [
        { id: 42, "section-url": "https://quintype-demo.quintype.io/photos" },
      ],
    });

    assert.deepEqual(
      [{
        exact: true,
        pageType: 'home-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/home',
        skipPWA: true
      },
      {
        exact: true,
        pageType: 'collection-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/:collectionSlug',
        skipPWA: false
      },
        {
          path: "/photos",
          pageType: "section-page",
          exact: true,
          params: { sectionId: 42 },
          skipPWA: true,
        },

      ],
      generateCommonRoutes(config, undefined, {
        allRoutes: false,
        sectionPageRoutes: true,
        skipPWA: { section: true },
      })
    );

    assert.deepEqual(
      [
        {
          path: "/",
          pageType: "home-page",
          params: { collectionSlug: "home" },
          exact: true,
          skipPWA: true,
        },{
          exact: true,
          pageType: 'home-page-preview',
          params: {
            collectionSlug: 'home'
          },
          path: '/preview/:previewId/collection/home',
          skipPWA: true
        },
        {
          exact: true,
          pageType: 'collection-page-preview',
          params: {
            collectionSlug: 'home'
          },
          path: '/preview/:previewId/collection/:collectionSlug',
          skipPWA: true
        },
      ],
      generateCommonRoutes(config, undefined, {
        allRoutes: false,
        homePageRoute: true,
        skipPWA: { home: true },
      })
    );

    assert.deepEqual(
      [{
        exact: true,
        pageType: 'home-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/home',
        skipPWA: true
      },
      {
        exact: true,
        pageType: 'collection-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/:collectionSlug',
        skipPWA: false
      },
        {
          path: "/photos(/.*)?/:storySlug",
          pageType: "story-page",
          exact: true,
          skipPWA: true,
        },
      ],
      generateCommonRoutes(config, undefined, {
        allRoutes: false,
        storyPageRoutes: true,
        skipPWA: { story: true },
      })
    );
  });

  it("picks up the collection slug if there is one present in the section", function () {
    const config = Config.build({
      sections: [
        {
          id: 42,
          "section-url": "https://quintype-demo.quintype.io/photos",
          collection: { slug: "photos" },
        },
      ],
    });

    assert.deepEqual(
      [{
        exact: true,
        pageType: 'home-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/home',
        skipPWA: true
      },
      {
        exact: true,
        pageType: 'collection-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/:collectionSlug',
        skipPWA: false
      },
        {
          path: "/photos",
          pageType: "section-page",
          exact: true,
          params: { sectionId: 42, collectionSlug: "photos" },
          skipPWA: false,
        },
      ],
      generateCommonRoutes(config, undefined, {
        allRoutes: false,
        sectionPageRoutes: true,
      })
    );
  });

  it("only picks the sections from the correct domain", function () {
    const config = Config.build({
      sections: [
        {
          id: 42,
          "section-url": "https://quintype-demo.quintype.io/photos",
          "domain-slug": "sub",
        },
      ],
    });

    assert.deepEqual(
      [{
        exact: true,
        pageType: 'home-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/home',
        skipPWA: true
      },
      {
        exact: true,
        pageType: 'collection-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/:collectionSlug',
        skipPWA: false
      }],
      generateCommonRoutes(config, null, {
        allRoutes: false,
        sectionPageRoutes: true,
      })
    );

    assert.deepEqual(
      [{
        exact: true,
        pageType: 'home-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/home',
        skipPWA: true
      },
      {
        exact: true,
        pageType: 'collection-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/:collectionSlug',
        skipPWA: false
      },
        {
          path: "/photos",
          pageType: "section-page",
          exact: true,
          params: { sectionId: 42 },
          skipPWA: false,
        },
      ],
      generateCommonRoutes(config, "sub", {
        allRoutes: false,
        sectionPageRoutes: true,
      })
    );
  });

  it("puts section urls before the story urls", function () {
    const config = Config.build({
      sections: [
        { id: 42, "section-url": "https://quintype-demo.quintype.io/photos" },
        {
          id: 43,
          "section-url": "https://quintype-demo.quintype.io/photos/gallery",
        },
      ],
    });

    assert.deepEqual(
      [{
        exact: true,
        pageType: 'home-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/home',
        skipPWA: true
      },
      {
        exact: true,
        pageType: 'collection-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/:collectionSlug',
        skipPWA: false
      },
        {
          path: "/photos",
          pageType: "section-page",
          exact: true,
          params: { sectionId: 42 },
          skipPWA: false,
        },
        {
          path: "/photos/gallery",
          pageType: "section-page",
          exact: true,
          params: { sectionId: 43 },
          skipPWA: false,
        },
        {
          path: "/photos(/.*)?/:storySlug",
          pageType: "story-page",
          exact: true,
          skipPWA: false,
        },
        {
          path: "/photos/gallery(/.*)?/:storySlug",
          pageType: "story-page",
          exact: true,
          skipPWA: false,
        },
      ],
      generateCommonRoutes(config, undefined, {
        allRoutes: false,
        sectionPageRoutes: true,
        storyPageRoutes: true,
      })
    );
  });

  it("removes /section from the story route", function () {
    const config = Config.build({
      sections: [
        {
          id: 42,
          "section-url": "https://quintype-demo.quintype.io/section/photos",
        },
      ],
    });

    assert.deepEqual(
      [{
        exact: true,
        pageType: 'home-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/home',
        skipPWA: true
      },
      {
        exact: true,
        pageType: 'collection-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/:collectionSlug',
        skipPWA: false
      },
        {
          path: "/section/photos",
          pageType: "section-page",
          exact: true,
          params: { sectionId: 42 },
          skipPWA: false,
        },
      ],
      generateCommonRoutes(config, undefined, {
        allRoutes: false,
        sectionPageRoutes: true,
      })
    );

    assert.deepEqual(
      [{
        exact: true,
        pageType: 'home-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/home',
        skipPWA: true
      },
      {
        exact: true,
        pageType: 'collection-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/:collectionSlug',
        skipPWA: false
      },
        {
          path: "/photos(/.*)?/:storySlug",
          pageType: "story-page",
          exact: true,
          skipPWA: false,
        },
      ],
      generateCommonRoutes(config, undefined, {
        allRoutes: false,
        storyPageRoutes: true,
      })
    );
  });

  it("generates things correctly if the section-url is missing", function () {
    const config = Config.build({ sections: [{ id: 42, slug: "photos" }] });

    assert.deepEqual(
      [{
        exact: true,
        pageType: 'home-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/home',
        skipPWA: true
      },
      {
        exact: true,
        pageType: 'collection-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/:collectionSlug',
        skipPWA: false
      },
        {
          path: "/photos(/.*)?/:storySlug",
          pageType: "story-page",
          exact: true,
          skipPWA: false,
        },
      ],
      generateCommonRoutes(config, undefined, {
        allRoutes: false,
        storyPageRoutes: true,
      })
    );

    assert.deepEqual(
      [{
        exact: true,
        pageType: 'home-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/home',
        skipPWA: true
      },
      {
        exact: true,
        pageType: 'collection-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/:collectionSlug',
        skipPWA: false
      },
        {
          path: "/photos",
          pageType: "section-page",
          exact: true,
          params: { sectionId: 42 },
          skipPWA: false,
        },
      ],
      generateCommonRoutes(config, undefined, {
        allRoutes: false,
        sectionPageRoutes: true,
      })
    );
  });

  it("generates the home page route", function () {
    const config = Config.build({
      domains: [{ slug: "sub", "home-collection-id": "home" }],
      sections: [],
    });

    assert.deepEqual(
      [
        {
          path: "/",
          pageType: "home-page",
          exact: true,
          params: { collectionSlug: "home" },
          skipPWA: false,
        },
        {
          exact: true,
          pageType: 'home-page-preview',
          params: {
            collectionSlug: 'home'
          },
          path: '/preview/:previewId/collection/home',
          skipPWA: true
        },
        {
          exact: true,
          pageType: 'collection-page-preview',
          params: {
            collectionSlug: 'home'
          },
          path: '/preview/:previewId/collection/:collectionSlug',
          skipPWA: false
        },
      ],
      generateCommonRoutes(config, undefined, {
        allRoutes: false,
        homePageRoute: true,
      })
    );

    assert.deepEqual(
      [
        {
          path: "/",
          pageType: "home-page",
          exact: true,
          params: { collectionSlug: "home" },
          skipPWA: false,
        },
        {
          exact: true,
          pageType: 'home-page-preview',
          params: {
            collectionSlug: 'home'
          },
          path: '/preview/:previewId/collection/home',
          skipPWA: true
        },
        {
          exact: true,
          pageType: 'collection-page-preview',
          params: {
            collectionSlug: 'home'
          },
          path: '/preview/:previewId/collection/:collectionSlug',
          skipPWA: false
        },
      ],
      generateCommonRoutes(config, null, {
        allRoutes: false,
        homePageRoute: true,
      })
    );

    assert.deepEqual(
      [
        {
          path: "/",
          pageType: "home-page",
          exact: true,
          params: { collectionSlug: "home" },
          skipPWA: false,
        },
        {
          exact: true,
          pageType: 'home-page-preview',
          params: {
            collectionSlug: 'home'
          },
          path: '/preview/:previewId/collection/home',
          skipPWA: true
        },
        {
          exact: true,
          pageType: 'collection-page-preview',
          params: {
            collectionSlug: 'home'
          },
          path: '/preview/:previewId/collection/:collectionSlug',
          skipPWA: false
        },
      ],
      generateCommonRoutes(config, "sub", {
        allRoutes: false,
        homePageRoute: true,
      })
    );
  });

  it("removes the mount point from the section path", function () {
    const config = Config.build({
      "sketches-host": "https://quintype-demo.quintype.io/foo",
      sections: [
        {
          id: 42,
          "section-url": "https://quintype-demo.quintype.io/foo/photos",
        },
      ],
    });

    assert.deepEqual(
      [{
        exact: true,
        pageType: 'home-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/home',
        skipPWA: true
      },
      {
        exact: true,
        pageType: 'collection-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/:collectionSlug',
        skipPWA: false
      },
        {
          path: "/photos",
          pageType: "section-page",
          exact: true,
          params: { sectionId: 42 },
          skipPWA: false,
        },
      ],
      generateCommonRoutes(config, undefined, {
        allRoutes: false,
        sectionPageRoutes: true,
      })
    );

    assert.deepEqual(
      [{
        exact: true,
        pageType: 'home-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/home',
        skipPWA: true
      },
      {
        exact: true,
        pageType: 'collection-page-preview',
        params: {
          collectionSlug: 'home'
        },
        path: '/preview/:previewId/collection/:collectionSlug',
        skipPWA: false
      },
        {
          path: "/photos(/.*)?/:storySlug",
          pageType: "story-page",
          exact: true,
          skipPWA: false,
        },
      ],
      generateCommonRoutes(config, undefined, {
        allRoutes: false,
        storyPageRoutes: true,
      })
    );
  });
});
