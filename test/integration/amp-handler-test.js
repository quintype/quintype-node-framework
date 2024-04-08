/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable func-names */
import supertest from "supertest";
import { ampRoutes } from "../../server/routes";

const assert = require("assert");
const express = require("express");

const ampConfig = {
  ampConfig: {
    fonts: {
      primary: {
        url: "Open+Sans:300,400,600,700",
        family: '"Open Sans", sans-serif',
      },
      secondary: {
        url: "PT+Serif:400,400italic,700,700italic",
        family: "sans-serif",
      },
    },
    colors: {
      primary: "#294f32",
      secondary: "#763194",
      "footer-background": "#FDBD10",
      "section-text-color": "#f4e842",
    },
    "invalid-elements-strategy": "redirect-to-web-version",
    "related-collection-id": 1234,
  },
};

function getClientStub({
  getHostname = () => "demo.quintype.io",
  getConfig = () =>
    Promise.resolve({
      "cdn-name": "images.assettype.com",
      "cdn-image": "gumlet.assettype.com",
      "sketches-host": "https://www.vikatan.com",
      domains: [
        {
          "host-url": "https://cinema.vikatan.com",
        },
        {
          "host-url": "https://sports.vikatan.com",
        },
      ],
      memoizeAsync: (key, fn) => {
        return ampConfig;
      },
    }),
  getStoryBySlug = (slug, params) =>
    Promise.resolve({
      story: {
        id: "1",
        url: "https://www.foo.com/cricket/ipl-2021",
        "hero-image-metadata": {
          width: 5472,
          height: 3648,
          "mime-type": "image/jpeg",
          "file-size": 6127839,
          "file-name": "Sample file",
          "focus-point": [2609, 1102],
        },
        "hero-image-s3-key": "barandbench/2020-01/sample.jpg",
        "story-content-id": "987c0480-41c8-41d2-ad35-36b5f92be73e",

        cards: [
          {
            "story-elements": [
              {
                description: "",
                "page-url": "/story/7f3d5bdb-ec52-4047-ac0d-df4036ec974b/element/9eb8f5cc-6ebe-4fb0-88b8-eca79efde210",
                type: "text",
                "family-id": "e9e12f9f-8b9f-4b93-a8c8-83c7b278000f",
                title: "",
                id: "9eb8f5cc-6ebe-4fb0-88b8-eca79efde210",
                metadata: {},
                subtype: null,
                text: "<p>In India today, the legal profession is growing in lockstep with one of the world’s most dynamic economies. It’s no surprise then— that in terms of absolute numbers— India’s legal profession is the world’s second largest, with over 1.4 million enrolled lawyers in legal practices nationwide.</p>",
              },
            ],
            "card-updated-at": 1581327522163,
            "content-version-id": "efaf78de-c90b-4d15-b040-c84ebb29cabf",
            "card-added-at": 1581327522163,
            status: "draft",
            id: "bf486412-1e8b-45d1-a5fd-51939cfe1ce1",
            "content-id": "bf486412-1e8b-45d1-a5fd-51939cfe1ce1",
            version: 1,
            metadata: {},
          },
        ],
        sections: [{ id: 1, name: "Sports" }],
        "story-template": "text",
        "is-amp-supported": true,
      },
    }),
  getCollectionBySlug = (slug) =>
    Promise.resolve({
      items: [
        {
          id: "1111",
          type: "story",
          story: {
            "story-content-id": "abc",
            "cdn-image": "gumlet.assettype.com",
            "hero-image-s3-key": "abc/heroimage.jpg",
            headline: "headline1",
            slug: "foo.com/story-a",
          },
        },
        {
          id: "2222",
          type: "story",
          story: {
            "story-content-id": "def",
            "cdn-image": "gumlet.assettype.com",
            "hero-image-s3-key": "def/heroimage.jpg",
            headline: "headline2",
            slug: "foo.com/story-a",
          },
        },
        {
          id: "3333",
          type: "story",
          story: {
            "story-content-id": "ghi",
            "cdn-image": "gumlet.assettype.com",
            "hero-image-s3-key": "ghi/heroimage.jpg",
            headline: "headline3",
            slug: "foo.com/story-c",
          },
        },
        {
          id: "4444",
          type: "story",
          story: {
            "story-content-id": "jkl",
            "cdn-image": "gumlet.assettype.com",
            "hero-image-s3-key": "jkl/heroimage.jpg",
            headline: "headline4",
            slug: "foo.com/story-d",
          },
        },
        {
          id: "5555",
          type: "story",
          story: {
            "story-content-id": "mno",
            "cdn-image": "gumlet.assettype.com",
            "hero-image-s3-key": "mno/heroimage.jpg",
            headline: "headline5",
            slug: "foo.com/story-e",
          },
        },
        {
          id: "6666",
          type: "story",
          story: {
            "story-content-id": "pqr",
            "cdn-image": "gumlet.assettype.com",
            "hero-image-s3-key": "pqr/heroimage.jpg",
            headline: "headline6",
            slug: "foo.com/story-f",
          },
        },
        {
          id: "7777",
          type: "story",
          story: {
            "story-content-id": "stu",
            "cdn-image": "gumlet.assettype.com",
            "hero-image-s3-key": "stu/heroimage.jpg",
            headline: "headline7",
            slug: "foo.com/story-g",
          },
        },
      ],
    }),
} = {}) {
  return {
    getHostname,
    getConfig,
    getStoryBySlug,
    getCollectionBySlug,
  };
}

