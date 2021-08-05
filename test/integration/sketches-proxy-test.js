const assert = require("assert");
const express = require("express");

const { upstreamQuintypeRoutes, mountQuintypeAt } = require("../../server/routes");
const supertest = require("supertest");

describe("Sketches Proxy", function () {
  let upstreamServer;

  before(function (next) {
    const upstreamApp = express();
    upstreamApp.all("/*", (req, res) =>
      res.send(
        JSON.stringify({
          method: req.method,
          url: req.url,
          host: req.headers.host,
        })
      )
    );
    upstreamServer = upstreamApp.listen(next);
  });

  describe("forwarding requests", function () {
    function buildApp({ app = express() } = {}) {
      upstreamQuintypeRoutes(app, {
        config: {
          sketches_host: `http://127.0.0.1:${upstreamServer.address().port}`,
        },
        getClient: (host) => ({ getHostname: () => host.toUpperCase() }),
        extraRoutes: ["/custom-route"],
        forwardAmp: true,
        forwardFavicon: true,
        publisherConfig: {},
      });
      return app;
    }

    it("forwards requests to sketches", function (done) {
      supertest(buildApp())
        .get("/api/v1/config")
        .expect(200)
        .then((res) => {
          const { method, url, host } = JSON.parse(res.text);
          assert.equal("GET", method);
          assert.equal("/api/v1/config", url);
          assert.equal("127.0.0.1", host);
        })
        .then(done);
    });

    it("forwards custom routes to sketches", function (done) {
      supertest(buildApp())
        .get("/custom-route")
        .expect(200)
        .then((res) => {
          const { method, url, host } = JSON.parse(res.text);
          assert.equal("GET", method);
          assert.equal("/custom-route", url);
          assert.equal("127.0.0.1", host);
        })
        .then(done);
    });

    it("grabs the hostname from the client", function (done) {
      supertest(buildApp())
        .get("/amp/story/foo")
        .set("Host", "foobar.com")
        .expect(200)
        .then((res) => {
          const { host } = JSON.parse(res.text);
          assert.equal("FOOBAR.COM", host);
        })
        .then(done);
    });

    it("does not forward unknown requests", function (done) {
      supertest(buildApp()).get("/unknown").expect(404, done);
    });

    it("forwards amp requests", function (done) {
      supertest(buildApp())
        .get("/amp/story/foo")
        .expect(200)
        .then((res) => {
          const { url } = JSON.parse(res.text);
          assert.equal("/amp/story/foo", url);
        })
        .then(done);
    });

    it("gets favicon", function (done) {
      supertest(buildApp())
        .get("/favicon.ico")
        .expect(200)
        .then((res) => {
          const { url } = JSON.parse(res.text);
          assert.equal("/favicon.ico", url);
        })
        .then(done);
    });

    it("allows mounting at a different path", function (done) {
      const app = express();
      mountQuintypeAt(app, "/foo");
      supertest(buildApp({ app }))
        .get("/foo/api/v1/config")
        .expect(200)
        .then((res) => {
          const { method, url, host } = JSON.parse(res.text);
          assert.equal("GET", method);
          assert.equal("/api/v1/config", url);
          assert.equal("127.0.0.1", host);
        })
        .then(done);
    });
  });

  describe("Override the s-maxage cache header", function () {
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
    function buildApp(sMaxAge = "", { app = express() } = {}) {
      upstreamQuintypeRoutes(app, {
        config: {
          sketches_host: `https://demo.quintype.io`,
        },
        getClient: getClientStub,
        extraRoutes: ["/custom-route"],
        forwardAmp: true,
        forwardFavicon: true,
        publisherConfig: {},
        sMaxAge: `${sMaxAge}`,
      });
      return app;
    }

    it("Override the s-maxage cache header when sMaxAge value is present", function (done) {
      const sMaxAge = "900";
      supertest(buildApp(sMaxAge))
        .get("/api/v1/config")
        .expect(200)
        .then((res) => {
          const cacheControl = res.headers["cache-control"];
          assert.equal(cacheControl, "public,max-age=15,s-maxage=900,stale-while-revalidate=300,stale-if-error=7200");
        })
        .then(done);
    });

    it("Does not override the s-maxage cache header if cacheability is Private", function (done) {
      const sMaxAge = "900";
      supertest(buildApp(sMaxAge))
        .get("/api/auth/v1/users/me")
        .then((res) => {
          const cacheControl = res.headers["cache-control"];
          assert.equal(cacheControl, "private,no-cache,no-store");
        })
        .then(done);
    });

    it("Does not override the s-maxage cache header for Breaking News", function (done) {
      const sMaxAge = "900";
      supertest(buildApp(sMaxAge))
        .get("/api/v1/breaking-news")
        .then((res) => {
          const cacheControl = res.headers["cache-control"];
          assert.equal(cacheControl, "public,max-age=15,s-maxage=240,stale-while-revalidate=300,stale-if-error=7200");
        })
        .then(done);
    });

    it("if sMaxAge value is not present, do not override cache headers", function (done) {
      supertest(buildApp())
        .get("/api/v1/config")
        .expect(200)
        .then((res) => {
          const cacheControl = res.headers["cache-control"];
          assert.equal(cacheControl, "public,max-age=15,s-maxage=240,stale-while-revalidate=300,stale-if-error=7200");
        })
        .then(done);
    });
  });

  describe("sitemap requests", function () {
    function buildApp({ isSitemapUrlEnabled }) {
      const app = express();
      upstreamQuintypeRoutes(app, {
        config: {
          sketches_host: `http://127.0.0.1:${upstreamServer.address().port}`,
        },
        getClient: (host) => ({ getHostname: () => host.toUpperCase() }),
        extraRoutes: ["/custom-route"],
        publisherConfig: {},
        isSitemapUrlEnabled,
      });
      return app;
    }

    it("forwards requests to test new_sitemap/today.xml should not throw error if isSitemapUrlEnabled is enabled", function (done) {
      supertest(buildApp({ isSitemapUrlEnabled: true }))
        .get("/news_sitemap/today.xml")
        .set("Host", "foobar.com")
        .expect(200)
        .then((res) => {
          const { host } = JSON.parse(res.text);
          assert.equal("FOOBAR.COM", host);
        })
        .then(done);
    });

    it("forwards requests to test news_sitemap.xml should not throw error if isSitemapUrlEnabled is disabled", function (done) {
      supertest(buildApp({ isSitemapUrlEnabled: false }))
        .get("/news_sitemap.xml")
        .set("Host", "foobar.com")
        .expect(200)
        .then((res) => {
          const { host } = JSON.parse(res.text);
          assert.equal("FOOBAR.COM", host);
        })
        .then(done);
    });
  });

  describe("ping check", function () {
    function buildApp(getConfig) {
      const app = express();
      upstreamQuintypeRoutes(app, {
        config: {
          sketches_host: `http://127.0.0.1:${upstreamServer.address().port}`,
        },
        getClient: (host) => ({ getConfig }),
      });
      return app;
    }

    it("returns a successful ping if the config is loaded", async function () {
      await supertest(buildApp(() => Promise.resolve({})))
        .get("/ping")
        .expect(200);
    });

    it("fails with a 503 if the config fails", async function () {
      await supertest(buildApp(() => Promise.reject({})))
        .get("/ping")
        .expect(503);
    });

    it("responds with a ping even if it's mounted somewhere", async function () {
      const app = express();
      mountQuintypeAt(app, "/foo");
      upstreamQuintypeRoutes(app, {
        config: {
          sketches_host: `http://127.0.0.1:${upstreamServer.address().port}`,
        },
        getClient: (host) => ({ getConfig: () => Promise.resolve({}) }),
      });

      await supertest(app).get("/ping").expect(200);

      await supertest(app).get("/foo/ping").expect(200);
    });
  });

  after(function () {
    upstreamServer.close();
  });
});
