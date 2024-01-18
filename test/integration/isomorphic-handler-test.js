const assert = require("assert");
const express = require("express");
const React = require("react");

const { isomorphicRoutes, mountQuintypeAt } = require("../../server/routes");
const supertest = require("supertest");

function getClientStub(hostname) {
  return {
    getHostname: () => "demo.quintype.io",
    getConfig: () =>
      Promise.resolve({
        foo: "bar",
        "sketches-host": "https://www.foo.com",
      }),
    baseUrl: "https://www.foo.com",
  };
}

function pickComponent(pageType) {
  return ({ data }) => <div data-page-type={pageType}>{data.text}</div>;
}

const cdnProviderFunc = () => "akamai";

function createApp(loadData, routes, opts = {}, app = express()) {
  const { redirectToLowercaseSlugs = false, enableExternalStories = false, externalIdPattern = "" } = opts;
  isomorphicRoutes(
    app,
    Object.assign(
      {
        assetHelper: {
          assetHash: (file) => (file === "app.js" ? "abcdef" : null),
          assetPath: (file) => `/assets/${file}`,
        },
        getClient: getClientStub,
        generateRoutes: () => routes,
        loadData,
        pickComponent: opts.pickComponent || pickComponent,
        renderLayout: (res, { store, title, content }) =>
          res.send(JSON.stringify({ store: store.getState(), title, content })),
        handleCustomRoute: false,
        publisherConfig: {},
        redirectToLowercaseSlugs,
        enableExternalStories,
        externalIdPattern
      },
      opts
    )
  );

  return app;
}