const dummyAmpLib = {
  ampifyStory: () => '<div data-page-type="home-page">foobar</div>',
  unsupportedStoryElementsPresent: () => false,
};

const getClientStubWithRelatedStories = (relatedStories) => () =>
  Object.assign({}, getClientStub(), {
    getRelatedStories: () => Promise.resolve({ "related-stories": relatedStories }),
  });

function createApp({ clientStub = getClientStub, ampLibrary = dummyAmpLib, enableAmp = true, redirectUrls = {} } = {}) {
  const app = express();
  ampRoutes(app, {
    getClient: clientStub,
    publisherConfig: {},
    ampLibrary,
    additionalConfig: {},
    enableAmp,
    redirectUrls,
    featureConfig: {
      optimizeAmpHtml: false,
    },
  });
  return app;
}

describe("ampStoryPageHandler integration tests", () => {
  it("mounts an amp story page", (done) => {
    const app = createApp();
    supertest(app)
      .get("/amp/story/foo")
      .expect("Content-Type", /html/)
      .expect(200)
      .end((err) => {
        if (err) return done(err);
        return done();
      });
  });
  it("passes on errors to express error handler", (done) => {
    const app = createApp({
      ampLibrary: {
        ampifyStory: () => new Error("Dummy error"),
        unsupportedStoryElementsPresent: () => false,
      },
    });
    supertest(app)
      .get("/amp/story/test")
      .expect(500, /Dummy error/)
      .end(function (err, res) {
        if (err) return done(err);
        return done();
      });
  });
  it("should redirect to non-amp page if enableAmp is false", (done) => {
    const app = createApp({
      enableAmp: false,
    });
    supertest(app)
      .get("/amp/cricket/ipl-2021")
      .expect(301)
      .expect("Location", "/cricket/ipl-2021")
      .end((err) => {
        if (err) return done(err);
        return done();
      });
  });
  it("Redirects the urls with status code to 302 if redirectUrls is present ", (done) => {
    const app = createApp({
      enableAmp: true,
      redirectUrls: {
        "/amp/story/sports/ipl-2021": {
          destinationUrl: "/amp/story/sports/cricket-2022",
          statusCode: 302,
        },
      },
    });
    supertest(app)
      .get("/amp/story/sports/ipl-2021")
      .expect(302)
      .expect("Location", "/amp/story/sports/cricket-2022")
      .end((err) => {
        if (err) return done(err);
        return done();
      });
  });
  it("should redirect to non-amp page if story contains unsuported elements and invalid-elements-strategy in /api/v1/amp/config is set to redirect-to-web-version", (done) => {
    const app = createApp({
      ampLibrary: {
        ampifyStory: () => '<div data-page-type="home-page">foobar</div>',
        unsupportedStoryElementsPresent: () => true,
      },
    });
    supertest(app)
      .get("/amp/story/test")
      .expect(302)
      .expect("Location", "https://www.foo.com/cricket/ipl-2021")
      .end((err) => {
        if (err) return done(err);
        return done();
      });
  });
  it("should show amp page if story contains unsuported elements but invalid-elements-strategy in /api/v1/amp/config is set to any value other than redirect-to-web-version", (done) => {
    const dummyAmpConfig = {
      ampConfig: {
        fonts: {
          primary: {
            url: "Open+Sans:300,400,600,700",
            family: '"Open Sans", sans-serif',
          },
          secondary: {
            url: "PT+Serif:400,400italic,700,700italic",
            family: "sans-serif",
          },
        },
        colors: {
          primary: "#294f32",
          secondary: "#763194",
          "footer-background": "#FDBD10",
          "section-text-color": "#f4e842",
        },
        "invalid-elements-strategy": "render-with-notification",
        "related-collection-id": 1234,
      },
    };
    const clientStubWithRedirectToWebVersion = () =>
      getClientStub({
        getConfig: () =>
          Promise.resolve({
            "cdn-name": "images.assettype.com",
            "cdn-image": "gumlet.assettype.com",
            "sketches-host": "https://www.vikatan.com",
            domains: [
              {
                "host-url": "https://cinema.vikatan.com",
              },
              {
                "host-url": "https://sports.vikatan.com",
              },
            ],
            memoizeAsync: (key, fn) => {
              return dummyAmpConfig;
            },
          }),
      });
    const app = createApp({
      clientStub: clientStubWithRedirectToWebVersion,
      ampLibrary: {
        ampifyStory: () => '<div data-page-type="home-page">foobar</div>',
        unsupportedStoryElementsPresent: () => true,
      },
    });
    supertest(app)
      .get("/amp/story/test")
      .expect(200)
      .expect("Content-Type", /html/)
      .end((err, res) => {
        if (err) return done(err);
        assert.strictEqual(res.text, `<div data-page-type="home-page">foobar</div>`);
        return done();
      });
  });
});

