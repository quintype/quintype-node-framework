const assert = require('assert');
const express = require("express");

const { isomorphicRoutes } = require("../../server/routes");
const supertest = require("supertest");

function getClientStub(hostname) {
  return {
    getHostname: () => "demo.quintype.io",
    getConfig: () => Promise.resolve({foo: "bar"})
  }
}

function createApp(loadData, route = {path: "/", pageType: "home-page"}, opts = {}) {
  const app = express();
  isomorphicRoutes(app, Object.assign({
    assetHelper: {assetHash: (file) => file == "app.js" ? "abcdef" : null},
    getClient: getClientStub,
    generateRoutes: () => [route],
    loadData,
    appVersion: 42,
    publisherConfig: {},
  }, opts));

  return app;
}

describe('Isomorphic Data Load', function() {
  it("returns data given by the load data function", function(done) {
    const app = createApp((pageType, params, config, client, {host}) => Promise.resolve({
      data: {
        pageType,
        config,
        clientHost: client.getHostname(),
        host
      }
    }));

    supertest(app)
      .get("/route-data.json?path=%2F")
      .expect("Content-Type", /json/)
      .expect(200)
      .then(res => {
        const response = JSON.parse(res.text);
        assert.equal("home-page", response.data.pageType);
        assert.equal("bar", response.data.config.foo);
        assert.equal("demo.quintype.io", response.data.clientHost);
        assert.equal("127.0.0.1", response.data.host);
      }).then(done);
  });

  it("passes url parameters to the load data function", function(done) {
    const app = createApp((pageType, params, config, client) => Promise.resolve({ data: { text: params.text } }));

    supertest(app)
      .get("/route-data.json?path=%2F&text=foobar")
      .expect("Content-Type", /json/)
      .expect(200)
      .then(res => {
        const response = JSON.parse(res.text);
        assert.equal("foobar", response.data.text);
      }).then(done);
  });

  it("loads data for the homepage if no path is passed in", function(done) {
    const app = createApp((pageType, params, config, client) => Promise.resolve({ data: {pageType} }));

    supertest(app)
      .get("/route-data.json")
      .expect("Content-Type", /json/)
      .expect(200)
      .then(res => {
        const response = JSON.parse(res.text);
        assert.equal("home-page", response.data.pageType);
      }).then(done);
  });

  it("returns an appVersion on every response", function(done) {
    const app = createApp((pageType, params, config, client) => Promise.resolve({}));

    supertest(app)
      .get("/route-data.json?path=%2F")
      .expect("Content-Type", /json/)
      .expect(200)
      .then(res => {
        const response = JSON.parse(res.text);
        assert.equal(42, response.appVersion);
      }).then(done);
  });

  it("return the title of the page", function(done) {
    const app = createApp((pageType, params, config, client) => Promise.resolve({data: {}, title: "foobar"}));
    supertest(app)
      .get("/route-data.json?path=%2F")
      .expect("Content-Type", /json/)
      .expect(200)
      .then(res => {
        const response = JSON.parse(res.text);
        assert.equal("foobar", response.title);
      }).then(done);
  });

  it("passes any params to the loadData function", function(done) {
    const app = createApp((pageType, params, config, client) => Promise.resolve({data: {amazing: params.amazing}}), {pageType: "home-page", path: "/", params: {amazing: "stuff"}});
    supertest(app)
      .get("/route-data.json?path=%2F")
      .expect("Content-Type", /json/)
      .expect(200)
      .then(res => {
        const response = JSON.parse(res.text);
        assert.equal("stuff", response.data.amazing);
      }).then(done);
  });

  it("passes back caching headers", function(done) {
    const app = createApp((pageType, params, config, client) => Promise.resolve({data: {cacheKeys: ["foo", "bar"]}}));
    supertest(app)
      .get("/route-data.json?path=%2F")
      .expect("Content-Type", /json/)
      .expect("Cache-Control", "public,max-age=15,s-maxage=240,stale-while-revalidate=300,stale-if-error=14400")
      .expect("Vary", "Accept-Encoding")
      .expect("Surrogate-Control", /public/)
      .expect("Cache-Tag", "foo,bar")
      .expect(200, done)
  });

  describe("aborting the data loader", () => {
    it("returns a 200 with a not-found if the load data decides to abort", function(done) {
      const app = createApp((pageType, params, config, client, {next}) => next(), undefined, {
        loadErrorData: (e) => ({foo: "bar"})
      });

      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(404)
        .then(res => {
          const response = JSON.parse(res.text);
          assert.equal("bar", response.foo);
        }).then(done, done);
    });

    it("returns a 200 with a not-found if the load data decides to abort", function(done) {
      const app = createApp((pageType, params, config, client, {next}) => next().then(n => ({data: n})), undefined, {
        loadErrorData: (e) => ({foo: "bar"})
      });

      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(404)
        .then(res => {
          const response = JSON.parse(res.text);
          assert.equal("bar", response.foo);
        }).then(done, done);
    });
  });

  describe("status codes", function() {
    it("any status code more than 500 becomes an http 500", function(done) {
      const app = createApp((pageType, params, config, client) => Promise.resolve({data: {}, httpStatusCode: 503}));
      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(500, done);
    });

    it("any status code less than 500 becomes an http 200", function(done) {
      const app = createApp((pageType, params, config, client) => Promise.resolve({data: {}, httpStatusCode: 301}));
      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(200)
        .then(res => {
          const response = JSON.parse(res.text);
          assert.equal(301, response.httpStatusCode);
        }).then(done);
    });
  });

  describe("failure scenarios", function(done) {
    it("returns 404 if the path is not matched", function(done) {
      this.timeout(10000);
      const app = createApp((pageType, params, config, client) => Promise.resolve({data: {amazing: params.amazing}}), {pageType: "home-page", path: "/foobar"}, {
        loadErrorData: (e) => ({foo: "bar"})
      });
      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(404)
        .then(res => {
          const response = JSON.parse(res.text);
          assert.equal("bar", response.foo);
        }).then(done);
    });

    it("returns 404 if generate routes throws an exception", function(done) {
      const app = createApp((pageType, params, config, client) => Promise.resolve({data: {amazing: params.amazing}}), {pageType: "home-page", path: "/"}, {
        generateRoutes: () => {throw "foobar"},
        loadErrorData: (e) => ({foo: "bar"})
      });
      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(404, done);
    });

    it("return 500 if loadData and loadErrorData both throw exceptions", function(done) {
      const app = createApp((pageType, params, config, client) => {throw "foobar"}, {pageType: "home-page", path: "/"}, {
        loadErrorData: () => {throw "exception2"; }
      });
      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(500, done);
    });

    it("loads error data if loadData throws an exceptions", function(done) {
      const app = createApp((pageType, params, config, client) => {throw "foobar"}, {pageType: "home-page", path: "/"}, {
        loadErrorData: (error, config) => Promise.resolve({error})
      });
      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(200)
        .then(res => {
          const response = JSON.parse(res.text);
          assert.equal("foobar", response.error);
        })
        .then(done);
    });

    it("has a default loadErrorData", function(done) {
      const app = createApp((pageType, params, config, client) => {throw "foobar"}, {pageType: "home-page", path: "/"});
      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(500, done);
    });
  });
});
