const express = require("express");
const React = require("react");
const assert = require("assert");
const { isomorphicRoutes } = require("../../server/routes");
const supertest = require("supertest");

const redirectUrls = {
  "/tag/:slug": { destinationUrl: "/topic/:slug", statusCode: 301 },
  "/india/:someslug": { destinationUrl: "/news/:someslug", statusCode: 301 },
  "/india/news/:someslug": {
    destinationUrl: "/india/:someslug",
    statusCode: 301,
  },
  "/india/foo/:param/:param1": {
    destinationUrl: "/india/:param",
    statusCode: 302,
  },
  "/:param1/something/:param2": {
    destinationUrl: "/:param2/something/:param1",
    statusCode: 301,
  },
  "/something/new": {
    destinationUrl: "https://www.google.com/something",
    statusCode: 301,
  },
  "/something/:param1": {
    destinationUrl: "https://www.google.com/:param1",
    statusCode: 301,
  },
  "/moved-permanently-1": {
    destinationUrl: "/permanent-location-1",
    statusCode: 301,
  },
  "/moved-permanently-2\t": {
    destinationUrl: "/permanent-location-2",
    statusCode: 301,
  },
  "/moved-permanently-3\t": {
    destinationUrl: "/permanent-location-3",
    statusCode: 301,
  },
  "/moved-permanently-4\t": {
    destinationUrl: "/permanent-location-4",
    statusCode: 301,
  },
  "/moved-permanently-5\t": {
    destinationUrl: "/permanent-location-5",
    statusCode: 301,
  },
  "/moved-permanently-6\t": {
    destinationUrl: "/permanent-location-6",
    statusCode: 301,
  },
  "/moved-permanently-7\t": {
    destinationUrl: "/permanent-location-7",
    statusCode: 301,
  },
  "/moved-permanently-8\t": {
    destinationUrl: "/permanent-location-8",
    statusCode: 301,
  },
  "/moved-permanently-9\t": {
    destinationUrl: "/permanent-location-9",
    statusCode: 301,
  },
  "/moved-permanently-10": {
    destinationUrl: "/permanent-location-10",
    statusCode: 301,
  },
  "/moved-permanently-11": {
    destinationUrl: "/permanent-location-11",
    statusCode: 301,
  },
  "/moved-permanently-12": {
    destinationUrl: "/permanent-location-12",
    statusCode: 301,
  },
  "/moved-permanently-13": {
    destinationUrl: "/permanent-location-13",
    statusCode: 301,
  },
  "/moved-permanently-14": {
    destinationUrl: "/permanent-location-14",
    statusCode: 301,
  },
  "/moved-permanently-15": {
    destinationUrl: "/permanent-location-15",
    statusCode: 301,
  },
  "/moved-permanently-16": {
    destinationUrl: "/permanent-location-16",
    statusCode: 301,
  },
  "/moved-permanently-17": {
    destinationUrl: "/permanent-location-17",
    statusCode: 301,
  },
  "/moved-permanently-18": {
    destinationUrl: "/permanent-location-18",
    statusCode: 301,
  },
  "/moved-permanently-19": {
    destinationUrl: "/permanent-location-19",
    statusCode: 301,
  },
  "/moved-permanently-20": {
    destinationUrl: "/permanent-location-20",
    statusCode: 301,
  },
  "/moved-permanently-21": {
    destinationUrl: "/permanent-location-21",
    statusCode: 301,
  },
  "/moved-permanently-22": {
    destinationUrl: "/permanent-location-22",
    statusCode: 301,
  },
  "/moved-permanently-23": {
    destinationUrl: "/permanent-location-23",
    statusCode: 301,
  },
  "/moved-permanently-24": {
    destinationUrl: "/permanent-location-24",
    statusCode: 301,
  },
  "/moved-permanently-25": {
    destinationUrl: "/permanent-location-25",
    statusCode: 301,
  },
  "/moved-permanently-26": {
    destinationUrl: "/permanent-location-26",
    statusCode: 301,
  },
  "/moved-permanently-27": {
    destinationUrl: "/permanent-location-27",
    statusCode: 301,
  },
  "/moved-permanently-28": {
    destinationUrl: "/permanent-location-28",
    statusCode: 301,
  },
  "/moved-permanently-29": {
    destinationUrl: "/permanent-location-29",
    statusCode: 301,
  },
  "/moved-permanently-30": {
    destinationUrl: "/permanent-location-30",
    statusCode: 301,
  },
  "/moved-permanently-31": {
    destinationUrl: "/permanent-location-31",
    statusCode: 301,
  },
  "/moved-permanently-32": {
    destinationUrl: "/permanent-location-32",
    statusCode: 301,
  },
  "/moved-permanently-33": {
    destinationUrl: "/permanent-location-33",
    statusCode: 301,
  },
  "/moved-permanently-34": {
    destinationUrl: "/permanent-location-34",
    statusCode: 301,
  },
  "/moved-permanently-35": {
    destinationUrl: "/permanent-location-35",
    statusCode: 301,
  },
  "/moved-permanently-36": {
    destinationUrl: "/permanent-location-36",
    statusCode: 301,
  },
  "/moved-permanently-37": {
    destinationUrl: "/permanent-location-37",
    statusCode: 301,
  },
  "/moved-permanently-38": {
    destinationUrl: "/permanent-location-38",
    statusCode: 301,
  },
  "/moved-permanently-39": {
    destinationUrl: "/permanent-location-39",
    statusCode: 301,
  },
  "/moved-permanently-40": {
    destinationUrl: "/permanent-location-40",
    statusCode: 301,
  },
  "/moved-permanently-41": {
    destinationUrl: "/permanent-location-41",
    statusCode: 301,
  },
  "/moved-permanently-42": {
    destinationUrl: "/permanent-location-42",
    statusCode: 301,
  },
  "/moved-permanently-43": {
    destinationUrl: "/permanent-location-43",
    statusCode: 301,
  },
  "/moved-permanently-44": {
    destinationUrl: "/permanent-location-44",
    statusCode: 301,
  },
  "/moved-permanently-45": {
    destinationUrl: "/permanent-location-45",
    statusCode: 301,
  },
  "/moved-permanently-46": {
    destinationUrl: "/permanent-location-46",
    statusCode: 301,
  },
  "/moved-permanently-47": {
    destinationUrl: "/permanent-location-47",
    statusCode: 301,
  },
  "/moved-permanently-48": {
    destinationUrl: "/permanent-location-48",
    statusCode: 301,
  },
  "/moved-permanently-49": {
    destinationUrl: "/permanent-location-49",
    statusCode: 301,
  },
  "/moved-permanently-50": {
    destinationUrl: "/permanent-location-50",
    statusCode: 301,
  },
  "/moved-permanently-51": {
    destinationUrl: "/permanent-location-51",
    statusCode: 301,
  },
  "/moved-permanently-52": {
    destinationUrl: "/permanent-location-52",
    statusCode: 301,
  },
  "/moved-permanently-53": {
    destinationUrl: "/permanent-location-53",
    statusCode: 301,
  },
  "/moved-permanently-54": {
    destinationUrl: "/permanent-location-54",
    statusCode: 301,
  },
  "/moved-permanently-55": {
    destinationUrl: "/permanent-location-55",
    statusCode: 301,
  },
  "/moved-permanently-56": {
    destinationUrl: "/permanent-location-56",
    statusCode: 301,
  },
  "/moved-permanently-57": {
    destinationUrl: "/permanent-location-57",
    statusCode: 301,
  },
  "/moved-permanently-58": {
    destinationUrl: "/permanent-location-58",
    statusCode: 301,
  },
  "/moved-permanently-59": {
    destinationUrl: "/permanent-location-59",
    statusCode: 301,
  },
  "/moved-permanently-60": {
    destinationUrl: "/permanent-location-60",
    statusCode: 301,
  },
  "/moved-permanently-61": {
    destinationUrl: "/permanent-location-61",
    statusCode: 301,
  },
  "/moved-permanently-62": {
    destinationUrl: "/permanent-location-62",
    statusCode: 301,
  },
  "/moved-permanently-63": {
    destinationUrl: "/permanent-location-63",
    statusCode: 301,
  },
  "/moved-permanently-64": {
    destinationUrl: "/permanent-location-64",
    statusCode: 301,
  },
  "/moved-permanently-65": {
    destinationUrl: "/permanent-location-65",
    statusCode: 301,
  },
  "/moved-permanently-66": {
    destinationUrl: "/permanent-location-66",
    statusCode: 301,
  },
  "/moved-permanently-67": {
    destinationUrl: "/permanent-location-67",
    statusCode: 301,
  },
  "/moved-permanently-68": {
    destinationUrl: "/permanent-location-68",
    statusCode: 301,
  },
  "/moved-permanently-69": {
    destinationUrl: "/permanent-location-69",
    statusCode: 301,
  },
  "/moved-permanently-70": {
    destinationUrl: "/permanent-location-70",
    statusCode: 301,
  },
  "/moved-permanently-71": {
    destinationUrl: "/permanent-location-71",
    statusCode: 301,
  },
  "/moved-permanently-72": {
    destinationUrl: "/permanent-location-72",
    statusCode: 301,
  },
  "/moved-permanently-73": {
    destinationUrl: "/permanent-location-73",
    statusCode: 301,
  },
  "/moved-permanently-74": {
    destinationUrl: "/permanent-location-74",
    statusCode: 301,
  },
  "/moved-permanently-75": {
    destinationUrl: "/permanent-location-75",
    statusCode: 301,
  },
  "/moved-permanently-76": {
    destinationUrl: "/permanent-location-76",
    statusCode: 301,
  },
  "/moved-permanently-77": {
    destinationUrl: "/permanent-location-77",
    statusCode: 301,
  },
  "/moved-permanently-78": {
    destinationUrl: "/permanent-location-78",
    statusCode: 301,
  },
  "/moved-permanently-79": {
    destinationUrl: "/permanent-location-79",
    statusCode: 301,
  },
  "/moved-permanently-80": {
    destinationUrl: "/permanent-location-80",
    statusCode: 301,
  },
  "/moved-permanently-81": {
    destinationUrl: "/permanent-location-81",
    statusCode: 301,
  },
  "/moved-permanently-82": {
    destinationUrl: "/permanent-location-82",
    statusCode: 301,
  },
  "/moved-permanently-83": {
    destinationUrl: "/permanent-location-83",
    statusCode: 301,
  },
  "/moved-permanently-84": {
    destinationUrl: "/permanent-location-84",
    statusCode: 301,
  },
  "/moved-permanently-85": {
    destinationUrl: "/permanent-location-85",
    statusCode: 301,
  },
  "/moved-permanently-86": {
    destinationUrl: "/permanent-location-86",
    statusCode: 301,
  },
  "/moved-permanently-87": {
    destinationUrl: "/permanent-location-87",
    statusCode: 301,
  },
  "/moved-permanently-88": {
    destinationUrl: "/permanent-location-88",
    statusCode: 301,
  },
  "/moved-permanently-89": {
    destinationUrl: "/permanent-location-89",
    statusCode: 301,
  },
  "/moved-permanently-90": {
    destinationUrl: "/permanent-location-90",
    statusCode: 301,
  },
  "/moved-permanently-91": {
    destinationUrl: "/permanent-location-91",
    statusCode: 301,
  },
  "/moved-permanently-92": {
    destinationUrl: "/permanent-location-92",
    statusCode: 301,
  },
  "/moved-permanently-93": {
    destinationUrl: "/permanent-location-93",
    statusCode: 301,
  },
  "/moved-permanently-94": {
    destinationUrl: "/permanent-location-94",
    statusCode: 301,
  },
  "/moved-permanently-95": {
    destinationUrl: "/permanent-location-95",
    statusCode: 301,
  },
  "/moved-permanently-96": {
    destinationUrl: "/permanent-location-96",
    statusCode: 301,
  },
  "/moved-permanently-97": {
    destinationUrl: "/permanent-location-97",
    statusCode: 301,
  },
  "/moved-permanently-98": {
    destinationUrl: "/permanent-location-98",
    statusCode: 301,
  },
  "/moved-permanently-99": {
    destinationUrl: "/permanent-location-99",
    statusCode: 301,
  },
  "/moved-permanently-100": {
    destinationUrl: "/permanent-location-100",
    statusCode: 301,
  },
};