describe("Amp infinite scroll handler", () => {
  it("Should return a 200 if request is same origin", function (done) {
    const app = createApp();
    supertest(app)
      .get("/amp/api/v1/amp-infinite-scroll?story-id=foo")
      .set("amp-same-origin", "true")
      .expect(200)
      .expect("Content-Type", /json/)
      .end((err) => {
        if (err) return done(err);
        return done();
      });
  });
  it("Should return a 200 if origin is google/bing CDN", function (done) {
    const app = createApp();
    supertest(app)
      .get(
        "/amp/api/v1/amp-infinite-scroll?story-id=55de49e4-de83-487c-93d3-82da3a3eb20b&__amp_source_origin=https://www.vikatan.com"
      )
      .set("origin", "https://www-vikatan-com.cdn.ampproject.org")
      .expect(200)
      .expect("Content-Type", /json/)
      .end((err) => {
        if (err) return done(err);
        return done();
      });
  });
  it("Should return a 200 if origin is subdomain", function (done) {
    const app = createApp();
    supertest(app)
      .get(
        "/amp/api/v1/amp-infinite-scroll?story-id=0743fa17-c39b-4b14-a21d-41a7ed35c4c6&__amp_source_origin=https://sports.vikatan.com"
      )
      .set("origin", "https://sports.vikatan.com")
      .expect(200)
      .expect("Content-Type", /json/)
      .end((err) => {
        if (err) return done(err);
        return done();
      });
  });
  it("Should return a 200 if origin is CDN of subdomain", function (done) {
    const app = createApp();
    supertest(app)
      .get(
        "/amp/api/v1/amp-infinite-scroll?story-id=0743fa17-c39b-4b14-a21d-41a7ed35c4c6&__amp_source_origin=https://sports.vikatan.com"
      )
      .set("origin", "https://sports-vikatan-com.cdn.ampproject.org")
      .expect(200)
      .expect("Content-Type", /json/)
      .end((err) => {
        if (err) return done(err);
        return done();
      });
  });
  it("Should return a 401 if not same origin or origin is not in whitelist", function (done) {
    const app = createApp();
    supertest(app)
      .get(
        "/amp/api/v1/amp-infinite-scroll?story-id=0743fa17-c39b-4b14-a21d-41a7ed35c4c6&__amp_source_origin=https://sports.vikatan.com"
      )
      .set("origin", "https://www.google.com")
      .expect(401)
      .end((err, res) => {
        if (err) return done(err);
        assert.strictEqual(res.body, "Unauthorized");
        return done();
      });
  });
  it("returns infinite scroll json config from story 5 onwards", function (done) {
    const app = createApp();
    const expectedJson = `{"pages":[{"image":"https://gumlet.assettype.com/pqr/heroimage.jpg?format=webp&w=250","title":"headline6","url":"/amp/story/foo.com/story-f"},{"image":"https://gumlet.assettype.com/stu/heroimage.jpg?format=webp&w=250","title":"headline7","url":"/amp/story/foo.com/story-g"}]}`;
    supertest(app)
      .get("/amp/api/v1/amp-infinite-scroll?story-id=foo")
      .set("amp-same-origin", "true")
      .expect(200)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        if (err) return done(err);
        const response = res.text;
        assert.equal(expectedJson, response);
        return done();
      });
  });
  it("removes current story from infinite scroll json config", function (done) {
    const app = createApp();
    const expectedJson = `{"pages":[{"image":"https://gumlet.assettype.com/stu/heroimage.jpg?format=webp&w=250","title":"headline7","url":"/amp/story/foo.com/story-g"}]}`;
    supertest(app)
      .get("/amp/api/v1/amp-infinite-scroll?story-id=pqr")
      .set("amp-same-origin", "true")
      .expect(200)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        if (err) return done(err);
        const response = res.text;
        assert.equal(expectedJson, response);
        return done();
      });
  });
});
