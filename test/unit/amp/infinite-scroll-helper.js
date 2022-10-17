/* eslint-disable no-undef */
/* eslint-disable func-names */

const assert = require("assert");
const InfiniteScrollAmp = require("../../../server/amp/helpers/infinite-scroll");

function getClientStub({
  getCollectionBySlug = (slug) =>
    new Promise((resolve) => {
      if (slug === "amp-infinite-scroll")
        resolve({
          items: [
            {
              type: "story",
              id: 1111,
              story: {
                "story-template": "text",
                headline: "aaa",
                "story-content-id": 1111,
                slug: "sports/aa",
                "hero-image-s3-key": "aa/a.jpg",
                access: "public",
              },
            },
            {
              type: "story",
              id: 2222,
              story: {
                "story-template": "visual-story",
                headline: "bbb",
                "story-content-id": 2222,
                slug: "sports/bb",
                "hero-image-s3-key": "bb/b.jpg",
                access: "public",
              },
            },
            {
              type: "story",
              id: 3333,
              story: {
                "story-template": "text",
                headline: "ccc",
                "story-content-id": 3333,
                slug: "sports/cc",
                "hero-image-s3-key": "cc/c.jpg",
                access: "public",
              },
            },
            {
              type: "story",
              id: 4444,
              story: {
                "story-template": "text",
                headline: "ddd",
                "story-content-id": 4444,
                slug: "sports/dd",
                "hero-image-s3-key": "dd/d.jpg",
                access: "public",
              },
            },
            {
              type: "story",
              id: 5555,
              story: {
                "story-template": "text",
                headline: "eee",
                "story-content-id": 5555,
                slug: "sports/ee",
                "hero-image-s3-key": "ee/e.jpg",
                access: "public",
              },
            },
            {
              type: "story",
              id: 6666,
              story: {
                "story-template": "text",
                headline: "fff",
                "story-content-id": 6666,
                slug: "sports/ff",
                "hero-image-s3-key": "ff/f.jpg",
                access: "public",
              },
            },
            {
              type: "story",
              id: 7777,
              story: {
                "story-template": "text",
                headline: "ggg",
                "story-content-id": 7777,
                slug: "sports/gg",
                "hero-image-s3-key": "gg/g.jpg",
                access: "public",
              },
            },
            {
              type: "story",
              id: 8888,
              story: {
                "story-template": "text",
                headline: "hhh",
                "story-content-id": 8888,
                slug: "sports/hh",
                "hero-image-s3-key": "hh/h.jpg",
                access: "public",
              },
            },
          ],
        });
      resolve(null);
    }),
  getRelatedStories = () =>
    new Promise((resolve) => {
      resolve({
        "related-stories": [
          {
            "story-template": "text",
            headline: "aaa",
            "story-content-id": 1111,
            slug: "sports/aa",
            "hero-image-s3-key": "aa/a.jpg",
            access: "public",
          },
          {
            "story-template": "visual-story",
            headline: "bbb",
            "story-content-id": 2222,
            slug: "sports/bb",
            "hero-image-s3-key": "bb/b.jpg",
            access: "public",
          },
          {
            "story-template": "text",
            headline: "ccc",
            "story-content-id": 3333,
            slug: "sports/cc",
            "hero-image-s3-key": "cc/c.jpg",
            access: "public",
          },
          {
            "story-template": "text",
            headline: "ddd",
            "story-content-id": 4444,
            slug: "sports/dd",
            "hero-image-s3-key": "dd/d.jpg",
            access: "public",
          },
          {
            "story-template": "text",
            headline: "eee",
            "story-content-id": 5555,
            slug: "politics/ee",
            "hero-image-s3-key": "ee/e.jpg",
            access: "public",
          },
          {
            "story-template": "text",
            headline: "fff",
            "story-content-id": 6666,
            slug: "politics/ff",
            "hero-image-s3-key": "ff/f.jpg",
            access: "public",
          },
          {
            "story-template": "text",
            headline: "ggg",
            "story-content-id": 7777,
            slug: "politics/gg",
            "hero-image-s3-key": "gg/g.jpg",
            access: "public",
          },
          {
            "story-template": "text",
            headline: "hhh",
            "story-content-id": 8888,
            slug: "politics/hh",
            "hero-image-s3-key": "hh/h.jpg",
            access: "public",
          },
        ],
      });
    }),
} = {}) {
  return {
    getCollectionBySlug,
    getRelatedStories,
  };
}
function getCustomApiStoriesClientStub({
  getCustomApiStories = () =>
    new Promise((resolve) => {
      resolve(
        [
          {
            title: "aaa",
            url: "sports/aa",
            image: "aa/a.jpg",
          },
          {
            title: "bbb",
            url: "sports/bb",
            image: "bb/b.jpg",
          },
          {
            title: "ccc",
            url: "sports/cc",
            image: "cc/c.jpg",
          },
          {
            title: "ddd",
            url: "sports/dd",
            image: "dd/d.jpg",
          },
          {
            title: "eee",
            url: "politics/ee",
            image: "ee/e.jpg",
          },
          {
            title: "fff",
            url: "politics/ff",
            image: "ff/f.jpg",
          },
          {
            title: "ggg",
            url: "politics/gg",
            image: "gg/g.jpg",
          },
          {
            title: "hhh",
            url: "politics/hh",
            image: "hh/h.jpg",
          },
        ]
      );
    }),
} = {}) {
  return {
    getCustomApiStories,
  };
}
class CustomInfiniteScrollAmp {
  constructor({ client, publisherConfig, queryParams, infiniteScrollSource }) {
    this.client = client;
    this.publisherConfig = publisherConfig;
    this.queryParams = queryParams;
    this.infiniteScrollSource = infiniteScrollSource;
  }

