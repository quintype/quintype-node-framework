/* eslint-disable no-undef */
/* eslint-disable func-names */

const assert = require("assert");
const InfiniteScrollAmp = require("../../../server/amp/helpers/infinite-scroll");
const { getTextStory } = require("../../data/amp-test-data");

function getClientStub({
  getStoryById = (id) =>
    new Promise((resolve) => {
      if (id === "4444")
        resolve({
          story: getTextStory({ "story-content-id": "7f3d5bdb-ec52-4047-ac0d-df4036ec974b" }),
        });
      resolve(null);
    }),
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
              },
            },
          ],
        });
      resolve(null);
    }),
} = {}) {
  return {
    getCollectionBySlug,
    getStoryById
  };
}
const dummyPublisherConfig = {
  "cdn-image": "gumlet.assettype.com",
};

describe("getInitialInlineConfig method of InfiniteScrollAmp helper function", function () {
  it("should throw err if storyId isn't passed", async function () {
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: getClientStub(),
      publisherConfig: dummyPublisherConfig,
    });
    const inlineConfig = await infiniteScrollAmp.getInitialInlineConfig({
      itemsToTake: 5,
    });
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
      itemsToTake: 5,
      story: {
        "story-template": "text",
        headline: "aaa",
        "story-content-id": 1111,
        slug: "sports/aa",
        "hero-image-s3-key": "aa/a.jpg",
      },
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
      itemsToTake: 5,
      story: {
        "story-template": "text",
        headline: "aaa",
        "story-content-id": 1111,
        slug: "sports/aa",
        "hero-image-s3-key": "aa/a.jpg",
      },
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
      itemsToTake: 5,
      story: {
        "story-template": "text",
        headline: "aaa",
        "story-content-id": 1111,
        slug: "sports/aa",
        "hero-image-s3-key": "aa/a.jpg",
      },
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
      itemsToTake: 5,
      story: {
        "story-template": "text",
        headline: "aaa",
        "story-content-id": 1111,
        slug: "sports/aa",
        "hero-image-s3-key": "aa/a.jpg",
      },
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
      itemsToTake: 5,
      story: {
        "story-template": "text",
        headline: "aaa",
        "story-content-id": 1111,
        slug: "sports/aa",
        "hero-image-s3-key": "aa/a.jpg",
      },
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
});

describe("getResponse method of InfiniteScrollAmp helper function", function () {
  it("should throw an error if 'story-id' isn't passed as query param", async function () {
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: getClientStub(),
      publisherConfig: dummyPublisherConfig,
      queryParams: { foo: "bar" },
    });
    const jsonResponse = await infiniteScrollAmp.getResponse({ itemsTaken: 2 });
    assert.strictEqual(jsonResponse instanceof Error, true);
    assert.throws(() => {
      throw new Error(`Query param "story-id" missing`);
    }, jsonResponse);
  });
  it("should throw an error if infinite scroll collection doesn't exist", async function () {
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
      infiniteScroll: { "source": "" }
    });
    const jsonResponse = await infiniteScrollAmp.getResponse({ itemsTaken: 2 });
    assert.strictEqual(jsonResponse instanceof Error, true);
  });
  it("should remove current story from response", async function () {
    const clientStub = getClientStub();
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      queryParams: { "story-id": 4444 },
    });
    const jsonResponse = await infiniteScrollAmp.getResponse({ itemsTaken: 2 });
    assert.strictEqual(false, /sports\/dd/.test(jsonResponse));
    assert.strictEqual(false, /dd\/d.jpg/.test(jsonResponse));
  });
  it("should remove visual stories from response", async function () {
    const clientStub = getClientStub();
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      queryParams: { "story-id": 4444 },
    });
    const jsonResponse = await infiniteScrollAmp.getResponse({ itemsTaken: 2 });
    assert.strictEqual(false, /sports\/bb/.test(jsonResponse));
    assert.strictEqual(false, /bb\/b.jpg/.test(jsonResponse));
  });
  it("should format JSON as per AMP spec", async function () {
    // https://amp.dev/documentation/components/amp-next-page/
    const clientStub = getClientStub();
    const infiniteScrollAmp = new InfiniteScrollAmp({
      ampConfig: {},
      client: clientStub,
      publisherConfig: dummyPublisherConfig,
      queryParams: { "story-id": 4444 },
    });
    const jsonResponse = await infiniteScrollAmp.getResponse({ itemsTaken: 2 });
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
});
