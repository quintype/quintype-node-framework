const assert = require("assert");
const express = require("express");
const React = require("react");

const { isomorphicRoutes } = require("../../server/routes");
const supertest = require("supertest");

function getClientStub(hostname) {
  return {
    getHostname: () => "demo.quintype.io",
    getConfig: () =>
      Promise.resolve({
        config: { foo: "bar", "theme-attributes": {} },
        "publisher-id": 42,
      }),
    getCustomPathData: (path) => {
      switch (path) {
        case "/moved-permanently":
          return Promise.resolve({
            page: {
              id: 101,
              type: "redirect",
              "status-code": 301,
              "destination-path": "/permanent-location",
            },
          });
        case "/moved-temporarily":
          return Promise.resolve({
            page: {
              id: 102,
              type: "redirect",
              "status-code": 302,
              "destination-path": "/temporary-location",
            },
          });
        case "/moved-absolute":
          // FIXME: the /http on the next line is garbage from API.
          return Promise.resolve({
            page: {
              id: 105,
              type: "redirect",
              "status-code": 301,
              "destination-path": "/https://www.google.com",
            },
          });
        case "/static-with-header-footer":
          return Promise.resolve({
            page: {
              id: 103,
              title: "Testing",
              content: "<html><head><title>Test</title></head><body><h1>Heading</h1></body></html>",
              metadata: { header: true, footer: false },
              type: "static-page",
              "status-code": 200,
            },
          });
        case "/static-without-header-footer":
          return Promise.resolve({
            page: {
              id: 104,
              title: "Testing",
              content: "<html><head><title>Test</title></head><body><h1>Heading</h1></body></html>",
              metadata: { header: false, footer: false },
              type: "static-page",
              "status-code": 200,
            },
          });
        case "/static-with-mime-type":
          return Promise.resolve({
            page: {
              id: 105,
              title: "Testing mime type",
              content: "<html><head><title>Test</title></head><body><h1>Heading</h1></body></html>",
              metadata: {
                header: false,
                footer: false,
                "mime-type": "text/plain",
              },
              type: "static-page",
              "status-code": 200,
            },
          });
        default:
          return Promise.resolve({ page: null, "status-code": 404 });
      }
    },
  };
}

function createApp(loadData, routes, opts = {}) {
  const app = express();
  isomorphicRoutes(
    app,
    Object.assign(
      {
        assetHelper: {
          assetHash: (file) => (file == "app.js" ? "abcdef" : null),
          assetPath: (file) => `/assets/${file}`,
        },
        getClient: getClientStub,
        generateRoutes: () => routes,
        loadData,
        renderLayout: (res, { contentTemplate, store }) =>
          res.send(JSON.stringify({ contentTemplate, store: store.getState() })),
        handleNotFound: false,
        publisherConfig: {},
      },
      opts
    )
  );

  return app;
}

describe("Custom Route Handler", function () {
  it("Redirects with status code 301 if API has 301 redirection setup", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) => next(),
      [{ pageType: "story-page", path: "/*" }]
    );
    supertest(app)
      .get("/moved-permanently")
      .expect("Location", "/permanent-location")
      .expect("Cache-Control", "public,max-age=15,s-maxage=900,stale-while-revalidate=1000,stale-if-error=14400")
      .expect("Vary", /Accept\-Encoding/)
      .expect("Surrogate-Key", "u/42/101")
      .expect("Cache-Tag", "u/42/101")
      .expect(301, done);
  });

  it("Redirects with status code 302 if API has 302 redirection setup", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) => next(),
      [{ pageType: "story-page", path: "/*" }]
    );
    supertest(app)
      .get("/moved-temporarily")
      .expect("Location", "/temporary-location")
      .expect("Cache-Control", "public,max-age=15,s-maxage=900,stale-while-revalidate=1000,stale-if-error=14400")
      .expect("Vary", /Accept\-Encoding/)
      .expect("Surrogate-Key", "u/42/102")
      .expect("Cache-Tag", "u/42/102")
      .expect(302, done);
  });

  it("Renders the page in the normal flow if it's a static page and either header or footer is enabled", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) =>
        pageType === "custom-static-page" ? Promise.resolve({}) : next(),
      [{ pageType: "story-page", path: "/*" }]
    );
    supertest(app)
      .get("/static-with-header-footer")
      .expect("Content-Type", /html/)
      .expect("Cache-Control", "public,max-age=15,s-maxage=900,stale-while-revalidate=1000,stale-if-error=14400")
      .expect("Vary", "Accept-Encoding")
      .expect("Surrogate-Key", "u/42/103")
      .expect("Cache-Tag", "u/42/103")
      .expect(200)
      .then((res) => {
        const response = JSON.parse(res.text);
        // In this case, content is empty to avoid breaking the script tags present outside it.
        assert.equal("", response.store.qt.data.content);
        assert.equal("static-page", response.store.qt.pageType);
      })
      .then(done);
  });

  it("Returns 404 if the route doesn't exist", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) => next(),
      [{ pageType: "story-page", path: "/*" }]
    );
    supertest(app).get("/does-not-exist").expect(404, done);
  });

  it("DisableIsomorphicComponent is set to true", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) =>
        pageType === "custom-static-page" ? Promise.resolve({}) : next(),
      [{ pageType: "story-page", path: "/*" }]
    );
    supertest(app)
      .get("/static-with-header-footer")
      .expect("Content-Type", /html/)
      .expect(200)
      .then((res) => {
        const response = JSON.parse(res.text);
        assert.equal(true, response.store.qt.disableIsomorphicComponent);
      })
      .then(done);
  });

  it("Store reads config and data from data-loader response", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) =>
        pageType === "custom-static-page" ? Promise.resolve({ data: { navigationMenu: [] }, config: {} }) : next(),
      [{ pageType: "story-page", path: "/*" }]
    );
    supertest(app)
      .get("/static-with-header-footer")
      .expect("Content-Type", /html/)
      .expect(200)
      .then((res) => {
        const response = JSON.parse(res.text);
        assert.deepEqual({}, response.store.qt.config);
        assert.deepEqual([], response.store.qt.data.navigationMenu);
      })
      .then(done);
  });

  it("Redirects to an absolute route, even if sketches gives a junk response", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) => next(),
      [{ pageType: "story-page", path: "/*" }]
    );
    supertest(app)
      .get("/moved-absolute")
      .expect("Location", "https://www.google.com")
      .expect("Cache-Control", "public,max-age=15,s-maxage=900,stale-while-revalidate=1000,stale-if-error=14400")
      .expect("Vary", /Accept\-Encoding/)
      .expect("Surrogate-Key", "u/42/105")
      .expect("Cache-Tag", "u/42/105")
      .expect(301, done);
  });
});