  async getCustomStoryList({ type = "inlineConfig" }) {
    const customStories = await this.client.getCustomApiStories();
    if (!customStories || customStories.length === 0)
      return new Error();
    if (type === "remoteConfig") {
      return JSON.stringify({ pages: customStories });
    }
    return JSON.stringify(customStories);
  };
}
const dummyPublisherConfig = {
  "cdn-image": "gumlet.assettype.com",
};

describe("getInitialInlineConfig method of InfiniteScrollAmp helper function", function () {
  // collection
  it("should throw err if storyId isn't passed", async function () {
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: getClientStub(),
      publisherConfig: dummyPublisherConfig,
    });
    const inlineConfig = await infiniteScrollAmp.getInitialInlineConfig({ storyId: "" });
    assert.strictEqual(inlineConfig instanceof Error, true);
    assert.throws(() => {
      throw new Error("Required params for getInitialInlineConfig missing");
    }, inlineConfig);
  });
  it("should return null if infinite scroll collection doesn't exist", async function () {
    const clientStub = getClientStub({
      getCollectionBySlug: (slug) =>
        new Promise((resolve) => {
          resolve(null);
        }),
    });
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
    });
    const inlineConfig = await infiniteScrollAmp.getInitialInlineConfig({
      storyId: 2222,
    });
    assert.strictEqual(inlineConfig, null);
  });
  it("should return null if infinite scroll collection contains no stories", async function () {
    const clientStub = getClientStub({
      getCollectionBySlug: (slug) =>
        new Promise((resolve) => {
          resolve({
            items: [],
          });
        }),
    });
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
    });
    const inlineConfig = await infiniteScrollAmp.getInitialInlineConfig({
      storyId: 2222,
    });
    assert.strictEqual(inlineConfig, null);
  });
  it("should remove current story from infinite scroll", async function () {
    const clientStub = getClientStub();
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
    });
    const inlineConfig = await infiniteScrollAmp.getInitialInlineConfig({
      storyId: 2222,
    });
    assert.strictEqual(false, /sports\/bb/.test(inlineConfig));
    assert.strictEqual(false, /bb\/b.jpg/.test(inlineConfig));
  });
  it("should remove visual stories from infinite scroll", async function () {
    const clientStub = getClientStub();
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
    });
    const inlineConfig = await infiniteScrollAmp.getInitialInlineConfig({
      storyId: 3333,
    });
    assert.strictEqual(false, /sports\/bb/.test(inlineConfig));
    assert.strictEqual(false, /bb\/b.jpg/.test(inlineConfig));
  });
  it("should format JSON as per AMP spec", async function () {
    // https://amp.dev/documentation/components/amp-next-page/
    const clientStub = getClientStub();
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
    });
    const inlineConfig = await infiniteScrollAmp.getInitialInlineConfig({
      storyId: 2222,
    });
    function isInlineConfigStructureValid(jsonStr) {
      const stories = JSON.parse(jsonStr);
      if (!stories.length) throw new Error("Can't verify empty array!");
      stories.forEach((story) => {
        const keys = Object.keys(story);
        if (keys.includes("image") && keys.includes("url") && keys.includes("title") && keys.length === 3) return;
        throw new Error("Invalid InlineConfigStructure");
      });
      return true;
    }
    assert.strictEqual(isInlineConfigStructureValid(inlineConfig), true);
  });
  // it("should take the first 'n' stories", async function() {
  //   // this test needs to be written after https://github.com/quintype/quintype-node-framework/pull/202 is merged
  // })
  /// related-stories
  it("should throw err if storyId isn't passed for relatedStoriesApi", async function () {
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: getClientStub(),
      publisherConfig: dummyPublisherConfig,
      infiniteScrollSource: "relatedStoriesApi",
    });
    const inlineConfig = await infiniteScrollAmp.getInitialInlineConfig({ storyId: "" });
    assert.strictEqual(inlineConfig instanceof Error, true);
    assert.throws(() => {
      throw new Error("Required params for getInitialInlineConfig missing");
    }, inlineConfig);
  });

  it("should return null if relatedStoriesApi infinite scroll collection doesn't exist", async function () {
    const clientStub = getClientStub({
      getRelatedStories: () =>
        new Promise((resolve) => {
          resolve(null);
        }),
    });
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      infiniteScrollSource: "relatedStoriesApi",
    });
    const inlineConfig = await infiniteScrollAmp.getInitialInlineConfig({
      storyId: 2222,
    });
    assert.strictEqual(inlineConfig, null);
  });

  it("should return null if relatedStoriesApi infinite scroll collection contains no stories", async function () {
    const clientStub = getClientStub({
      getRelatedStories: () =>
        new Promise((resolve) => {
          resolve({
            "related-stories": [],
          });
        }),
    });
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      infiniteScrollSource: "relatedStoriesApi",
    });
    const inlineConfig = await infiniteScrollAmp.getInitialInlineConfig({
      storyId: 2222,
    });
    assert.strictEqual(inlineConfig, null);
  });

  it("should remove visual stories from relatedStoriesApi infinite scroll", async function () {
    const clientStub = getClientStub();
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      infiniteScrollSource: "relatedStoriesApi",
    });
    const inlineConfig = await infiniteScrollAmp.getInitialInlineConfig({
      storyId: 3333,
    });

    assert.strictEqual(false, /sports\/bb/.test(inlineConfig));
    assert.strictEqual(false, /bb\/b.jpg/.test(inlineConfig));
  });

  it("relatedStoriesApi Response should be in JSON format as per AMP spec", async function () {
    // https://amp.dev/documentation/components/amp-next-page/
    const clientStub = getClientStub();
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      infiniteScrollSource: "relatedStoriesApi",
    });
    const inlineConfig = await infiniteScrollAmp.getInitialInlineConfig({
      storyId: 2222,
    });
    function isInlineConfigStructureValid(jsonStr) {
      const stories = JSON.parse(jsonStr);
      if (!stories.length) throw new Error("Can't verify empty array!");
      stories.forEach((story) => {
        const keys = Object.keys(story);
        if (keys.includes("image") && keys.includes("url") && keys.includes("title") && keys.length === 3) return;
        throw new Error("Invalid InlineConfigStructure");
      });
      return true;
    }
    assert.strictEqual(isInlineConfigStructureValid(inlineConfig), true);
  });
  /// custom-stories
  it("should return null if CustomApi Stories infinite scroll collection doesn't exist", async function () {
    const clientStub = getCustomApiStoriesClientStub({
      getCustomApiStories: () =>
        new Promise((resolve) => {
          resolve(null);
        }),
    });
    const customInfiniteScrollAmp = new CustomInfiniteScrollAmp({
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      infiniteScrollSource: "custom",
    });
    const inlineConfig = await customInfiniteScrollAmp.getCustomStoryList({
      type: "inlineConfig",
    });
    assert.strictEqual(inlineConfig instanceof Error, true);
  });

  it("should return null if CustomApi Stories infinite scroll collection contains no stories", async function () {
    const clientStub = getCustomApiStoriesClientStub({
      getCustomApiStories: () =>
        new Promise((resolve) => {
          resolve([]);
        }),
    });
    const customInfiniteScrollAmp = new CustomInfiniteScrollAmp({
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      infiniteScrollSource: "custom",
    });
    const inlineConfig = await customInfiniteScrollAmp.getCustomStoryList({
      type: "inlineConfig",
    });
    assert.strictEqual(inlineConfig instanceof Error, true);
  });

  it("CustomApi Stories Response should be in JSON format as per AMP spec", async function () {
    // https://amp.dev/documentation/components/amp-next-page/
    const clientStub = getCustomApiStoriesClientStub();
    const customInfiniteScrollAmp = new CustomInfiniteScrollAmp({
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      infiniteScrollSource: "custom",
    });
    const inlineConfig = await customInfiniteScrollAmp.getCustomStoryList({
      type: "inlineConfig",
    });
    function isInlineConfigStructureValid(jsonStr) {
      const stories = JSON.parse(jsonStr);
      if (!stories.length) throw new Error("Can't verify empty array!");
      stories.forEach((story) => {
        const keys = Object.keys(story);
        if (keys.includes("image") && keys.includes("url") && keys.includes("title") && keys.length === 3) return;
        throw new Error("Invalid InlineConfigStructure");
      });
      return true;
    }
    assert.strictEqual(isInlineConfigStructureValid(inlineConfig), true);
  });
});