function getRedirectUrl() {
  return redirectUrls;
}

function pickComponent(pageType) {
  return ({ data }) => <div data-page-type={pageType}>{data.text}</div>;
}

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
        case "/moved-permanently-1":
          return Promise.resolve({
            page: {
              id: 101,
              type: "redirect",
              "status-code": 301,
              "destination-path": "/permanent-location-1",
            },
          });
        case "/moved-temporarily-1":
          return Promise.resolve({
            page: {
              id: 102,
              type: "redirect",
              "status-code": 302,
              "destination-path": "/temporarily-location-1",
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
          assetHash: (file) => (file === "app.js" ? "abcdef" : null),
          assetPath: (file) => `/assets/${file}`,
        },
        getClient: getClientStub,
        generateRoutes: () => routes,
        loadData,
        pickComponent: pickComponent,
        renderLayout: (res, { store, title, content }) =>
          res.send(JSON.stringify({ store: store.getState(), title, content })),
        handleNotFound: false,
        publisherConfig: {},
      },
      opts
    )
  );

  return app;
}

describe("Redirect Routes Handler", function () {
  it("Redirects all the urls with status code to 301 if redirectUrls is present", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) => next(),
      [{ pageType: "story-page", path: "/*" }],
      {
        redirectUrls,
      }
    );
    supertest(app)
      .get("/moved-permanently-1")
      .expect("Location", "/permanent-location-1")
      .expect(301, done);
  });

  it("Redirects all the urls with status code to 302 if redirectUrls is present", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) => next(),
      [{ pageType: "story-page", path: "/*" }],
      {
        redirectUrls: [
          {
            sourceUrl: "/moved-temporarily-1",
            destinationUrl: "/temporarily-location-1",
            statusCode: 302,
          },
        ],
      }
    );
    supertest(app)
      .get("/moved-temporarily-1")
      .expect("Location", "/temporarily-location-1")
      .expect(302, done);
  });

  it("Renders homepage when redirect urls are present", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) =>
        Promise.resolve({ pageType, data: { text: "foobar", host } }),
      [{ pageType: "home-page", path: "/" }],
      {
        redirectUrls: [
          {
            sourceUrl: "/moved-temporarily-1",
            destinationUrl: "/temporarily-location-1",
            statusCode: 302,
          },
        ],
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
        assert.equal("foobar", response.store.qt.data.text);
        assert.equal("127.0.0.1", response.store.qt.data.host);
        assert.equal("home-page", response.store.qt.pageType);
      })
      .then(done);
  });

  it("Redirects all the urls with status code to 301 if redirectUrls function is present", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) => next(),
      [{ pageType: "story-page", path: "/*" }],
      { redirectUrls: getRedirectUrl }
    );
    supertest(app)
      .get("/moved-permanently-1")
      .expect("Location", "/permanent-location-1")
      .expect(301, done);
  });

  it("Should handle Route Parameters redirects properly", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) => next(),
      [{ pageType: "story-page", path: "/*" }],
      { redirectUrls: getRedirectUrl }
    );
    supertest(app)
      .get("/india/news/some-slug")
      .expect("Location", "/india/some-slug")
      .expect(301, done);
  });

  it("Should handle multiple Route Parameters redirects properly", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) => next(),
      [{ pageType: "story-page", path: "/*" }],
      { redirectUrls: getRedirectUrl }
    );
    supertest(app)
      .get("/india/foo/some-slug/slug")
      .expect("Location", "/india/some-slug")
      .expect(302, done);
  });

  it("Should handle interchanging route parameter redirects properly", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) => next(),
      [{ pageType: "story-page", path: "/*" }],
      { redirectUrls: getRedirectUrl }
    );
    supertest(app)
      .get("/foo/something/bar")
      .expect("Location", "/bar/something/foo")
      .expect(301, done);
  });

  it("Should handle external redirects", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) => next(),
      [{ pageType: "story-page", path: "/*" }],
      { redirectUrls: getRedirectUrl }
    );
    supertest(app)
      .get("/something/new")
      .expect("Location", "https://www.google.com/something")
      .expect(301, done);
  });

  it("Should handle external redirects with params", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) => next(),
      [{ pageType: "story-page", path: "/*" }],
      { redirectUrls: getRedirectUrl }
    );
    supertest(app)
      .get("/something/new1")
      .expect("Location", "https://www.google.com/new1")
      .expect(301, done);
  });

  it("Should not crash if redirectUrls is not present", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) => next(),
      [{ pageType: "story-page", path: "/*" }]
    );
    supertest(app)
      .get("/moved-temporarily-1")
      .expect("Location", "/temporarily-location-1")
      .expect(
        "Cache-Control",
        "public,max-age=15,s-maxage=900,stale-while-revalidate=1000,stale-if-error=14400"
      )
      .expect("Vary", /Accept\-Encoding/)
      .expect("Surrogate-Key", "sp/42/102")
      .expect("Cache-Tag", "sp/42/102")
      .expect(302, done);
  });

  it("Returns 404 if the route doesn't exist", function (done) {
    const app = createApp(
      (pageType, params, config, client, { host, next }) => next(),
      [{ pageType: "story-page", path: "/*" }]
    );
    supertest(app).get("/does-not-exist").expect(404, done);
  });
});