describe("Isomorphic Handler", function () {
  it("Renders the page if the route matches", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host }) =>
        Promise.resolve({ pageType, data: { text: "foobar", host } }),
      [{ pageType: "home-page", path: "/", exact: true }]
    );

    supertest(app)
      .get("/")
      .expect("Content-Type", /html/)
      .expect(200)
      .then((res) => {
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

  it("Accepts an async pickComponent function", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host }) =>
        Promise.resolve({ pageType, data: { text: "foobar" } }),
      [{ pageType: "home-page", path: "/" }],
      {
        pickComponent: (pageType) => Promise.resolve(pickComponent(pageType)),
      }
    );

    supertest(app)
      .get("/")
      .expect("Content-Type", /html/)
      .expect(200)
      .then((res) => {
        const response = JSON.parse(res.text);
        assert.equal(
          '<div data-page-type="home-page">foobar</div>',
          response.content
        );
      })
      .then(done);
  });

  it("Passes all URL parameters to the load data function", function (done) {
    const app = createApp(
      (pageType, params, config, client) =>
        Promise.resolve({ pageType, data: { text: params.text } }),
      [{ pageType: "home-page", path: "/" }]
    );

    supertest(app)
      .get("/?text=foobar")
      .expect("Content-Type", /html/)
      .expect(200)
      .then((res) => {
        const response = JSON.parse(res.text);
        assert.equal("foobar", response.store.qt.data.text);
      })
      .then(done);
  });

  describe("preloading", function () {
    it("preloads the app.js", function (done) {
      const app = createApp(
        (pageType, params, config, client) =>
          Promise.resolve({ pageType, data: { text: "foobar" } }),
        [{ pageType: "home-page", path: "/" }],
        {
          preloadJs: true,
        }
      );

      supertest(app)
        .get("/?foo=bar")
        .expect("Content-Type", /html/)
        .expect("Link", "</assets/app.js>; rel=preload; as=script;")
        .expect(200, done);
    });
  });

  it("Throws a 404 if the route is not matched", function (done) {
    const app = createApp(
      (pageType, params, config, client) => Promise.resolve(),
      [{ pageType: "home-page", path: "/", exact: true }],
      {
        loadErrorData: (err, config, client, { host }) => ({
          httpStatusCode: err.httpStatusCode,
          pageType: "not-found",
          data: { text: "foobar", host },
        }),
      }
    );

    supertest(app)
      .get("/not-found")
      .expect("Content-Type", /html/)
      .expect(404)
      .then((res) => {
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

  it("Throws a 500 if loadData doesn't work", function (done) {
    const app = createApp(
      (pageType, params, config, client) => {
        throw "exception";
      },
      [{ pageType: "home-page", path: "/" }],
      {
        loadErrorData: (err, config) => ({
          httpStatusCode: err.httpStatusCode || 500,
          pageType: "not-found",
          data: { text: "foobar" },
        }),
      }
    );

    supertest(app)
      .get("/")
      .expect("Content-Type", /html/)
      .expect(500)
      .then((res) => {
        const response = JSON.parse(res.text);
        assert.equal(
          '<div data-page-type="not-found">foobar</div>',
          response.content
        );
        assert.equal(true, response.store.qt.disableIsomorphicComponent);
      })
      .then(done, done);
  });

  it("Throws a 500 if loadData and loadErrorData both crash", function (done) {
    const app = createApp(
      (pageType, params, config, client) => {
        throw "exception";
      },
      [{ pageType: "home-page" }],
      {
        loadErrorData: (err, config) => {
          throw "foobar";
        },
      }
    );

    supertest(app).get("/").expect("Content-Type", /html/).expect(500, done);
  });

  it("Cache headers are set", function (done) {
    const app = createApp(
      (pageType, params, config, client) =>
        Promise.resolve({
          pageType,
          data: { text: "foobar", cacheKeys: ["foo", "bar"] },
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
      .expect("Surrogate-Key", "foo bar")
      .expect("Cache-Tag", "foo,bar")
      .expect(200, done);
  });

  it("it redirects on a 301", function (done) {
    const app = createApp(
      (pageType, params, config, client) =>
        Promise.resolve({ httpStatusCode: 301, data: { location: "/foobar" } }),
      [{ pageType: "home-page", path: "/" }]
    );

    supertest(app).get("/").expect("Location", "/foobar").expect(301, done);
  });

  it("returns a 500 if render layout crashes", function (done) {
    const app = createApp(
      (pageType, params, config, client) =>
        Promise.resolve({ pageType, data: { text: "foobar" } }),
      [{ pageType: "home-page", path: "/" }],
      {
        renderLayout: () => {
          throw "foobar";
        },
      }
    );
    supertest(app).get("/").expect(500, done);
  });

  describe("Prerender server", function () {
    const newApp = express();
    const newServer = newApp.listen(4000);

    newApp.get("/*", (req, res) => {
      return res.status("200").send("Prerender");
    });

    const app = createApp(
      (pageType, params, config, client) =>
        Promise.resolve({ pageType, data: { text: "foobar" } }),
      [{ pageType: "home-page", path: "/" }],
      {
        prerenderServiceUrl: "http://localhost:4000",
      }
    );

    it("Should run prerender servre if i pass any other server top of it", function (done) {
      supertest(newServer)
        .get("/http://localhost:3000")
        .expect(200)
        .then((res) => {
          assert.equal("Prerender", res.text);
        })
        .then(done, done)
        .finally(() => {
          newServer.close();
        });
    });

    // TODO: Figure out how to test prerender response in framework (use token or start prerender server locally?)
    // it("Should include prerender middleware if prerenderServiceUrl is available", async function () {
    //   await supertest(app)
    //     .get({
    //       hostname: "/foo?preload=true",
    //       headers: {
    //         "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
    //       },
    //     })
    //     .expect("Content-Type", /html/)
    //     .expect("Vary", "Accept-Encoding")
    //     .expect(200)
    //     .then((res) => {
    //       const response = JSON.parse(res.text);
    //       const cacheControl = res.header["cache-control"];
    //       const tag = res.header["cache-tag"];
    //       assert.equal(
    //         cacheControl,
    //         "public,max-age=15,s-maxage=60,stale-while-revalidate=150,stale-if-error=3600"
    //       );
    //       assert.equal(tag, "preRenderCache");
    //       assert.equal(
    //         '<div data-page-type="home-page">foobar</div>',
    //         response.content
    //       );
    //     });
    // });
  });

  describe("aborting the data loader", () => {
    it("Throws a 404 if load data decides not to handle the request", function (done) {
      const app = createApp(
        (pageType, params, config, client, { next }) => next(),
        [{ pageType: "home-page", path: "/skip", exact: true }],
        {
          loadErrorData: (err, config, client, { host }) => ({
            httpStatusCode: err.httpStatusCode,
            pageType: "not-found",
            data: { text: "foobar", host },
          }),
        }
      );

      supertest(app)
        .get("/skip")
        .expect("Content-Type", /html/)
        .expect(404)
        .then((res) => {
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

    it("Allows bypassing even data.abort is set", function (done) {
      const app = createApp(
        (pageType, params, config, client, { next }) =>
          next().then((n) => ({ data: n })),
        [{ pageType: "home-page", path: "/skip", exact: true }],
        {
          loadErrorData: (err, config, client, { host }) => ({
            httpStatusCode: err.httpStatusCode,
            pageType: "not-found",
            data: { text: "foobar", host },
          }),
        }
      );

      supertest(app)
        .get("/skip")
        .expect("Content-Type", /html/)
        .expect(404)
        .then((res) => {
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

    it("Allows you to chain one loader to the next if two routes overlap", function (done) {
      const overlappingRoutes = [
        { pageType: "skip", path: "/" },
        { pageType: "home-page", path: "/" },
      ];
      const dataLoader = (pageType, _1, _2, _3, { host, next }) =>
        pageType === "skip"
          ? next()
          : Promise.resolve({ pageType, data: { text: "foobar", host } });

      const app = createApp(dataLoader, overlappingRoutes);

      supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
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

  it("Passes the primaryHostUrl and currentHostUrl to the render", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host }) =>
        Promise.resolve({ pageType, data: { text: "foobar", host } }),
      [{ pageType: "home-page", path: "/" }]
    );

    supertest(app)
      .get("/")
      .expect("Content-Type", /html/)
      .expect(200)
      .then((res) => {
        const response = JSON.parse(res.text);
        assert.equal("https://www.foo.com", response.store.qt.currentHostUrl);
        assert.equal("https://www.foo.com", response.store.qt.primaryHostUrl);
      })
      .then(done);
  });

  describe("lightPages", () => {
    it("renders amp story pages", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, story: { "is-amp-supported": true } },
          }),
        [{ pageType: "story-page", path: "/*/:storySlug" }],
        {
          lightPages: true,
        }
      );

      supertest(app)
        .get("/foo/bar")
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
          assert.equal(
            `http://127.0.0.1/amp/story/%2Ffoo%2Fbar`,
            res.get("X-QT-Light-Pages-Url")
          );
        })
        .then(done);
    });

    it("renders amp story pages when lightPages is passed as a function which return true", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, story: { "is-amp-supported": true } },
          }),
        [{ pageType: "story-page", path: "/*/:storySlug" }],
        {
          lightPages: (config) => true,
        }
      );

      supertest(app)
        .get("/foo/bar")
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
          assert.equal(
            `http://127.0.0.1/amp/story/%2Ffoo%2Fbar`,
            res.get("X-QT-Light-Pages-Url")
          );
        })
        .then(done);
    });

    it("renders a normal story page when lightPages is passed as a function which return false", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, story: { "is-amp-supported": true } },
          }),
        [{ pageType: "story-page", path: "/*/:storySlug" }],
        {
          lightPages: () => false,
          renderLightPage: (req, res, result) =>
            res.send("<h1> Amp Page </h1>"),
          shouldEncodeAmpUri: true,
        }
      );

      supertest(app)
        .get("/foo/bar")
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.equal("foobar", response.store.qt.data.text);
        })
        .then(done);
    });

    it("renders amp story pages using non-encode slug when lightPages is passed as a function which return true and shouldEncodeAmpUri is false", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, story: { "is-amp-supported": true } },
          }),
        [{ pageType: "story-page", path: "/*/:storySlug" }],
        {
          lightPages: () => true,
          shouldEncodeAmpUri: () => false,
        }
      );

      supertest(app)
        .get(
          "/general-news/%E0%B9%84%E0%B8%A1%E0%B9%88%E0%B8%A3%E0%B8%AD%E0%B8%94-%E0%B8%95%E0%B8%B3%E0%B8%A3%E0%B8%A7%E0%B8%88%E0%B8%9A%E0%B8%B8%E0%B8%81%E0%B8%88%E0%B8%B1%E0%B8%9A-%E0%B9%80%E0%B8%88%E0%B9%89%E0%B8%B2%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%A3%E0%B8%B1%E0%B8%9A%E0%B9%81%E0%B8%97%E0%B8%87-%E0%B8%AB%E0%B8%A7%E0%B8%A2%E0%B8%AD%E0%B8%AD%E0%B8%99%E0%B9%84%E0%B8%A5%E0%B8%99%E0%B9%8C"
        )
        .expect(200)
        .then((res) => {
          assert.equal(
            `http://127.0.0.1/amp/story//general-news/%E0%B9%84%E0%B8%A1%E0%B9%88%E0%B8%A3%E0%B8%AD%E0%B8%94-%E0%B8%95%E0%B8%B3%E0%B8%A3%E0%B8%A7%E0%B8%88%E0%B8%9A%E0%B8%B8%E0%B8%81%E0%B8%88%E0%B8%B1%E0%B8%9A-%E0%B9%80%E0%B8%88%E0%B9%89%E0%B8%B2%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%A3%E0%B8%B1%E0%B8%9A%E0%B9%81%E0%B8%97%E0%B8%87-%E0%B8%AB%E0%B8%A7%E0%B8%A2%E0%B8%AD%E0%B8%AD%E0%B8%99%E0%B9%84%E0%B8%A5%E0%B8%99%E0%B9%8C`,
            res.get("X-QT-Light-Pages-Url")
          );
        })
        .then(done);
    });
  });

  describe("cdnProvider", () => {
    it("Returns the right cloudflare headers for cache keys passed and no cdn provider passed", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, cacheKeys: ["c/1/abcdefgh"] },
          }),
        [{ pageType: "home-page", path: "/" }]
      );

      supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
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

    it("Returns the right cloudflare headers for no cacheKeys and no cdnProvider passed", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host },
          }),
        [{ pageType: "home-page", path: "/" }]
      );

      supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
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

    it("Returns the right headers when there is cachekeys is set to DO_NOT_CACHE", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, cacheKeys: "DO_NOT_CACHE" },
          }),
        [{ pageType: "home-page", path: "/" }],
        { cdnProvider: "akamai" }
      );

      supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
          const cacheControl = res.header["cache-control"];
          const edgeCacheControl = res.header["edge-control"];
          const cacheTag = res.header["cache-tag"];
          const edgeCacheTag = res.header["edge-cache-tag"];
          const contentSecurityPolicy = res.header["content-security-policy"];
          assert.equal(cacheControl, "private,no-cache,no-store,max-age=0");
          assert.equal(edgeCacheControl, "private,no-cache,no-store,max-age=0");
          assert.equal(cacheTag, undefined);
          assert.equal(edgeCacheTag, undefined);
          assert.equal(
            contentSecurityPolicy,
            `default-src data: 'unsafe-inline' 'unsafe-eval' https: http:;` +
              `script-src data: 'unsafe-inline' 'unsafe-eval' https: http: blob:;` +
              `style-src data: 'unsafe-inline' https: http: blob:;` +
              `img-src data: https: http: blob:;` +
              `font-src data: https: http:;` +
              `connect-src https: wss: ws: http: blob:;` +
              `media-src https: blob: http:;` +
              `object-src https: http:;` +
              `child-src https: data: blob: http:;` +
              `form-action https: http:;` +
              `block-all-mixed-content;`
          );
        })
        .then(done);
    });

    it("Returns the right akamai headers when cachekeys are not passed", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host },
          }),
        [{ pageType: "home-page", path: "/" }],
        { cdnProvider: "akamai" }
      );

      supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
          const cacheControl = res.header["cache-control"];
          const edgeCacheControl = res.header["edge-control"];
          const edgeCacheTag = res.header["edge-cache-tag"];
          const contentSecurityPolicy = res.header["content-security-policy"];
          assert.equal(
            cacheControl,
            "public,max-age=15,s-maxage=60,stale-while-revalidate=150,stale-if-error=3600"
          );
          assert.equal(
            edgeCacheControl,
            "public,maxage=60,stale-while-revalidate=150,stale-if-error=3600"
          );
          assert.equal(edgeCacheTag, undefined);
          assert.equal(
            contentSecurityPolicy,
            `default-src data: 'unsafe-inline' 'unsafe-eval' https: http:;` +
              `script-src data: 'unsafe-inline' 'unsafe-eval' https: http: blob:;` +
              `style-src data: 'unsafe-inline' https: http: blob:;` +
              `img-src data: https: http: blob:;` +
              `font-src data: https: http:;` +
              `connect-src https: wss: ws: http: blob:;` +
              `media-src https: blob: http:;` +
              `object-src https: http:;` +
              `child-src https: data: blob: http:;` +
              `form-action https: http:;` +
              `block-all-mixed-content;`
          );
        })
        .then(done);
    });

    it("Returns the right akamai headers when right cachekeys are passed", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, cacheKeys: ["c/1/abcdefgh"] },
          }),
        [{ pageType: "home-page", path: "/" }],
        { cdnProvider: "akamai" }
      );

      supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
          const cacheControl = res.header["cache-control"];
          const edgeCacheControl = res.header["edge-control"];
          const edgeCacheTag = res.header["edge-cache-tag"];
          const contentSecurityPolicy = res.header["content-security-policy"];
          assert.equal(
            cacheControl,
            "public,max-age=15,s-maxage=900,stale-while-revalidate=1000,stale-if-error=14400"
          );
          assert.equal(
            edgeCacheControl,
            "public,maxage=900,stale-while-revalidate=1000,stale-if-error=14400"
          );
          assert.equal(edgeCacheTag, "c/1/abcdefgh");
          assert.equal(
            contentSecurityPolicy,
            `default-src data: 'unsafe-inline' 'unsafe-eval' https: http:;` +
              `script-src data: 'unsafe-inline' 'unsafe-eval' https: http: blob:;` +
              `style-src data: 'unsafe-inline' https: http: blob:;` +
              `img-src data: https: http: blob:;` +
              `font-src data: https: http:;` +
              `connect-src https: wss: ws: http: blob:;` +
              `media-src https: blob: http:;` +
              `object-src https: http:;` +
              `child-src https: data: blob: http:;` +
              `form-action https: http:;` +
              `block-all-mixed-content;`
          );
        })
        .then(done);
    });

    it("Returns the right cache headers when cdnProvider is of type function", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, cacheKeys: ["c/1/abcdefgh"] },
          }),
        [{ pageType: "home-page", path: "/" }],
        { cdnProvider: cdnProviderFunc() }
      );

      supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
          const cacheControl = res.header["cache-control"];
          const edgeCacheControl = res.header["edge-control"];
          const edgeCacheTag = res.header["edge-cache-tag"];
          const contentSecurityPolicy = res.header["content-security-policy"];
          assert.equal(
            cacheControl,
            "public,max-age=15,s-maxage=900,stale-while-revalidate=1000,stale-if-error=14400"
          );
          assert.equal(
            edgeCacheControl,
            "public,maxage=900,stale-while-revalidate=1000,stale-if-error=14400"
          );
          assert.equal(edgeCacheTag, "c/1/abcdefgh");
          assert.equal(
            contentSecurityPolicy,
            `default-src data: 'unsafe-inline' 'unsafe-eval' https: http:;` +
              `script-src data: 'unsafe-inline' 'unsafe-eval' https: http: blob:;` +
              `style-src data: 'unsafe-inline' https: http: blob:;` +
              `img-src data: https: http: blob:;` +
              `font-src data: https: http:;` +
              `connect-src https: wss: ws: http: blob:;` +
              `media-src https: blob: http:;` +
              `object-src https: http:;` +
              `child-src https: data: blob: http:;` +
              `form-action https: http:;` +
              `block-all-mixed-content;`
          );
        })
        .then(done);
    });
    it("Override the s-maxage cache headers when sMaxAge value present", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, cacheKeys: ["c/1/abcdefgh"] },
          }),
        [{ pageType: "home-page", path: "/" }],
        { cdnProvider: cdnProviderFunc(), sMaxAge: "1800" }
      );

      supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
          const cacheControl = res.header["cache-control"];
          assert.equal(
            cacheControl,
            "public,max-age=15,s-maxage=1800,stale-while-revalidate=1000,stale-if-error=14400"
          );
        })
        .then(done);
    });
    it("Fallback the value of s-maxage to 900 second if when sMaxAge value not present", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host, cacheKeys: ["c/1/abcdefgh"] },
          }),
        [{ pageType: "home-page", path: "/" }],
        { cdnProvider: cdnProviderFunc() }
      );

      supertest(app)
        .get("/")
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
          const cacheControl = res.header["cache-control"];
          assert.equal(
            cacheControl,
            "public,max-age=15,s-maxage=900,stale-while-revalidate=1000,stale-if-error=14400"
          );
        })
        .then(done);
    });
  });

  describe("redirectToLowercaseSlugs", () => {
    it("when enabled, redirects story slug with capital letters to lowercase slug URL", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host },
          }),
        [{ pageType: "story-page", path: "/*/:storySlug" }],
        { redirectToLowercaseSlugs: true }
      );

      supertest(app)
        .get("/foo/Bar")
        .expect("Location", "/foo/bar")
        .expect(301)
        .then((res) => {
          assert(true);
        })
        .then(done);
    });

    it("when enabled, it does not redirect for story slugs containing accents or non-latin letters", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host },
          }),
        [{ pageType: "story-page", path: "/*/:storySlug" }],
        { redirectToLowercaseSlugs: true }
      );

      supertest(app)
        .get(
          "/foo/%E0%A6%85%E0%A6%B8%E0%A7%8D%E0%A6%AC%E0%A6%BE%E0%A6%AD%E0%A6%BE%E0%A6%AC%E0%A6%BF%E0%A6%95-%C3%81%C3%89%C3%8D%C3%93%C3%9A%C3%9D-%C3%9Cber-%C4%B0nsensitive"
        ) // Actual URL is অস্বাভাবিক-ÁÉÍÓÚÝ-Über-İnsensitive
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.equal("foobar", response.store.qt.data.text);
        })
        .then(done);
    });

    it("when enabled, it does not redirect for section pages containing capital letters", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host },
          }),
        [{ pageType: "section-page", path: "/:section/:subSection" }],
        { redirectToLowercaseSlugs: true }
      );

      supertest(app)
        .get("/foo/Bar")
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.equal("foobar", response.store.qt.data.text);
        })
        .then(done);
    });

    it("when not enabled, story slug with capital letters gives a normal response", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host },
          }),
        [{ pageType: "story-page", path: "/*/:storySlug" }],
        { redirectToLowercaseSlugs: false }
      );

      supertest(app)
        .get("/foo/Bar")
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.equal("foobar", response.store.qt.data.text);
        })
        .then(done);
    });
  });

  describe("External Stories", () => {
    it("should render the story page when external stories are enabled and the route matches", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: { text: "foobar", host },
          }),
        [{ pageType: "story-page", path: "/*/:storySlug" }],
        {
          enableExternalStories: true,
          externalIdPattern: "/EXTERNAL_ID",
          getClient: (hostname) => ({
            getConfig: () => Promise.resolve({ "publisher-id": 42 }),
            getStoryByExternalId: (externalId) =>
              Promise.resolve({
                story: { slug: `section/${externalId}`, id: "abcdefgh-blah" },
              }),
          }),
        }
      );

      supertest(app)
        .get("/12345")
        .expect("Content-Type", /html/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.equal('<div data-page-type="story-page">foobar</div>', response.content);
          assert.equal("foobar", response.store.qt.data.text);
          assert.equal("127.0.0.1", response.store.qt.data.host);
          assert.equal("story-page", response.store.qt.pageType);
        })
        .then(done);
    });

    it("should render the 404 page when external stories are enabled but the route doesn't match", (done) => {
      const app = createApp(
        (pageType, params, config, client) => Promise.resolve(),
        [{ pageType: "story-page", path: "/:storySlug", exact: true }],
        {
          loadErrorData: (err, config, client, { host }) => ({
            httpStatusCode: err.httpStatusCode,
            pageType: "not-found",
            data: { text: "foobar", host },
          }),
          enableExternalStories: true,
          externalIdPattern: "/EXTERNAL_ID",
          getClient: (hostname) => ({
            getConfig: () => Promise.resolve({ "publisher-id": 42 }),
            getStoryByExternalId: (externalId) =>
              Promise.resolve({
                story: null
              }),
          }),
        }
      );

      supertest(app)
        .get("/abc/def/12345")
        .expect("Content-Type", /html/)
        .expect(404)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.equal(
            '<div data-page-type="not-found">foobar</div>',
            response.content
          );
          assert.equal("127.0.0.1", response.store.qt.data.host);
        })
        .then(done);
    });

    it("should render a 404 page when external stories are not enabled", (done) => {
      const app = createApp(
        (pageType, params, config, client) => Promise.resolve(),
        [{ pageType: "story-page", path: "/*/:storySlug", exact: true }],
        {
          loadErrorData: (err, config, client, { host }) => ({
            httpStatusCode: err.httpStatusCode,
            pageType: "not-found",
            data: { text: "foobar", host },
          }),
          enableExternalStories: false,
          getClient: (hostname) => ({
            getConfig: () => Promise.resolve({ "publisher-id": 42 }),
            getStoryByExternalId: (externalId) =>
              Promise.resolve(null),
          }),
        }
      );

      supertest(app)
        .get("/12345")
        .expect("Content-Type", /html/)
        .expect(404)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.equal(
            '<div data-page-type="not-found">foobar</div>',
            response.content
          );
          assert.equal("127.0.0.1", response.store.qt.data.host);
        })
        .then(done);
    });
  });

  describe("mountAt", function () {
    it("Gets Pages Mounted at Some Path", async function () {
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
        .then((res) => {
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

    it("returns 404 for pages outside the mount at", async function () {
      const app = express();
      mountQuintypeAt(app, "/foo");
      createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({ pageType, data: { text: "foobar", host } }),
        [{ pageType: "home-page", path: "/", exact: true }],
        {},
        app
      );

      await supertest(app).get("/").expect(404);
    });

    it("Gets Pages Mounted at Some Path", async function () {
      const app = express();
      mountQuintypeAt(app, (hostname) => `/${hostname}`);
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
        .then((res) => {
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
      mountQuintypeAt(app, (hostname) => undefined);
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
        .then((res) => {
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