describe("getResponse method of InfiniteScrollAmp helper function", function () {
  // collection
  it("should throw an error in Collection if 'story-id' isn't passed as query param", async function () {
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: getClientStub(),
      publisherConfig: dummyPublisherConfig,
      queryParams: { foo: "bar" },
    });
    const jsonResponse = await infiniteScrollAmp.getResponse();
    assert.strictEqual(jsonResponse instanceof Error, true);
    assert.throws(() => {
      throw new Error(`Query param "story-id" missing`);
    }, jsonResponse);
  });
  it("should throw an error if Collection infinite scroll collection doesn't exist", async function () {
    const clientStub = getClientStub({
      getCollectionBySlug: () =>
        new Promise((resolve) => {
          resolve(null);
        }),
    });
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      queryParams: { "story-id": 2222 },
    });
    const jsonResponse = await infiniteScrollAmp.getResponse();
    assert.strictEqual(jsonResponse instanceof Error, true);
  });
  it("should remove current story from Collection response", async function () {
    const clientStub = getClientStub();
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      queryParams: { "story-id": 4444 },
    });
    const jsonResponse = await infiniteScrollAmp.getResponse();
    assert.strictEqual(false, /sports\/dd/.test(jsonResponse));
    assert.strictEqual(false, /dd\/d.jpg/.test(jsonResponse));
  });
  it("should remove visual stories from Collection response", async function () {
    const clientStub = getClientStub();
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      queryParams: { "story-id": 4444 },
    });
    const jsonResponse = await infiniteScrollAmp.getResponse();
    assert.strictEqual(false, /sports\/bb/.test(jsonResponse));
    assert.strictEqual(false, /bb\/b.jpg/.test(jsonResponse));
  });
  it("should format Collection JSON as per AMP spec", async function () {
    // https://amp.dev/documentation/components/amp-next-page/
    const clientStub = getClientStub();
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      queryParams: { "story-id": 4444 },
    });
    const jsonResponse = await infiniteScrollAmp.getResponse();
    function isJsonConfigStructureValid(jsonStr) {
      const parsed = JSON.parse(jsonStr);
      const stories = parsed.pages;
      if (!stories.length) throw new Error("Can't verify empty array!");
      stories.forEach((story) => {
        const keys = Object.keys(story);
        if (keys.includes("image") && keys.includes("url") && keys.includes("title") && keys.length === 3) return;
        throw new Error("Invalid InlineConfigStructure");
      });
      return true;
    }
    assert.strictEqual(isJsonConfigStructureValid(jsonResponse), true);
  });
  // it("should omit the first 'n' stories, take the rest", async function() {
  //   // this test needs to be written after https://github.com/quintype/quintype-node-framework/pull/202 is merged
  // })
  // related-stories
  it("should throw an error in relatedStoriesApi if 'story-id' isn't passed as query param", async function () {
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: getClientStub(),
      publisherConfig: dummyPublisherConfig,
      queryParams: { foo: "bar" },
      infiniteScrollSource: "relatedStoriesApi",
    });
    const jsonResponse = await infiniteScrollAmp.getResponse();
    assert.strictEqual(jsonResponse instanceof Error, true);
    assert.throws(() => {
      throw new Error(`Query param "story-id" missing`);
    }, jsonResponse);
  });

  it("should throw an error if relatedStoriesApi scroll collection doesn't exist", async function () {
    const clientStub = getClientStub({
      getRelatedStories: () =>
        new Promise((resolve) => {
          resolve(null);
        }),
    });
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      queryParams: { "story-id": 2222 },
      infiniteScrollSource: "relatedStoriesApi",
    });
    const jsonResponse = await infiniteScrollAmp.getResponse();
    assert.strictEqual(jsonResponse instanceof Error, true);
  });

  it("should remove visual stories from relatedStoriesApi response", async function () {
    const clientStub = getClientStub();
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      queryParams: { "story-id": 4444 },
      infiniteScrollSource: "relatedStoriesApi",
    });
    const jsonResponse = await infiniteScrollAmp.getResponse();
    assert.strictEqual(false, /sports\/bb/.test(jsonResponse));
    assert.strictEqual(false, /bb\/b.jpg/.test(jsonResponse));
  });

  it("should format relatedStoriesApi JSON as per AMP spec", async function () {
    // https://amp.dev/documentation/components/amp-next-page/
    const clientStub = getClientStub();
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      queryParams: { "story-id": 4444 },
      infiniteScrollSource: "relatedStoriesApi",
    });
    const jsonResponse = await infiniteScrollAmp.getResponse();
    function isJsonConfigStructureValid(jsonStr) {
      const parsed = JSON.parse(jsonStr);
      const stories = parsed.pages;
      if (!stories.length) throw new Error("Can't verify empty array!");
      stories.forEach((story) => {
        const keys = Object.keys(story);
        if (keys.includes("image") && keys.includes("url") && keys.includes("title") && keys.length === 3) return;
        throw new Error("Invalid InlineConfigStructure");
      });
      return true;
    }
    assert.strictEqual(isJsonConfigStructureValid(jsonResponse), true);
  });

  // custom-stories
  it("should throw an error if customApi infinite scroll collection doesn't exist", async function () {
    const clientStub = getCustomApiStoriesClientStub({
      getCustomApiStories: () =>
        new Promise((resolve) => {
          resolve(null);
        }),
    });
    const customInfiniteScrollAmp = new CustomInfiniteScrollAmp({
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      infiniteScrollSource: "custom",
    });
    const jsonResponse = await customInfiniteScrollAmp.getCustomStoryList({
      type: "remoteConfig",
    });
    assert.strictEqual(jsonResponse instanceof Error, true);
  });

  it("should format JSON as per AMP spec in customApi list", async function () {
    // https://amp.dev/documentation/components/amp-next-page/
    const clientStub = getCustomApiStoriesClientStub();
    const customInfiniteScrollAmp = new CustomInfiniteScrollAmp({
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      infiniteScrollSource: "custom",
    });
    const jsonResponse = await customInfiniteScrollAmp.getCustomStoryList({
      type: "remoteConfig",
    });
    function isJsonConfigStructureValid(jsonStr) {
      const parsed = JSON.parse(jsonStr);
      const stories = parsed.pages;
      if (!stories.length) throw new Error("Can't verify empty array!");
      stories.forEach((story) => {
        const keys = Object.keys(story);
        if (keys.includes("image") && keys.includes("url") && keys.includes("title") && keys.length === 3) return;
        throw new Error("Invalid InlineConfigStructure");
      });
      return true;
    }
    assert.strictEqual(isJsonConfigStructureValid(jsonResponse), true);
  });
});
