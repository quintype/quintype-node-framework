const { NAVIGATE_TO_PAGE, SERVICE_WORKER_UPDATED } = require("@quintype/components");

const assert = require("assert");

const { createQtStore } = require("../../store/create-store");

describe("createQtStore", function () {
  describe("store", function () {
    it("it can create a store with initial values", function () {
      const store = createQtStore(
        {},
        { pageType: "home-page" },
        { location: { pathname: "/foobar" } }
      );
      assert.equal("/foobar", store.getState().qt.currentPath);
      assert.equal("home-page", store.getState().qt.pageType);
    });

    it("updates the store when a navigation event happens", function () {
      const store = createQtStore(
        {},
        { pageType: "home-page" },
        { location: { pathname: "/foobar" } }
      );
      store.dispatch({
        type: NAVIGATE_TO_PAGE,
        page: { pageType: "section-page" },
        currentPath: "/foo2",
      });
      assert.equal("/foo2", store.getState().qt.currentPath);
      assert.equal("section-page", store.getState().qt.pageType);
    });

    it("gets updates when the service worker is updated", function () {
      const store = createQtStore(
        {},
        { pageType: "home-page" },
        { location: { pathname: "/foobar" } }
      );
      assert.equal(false, store.getState().serviceWorkerStatus.updated);
      store.dispatch({ type: SERVICE_WORKER_UPDATED });
      assert.equal(true, store.getState().serviceWorkerStatus.updated);
    });

    it("can accept custom reducers too", function () {
      const myReducer = (value = "foo", { type }) =>
        type == "MY-ACTION" ? "bar" : value;
      const store = createQtStore(
        { custom: myReducer },
        { pageType: "home-page" },
        { location: { pathname: "/foobar" } }
      );
      assert.equal("foo", store.getState().custom);
      store.dispatch({ type: "MY-ACTION" });
      assert.equal("bar", store.getState().custom);
    });
  });
});
