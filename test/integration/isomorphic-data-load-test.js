const assert = require("assert").strict;
const express = require("express");

const { isomorphicRoutes } = require("../../server/routes");
const supertest = require("supertest");

const {
  MOCK_WHITELIST_MOBILE_CONFIG,
} = require("../data/whitelist-mobile-config");

function getClientStub() {
  return {
    getHostname: () => "demo.quintype.io",
    getConfig: () => Promise.resolve({ foo: "bar" }),
  };
}

function createApp(loadData, opts = {}) {
  const app = express();
  isomorphicRoutes(
    app,
    Object.assign(
      {
        assetHelper: {
          assetHash: (file) => (file == "app.js" ? "abcdef" : null),
        },
        getClient: getClientStub,
        generateRoutes: () =>
          opts.routes || [{ path: "/", pageType: "home-page" }],
        loadData,
        appVersion: 42,
        publisherConfig: opts.publisherConfig || {},
      },
      opts
    )
  );

  return app;
}

describe("Isomorphic Data Load", function () {
  it("returns data given by the load data function", function (done) {
    const app = createApp((pageType, params, config, client, { host }) =>
      Promise.resolve({
        data: {
          pageType,
          config,
          clientHost: client.getHostname(),
          host,
        },
      })
    );

    supertest(app)
      .get("/route-data.json?path=%2F")
      .expect("Content-Type", /json/)
      .expect(200)
      .then((res) => {
        const response = JSON.parse(res.text);
        assert.equal("home-page", response.data.pageType);
        assert.equal("bar", response.data.config.foo);
        assert.equal("demo.quintype.io", response.data.clientHost);
        assert.equal("127.0.0.1", response.data.host);
      })
      .then(done);
  });

  it("passes url parameters to the load data function", function (done) {
    const app = createApp((pageType, params, config, client) =>
      Promise.resolve({ data: { text: params.text } })
    );

    supertest(app)
      .get("/route-data.json?path=%2F&text=foobar")
      .expect("Content-Type", /json/)
      .expect(200)
      .then((res) => {
        const response = JSON.parse(res.text);
        assert.equal("foobar", response.data.text);
      })
      .then(done);
  });

  it("loads data for the homepage if no path is passed in", function (done) {
    const app = createApp((pageType, params, config, client) =>
      Promise.resolve({ data: { pageType } })
    );

    supertest(app)
      .get("/route-data.json")
      .expect("Content-Type", /json/)
      .expect(200)
      .then((res) => {
        const response = JSON.parse(res.text);
        assert.equal("home-page", response.data.pageType);
      })
      .then(done);
  });

  it("returns an appVersion on every response", function (done) {
    const app = createApp((pageType, params, config, client) =>
      Promise.resolve({})
    );

    supertest(app)
      .get("/route-data.json?path=%2F")
      .expect("Content-Type", /json/)
      .expect(200)
      .then((res) => {
        const response = JSON.parse(res.text);
        assert.equal(42, response.appVersion);
      })
      .then(done);
  });

  it("return the title of the page", function (done) {
    const app = createApp((pageType, params, config, client) =>
      Promise.resolve({ data: {}, title: "foobar" })
    );
    supertest(app)
      .get("/route-data.json?path=%2F")
      .expect("Content-Type", /json/)
      .expect(200)
      .then((res) => {
        const response = JSON.parse(res.text);
        assert.equal("foobar", response.title);
      })
      .then(done);
  });

  it("passes any params to the loadData function", function (done) {
    const app = createApp(
      (pageType, params, config, client) =>
        Promise.resolve({ data: { amazing: params.amazing } }),
      {
        routes: [
          { pageType: "home-page", path: "/", params: { amazing: "stuff" } },
        ],
      }
    );
    supertest(app)
      .get("/route-data.json?path=%2F")
      .expect("Content-Type", /json/)
      .expect(200)
      .then((res) => {
        const response = JSON.parse(res.text);
        assert.equal("stuff", response.data.amazing);
      })
      .then(done);
  });

  it("passes back caching headers", function (done) {
    const app = createApp((pageType, params, config, client) =>
      Promise.resolve({ data: { cacheKeys: ["foo", "bar"] } })
    );
    supertest(app)
      .get("/route-data.json?path=%2F")
      .expect("Content-Type", /json/)
      .expect(
        "Cache-Control",
        "public,s-maxage=900"
      )
      .expect("Vary", "Accept-Encoding")
      .expect("Cache-Tag", "foo,bar")
      .expect(200, done);
  });

  describe("aborting the data loader", () => {
    it("returns a 200 with a not-found if the load data decides to abort", function (done) {
      const app = createApp(
        (pageType, params, config, client, { next }) => next(),
        {
          routes: [],
          loadErrorData: (e) => ({ foo: "bar" }),
        }
      );

      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(404)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.equal("bar", response.foo);
        })
        .then(done, done);
    });

    it("returns a 200 with a not-found if the load data decides to abort", function (done) {
      const app = createApp(
        (pageType, params, config, client, { next }) =>
          next().then((n) => ({ data: n })),
        {
          routes: [],
          loadErrorData: (e) => ({ foo: "bar" }),
        }
      );

      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(404)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.equal("bar", response.foo);
        })
        .then(done, done);
    });
  });

  describe("status codes", function () {
    it("any status code more than 500 becomes an http 500", function (done) {
      const app = createApp((pageType, params, config, client) =>
        Promise.resolve({ data: {}, httpStatusCode: 503 })
      );
      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(500, done);
    });

    it("any status code less than 500 becomes an http 200", function (done) {
      const app = createApp((pageType, params, config, client) =>
        Promise.resolve({ data: {}, httpStatusCode: 301 })
      );
      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.equal(301, response.httpStatusCode);
        })
        .then(done);
    });
  });

  describe("Multi Domain Support", function () {
    function getClientStubMultiDomain() {
      return {
        getConfig() {
          return Promise.resolve({
            "sketches-host": "https://www.example.com",
            domains: [
              {
                slug: "my-domain",
                "host-url": "https://subdomain.example.com",
              },
            ],
          });
        },
      };
    }

    it("passes the domain slug to the load data function, and returns currentHostUrl in response", function (done) {
      const app = createApp(
        (pageType, params, config, client, { domainSlug }) =>
          Promise.resolve({ data: { domainSlug } }),
        {
          getClient: getClientStubMultiDomain,
          publisherConfig: {
            domain_mapping: {
              "127.0.0.1": "my-domain",
            },
          },
        }
      );

      supertest(app)
        .get("/route-data.json")
        .expect("Content-Type", /json/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.equal("my-domain", response.data.domainSlug);
          assert.equal(
            "https://subdomain.example.com",
            response.currentHostUrl
          );
          assert.equal("https://www.example.com", response.primaryHostUrl);
        })
        .then(done);
    });

    it("passes undefined if domain mapping is not present, and returns currentHostUrl in response", function (done) {
      const app = createApp(
        (pageType, params, config, client, { domainSlug }) =>
          Promise.resolve({ data: { domainSlug } }),
        {
          getClient: getClientStubMultiDomain,
          publisherConfig: {},
        }
      );

      supertest(app)
        .get("/route-data.json")
        .expect("Content-Type", /json/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.strictEqual(undefined, response.data.domainSlug);
          assert.strictEqual(
            "https://www.example.com",
            response.currentHostUrl
          );
          assert.equal("https://www.example.com", response.primaryHostUrl);
        })
        .then(done);
    });

    it("passes null if the domain is the default domain (or not present in the map), and returns currentHostUrl in response", function (done) {
      const app = createApp(
        (pageType, params, config, client, { domainSlug }) =>
          Promise.resolve({ data: { domainSlug } }),
        {
          getClient: getClientStubMultiDomain,
          publisherConfig: {
            domain_mapping: {
              "unrelated.domain.com": "unrelated",
            },
          },
        }
      );

      supertest(app)
        .get("/route-data.json")
        .expect("Content-Type", /json/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.strictEqual(null, response.data.domainSlug);
          assert.strictEqual(
            "https://www.example.com",
            response.currentHostUrl
          );
          assert.equal("https://www.example.com", response.primaryHostUrl);
        })
        .then(done);
    });

    it("passes the domainSlug to generateSlug", function (done) {
      const app = createApp(
        (pageType) => Promise.resolve({ data: { pageType } }),
        {
          publisherConfig: {
            domain_mapping: {
              "127.0.0.1": "subdomain",
            },
          },
          generateRoutes: (config, domain) => [
            { path: "/", pageType: `home-for-${domain}` },
          ],
        }
      );
      supertest(app)
        .get("/route-data.json")
        .expect("Content-Type", /json/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.strictEqual("home-for-subdomain", response.data.pageType);
        })
        .then(done);
    });

    it("strips the mount point", function (done) {
      const app = createApp(
        (pageType, params, config, client, { domainSlug }) =>
          Promise.resolve({ data: { domainSlug } }),
        {
          getClient: () => {
            return {
              getConfig() {
                return Promise.resolve({
                  "sketches-host": "https://www.example.com/subdir",
                  domains: [
                    {
                      slug: "my-domain",
                      "host-url": "https://subdomain.example.com/subdir",
                    },
                  ],
                });
              },
            };
          },
          publisherConfig: {
            domain_mapping: {
              "127.0.0.1": "my-domain",
            },
          },
        }
      );

      supertest(app)
        .get("/route-data.json")
        .expect("Content-Type", /json/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.equal("my-domain", response.data.domainSlug);
          assert.equal(
            "https://subdomain.example.com",
            response.currentHostUrl
          );
          assert.equal("https://www.example.com", response.primaryHostUrl);
        })
        .then(done);
    });
  });

  describe("failure scenarios", function (done) {
    it("returns 404 if the path is not matched", function (done) {
      this.timeout(10000);
      const app = createApp(
        (pageType, params, config, client) =>
          Promise.resolve({ data: { amazing: params.amazing } }),
        {
          routes: [{ pageType: "home-page", path: "/foobar" }],
          loadErrorData: (e) => ({ foo: "bar" }),
        }
      );
      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(404)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.equal("bar", response.foo);
        })
        .then(done);
    });

    it("returns 404 if generate routes throws an exception", function (done) {
      const app = createApp(
        (pageType, params, config, client) =>
          Promise.resolve({ data: { amazing: params.amazing } }),
        {
          routes: [{ pageType: "home-page", path: "/" }],
          generateRoutes: () => {
            throw "foobar";
          },
          loadErrorData: (e) => ({ foo: "bar" }),
        }
      );
      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(404, done);
    });

    it("return 500 if loadData and loadErrorData both throw exceptions", function (done) {
      const app = createApp(
        (pageType, params, config, client) => {
          throw "foobar";
        },
        {
          routes: [{ pageType: "home-page", path: "/" }],
          loadErrorData: () => {
            throw "exception2";
          },
        }
      );
      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(500, done);
    });

    it("loads error data if loadData throws an exceptions", function (done) {
      const app = createApp(
        (pageType, params, config, client) => {
          throw "foobar";
        },
        {
          routes: [{ pageType: "home-page", path: "/" }],
          loadErrorData: (error, config) => Promise.resolve({ error }),
        }
      );
      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.equal("foobar", response.error);
        })
        .then(done);
    });

    it("has a default loadErrorData", function (done) {
      const app = createApp(
        (pageType, params, config, client) => {
          throw "foobar";
        },
        { routes: [{ pageType: "home-page", path: "/" }] }
      );
      supertest(app)
        .get("/route-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(500, done);
    });
  });
  describe("Mobile Data", () => {
    it("loads only config needed for mobile when mobileApiEnabled flag and the mobileConfigFields is passed", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            data: {
              pageType,
              clientHost: client.getHostname(),
              host,
            },
            config: {
              foo: "bar",
              "cdn-image": "https://image.foobar.com",
              "polltype-host": "https://poll.foobar.com",
              "social-links": {
                link1: "https://link1.com/facebook",
              },
              "publisher-name": "Awesome Publisher",
            },
          }),
        {
          mobileApiEnabled: true,
          mobileConfigFields: MOCK_WHITELIST_MOBILE_CONFIG,
        }
      );
      supertest(app)
        .get("/mobile-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.equal("home-page", response.data.pageType);
          assert.equal(undefined, response.config.foo);
          assert.equal(
            "https://image.foobar.com",
            response.config["cdn-image"]
          );
          assert.equal(undefined, response.config["polltype-host"]);
          assert.equal(
            JSON.stringify(["cdn-image"]),
            JSON.stringify(Object.keys(response.config))
          );
          assert.equal("demo.quintype.io", response.data.clientHost);
          assert.equal("127.0.0.1", response.data.host);
        })
        .then(done);
    });

    it("loads all the config fields if the list of mobile config fields is empty", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            data: {
              pageType,
              clientHost: client.getHostname(),
              host,
            },
            config: {
              foo: "bar",
              "cdn-image": "https://image.foobar.com",
              "polltype-host": "https://poll.foobar.com",
              "social-links": {
                link1: "https://link1.com/facebook",
              },
              "publisher-name": "Awesome Publisher",
            },
          }),
        { mobileApiEnabled: true, mobileConfigFields: {} }
      );
      supertest(app)
        .get("/mobile-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.strictEqual("home-page", response.data.pageType);
          assert.strictEqual("bar", response.config.foo);
          assert.strictEqual(
            "https://image.foobar.com",
            response.config["cdn-image"]
          );
          assert.strictEqual(
            "https://poll.foobar.com",
            response.config["polltype-host"]
          );
          assert.strictEqual(
            JSON.stringify([
              "foo",
              "cdn-image",
              "polltype-host",
              "social-links",
              "publisher-name",
            ]),
            JSON.stringify(Object.keys(response.config))
          );
          assert.strictEqual("demo.quintype.io", response.data.clientHost);
          assert.strictEqual("127.0.0.1", response.data.host);
        })
        .then(done);
    });

    it("third level of data remain as original", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            data: {
              pageType,
              clientHost: client.getHostname(),
              host,
              collection: {
                summary: "Home collection",
                id: 2688,
                "total-count": 3,
                "collection-date": null,
                items: [
                  {
                    id: 89215,
                    "associated-metadata": {
                      layout: "OneColStoryList",
                      enable_load_more_button: true,
                      initial_stories_load_count: 6,
                      subsequent_stories_load_count: 10,
                    },
                  },
                ],
              },
            },
            config: {
              "cdn-image": "https://image.foobar.com",
            },
          }),
        {
          mobileApiEnabled: true,
          mobileConfigFields: MOCK_WHITELIST_MOBILE_CONFIG,
        }
      );
      supertest(app)
        .get("/mobile-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.strictEqual(89215, response.data.collection.items[0].id);
        })
        .then(done);
    });

    it("loads only data listed in the whitelisted keys", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            pageType,
            data: {
              clientHost: client.getHostname(),
              host,
              collection: {
                summary: "Home collection",
                id: 2688,
                "total-count": 3,
                "collection-date": null,
                items: [
                  {
                    id: 89215,
                    "associated-metadata": {
                      layout: "OneColStoryList",
                      enable_load_more_button: true,
                      initial_stories_load_count: 6,
                      subsequent_stories_load_count: 10,
                    },
                  },
                ],
              },
            },
            config: {
              "cdn-image": "https://image.foobar.com",
            },
          }),
        {
          mobileApiEnabled: true,
          mobileConfigFields: MOCK_WHITELIST_MOBILE_CONFIG,
        }
      );
      supertest(app)
        .get("/mobile-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.strictEqual(
            JSON.stringify({
              summary: "Home collection",
              "total-count": 3,
              items: [
                {
                  id: 89215,
                  "associated-metadata": {
                    layout: "OneColStoryList",
                    enable_load_more_button: true,
                    initial_stories_load_count: 6,
                    subsequent_stories_load_count: 10,
                  },
                },
              ],
            }),
            JSON.stringify(response.data.collection)
          );
        })
        .then(done);
    });

    it("does not filter data if no whitelist is passed", (done) => {
      const app = createApp(
        (pageType, params, config, client, { host }) =>
          Promise.resolve({
            data: {
              pageType,
              clientHost: client.getHostname(),
              host,
              collection: {
                summary: "Home collection",
                randomKey: true,
                id: 2688,
                "total-count": 3,
                "collection-date": null,
                items: [
                  {
                    id: 89215,
                    "associated-metadata": {
                      layout: "OneColStoryList",
                      enable_load_more_button: true,
                      initial_stories_load_count: 6,
                      subsequent_stories_load_count: 10,
                    },
                  },
                ],
              },
            },
            config: {
              "cdn-image": "https://image.foobar.com",
            },
          }),
        { mobileApiEnabled: true, mobileConfigFields: {} }
      );
      supertest(app)
        .get("/mobile-data.json?path=%2F")
        .expect("Content-Type", /json/)
        .expect(200)
        .then((res) => {
          const response = JSON.parse(res.text);
          assert.strictEqual(true, response.data.collection.randomKey);
        })
        .then(done);
    });
  });
});
