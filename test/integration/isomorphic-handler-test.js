const assert = require("assert");
const express = require("express");
const React = require("react");

const { isomorphicRoutes, mountQuintypeAt } = require("../../server/routes");
const supertest = require("supertest");

function getClientStub(hostname) {
  return {
    getHostname: () => "demo.quintype.io",
    getConfig: () =>
      Promise.resolve({ foo: "bar", "sketches-host": "https://www.foo.com" })
  };
}

function pickComponent(pageType) {
  return ({ data }) => <div data-page-type={pageType}>{data.text}</div>;
}

function createApp(loadData, routes, opts = {}, app = express()) {
  isomorphicRoutes(
    app,
    Object.assign(
      {
        assetHelper: {
          assetHash: file => (file == "app.js" ? "abcdef" : null),
          assetPath: file => `/assets/${file}`
        },
        getClient: getClientStub,
        generateRoutes: () => routes,
        loadData,
        pickComponent: opts.pickComponent || pickComponent,
        renderLayout: (res, { store, title, content }) =>
          res.send(JSON.stringify({ store: store.getState(), title, content })),
        handleCustomRoute: false,
        publisherConfig: {}
      },
      opts
    )
  );

  return app;
}

describe("Isomorphic Handler", function() {
  it("Renders the page if the route matches", function(done) {
    const app = createApp(
      (pageType, params, config, client, { host }) =>
        Promise.resolve({ pageType, data: { text: "foobar", host } }),
      [{ pageType: "home-page", path: "/", exact: true }]
    );

    supertest(app)
      .get("/")
      .expect("Content-Type", /html/)
      .expect(200)
      .then(res => {
        const response = JSON.parse(res.text);
        assert.equal(
          '<div data-page-type="home-page">foobar</div>',
          response.content
        );
        assert.equal("foobar", response.store.qt.data.text);
        assert.equal("127.0.0.1", response.store.qt.data.host);
        assert.equal("home-page", response.store.qt.pageType);
      })
      .then(done);
  });

  it("Accepts an async pickComponent function", function(done) {
    const app = createApp(
      (pageType, params, config, client, { host }) =>
        Promise.resolve({ pageType, data: { text: "foobar" } }),
      [{ pageType: "home-page", path: "/" }],
      {
        pickComponent: pageType => Promise.resolve(pickComponent(pageType))
      }
    );

    supertest(app)
      .get("/")
      .expect("Content-Type", /html/)
      .expect(200)
      .then(res => {
        const response = JSON.parse(res.text);
        assert.equal(
          '<div data-page-type="home-page">foobar</div>',
          response.content
        );
      })
      .then(done);
  });

  it("Passes all URL parameters to the load data function", function(done) {
    const app = createApp(
      (pageType, params, config, client) =>
        Promise.resolve({ pageType, data: { text: params.text } }),
      [{ pageType: "home-page", path: "/" }]
    );

    supertest(app)
      .get("/?text=foobar")
      .expect("Content-Type", /html/)
      .expect(200)
      .then(res => {
        const response = JSON.parse(res.text);
        assert.equal("foobar", response.store.qt.data.text);
      })
      .then(done);
  });

  describe("preloading", function() {
    it("preloads the app.js", function(done) {
      const app = createApp(
        (pageType, params, config, client) =>
          Promise.resolve({ pageType, data: { text: "foobar" } }),
        [{ pageType: "home-page", path: "/" }],
        {
          preloadJs: true
        }
      );

      supertest(app)
        .get("/?foo=bar")
        .expect("Content-Type", /html/)
        .expect("Link", "</assets/app.js>; rel=preload; as=script;")
        .expect(200, done);
    });

    it("preloads the route-data", function(done) {
      const app = createApp(
        (pageType, params, config, client) =>
          Promise.resolve({ pageType, data: { text: "foobar" } }),
        [{ pageType: "home-page", path: "/" }],
        {
          preloadRouteData: true
        }
      );

      supertest(app)
        .get("/?foo=bar")
        .expect("Content-Type", /html/)
        .expect(
          "Link",
          "</route-data.json?path=%2F&foo=bar>; rel=preload; as=fetch;"
        )
        .expect(200, done);
    });
  });

  it("Throws a 404 if the route is not matched", function(done) {
    const app = createApp(
      (pageType, params, config, client) => Promise.resolve(),
      [{ pageType: "home-page", path: "/", exact: true }],
      {
        loadErrorData: (err, config, client, { host }) => ({
          httpStatusCode: err.httpStatusCode,
          pageType: "not-found",
          data: { text: "foobar", host }
        })
      }
    );

    supertest(app)
      .get("/not-found")
      .expect("Content-Type", /html/)
      .expect(404)
      .then(res => {
        const response = JSON.parse(res.text);
        assert.equal(
          '<div data-page-type="not-found">foobar</div>',
          response.content
        );
        assert.equal(false, response.store.qt.disableIsomorphicComponent);
        assert.equal("127.0.0.1", response.store.qt.data.host);
      })
      .then(done);
  });

  it("Throws a 500 if loadData doesn't work", function(done) {
    const app = createApp(
      (pageType, params, config, client) => {
        throw "exception";
      },
      [{ pageType: "home-page" }],
      {
        loadErrorData: (err, config) => ({
          httpStatusCode: err.httpStatusCode || 500,
          pageType: "not-found",
          data: { text: "foobar" }
        })
      }
    );

    supertest(app)
      .get("/")
      .expect("Content-Type", /html/)
      .expect(500)
      .then(res => {
        const response = JSON.parse(res.text);
        assert.equal(
          '<div data-page-type="not-found">foobar</div>',
          response.content
        );
        assert.equal(true, response.store.qt.disableIsomorphicComponent);
      })
      .then(done, done);
  });

  it("Throws a 500 if loadData and loadErrorData both crash", function(done) {
    const app = createApp(
      (pageType, params, config, client) => {
        throw "exception";
      },
      [{ pageType: "home-page" }],
      {
        loadErrorData: (err, config) => {
          throw "foobar";
        }
      }
    );

    supertest(app)
      .get("/")
      .expect("Content-Type", /html/)
      .expect(500, done);
  });

  it("Cache headers are set", function(done) {
    const app = createApp(
      (pageType, params, config, client) =>
        Promise.resolve({
          pageType,
          data: { text: "foobar", cacheKeys: ["foo", "bar"] }
        }),
      [{ pageType: "home-page", path: "/" }]
    );

    supertest(app)
      .get("/")
      .expect("Content-Type", /html/)
      .expect(
        "Cache-Control",
        "public,max-age=15,s-maxage=900,stale-while-revalidate=1000,stale-if-error=14400"
      )
      .expect("Vary", "Accept-Encoding")
      .expect("Surrogate-Control", /public/)
      .expect("Surrogate-Key", "foo bar")
      .expect("Cache-Tag", "foo,bar")
      .expect(200, done);
  });

  it("it redirects on a 301", function(done) {
    const app = createApp(
      (pageType, params, config, client) =>
        Promise.resolve({ httpStatusCode: 301, data: { location: "/foobar" } }),
      [{ pageType: "home-page", path: "/" }]
    );

    supertest(app)
      .get("/")
      .expect("Location", "/foobar")
      .expect(301, done);
  });

  it("returns a 500 if render layout crashes", function(done) {
    const app = createApp(
      (pageType, params, config, client) =>
        Promise.resolve({ pageType, data: { text: "foobar" } }),
      [{ pageType: "home-page", path: "/" }],
      {
        renderLayout: () => {
          throw "foobar";
        }
      }
    );
    supertest(app)
      .get("/")
      .expect(500, done);
  });

  describe("aborting the data loader", () => {
    it("Throws a 404 if load data decides not to handle the request", function(done) {
      const app = createApp(
        (pageType, params, config, client, { next }) => next(),
        [{ pageType: "home-page", path: "/skip", exact: true }],
        {
          loadErrorData: (err, config, client, { host }) => ({
            httpStatusCode: err.httpStatusCode,
            pageType: "not-found",
            data: { text: "foobar", host }
          })
        }
      );

      supertest(app)
        .get("/skip")
        .expect("Content-Type", /html/)
        .expect(404)
        .then(res => {
          const response = JSON.parse(res.text);
          assert.equal(
            '<div data-page-type="not-found">foobar</div>',
            response.content
          );
          assert.equal(false, response.store.qt.disableIsomorphicComponent);
          assert.equal("127.0.0.1", response.store.qt.data.host);
        })
        .then(done, done);
    });

    it("Allows bypassing even data.abort is set", function(done) {
      const app = createApp(
        (pageType, params, config, client, { next }) =>
          next().then(n => ({ data: n })),
        [{ pageType: "home-page", path: "/skip", exact: true }],
        {
          loadErrorData: (err, config, client, { host }) => ({
            httpStatusCode: err.httpStatusCode,
            pageType: "not-found",
            data: { text: "foobar", host }
          })
        }
      );

      supertest(app)
        .get("/skip")
        .expect("Content-Type", /html/)
        .expect(404)
        .then(res => {
          const response = JSON.parse(res.text);
          assert.equal(
            '<div data-page-type="not-found">foobar</div>',
            response.content
          );
          assert.equal(false, response.store.qt.disableIsomorphicComponent);
          assert.equal("127.0.0.1", response.store.qt.data.host);
        })
        .then(done);
    });

    it("Allows you to chain one loader to the next if two routes overlap", function(done) {
      const overlappingRoutes = [
        { pageType: "skip", path: "/" },
        { pageType: "home-page", path: "/" }
      ];
      const dataLoader = (pageType, _1, _2, _3, { host, next }) =>
        pageType == "skip"
          ? next()
          : Promise.resolve({ pageType, data: { text: "foobar", host } });

      const app = createApp(dataLoader, overlappingRoutes);

      supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then(res => {
          const response = JSON.parse(res.text);
          assert.equal(
            '<div data-page-type="home-page">foobar</div>',
            response.content
          );
          assert.equal("foobar", response.store.qt.data.text);
          assert.equal("127.0.0.1", response.store.qt.data.host);
          assert.equal("home-page", response.store.qt.pageType);
        })
        .then(done);
    });
  });

  it("Passes the primaryHostUrl and currentHostUrl to the render", function(done) {
    const app = createApp(
      (pageType, params, config, client, { host }) =>
        Promise.resolve({ pageType, data: { text: "foobar", host } }),
      [{ pageType: "home-page", path: "/" }]
    );

    supertest(app)
      .get("/")
      .expect("Content-Type", /html/)
      .expect(200)
      .then(res => {
        const response = JSON.parse(res.text);
        assert.equal("https://www.foo.com", response.store.qt.currentHostUrl);
        assert.equal("https://www.foo.com", response.store.qt.primaryHostUrl);
      })
      .then(done);
  });

  describe("lightPages", () => {
    it("renders amp story pages", done => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, story: { "is-amp-supported": true } }
          }),
        [{ pageType: "story-page", path: "/*/:storySlug" }],
        {
          lightPages: true,
          renderLightPage: (req, res, result) => res.send("<h1> Amp Page </h1>")
        }
      );

      supertest(app)
        .get("/foo/bar")
        .expect("Content-Type", /html/)
        .expect(200)
        .then(res => {
          assert.equal("<h1> Amp Page </h1>", res.text);
        })
        .then(done);
    });

    it("renders amp story pages when lightPages is passed as a function which return true", done => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, story: { "is-amp-supported": true } }
          }),
        [{ pageType: "story-page", path: "/*/:storySlug" }],
        {
          lightPages: () => true,
          renderLightPage: (req, res, result) => res.send("<h1> Amp Page </h1>")
        }
      );

      supertest(app)
        .get("/foo/bar")
        .expect("Content-Type", /html/)
        .expect(200)
        .then(res => {
          assert.equal("<h1> Amp Page </h1>", res.text);
        })
        .then(done);
    });

    it("renders a  normal story page when lightPages is passed as a function which return false", done => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, story: { "is-amp-supported": true } }
          }),
        [{ pageType: "story-page", path: "/*/:storySlug" }],
        {
          lightPages: () => false,
          renderLightPage: (req, res, result) => res.send("<h1> Amp Page </h1>")
        }
      );

      supertest(app)
        .get("/foo/bar")
        .expect("Content-Type", /html/)
        .expect(200)
        .then(res => {
          const response = JSON.parse(res.text);
          assert.equal("foobar", response.store.qt.data.text);
        })
        .then(done);
    });
  });

  describe("cdnProvider", () => {
    it("Returns the right cloudflare headers for cache keys passed and no cdn provider passed", done => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, cacheKeys: ["c/1/abcdefgh"] }
          }),
        [{ pageType: "home-page", path: "/" }]
      );

      supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then(res => {
          const cacheControl = res.header["cache-control"];
          const cacheTag = res.header["cache-tag"];
          assert.equal(
            cacheControl,
            "public,max-age=15,s-maxage=900,stale-while-revalidate=1000,stale-if-error=14400"
          );
          assert.equal(cacheTag, "c/1/abcdefgh");
        })
        .then(done);
    });

    it("Returns the right cloudflare headers for no cacheKeys and no cdnProvider passed", done => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host }
          }),
        [{ pageType: "home-page", path: "/" }]
      );

      supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then(res => {
          const cacheControl = res.header["cache-control"];
          const cacheTag = res.header["cache-tag"];
          assert.equal(
            cacheControl,
            "public,max-age=15,s-maxage=60,stale-while-revalidate=150,stale-if-error=3600"
          );
          assert.equal(cacheTag, undefined);
        })
        .then(done);
    });

    it("Returns the right headers when there is cachekeys is set to DO_NOT_CACHE", done => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, cacheKeys: "DO_NOT_CACHE" }
          }),
        [{ pageType: "home-page", path: "/" }],
        { cdnProvider: "akamai" }
      );

      supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then(res => {
          const cacheControl = res.header["cache-control"];
          const edgeCacheControl = res.header["edge-control"];
          const cacheTag = res.header["cache-tag"];
          const edgeCacheTag = res.header["edge-cache-tag"];
          assert.equal(cacheControl, "private,no-cache,no-store,max-age=0");
          assert.equal(edgeCacheControl, "private,no-cache,no-store,max-age=0");
          assert.equal(cacheTag, undefined);
          assert.equal(edgeCacheTag, undefined);
        })
        .then(done);
    });

    it("Returns the right akamai headers when cachekeys are not passed", done => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host }
          }),
        [{ pageType: "home-page", path: "/" }],
        { cdnProvider: "akamai" }
      );

      supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then(res => {
          const cacheControl = res.header["cache-control"];
          const edgeCacheControl = res.header["edge-control"];
          const edgeCacheTag = res.header["edge-cache-tag"];
          assert.equal(
            cacheControl,
            "public,max-age=15,s-maxage=60,stale-while-revalidate=150,stale-if-error=3600"
          );
          assert.equal(
            edgeCacheControl,
            "public,max-age=15,s-maxage=60,stale-while-revalidate=150,stale-if-error=3600"
          );
          assert.equal(edgeCacheTag, undefined);
        })
        .then(done);
    });

    it("Returns the right akamai headers when right cachekeys are passed", done => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, cacheKeys: ["c/1/abcdefgh"] }
          }),
        [{ pageType: "home-page", path: "/" }],
        { cdnProvider: "akamai" }
      );

      supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then(res => {
          const cacheControl = res.header["cache-control"];
          const edgeCacheControl = res.header["edge-control"];
          const edgeCacheTag = res.header["edge-cache-tag"];
          assert.equal(
            cacheControl,
            "public,max-age=15,s-maxage=900,stale-while-revalidate=1000,stale-if-error=14400"
          );
          assert.equal(
            edgeCacheControl,
            "public,max-age=15,s-maxage=900,stale-while-revalidate=1000,stale-if-error=14400"
          );
          assert.equal(edgeCacheTag, "c/1/abcdefgh");
        })
        .then(done);
    });
  });

  describe("mountAt", function() {
    it("Gets Pages Mounted at Some Path", async function() {
      const app = express();
      mountQuintypeAt(app, "/foo");
      createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({ pageType, data: { text: "foobar", host } }),
        [{ pageType: "home-page", path: "/", exact: true }],
        {},
        app
      );

      await supertest(app)
        .get("/foo")
        .expect("Content-Type", /html/)
        .expect(200)
        .then(res => {
          const response = JSON.parse(res.text);
          assert.equal(
            '<div data-page-type="home-page">foobar</div>',
            response.content
          );
          assert.equal("foobar", response.store.qt.data.text);
          assert.equal("127.0.0.1", response.store.qt.data.host);
          assert.equal("home-page", response.store.qt.pageType);
        });
    });

    it("returns 404 for pages outside the mount at", async function() {
      const app = express();
      mountQuintypeAt(app, "/foo");
      createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({ pageType, data: { text: "foobar", host } }),
        [{ pageType: "home-page", path: "/", exact: true }],
        {},
        app
      );

      await supertest(app)
        .get("/")
        .expect(404);
    });

    it("Gets Pages Mounted at Some Path", async function() {
      const app = express();
      mountQuintypeAt(app, hostname => `/${hostname}`);
      createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({ pageType, data: { text: "foobar", host } }),
        [{ pageType: "home-page", path: "/", exact: true }],
        {},
        app
      );

      await supertest(app)
        .get("/127.0.0.1")
        .expect("Content-Type", /html/)
        .expect(200)
        .then(res => {
          const response = JSON.parse(res.text);
          assert.equal(
            '<div data-page-type="home-page">foobar</div>',
            response.content
          );
          assert.equal("foobar", response.store.qt.data.text);
          assert.equal("127.0.0.1", response.store.qt.data.host);
          assert.equal("home-page", response.store.qt.pageType);
        });
    });

    it("doesn't apply the mountpoint if the function returns undefined", async () => {
      const app = express();
      mountQuintypeAt(app, hostname => undefined);
      createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({ pageType, data: { text: "foobar", host } }),
        [{ pageType: "home-page", path: "/", exact: true }],
        {},
        app
      );

      await supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then(res => {
          const response = JSON.parse(res.text);
          assert.equal(
            '<div data-page-type="home-page">foobar</div>',
            response.content
          );
          assert.equal("foobar", response.store.qt.data.text);
          assert.equal("127.0.0.1", response.store.qt.data.host);
          assert.equal("home-page", response.store.qt.pageType);
        });
    });
  });
});
